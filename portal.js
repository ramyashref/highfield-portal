
import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

const app = initializeApp(window.HIGHFIELD_FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const $ = id => document.getElementById(id);
const adminEmail = "info@highfieldeg.com";

const isAdmin = user =>
  (user?.email || "").toLowerCase() === adminEmail;

const status = (message, error = false) => {
  const element = $("status");
  if (!element) return;

  element.textContent = message;
  element.className = error ? "status error" : "status";
};

const go = url => {
  location.href = url;
};

const money = value =>
  `${Number(value || 0).toLocaleString("en-US")} EGP`;

const profileRef = user => doc(db, "trainees", user.uid);

async function ensureProfile(user) {
  const reference = profileRef(user);
  const snapshot = await getDoc(reference);

  if (!snapshot.exists()) {
    await setDoc(reference, {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || "",
      subscriptionStatus: "pending",
      accountStatus: "pending",
      createdAt: serverTimestamp()
    });
  }
}

async function profile(user) {
  const snapshot = await getDoc(profileRef(user));
  return snapshot.exists() ? snapshot.data() : null;
}

function authErr(error) {
  const messages = {
    "auth/invalid-credential": "بيانات الدخول غير صحيحة.",
    "auth/too-many-requests": "محاولات كثيرة، جرّب لاحقًا.",
    "auth/popup-closed-by-user": "تم إغلاق نافذة Google.",
    "auth/email-already-in-use": "البريد الإلكتروني مسجل بالفعل.",
    "auth/weak-password": "كلمة المرور ضعيفة.",
    "auth/operation-not-allowed": "طريقة تسجيل الدخول غير مفعّلة."
  };

  return messages[error.code] ||
    `حصلت مشكلة: ${error.code || error.message || "خطأ غير معروف"}`;
}

async function google() {
  const result = await signInWithPopup(
    auth,
    new GoogleAuthProvider()
  );

  await ensureProfile(result.user);

  go(
    isAdmin(result.user)
      ? "admin-dashboard.html"
      : "trainee-dashboard.html"
  );
}

async function login() {
  try {
    const result = await signInWithEmailAndPassword(
      auth,
      $("email").value.trim(),
      $("password").value
    );

    if (isAdmin(result.user)) {
      go("admin-dashboard.html");
      return;
    }

    const data = await profile(result.user);

    if (
      data?.accountStatus !== "active" ||
      data?.subscriptionStatus !== "approved"
    ) {
      await signOut(auth);
      status("الحساب معلّق لحين اعتماد الاشتراك من الإدارة.", true);
      return;
    }

    go("trainee-dashboard.html");
  } catch (error) {
    status(authErr(error), true);
  }
}

async function signup() {
  try {
    if ($("password").value.length < 8) {
      status("كلمة المرور لازم تكون 8 أحرف على الأقل.", true);
      return;
    }

    const result = await createUserWithEmailAndPassword(
      auth,
      $("email").value.trim(),
      $("password").value
    );

    await ensureProfile(result.user);
    await signOut(auth);

    status("تم إنشاء الحساب. يلزم اعتماد الإدارة قبل الدخول.");
  } catch (error) {
    status(authErr(error), true);
  }
}

async function reset() {
  try {
    const email = $("email").value.trim();

    if (!email) {
      status("اكتب البريد الإلكتروني أولًا.", true);
      return;
    }

    await sendPasswordResetEmail(auth, email);
    status("لو البريد مسجل، ستصلك رسالة استعادة كلمة المرور.");
  } catch (error) {
    status(authErr(error), true);
  }
}

async function loadTrainee(user) {
  const data = await profile(user);

  if (
    data?.accountStatus !== "active" ||
    data?.subscriptionStatus !== "approved"
  ) {
    await signOut(auth);
    go("trainee-login.html");
    return;
  }

  $("traineeName").textContent =
    data.displayName || user.email || "";

  $("traineeEmail").textContent = user.email || "";
  $("subscriptionStatus").textContent =
    data.subscriptionStatus || "—";

  $("accountStatus").textContent =
    data.accountStatus || "—";

  $("totalFee").textContent = money(data.totalFee);
  $("totalPaid").textContent = money(data.totalPaid);

  $("balance").textContent = money(
    Math.max(
      0,
      Number(data.totalFee || 0) -
      Number(data.totalPaid || 0)
    )
  );

  const payments = await getDocs(
    query(
      collection(db, "paymentSubmissions"),
      where("uid", "==", user.uid)
    )
  );

  $("payments").replaceChildren();

  payments.forEach(snapshot => {
    const payment = snapshot.data();
    const item = document.createElement("li");

    item.textContent =
      `${money(payment.amount)} — ${payment.status}`;

    $("payments").append(item);
  });

  const progress = await getDocs(
    query(
      collection(db, "trainingProgress"),
      where("uid", "==", user.uid)
    )
  );

  $("progress").replaceChildren();

  progress.forEach(snapshot => {
    const itemData = snapshot.data();
    const item = document.createElement("li");

    item.textContent =
      `${itemData.programName || "برنامج"} — ${itemData.status || "لم يبدأ"}`;

    $("progress").append(item);
  });
}

async function submitPayment() {
  const user = auth.currentUser;
  const file = $("proof").files[0];
  const amount = Number($("amount").value);

  if (!user || !(amount > 0) || !file) {
    status("أدخل المبلغ واختر إثبات الدفع.", true);
    return;
  }

  if (
    file.size > 5 * 1024 * 1024 ||
    !["image/jpeg", "image/png", "application/pdf"].includes(file.type)
  ) {
    status("الملف لازم يكون JPG أو PNG أو PDF وأقل من 5MB.", true);
    return;
  }

  try {
    const safeName = file.name.replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    );

    const path =
      `payment-proofs/${user.uid}/${Date.now()}-${safeName}`;

    const uploaded = await uploadBytes(
      ref(storage, path),
      file,
      { contentType: file.type }
    );

    const url = await getDownloadURL(uploaded.ref);

    await addDoc(collection(db, "paymentSubmissions"), {
      uid: user.uid,
      amount,
      proofPath: path,
      proofUrl: url,
      method: $("method").value,
      status: "pending",
      createdAt: serverTimestamp()
    });

    status("تم إرسال الإثبات للمراجعة. لن يتغير الرصيد إلا بعد اعتماد الإدارة.");
    $("paymentForm").reset();
  } catch (error) {
    console.error("Payment submission error:", error);
    status(
      `تعذر إرسال الإثبات: ${error.code || error.message || "خطأ غير معروف"}`,
      true
    );
  }
}

async function adminLoad() {
  const traineesSnapshot = await getDocs(
    collection(db, "trainees")
  );

  $("trainees").replaceChildren();

  traineesSnapshot.forEach(snapshot => {
    const trainee = snapshot.data();
    const row = document.createElement("tr");

    [
      trainee.email,
      trainee.displayName,
      trainee.subscriptionStatus,
      trainee.accountStatus,
      money(trainee.totalFee),
      money(trainee.totalPaid)
    ].forEach(value => {
      const cell = document.createElement("td");
      cell.textContent = value ?? "";
      row.append(cell);
    });

    const actionCell = document.createElement("td");
    const approveButton = document.createElement("button");

    approveButton.textContent = "اعتماد وتفعيل";

    approveButton.onclick = async () => {
      const fee = Number(
        prompt("قيمة الاشتراك بالجنيه؟", "0")
      );

      if (!Number.isFinite(fee) || fee < 0) {
        status("أدخل قيمة اشتراك صحيحة.", true);
        return;
      }

      approveButton.disabled = true;

      try {
        await setDoc(
          doc(db, "trainees", snapshot.id),
          {
            subscriptionStatus: "approved",
            accountStatus: "active",
            totalFee: fee,
            totalPaid: Number(trainee.totalPaid || 0),
            approvedAt: serverTimestamp()
          },
          { merge: true }
        );

        status("تم اعتماد المتدرب وتفعيل حسابه.");
        await adminLoad();
      } catch (error) {
        console.error("Approve trainee error:", error);
        status(
          `تعذر الاعتماد: ${error.code || error.message || "خطأ غير معروف"}`,
          true
        );
        approveButton.disabled = false;
      }
    };

    actionCell.append(approveButton);
    row.append(actionCell);
    $("trainees").append(row);
  });

  const pendingSnapshot = await getDocs(
    query(
      collection(db, "paymentSubmissions"),
      where("status", "==", "pending")
    )
  );

  $("pendingPayments").replaceChildren();

  pendingSnapshot.forEach(snapshot => {
    const payment = snapshot.data();
    const row = document.createElement("tr");

    [
      payment.uid,
      money(payment.amount),
      payment.method,
      payment.status
    ].forEach(value => {
      const cell = document.createElement("td");
      cell.textContent = value ?? "";
      row.append(cell);
    });

    const actionCell = document.createElement("td");
    const proofLink = document.createElement("a");

    proofLink.href = payment.proofUrl || "#";
    proofLink.target = "_blank";
    proofLink.rel = "noopener";
    proofLink.textContent = "فتح الإثبات";

    actionCell.append(proofLink);

    const approveButton = document.createElement("button");
    approveButton.textContent = "اعتماد الدفعة";

    approveButton.onclick = async () => {
      approveButton.disabled = true;

      try {
        const traineeReference = doc(
          db,
          "trainees",
          payment.uid
        );

        const traineeSnapshot = await getDoc(
          traineeReference
        );

        if (!traineeSnapshot.exists()) {
          throw new Error("ملف المتدرب غير موجود.");
        }

        const trainee = traineeSnapshot.data();

        await setDoc(
          doc(db, "paymentSubmissions", snapshot.id),
          {
            status: "approved",
            reviewedAt: serverTimestamp()
          },
          { merge: true }
        );

        await setDoc(
          traineeReference,
          {
            totalPaid:
              Number(trainee.totalPaid || 0) +
              Number(payment.amount || 0)
          },
          { merge: true }
        );

        status("تم اعتماد الدفعة وتحديث الرصيد.");
        await adminLoad();
      } catch (error) {
        console.error("Approve payment error:", error);
        status(
          `تعذر اعتماد الدفعة: ${error.code || error.message || "خطأ غير معروف"}`,
          true
        );
        approveButton.disabled = false;
      }
    };

    actionCell.append(approveButton);
    row.append(actionCell);
    $("pendingPayments").append(row);
  });
}

onAuthStateChanged(auth, async user => {
  const page = document.body.dataset.page;

  if (page === "login" && user) {
    go(
      isAdmin(user)
        ? "admin-dashboard.html"
        : "trainee-dashboard.html"
    );
    return;
  }

  if (page === "trainee") {
    if (!user) {
      go("trainee-login.html");
      return;
    }

    try {
      await loadTrainee(user);
    } catch (error) {
      console.error("Trainee load error:", error);
      status(
        `تعذر تحميل الحساب: ${error.code || error.message || "خطأ غير معروف"}`,
        true
      );
    }
  }

  if (page === "admin") {
    if (!user) {
      go("trainee-login.html");
      return;
    }

    if (!isAdmin(user)) {
      go("trainee-login.html");
      return;
    }

    try {
      await adminLoad();
    } catch (error) {
      console.error("Admin load error:", error);
      status(
        `خطأ الإدارة: ${error.code || error.message || "خطأ غير معروف"}`,
        true
      );
    }
  }
});

$("googleLogin")?.addEventListener("click", () => {
  google().catch(error => status(authErr(error), true));
});

$("emailLogin")?.addEventListener("click", login);
$("signup")?.addEventListener("click", signup);
$("resetPassword")?.addEventListener("click", reset);

$("logout")?.addEventListener("click", async () => {
  await signOut(auth);
  go("trainee-login.html");
});

$("paymentForm")?.addEventListener("submit", event => {
  event.preventDefault();
  submitPayment();
});
