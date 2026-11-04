import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, collection, query, where,
  getDocs, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

const app = initializeApp(window.HIGHFIELD_FIREBASE_CONFIG);
const auth = getAuth(app), db = getFirestore(app), storage = getStorage(app);
const $ = id => document.getElementById(id);
let authFlowInProgress = false;
const adminEmail = "info@highfieldeg.com";
const isAdmin = user => (user?.email || "").toLowerCase() === adminEmail;
const status = (message, error=false) => {
  const el=$("status"); if(!el) return;
  el.textContent=message; el.className=error?"status error":"status";
};
const go = url => { location.href=url; };
const money = value => `${Number(value||0).toLocaleString("en-US")} EGP`;
const profileRef = user => doc(db,"trainees",user.uid);
const getProfile = async user => { const snap=await getDoc(profileRef(user)); return snap.exists()?snap.data():null; };

function authErr(error) {
  const messages={
    "auth/invalid-credential":"البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    "auth/too-many-requests":"محاولات كثيرة. حاول مرة أخرى لاحقًا.",
    "auth/email-already-in-use":"هذا البريد الإلكتروني مسجل بالفعل.",
    "auth/weak-password":"كلمة المرور ضعيفة. استخدم 8 أحرف على الأقل.",
    "auth/invalid-email":"صيغة البريد الإلكتروني غير صحيحة.",
    "auth/operation-not-allowed":"تسجيل الدخول بالبريد الإلكتروني غير مفعّل في Firebase."
  };
  return messages[error.code] || `تعذر إكمال العملية: ${error.code||error.message||"خطأ غير معروف"}`;
}

function switchAuth(mode) {
  const login=mode==="login";
  $("loginForm")?.classList.toggle("hidden",!login);
  $("signupForm")?.classList.toggle("hidden",login);
  $("showLogin")?.classList.toggle("active",login);
  $("showSignup")?.classList.toggle("active",!login);
  $("authTitle").textContent=login?"دخول المتدربين":"إنشاء حساب متدرب جديد";
  $("authSubtitle").textContent=login
    ?"بوابتك التعليمية لمتابعة البرامج والتسجيلات والمدفوعات والشهادات."
    :"أنشئ حسابك للوصول مباشرة إلى بوابة Highfield Egypt التعليمية.";
  status("");
}

async function login(event) {
  event?.preventDefault();
  try {
    authFlowInProgress = true;
    const result=await signInWithEmailAndPassword(auth,$("email").value.trim(),$("password").value);
    if(isAdmin(result.user)) {
      await result.user.reload();
      if(!result.user.emailVerified) {
        await signOut(auth);
        authFlowInProgress = false;
        status("حساب الإدارة يحتاج إلى توثيق البريد الإلكتروني أولًا.",true);
        return;
      }
      authFlowInProgress = false;
      go("admin-dashboard.html"); return;
    }
    const data=await getProfile(result.user);
    if(!data) {
      await signOut(auth);
      authFlowInProgress = false;
      status("لم يتم العثور على ملف المتدرب. تواصل مع الدعم الفني.",true); return;
    }
    authFlowInProgress = false;
    go("trainee-dashboard.html");
  } catch(error) { authFlowInProgress = false; console.error(error); status(authErr(error),true); }
}

async function signup(event) {
  event?.preventDefault();
  const ar=$("fullNameAr").value.trim(), en=$("fullNameEn").value.trim();
  const email=$("signupEmail").value.trim().toLowerCase();
  const whatsapp=$("whatsapp").value.trim();
  const password=$("signupPassword").value;
  const nationalId=$("nationalId").value.trim();
  const fields=["fullNameAr","fullNameEn","signupEmail","whatsapp","signupPassword","specialty","nationalId","country","governorate","workplace","college","university"];
  if(fields.some(id=>!$(id).value.trim())) { status("من فضلك أكمل جميع البيانات المطلوبة.",true); return; }
  if(ar.split(/\s+/).length<4) { status("اكتب الاسم الرباعي باللغة العربية.",true); $("fullNameAr").focus(); return; }
  if(en.split(/\s+/).length<4) { status("Please enter your full four-part name in English.",true); $("fullNameEn").focus(); return; }
  if(password.length<8) { status("كلمة المرور يجب ألا تقل عن 8 أحرف.",true); return; }
  if(whatsapp.replace(/[^\d]/g,"").length<8) { status("أدخل رقم WhatsApp صحيحًا مع كود الدولة.",true); return; }
  try {
    authFlowInProgress = true;
    const credential=await createUserWithEmailAndPassword(auth,email,password);
    const user=credential.user;
    const profile={
      uid:user.uid, email, whatsapp,
      fullNameAr:ar, fullNameEn:en, displayName:ar,
      specialty:$("specialty").value.trim(),
      nationalIdOrPassport:nationalId,
      country:$("country").value.trim(),
      governorate:$("governorate").value.trim(),
      workplace:$("workplace").value.trim(),
      college:$("college").value.trim(),
      university:$("university").value.trim(),
      accountStatus:"active",
      subscriptionStatus:"not_enrolled",
      enrollmentType:"self_registered",
      totalPaid:0,
      createdAt:serverTimestamp()
    };
    await setDoc(profileRef(user),profile);
    authFlowInProgress = false;
    go("trainee-dashboard.html");
  } catch(error) {
    authFlowInProgress = false;
    console.error("Signup error:",error);
    status(authErr(error),true);
  }
}

async function resetPassword() {
  const email=$("email").value.trim();
  if(!email) { status("اكتب بريدك الإلكتروني أولًا.",true); return; }
  try { await sendPasswordResetEmail(auth,email); status("إذا كان البريد مسجلًا، ستصلك رسالة استعادة كلمة المرور."); }
  catch(error) { status(authErr(error),true); }
}

function drawCharts(progressItems,payments,totalFee,totalPaid) {
  if(!window.Chart) return;
  const completed=progressItems.filter(x=>["completed","passed","approved"].includes(String(x.status||"").toLowerCase())).length;
  const inProgress=progressItems.filter(x=>["in progress","in_progress","started"].includes(String(x.status||"").toLowerCase())).length;
  const upcoming=Math.max(0,progressItems.length-completed-inProgress);
  const academic=$("academicChart");
  if(academic) new Chart(academic,{type:"doughnut",data:{labels:["مكتمل","قيد التنفيذ","لم يبدأ"],datasets:[{data:[completed,inProgress,upcoming],backgroundColor:["#4fc49a","#4b9cff","#243e63"],borderColor:"#0b2040",borderWidth:4,hoverOffset:5}]},options:{responsive:true,maintainAspectRatio:false,cutout:"70%",plugins:{legend:{position:"bottom",labels:{color:"#c8d8ec",padding:18,font:{family:"Cairo"}}}}}});
  const paid=$("paymentChart");
  if(paid) new Chart(paid,{type:"bar",data:{labels:["المدفوع","المتبقي"],datasets:[{label:"EGP",data:[totalPaid,Math.max(0,totalFee-totalPaid)],backgroundColor:["#4fc49a","#4b9cff"],borderRadius:8,maxBarThickness:62}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:"#c8d8ec",font:{family:"Cairo"}},grid:{display:false}},y:{beginAtZero:true,ticks:{color:"#9fb4d0"},grid:{color:"#ffffff12"}}}}});
  $("academicCaption").textContent=progressItems.length?`تم استكمال ${completed} من ${progressItems.length} برنامجًا مسجلًا.`:"لم تتم إضافة برامج تدريبية إلى حسابك بعد.";
}

async function loadTrainee(user) {
  const data=await getProfile(user);
  if(!data) { status("ملف المتدرب غير موجود. يرجى التواصل مع الدعم.",true); return; }
  $("traineeName").textContent=data.fullNameAr||data.displayName||"متدرب Highfield";
  $("traineeEmail").textContent=data.email||user.email||"";
  const paidTotal=Number(data.totalPaid||0), fee=Number(data.totalFee||0);
  $("totalPaid").textContent=money(paidTotal);
  $("balance").textContent=fee?money(Math.max(0,fee-paidTotal)):"غير محدد";
  const paymentsSnap=await getDocs(query(collection(db,"paymentSubmissions"),where("uid","==",user.uid)));
  const payments=[]; paymentsSnap.forEach(s=>payments.push(s.data()));
  const paymentsBody=$("payments"); paymentsBody.replaceChildren();
  if(!payments.length) paymentsBody.innerHTML='<tr><td colspan="4">لا توجد مدفوعات مسجلة.</td></tr>';
  payments.forEach(p=>{
    const tr=document.createElement("tr");
    const date=p.createdAt?.toDate?p.createdAt.toDate().toLocaleDateString("ar-EG"):"—";
    [money(p.amount),p.method||"—",p.status||"قيد المراجعة",date].forEach(v=>{const td=document.createElement("td");td.textContent=v;tr.append(td);});
    paymentsBody.append(tr);
  });
  const progressSnap=await getDocs(query(collection(db,"trainingProgress"),where("uid","==",user.uid)));
  const progress=[]; progressSnap.forEach(s=>progress.push(s.data()));
  const body=$("progress"); body.replaceChildren();
  if(!progress.length) body.innerHTML='<tr><td colspan="3">لم تتم إضافة برامج إلى حسابك بعد. يمكنك استكشاف البرامج المتاحة.</td></tr>';
  progress.forEach(p=>{
    const tr=document.createElement("tr");
    const name=document.createElement("td");name.textContent=p.programName||"برنامج تدريبي";
    const state=document.createElement("td");state.textContent=p.status||"لم يبدأ";
    const pct=document.createElement("td");pct.textContent=`${Math.max(0,Math.min(100,Number(p.progressPercent||0)))}%`;
    tr.append(name,state,pct);body.append(tr);
  });
  $("programCount").textContent=progress.length;
  $("completedCount").textContent=progress.filter(p=>["completed","passed","approved"].includes(String(p.status||"").toLowerCase())).length;
  const details=[
    ["الاسم بالعربي",data.fullNameAr],["Full name",data.fullNameEn],["WhatsApp",data.whatsapp],
    ["التخصص",data.specialty],["رقم الهوية / الجواز",data.nationalIdOrPassport?("••••"+String(data.nationalIdOrPassport).slice(-4)):"—"],["الدولة",data.country],
    ["المحافظة",data.governorate],["جهة العمل",data.workplace],["الكلية",data.college],["الجامعة",data.university]
  ];
  const grid=$("profileDetails");grid.replaceChildren();
  details.forEach(([label,value])=>{const item=document.createElement("div");item.className="profile-item";const small=document.createElement("small");small.textContent=label;const strong=document.createElement("strong");strong.textContent=value||"—";item.append(small,strong);grid.append(item);});
  drawCharts(progress,payments,fee,paidTotal);
}

async function submitPayment() {
  const user=auth.currentUser,file=$("proof")?.files[0],amount=Number($("amount")?.value);
  if(!user||!(amount>0)||!file){status("أدخل المبلغ واختر إثبات الدفع.",true);return;}
  if(file.size>5*1024*1024||!["image/jpeg","image/png","application/pdf"].includes(file.type)){status("الملف لازم يكون JPG أو PNG أو PDF وأقل من 5MB.",true);return;}
  try{
    const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,"_"),path=`payment-proofs/${user.uid}/${Date.now()}-${safeName}`;
    const uploaded=await uploadBytes(ref(storage,path),file,{contentType:file.type}),url=await getDownloadURL(uploaded.ref);
    await addDoc(collection(db,"paymentSubmissions"),{uid:user.uid,amount,proofPath:path,proofUrl:url,method:$("method").value,status:"pending",createdAt:serverTimestamp()});
    status("تم إرسال إثبات الدفع للمراجعة. سيظهر تحديثه في سجل المدفوعات بعد المراجعة.");$("paymentForm").reset();
  }catch(error){console.error(error);status(`تعذر إرسال الإثبات: ${error.code||error.message}`,true);}
}

async function adminLoad() {
  const traineesSnapshot=await getDocs(collection(db,"trainees"));$("trainees").replaceChildren();
  traineesSnapshot.forEach(snapshot=>{
    const t=snapshot.data(),row=document.createElement("tr");
    [t.email,t.fullNameAr||t.displayName,t.subscriptionStatus,t.accountStatus,money(t.totalFee),money(t.totalPaid)].forEach(v=>{const cell=document.createElement("td");cell.textContent=v??"";row.append(cell);});
    const action=document.createElement("td"),button=document.createElement("button");button.textContent="تفعيل الاشتراك السنوي";
    button.onclick=async()=>{
      const fee=Number(prompt("قيمة الاشتراك السنوي بالجنيه؟","60000"));
      if(!Number.isFinite(fee)||fee<0){status("أدخل قيمة صحيحة.",true);return;}
      button.disabled=true;
      try{await setDoc(doc(db,"trainees",snapshot.id),{subscriptionStatus:"approved",totalFee:fee,annualRegistrationFee:1000,approvedAt:serverTimestamp()},{merge:true});status("تم تفعيل الاشتراك السنوي.");await adminLoad();}
      catch(error){status(`تعذر تحديث الاشتراك: ${error.code||error.message}`,true);button.disabled=false;}
    };
    action.append(button);row.append(action);$("trainees").append(row);
  });
  const pending=await getDocs(query(collection(db,"paymentSubmissions"),where("status","==","pending")));
  $("pendingPayments").replaceChildren();
  pending.forEach(snapshot=>{
    const p=snapshot.data(),row=document.createElement("tr");
    [p.uid,money(p.amount),p.method,p.status].forEach(v=>{const td=document.createElement("td");td.textContent=v||"";row.append(td);});
    const action=document.createElement("td"),link=document.createElement("a");link.href=p.proofUrl||"#";link.target="_blank";link.rel="noopener";link.textContent="فتح الإثبات";action.append(link);
    const button=document.createElement("button");button.textContent="اعتماد الدفعة";
    button.onclick=async()=>{
      button.disabled=true;
      try{const refT=doc(db,"trainees",p.uid),snap=await getDoc(refT);if(!snap.exists())throw new Error("ملف المتدرب غير موجود.");
        await setDoc(doc(db,"paymentSubmissions",snapshot.id),{status:"approved",reviewedAt:serverTimestamp()},{merge:true});
        await setDoc(refT,{totalPaid:Number(snap.data().totalPaid||0)+Number(p.amount||0)},{merge:true});
        status("تم اعتماد الدفعة وتحديث الرصيد.");await adminLoad();
      }catch(error){status(`تعذر اعتماد الدفعة: ${error.code||error.message}`,true);button.disabled=false;}
    };
    action.append(button);row.append(action);$("pendingPayments").append(row);
  });
}

onAuthStateChanged(auth,async user=>{
  const page=document.body.dataset.page;
  if(page==="login"&&user&&!authFlowInProgress){go(isAdmin(user)?"admin-dashboard.html":"trainee-dashboard.html");return;}
  if(page==="trainee"){
    if(!user){go("trainee-login.html");return;}
    try{await loadTrainee(user);}catch(error){console.error(error);status(`تعذر تحميل الحساب: ${error.code||error.message}`,true);}
  }
  if(page==="admin"){
    if(!user||!isAdmin(user)){go("trainee-login.html");return;}
    await user.reload();
    if(!user.emailVerified){await signOut(auth);go("trainee-login.html");return;}
    try{await adminLoad();}catch(error){status(`خطأ الإدارة: ${error.code||error.message}`,true);}
  }
});

$("loginForm")?.addEventListener("submit",login);
$("signupForm")?.addEventListener("submit",signup);
$("showLogin")?.addEventListener("click",()=>switchAuth("login"));
$("showSignup")?.addEventListener("click",()=>switchAuth("signup"));
$("resetPassword")?.addEventListener("click",resetPassword);
$("logout")?.addEventListener("click",async()=>{await signOut(auth);go("trainee-login.html");});
$("paymentForm")?.addEventListener("submit",e=>{e.preventDefault();submitPayment();});
