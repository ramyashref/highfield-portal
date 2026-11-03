import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification,
  updateProfile, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, collection, query, where,
  getDocs, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {
  getStorage, ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

const app = initializeApp(window.HIGHFIELD_FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const $ = id => document.getElementById(id);
const adminEmail = "info@highfieldeg.com";
const whatsappNumber = "201101669115";
const isAdmin = user => (user?.email || "").toLowerCase() === adminEmail;
const money = value => `${Number(value || 0).toLocaleString("en-EG")} EGP`;
const profileRef = user => doc(db, "trainees", user.uid);
const go = url => { location.href = url; };
const status = (message, error = false) => {
  const element = $("status");
  if (!element) return;
  element.textContent = message;
  element.className = error ? "status error" : "status";
};
const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const programs = (window.HIGHFIELD_PROGRAMS || []).map(row => ({
  id: Number(row[0]), name: String(row[1]), category: String(row[2]),
  audience: String(row[3]), days: Number(row[4]) || 1
}));

function getProgramPrice(program) {
  const sourceRow = [program.id, program.name, program.category, program.audience, program.days];
  if (typeof window.HIGHFIELD_GET_PROGRAM_PRICE === "function") return window.HIGHFIELD_GET_PROGRAM_PRICE(sourceRow);
  const title = program.name.toLowerCase();
  let level;
  if (/advanced|intensive/.test(title) || program.days >= 5) level = "Advanced";
  else if (/basic|fundamentals?/.test(title)) level = "Basic";
  else if (program.days >= 3) level = "Intermediate";
  else level = "Basic";
  return { level, price: ({ Basic: 2000, Intermediate: 4000, Advanced: 8000 })[level] };
}

async function ensureProfile(user) {
  const reference = profileRef(user);
  const snapshot = await getDoc(reference);
  if (!snapshot.exists()) {
    await setDoc(reference, {
      uid: user.uid, email: user.email || "", displayName: user.displayName || "",
      subscriptionStatus: "pending", accountStatus: "pending",
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
  return messages[error.code] || `حصلت مشكلة: ${error.code || error.message || "خطأ غير معروف"}`;
}
async function google() {
  const result = await signInWithPopup(auth, new GoogleAuthProvider());
  await ensureProfile(result.user);
  if (isAdmin(result.user)) return go("admin-dashboard.html");
  const data = await profile(result.user);
  if (data?.accountStatus === "active") return go("trainee-dashboard.html");
  await signOut(auth);
  status("تم إنشاء الحساب. سيتم تفعيل الدخول بعد مراجعة الإدارة.");
}
async function login() {
  try {
    const result = await signInWithEmailAndPassword(auth, $("email").value.trim(), $("password").value);
    if (isAdmin(result.user)) {
      await result.user.reload();
      if (!result.user.emailVerified) {
        await sendEmailVerification(result.user);
        await signOut(auth);
        status("تم إرسال رسالة تحقق إلى بريد الإدارة. افتح الرسالة ثم سجّل الدخول مجددًا.", true);
        return;
      }
      return go("admin-dashboard.html");
    }
    const data = await profile(result.user);
    if (data?.accountStatus !== "active") {
      await signOut(auth);
      status("الحساب قيد المراجعة من إدارة Highfield.", true);
      return;
    }
    go("trainee-dashboard.html");
  } catch (error) { console.error(error); status(authErr(error), true); }
}
async function signup() {
  try {
    if (!( $("fullName")?.value.trim() )) return status("اكتب الاسم بالكامل عند إنشاء الحساب.", true);
    if ($("password").value.length < 8) return status("كلمة المرور لازم تكون 8 أحرف على الأقل.", true);
    const result = await createUserWithEmailAndPassword(auth, $("email").value.trim(), $("password").value);
    const fullName = $("fullName")?.value.trim() || "";
    if (fullName) await updateProfile(result.user, { displayName: fullName });
    await ensureProfile(result.user);
    await signOut(auth);
    status("تم إنشاء الحساب. ستتمكن من الدخول بعد اعتماد الإدارة.");
  } catch (error) { status(authErr(error), true); }
}
async function reset() {
  try {
    const email = $("email").value.trim();
    if (!email) return status("اكتب البريد الإلكتروني أولًا.", true);
    await sendPasswordResetEmail(auth, email);
    status("لو البريد مسجل، ستصلك رسالة استعادة كلمة المرور.");
  } catch (error) { status(authErr(error), true); }
}

function renderProgramCatalog(enrolledIds = []) {
  const target = $("programCatalog");
  if (!target) return;
  const term = ($("programSearch")?.value || "").trim().toLowerCase();
  const category = $("programCategory")?.value || "";
  const available = programs.filter(p => !enrolledIds.includes(p.id) &&
    (!category || p.category === category) &&
    (!term || `${p.name} ${p.category} ${p.audience}`.toLowerCase().includes(term)));
  if (!available.length) {
    target.innerHTML = '<p class="note">لا توجد برامج مطابقة للبحث، أو أن المتدرب مسجل بالفعل في البرامج المعروضة.</p>';
    return;
  }
  target.innerHTML = available.map(p => {
    const price = getProgramPrice(p);
    return `<article class="program-option"><div class="program-option-head"><span class="program-tag">${esc(p.category)}</span><span class="program-tag">${p.days} ${p.days === 1 ? "day" : "days"}</span></div><h3>${esc(p.name)}</h3><p>${esc(p.audience)}</p><div class="program-option-foot"><strong>${money(price.price)}</strong><button type="button" data-enroll-program="${p.id}">طلب الالتحاق</button></div></article>`;
  }).join("");
  target.querySelectorAll("[data-enroll-program]").forEach(button => button.addEventListener("click", () => selectProgram(Number(button.dataset.enrollProgram))));
}
function setupCatalog(enrolledIds = []) {
  const categories = [...new Set(programs.map(p => p.category))].sort();
  const select = $("programCategory");
  if (select && !select.dataset.ready) {
    select.innerHTML = '<option value="">كل التخصصات</option>' + categories.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join("");
    select.dataset.ready = "1";
  }
  $("programSearch")?.addEventListener("input", () => renderProgramCatalog(enrolledIds));
  select?.addEventListener("change", () => renderProgramCatalog(enrolledIds));
  renderProgramCatalog(enrolledIds);
}
function selectProgram(id) {
  const program = programs.find(p => p.id === id);
  if (!program) return;
  const price = getProgramPrice(program);
  $("selectedProgramId").value = String(program.id);
  $("selectedProgramName").textContent = program.name;
  $("selectedProgramFee").textContent = money(price.price);
  $("enrollmentPanel").hidden = false;
  $("enrollmentPanel").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function loadTrainee(user) {
  const data = await profile(user);
  if (data?.accountStatus !== "active") { await signOut(auth); go("trainee-login.html"); return; }
  $("traineeName").textContent = data.displayName || user.displayName || user.email || "";
  $("traineeEmail").textContent = user.email || "";
  $("subscriptionStatus").textContent = data.subscriptionStatus || "—";
  $("accountStatus").textContent = data.accountStatus || "—";
  $("totalFee").textContent = money(data.totalFee);
  $("totalPaid").textContent = money(data.totalPaid);
  $("balance").textContent = money(Math.max(0, Number(data.totalFee || 0) - Number(data.totalPaid || 0)));

  const payments = await getDocs(query(collection(db, "paymentSubmissions"), where("uid", "==", user.uid)));
  $("payments").replaceChildren();
  payments.forEach(snap => {
    const payment = snap.data();
    const li = document.createElement("li");
    li.textContent = `${money(payment.amount)} — ${payment.paymentType === "additional_program" ? `برنامج إضافي: ${payment.programName || ""}` : "الاشتراك السنوي"} — ${payment.status || "pending"}`;
    $("payments").append(li);
  });

  const progress = await getDocs(query(collection(db, "trainingProgress"), where("uid", "==", user.uid)));
  $("progress").replaceChildren();
  progress.forEach(snap => {
    const item = snap.data(); const li = document.createElement("li");
    li.textContent = `${item.programName || "برنامج"} — ${item.status || "لم يبدأ"}`;
    $("progress").append(li);
  });

  const enrollments = await getDocs(query(collection(db, "programEnrollments"), where("uid", "==", user.uid)));
  const enrolledIds = [];
  $("extraPrograms").replaceChildren();
  enrollments.forEach(snap => {
    const item = snap.data(); enrolledIds.push(Number(item.programId));
    const card = document.createElement("article"); card.className = "enrollment-row";
    const title = document.createElement("strong"); title.textContent = item.programName || "برنامج إضافي";
    const meta = document.createElement("p"); meta.textContent = `${money(item.fee)} · حالة التسجيل: ${item.status || "pending"} · حالة الدفع: ${item.paymentStatus || "unpaid"}`;
    card.append(title, meta); $("extraPrograms").append(card);
  });
  setupCatalog(enrolledIds);
}

async function submitAnnualPayment() {
  const user = auth.currentUser; const file = $("proof")?.files?.[0]; const amount = Number($("amount")?.value);
  if (!user || !(amount > 0) || !file) return status("أدخل المبلغ واختر إثبات الدفع.", true);
  if (file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "application/pdf"].includes(file.type)) return status("الملف لازم يكون JPG أو PNG أو PDF وأقل من 5MB.", true);
  try {
    const path = `payment-proofs/${user.uid}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const uploaded = await uploadBytes(ref(storage, path), file, { contentType: file.type });
    const url = await getDownloadURL(uploaded.ref);
    await addDoc(collection(db, "paymentSubmissions"), { uid: user.uid, amount, proofPath: path, proofUrl: url, method: $("method").value, paymentType: "annual_subscription", status: "pending", createdAt: serverTimestamp() });
    status("تم إرسال إثبات الدفع للمراجعة."); $("paymentForm").reset();
  } catch (error) { console.error(error); status(`تعذر إرسال الإثبات: ${error.code || error.message}`, true); }
}

async function submitExtraEnrollment(event) {
  event.preventDefault();
  const user = auth.currentUser;
  const programId = Number($("selectedProgramId").value);
  const program = programs.find(p => p.id === programId);
  if (!user || !program) return status("اختار برنامجًا صحيحًا أولًا.", true);
  const fee = getProgramPrice(program).price;
  const priorRequests = await getDocs(query(collection(db, "programEnrollments"), where("uid", "==", user.uid)));
  const alreadyEnrolled = priorRequests.docs.some(snap => Number(snap.data().programId) === program.id && !["rejected", "cancelled"].includes(snap.data().status));
  if (alreadyEnrolled) return status("لديك طلب أو تسجيل قائم بالفعل لهذا البرنامج.", true);
  const file = $("extraProof").files[0];
  const method = $("extraPaymentMethod").value;
  if (method === "transfer" && !file) return status("ارفع إيصال التحويل قبل إرسال الطلب.", true);
  try {
    let proofPath = "", proofUrl = "", enrollmentStatus = "pending_payment", paymentStatus = "unpaid";
    if (method === "transfer" && file) {
      if (file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "application/pdf"].includes(file.type)) return status("إثبات الدفع يجب أن يكون JPG أو PNG أو PDF وأقل من 5MB.", true);
      proofPath = `payment-proofs/${user.uid}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const uploaded = await uploadBytes(ref(storage, proofPath), file, { contentType: file.type });
      proofUrl = await getDownloadURL(uploaded.ref);
      enrollmentStatus = "payment_review";
    }
    const enrollment = await addDoc(collection(db, "programEnrollments"), {
      uid: user.uid, traineeEmail: user.email || "", programId: program.id,
      programName: program.name, category: program.category, fee,
      status: enrollmentStatus, paymentStatus, requestSource: "trainee",
      paymentMethod: method, createdAt: serverTimestamp()
    });
    if (proofPath) {
      await addDoc(collection(db, "paymentSubmissions"), {
        uid: user.uid, traineeEmail: user.email || "", amount: fee, proofPath, proofUrl, method,
        paymentType: "additional_program", enrollmentId: enrollment.id,
        programId: program.id, programName: program.name,
        status: "pending", createdAt: serverTimestamp()
      });
    }
    status(method === "transfer" && file ? "تم استلام طلب الالتحاق وإثبات الدفع، وهو الآن قيد المراجعة." : "تم إرسال طلب الالتحاق. تواصل مع Highfield لاستكمال التسجيل.");
    $("extraEnrollmentForm").reset(); $("enrollmentPanel").hidden = true;
    await loadTrainee(user);
  } catch (error) { console.error(error); status(`تعذر إرسال الطلب: ${error.code || error.message}`, true); }
}

async function adminLoad() {
  const traineesSnapshot = await getDocs(collection(db, "trainees"));
  $("trainees").replaceChildren();
  const traineeOptions = [];
  traineesSnapshot.forEach(snap => {
    const trainee = snap.data();
    traineeOptions.push({ uid: snap.id, email: trainee.email || "", name: trainee.displayName || trainee.email || snap.id });
    const row = document.createElement("tr");
    [trainee.email, trainee.displayName, trainee.subscriptionStatus, trainee.accountStatus, money(trainee.totalFee), money(trainee.totalPaid)].forEach(value => { const td = document.createElement("td"); td.textContent = value ?? ""; row.append(td); });
    const action = document.createElement("td"); const button = document.createElement("button"); button.textContent = "اعتماد الاشتراك السنوي";
    button.onclick = async () => {
      const fee = Number(prompt("إجمالي الاشتراك السنوي شامل رسوم التسجيل؟", "61000"));
      if (!Number.isFinite(fee) || fee < 0) return status("أدخل قيمة صحيحة.", true);
      try { await setDoc(doc(db, "trainees", snap.id), { subscriptionStatus: "approved", accountStatus: "active", totalFee: fee, totalPaid: Number(trainee.totalPaid || 0), approvedAt: serverTimestamp() }, { merge: true }); status("تم اعتماد الاشتراك وتفعيل الحساب."); await adminLoad(); }
      catch (error) { status(`تعذر الاعتماد: ${error.code || error.message}`, true); }
    };
    action.append(button); row.append(action); $("trainees").append(row);
  });

  const traineeSelect = $("adminTraineeSelect");
  if (traineeSelect) traineeSelect.innerHTML = '<option value="">اختر المتدرب</option>' + traineeOptions.map(t => `<option value="${esc(t.uid)}">${esc(t.name)} — ${esc(t.email)}</option>`).join("");
  const programSelect = $("adminProgramSelect");
  if (programSelect) programSelect.innerHTML = '<option value="">اختر البرنامج</option>' + programs.map(p => `<option value="${p.id}">${esc(p.name)} — ${money(getProgramPrice(p).price)}</option>`).join("");

  const pending = await getDocs(query(collection(db, "paymentSubmissions"), where("status", "==", "pending")));
  $("pendingPayments").replaceChildren();
  for (const snap of pending.docs) {
    const payment = snap.data(); const row = document.createElement("tr");
    [payment.traineeEmail || payment.uid, money(payment.amount), payment.programName || payment.method || "", payment.paymentType || "annual_subscription"].forEach(value => { const td = document.createElement("td"); td.textContent = value ?? ""; row.append(td); });
    const action = document.createElement("td");
    if (payment.proofUrl) { const link = document.createElement("a"); link.href = payment.proofUrl; link.target = "_blank"; link.rel = "noopener"; link.textContent = "فتح الإثبات"; action.append(link, document.createTextNode(" ")); }
    const approve = document.createElement("button"); approve.textContent = "اعتماد";
    approve.onclick = async () => {
      approve.disabled = true;
      try {
        await setDoc(doc(db, "paymentSubmissions", snap.id), { status: "approved", reviewedAt: serverTimestamp(), reviewedBy: auth.currentUser.email }, { merge: true });
        if (payment.paymentType === "additional_program" && payment.enrollmentId) {
          await setDoc(doc(db, "programEnrollments", payment.enrollmentId), { status: "confirmed", paymentStatus: "paid", paidAt: serverTimestamp() }, { merge: true });
        } else {
          const refTrainee = doc(db, "trainees", payment.uid); const traineeSnap = await getDoc(refTrainee);
          if (traineeSnap.exists()) await setDoc(refTrainee, { totalPaid: Number(traineeSnap.data().totalPaid || 0) + Number(payment.amount || 0) }, { merge: true });
        }
        status("تم اعتماد الدفعة."); await adminLoad();
      } catch (error) { status(`تعذر اعتماد الدفعة: ${error.code || error.message}`, true); approve.disabled = false; }
    };
    const reject = document.createElement("button"); reject.textContent = "رفض"; reject.className = "secondary";
    reject.onclick = async () => {
      const reason = prompt("سبب رفض إثبات الدفع (اختياري):", "");
      try {
        await setDoc(doc(db, "paymentSubmissions", snap.id), { status: "rejected", rejectionReason: reason || "", reviewedAt: serverTimestamp(), reviewedBy: auth.currentUser.email }, { merge: true });
        if (payment.paymentType === "additional_program" && payment.enrollmentId) {
          await setDoc(doc(db, "programEnrollments", payment.enrollmentId), { status: "payment_rejected", paymentStatus: "unpaid" }, { merge: true });
        }
        status("تم رفض إثبات الدفع."); await adminLoad();
      } catch (error) { status(`تعذر رفض الدفعة: ${error.code || error.message}`, true); }
    };
    action.append(approve, reject); row.append(action); $("pendingPayments").append(row);
  }

  const enrollments = await getDocs(collection(db, "programEnrollments"));
  $("adminEnrollments").replaceChildren();
  enrollments.forEach(snap => {
    const e = snap.data(); const row = document.createElement("tr");
    [e.traineeEmail || e.uid, e.programName, e.status, e.paymentStatus, money(e.fee)].forEach(value => { const td = document.createElement("td"); td.textContent = value ?? ""; row.append(td); });
    const action = document.createElement("td");
    if (e.status !== "confirmed" && e.status !== "admin_enrolled") {
      const confirm = document.createElement("button"); confirm.textContent = "تأكيد التسجيل";
      confirm.onclick = async () => { try { await setDoc(doc(db, "programEnrollments", snap.id), { status: "confirmed", confirmedBy: auth.currentUser.email, confirmedAt: serverTimestamp() }, { merge: true }); status("تم تأكيد التسجيل إداريًا."); await adminLoad(); } catch (error) { status(`تعذر التأكيد: ${error.code || error.message}`, true); } };
      action.append(confirm);
      const rejectRequest = document.createElement("button"); rejectRequest.textContent = "رفض الطلب"; rejectRequest.className = "secondary";
      rejectRequest.onclick = async () => { try { await setDoc(doc(db, "programEnrollments", snap.id), { status: "rejected", rejectedBy: auth.currentUser.email, rejectedAt: serverTimestamp() }, { merge: true }); status("تم رفض طلب الالتحاق."); await adminLoad(); } catch (error) { status(`تعذر رفض الطلب: ${error.code || error.message}`, true); } };
      action.append(rejectRequest);
    }
    row.append(action); $("adminEnrollments").append(row);
  });
}

async function adminCreateEnrollment(event) {
  event.preventDefault();
  const uid = $("adminTraineeSelect").value;
  const programId = Number($("adminProgramSelect").value);
  const program = programs.find(p => p.id === programId);
  const paymentStatus = $("adminPaymentStatus").value;
  if (!uid || !program) return status("اختر المتدرب والبرنامج.", true);
  const trainee = await getDoc(doc(db, "trainees", uid));
  if (!trainee.exists()) return status("المتدرب غير موجود.", true);
  const existing = await getDocs(query(collection(db, "programEnrollments"), where("uid", "==", uid)));
  if (existing.docs.some(snap => Number(snap.data().programId) === program.id && !["rejected", "cancelled"].includes(snap.data().status))) return status("المتدرب مسجل بالفعل في هذا البرنامج.", true);
  try {
    await addDoc(collection(db, "programEnrollments"), {
      uid, traineeEmail: trainee.data().email || "", programId: program.id,
      programName: program.name, category: program.category,
      fee: getProgramPrice(program).price, status: "admin_enrolled",
      paymentStatus, requestSource: "admin", enrolledBy: auth.currentUser.email,
      adminNote: $("adminEnrollmentNote").value.trim(), createdAt: serverTimestamp()
    });
    status("تمت إضافة المتدرب إلى البرنامج بواسطة الإدارة."); $("adminEnrollmentForm").reset(); await adminLoad();
  } catch (error) { console.error(error); status(`تعذر إضافة المتدرب: ${error.code || error.message}`, true); }
}

onAuthStateChanged(auth, async user => {
  const page = document.body.dataset.page;
  if (page === "login" && user) {
    if (isAdmin(user)) return go("admin-dashboard.html");
    const data = await profile(user);
    // A new Google account may trigger this observer before its trainee profile is created.
    // Leave that flow to google(); only route users when a profile already exists.
    if (data?.accountStatus === "active") go("trainee-dashboard.html");
    else if (data) { await signOut(auth); status("حسابك قيد المراجعة من الإدارة."); }
  }
  if (page === "trainee") {
    if (!user) return go("trainee-login.html");
    try { await loadTrainee(user); } catch (error) { console.error(error); status(`تعذر تحميل الحساب: ${error.code || error.message}`, true); }
  }
  if (page === "admin") {
    if (!user || !isAdmin(user) || !user.emailVerified) return go("trainee-login.html");
    try { await adminLoad(); } catch (error) { console.error(error); status(`خطأ الإدارة: ${error.code || error.message}`, true); }
  }
});

$("googleLogin")?.addEventListener("click", () => google().catch(error => status(authErr(error), true)));
$("emailLogin")?.addEventListener("click", login);
$("signup")?.addEventListener("click", signup);
$("resetPassword")?.addEventListener("click", reset);
$("logout")?.addEventListener("click", async () => { await signOut(auth); go("trainee-login.html"); });
$("paymentForm")?.addEventListener("submit", event => { event.preventDefault(); submitAnnualPayment(); });
$("extraEnrollmentForm")?.addEventListener("submit", submitExtraEnrollment);
$("adminEnrollmentForm")?.addEventListener("submit", adminCreateEnrollment);
$("extraPaymentMethod")?.addEventListener("change", () => {
  const transfer = $("extraPaymentMethod").value === "transfer";
  $("extraProofWrap").hidden = !transfer;
});
