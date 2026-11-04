import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, collection, query, where,
  getDocs, addDoc, serverTimestamp, runTransaction
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const app = initializeApp(window.HIGHFIELD_FIREBASE_CONFIG);
const auth = getAuth(app), db = getFirestore(app);
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
let currentEnrollments = [];
let currentCancellationRequests = [];
let selectedEnrollmentId = "";
const ANNUAL_TOTAL_FEE = 61000;
const ANNUAL_FIRST_DUE = 6000; // 1,000 EGP registration + first 5,000 EGP installment
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


function formatStatus(value) {
  const map={pending_payment:"في انتظار الدفع",pending:"قيد المراجعة",partial:"مدفوع جزئيًا",paid:"مدفوع بالكامل",confirmed:"مؤكد",active:"نشط",unpaid:"غير مدفوع",admin_enrolled:"تم التسجيل بواسطة الإدارة",waived:"إعفاء إداري",pending_cancellation:"طلب إلغاء قيد المراجعة",cancelled:"ملغي",approved:"تمت الموافقة",rejected:"مرفوض"};
  return map[String(value||"").toLowerCase()] || value || "قيد المراجعة";
}

function populateIndividualPrograms() {
  const select=$("individualProgramSelect");
  if(!select || select.dataset.ready==="1") return;
  const programs=window.HIGHFIELD_PROGRAMS||[];
  select.replaceChildren(new Option("اختر البرنامج التدريبي",""));
  programs.forEach(item=>{
    const option=new Option(`${item[1]} — ${item[2]}`,String(item[0]));
    select.add(option);
  });
  select.dataset.ready="1";
  select.addEventListener("change",()=>{
    const id=Number(select.value),program=programs.find(x=>Number(x[0])===id);
    const price=program&&window.HIGHFIELD_GET_PROGRAM_PRICE?window.HIGHFIELD_GET_PROGRAM_PRICE(program).price:0;
    $("individualPrice").textContent=program?`${money(price)} · رسوم مستقلة للبرنامج`:"اختر برنامجًا لعرض الرسوم.";
  });
}

function renderEnrollmentSummary(enrollment) {
  if(!enrollment) return;
  const paid=Number(enrollment.paidAmount||0),total=Number(enrollment.totalFee||0);
  const balance=Math.max(0,total-paid);
  $("enrollmentSummary").classList.remove("hidden");
  $("selectedEnrollmentName").textContent=enrollment.programName||"مسار تدريبي";
  $("selectedTotal").textContent=money(total);
  $("selectedPaid").textContent=money(paid);
  $("selectedBalance").textContent=money(balance);
  const scheduledDue=enrollment.pathType==="annual"?(paid===0?6000:5000):Number(enrollment.dueNow||balance);
  const dueNow=Math.min(balance,scheduledDue);
  $("selectedDueNow").textContent=money(dueNow);
  $("selectedPaymentNote").textContent=enrollment.pathType==="annual"
    ?"البرنامج السنوي: 1,000 جنيه رسوم تسجيل + 5,000 جنيه قسط شهري. إجمالي الالتزام 61,000 جنيه."
    :"رسوم هذا البرنامج مستقلة عن الاشتراك السنوي.";
  selectedEnrollmentId=enrollment.id;
}

async function createEnrollmentRequest(pathType,program=null) {
  const user=auth.currentUser;
  if(!user) { status("سجّل الدخول أولًا.",true); return; }
  let programId="annual-medical-program",programName="Annual Medical Program — البرنامج الطبي السنوي الشامل";
  let totalFee=ANNUAL_TOTAL_FEE,dueNow=ANNUAL_FIRST_DUE;
  if(pathType==="individual") {
    if(!program) { status("اختر برنامجًا من القائمة أولًا.",true); return; }
    const pricing=window.HIGHFIELD_GET_PROGRAM_PRICE?.(program);
    if(!pricing) { status("تعذر تحديد سعر البرنامج. حدّث الصفحة وحاول مرة أخرى.",true); return; }
    programId=String(program[0]);programName=program[1];totalFee=Number(pricing.price);dueNow=totalFee;
  }
  try {
    const existingSnap=await getDocs(query(collection(db,"programEnrollments"),where("uid","==",user.uid)));
    let existing=null;
    existingSnap.forEach(s=>{
      const e=s.data();
      if(e.programId===programId && !["cancelled","rejected"].includes(String(e.enrollmentStatus||"").toLowerCase())) existing={id:s.id,...e};
    });
    if(existing) {
      selectedEnrollmentId=existing.id;
      renderEnrollmentSummary(existing);
      status("لديك بالفعل طلب تسجيل لهذا المسار. يمكنك متابعة الرصيد أو تسجيل بيانات الدفع.");
      selectEnrollmentForPayment(existing.id);
      return;
    }
    const payload={
      uid:user.uid,pathType,programId,programName,totalFee,dueNow,paidAmount:0,
      paymentStatus:"unpaid",enrollmentStatus:"pending_payment",createdAt:serverTimestamp()
    };
    const refNew=await addDoc(collection(db,"programEnrollments"),payload);
    const enrollment={id:refNew.id,...payload,createdAt:new Date()};
    currentEnrollments.push(enrollment);
    selectedEnrollmentId=refNew.id;
    renderEnrollmentSummary(enrollment);
    renderEnrollmentsTable();
    populatePaymentEnrollmentSelect();
    selectEnrollmentForPayment(refNew.id);
    status("تم إنشاء طلب الالتحاق. يمكنك الآن سداد الرسوم أو تسجيل بيانات الدفع.");
  } catch(error) {
    console.error(error);
    status(`تعذر إنشاء طلب الالتحاق: ${error.code||error.message}`,true);
  }
}

function renderEnrollmentsTable() {
  const body=$("enrollments");if(!body)return;
  body.replaceChildren();
  if(!currentEnrollments.length) {
    body.innerHTML='<tr><td colspan="6">لم تختر مسارًا تدريبيًا بعد.</td></tr>';return;
  }
  currentEnrollments.forEach(e=>{
    const paid=Number(e.paidAmount||0),total=Number(e.totalFee||0);
    const row=document.createElement("tr");
    const pendingRequest=currentCancellationRequests.find(r=>r.enrollmentId===e.id && r.status==="pending");
    const statusText=pendingRequest?"طلب إلغاء قيد المراجعة":formatStatus(e.enrollmentStatus||e.paymentStatus);
    const values=[e.programName||"برنامج تدريبي",money(total),money(paid),money(Math.max(0,total-paid)),statusText];
    values.forEach(v=>{const td=document.createElement("td");td.textContent=v;row.append(td);});
    const action=document.createElement("td");
    if(String(e.enrollmentStatus||"").toLowerCase()!=="cancelled" && !pendingRequest) {
      const cancel=document.createElement("button");
      cancel.type="button";cancel.className="outline-link cancel-enrollment-btn";
      cancel.textContent="طلب إلغاء الاشتراك";
      cancel.addEventListener("click",event=>{event.stopPropagation();requestEnrollmentCancellation(e);});
      action.append(cancel);
    } else {
      const label=document.createElement("span");
      label.className="cancellation-state";
      label.textContent=String(e.enrollmentStatus||"").toLowerCase()==="cancelled"?"تم إلغاء الاشتراك":"قيد مراجعة الإلغاء";
      action.append(label);
    }
    row.append(action);
    row.style.cursor="pointer";row.title="اضغط لعرض تفاصيل الرصيد";
    row.addEventListener("click",()=>{if(String(e.enrollmentStatus||"").toLowerCase()!=="cancelled"){renderEnrollmentSummary(e);selectEnrollmentForPayment(e.id);}});
    body.append(row);
  });
}

async function requestEnrollmentCancellation(enrollment) {
  const user=auth.currentUser;
  if(!user||!enrollment)return;
  const reason=prompt(`سبب طلب إلغاء الاشتراك في: ${enrollment.programName}\n\nسيتم إرسال الطلب للإدارة للمراجعة. الإلغاء لا يعني استردادًا تلقائيًا للمبلغ.`);
  if(reason===null)return;
  if(!reason.trim()){status("اكتب سبب طلب الإلغاء.",true);return;}
  const alreadyPending=currentCancellationRequests.some(r=>r.enrollmentId===enrollment.id&&r.status==="pending");
  if(alreadyPending){status("يوجد بالفعل طلب إلغاء قيد المراجعة لهذا البرنامج.",true);return;}
  if(String(enrollment.enrollmentStatus||"").toLowerCase()==="cancelled"){status("هذا الاشتراك ملغي بالفعل.",true);return;}
  try{
    const ref=await addDoc(collection(db,"enrollmentCancellationRequests"),{
      uid:user.uid,enrollmentId:enrollment.id,programId:enrollment.programId,
      programName:enrollment.programName,reason:reason.trim(),status:"pending",
      paidAmount:Number(enrollment.paidAmount||0),totalFee:Number(enrollment.totalFee||0),
      createdAt:serverTimestamp()
    });
    currentCancellationRequests.push({
      id:ref.id,uid:user.uid,enrollmentId:enrollment.id,programId:enrollment.programId,
      programName:enrollment.programName,reason:reason.trim(),status:"pending"
    });
    renderEnrollmentsTable();populatePaymentEnrollmentSelect();
    status("تم إرسال طلب الإلغاء إلى الإدارة. سيظل الاشتراك قائمًا حتى صدور القرار.");
  }catch(error){
    console.error(error);status(`تعذر إرسال طلب الإلغاء: ${error.code||error.message}`,true);
  }
}

function populatePaymentEnrollmentSelect() {
  const select=$("paymentEnrollment");if(!select)return;
  const current=select.value;
  select.replaceChildren(new Option("اختر التسجيل المرتبط بالدفعة",""));
  currentEnrollments.filter(e=>String(e.enrollmentStatus||"").toLowerCase()!=="cancelled"
    && !currentCancellationRequests.some(r=>r.enrollmentId===e.id&&r.status==="pending")).forEach(e=>{
    const remain=Math.max(0,Number(e.totalFee||0)-Number(e.paidAmount||0));
    if(remain>0) select.add(new Option(`${e.programName} — متبقي ${money(remain)}`,e.id));
  });
  if(currentEnrollments.some(e=>e.id===current))select.value=current;
}

function selectEnrollmentForPayment(id) {
  const select=$("paymentEnrollment");if(!select)return;
  select.value=id;
  const enrollment=currentEnrollments.find(e=>e.id===id);
  if(!enrollment)return;
  const remain=Math.max(0,Number(enrollment.totalFee||0)-Number(enrollment.paidAmount||0));
  const scheduledDue=enrollment.pathType==="annual"?(Number(enrollment.paidAmount||0)===0?6000:5000):Number(enrollment.dueNow||remain);
  const due=Math.min(remain,scheduledDue);
  $("amount").value=due>0?due:"";
  $("amount").max=remain;
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
  $("academicCaption").textContent=progressItems.length?`تم استكمال ${completed} من ${progressItems.length} برنامجًا مسجلًا ضمن مسار التطوير المستمر.`:"لم تتم إضافة برامج تدريبية إلى حسابك بعد.";
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
    const date=p.paymentDate|| (p.createdAt?.toDate?p.createdAt.toDate().toLocaleDateString("ar-EG"):"—");
    [money(p.amount),p.programName||"—",p.rejectionReason?`${formatStatus(p.status)}: ${p.rejectionReason}`:formatStatus(p.status),date].forEach(v=>{const td=document.createElement("td");td.textContent=v;tr.append(td);});
    paymentsBody.append(tr);
  });
  const progressSnap=await getDocs(query(collection(db,"trainingProgress"),where("uid","==",user.uid)));
  const progress=[]; progressSnap.forEach(s=>progress.push(s.data()));
  const enrollmentSnap=await getDocs(query(collection(db,"programEnrollments"),where("uid","==",user.uid)));
  currentEnrollments=[]; enrollmentSnap.forEach(s=>currentEnrollments.push({id:s.id,...s.data()}));
  const cancellationSnap=await getDocs(query(collection(db,"enrollmentCancellationRequests"),where("uid","==",user.uid)));
  currentCancellationRequests=[]; cancellationSnap.forEach(s=>currentCancellationRequests.push({id:s.id,...s.data()}));
  const activeEnrollments=currentEnrollments.filter(e=>!["cancelled","rejected"].includes(String(e.enrollmentStatus||"").toLowerCase()));
  const annualEnrollments=activeEnrollments.filter(e=>e.pathType==="annual");
  const individualEnrollments=activeEnrollments.filter(e=>e.pathType==="individual");
  const sumFinance=list=>({
    total:list.reduce((sum,e)=>sum+Number(e.totalFee||0),0),
    paid:list.reduce((sum,e)=>sum+Number(e.paidAmount||0),0)
  });
  const annualFinance=sumFinance(annualEnrollments), individualFinance=sumFinance(individualEnrollments);
  const enrollmentTotal=annualFinance.total+individualFinance.total;
  const enrollmentPaid=annualFinance.paid+individualFinance.paid;
  const enrollmentBalance=Math.max(0,enrollmentTotal-enrollmentPaid);
  $("balance").textContent=activeEnrollments.length?money(enrollmentBalance):"لا توجد التزامات نشطة";
  if($("annualBalance")) $("annualBalance").textContent=money(Math.max(0,annualFinance.total-annualFinance.paid));
  if($("annualFinanceDetail")) $("annualFinanceDetail").textContent=`المدفوع ${money(annualFinance.paid)} · إجمالي الرسوم ${money(annualFinance.total)}`;
  if($("individualBalance")) $("individualBalance").textContent=money(Math.max(0,individualFinance.total-individualFinance.paid));
  if($("individualFinanceDetail")) $("individualFinanceDetail").textContent=`المدفوع ${money(individualFinance.paid)} · إجمالي الرسوم ${money(individualFinance.total)}`;
  renderEnrollmentsTable();populatePaymentEnrollmentSelect();populateIndividualPrograms();
  const latest=[...activeEnrollments].reverse()[0];
  if(latest) { renderEnrollmentSummary(latest);selectedEnrollmentId=latest.id; }
  const body=$("progress"); body.replaceChildren();
  const learningRows=[];
  const progressByEnrollment=new Map();
  progress.forEach(p=>{
    if(p.enrollmentId) progressByEnrollment.set(p.enrollmentId,p);
    else if(p.programId) progressByEnrollment.set(String(p.programId),p);
  });
  activeEnrollments.forEach(e=>{
    const p=progressByEnrollment.get(e.id)||progressByEnrollment.get(String(e.programId))||{};
    const state=p.status||e.enrollmentStatus||e.paymentStatus||"pending_payment";
    const pct=Math.max(0,Math.min(100,Number(p.progressPercent||0)));
    learningRows.push({
      name:e.programName||"برنامج تدريبي",
      type:e.pathType==="annual"?"البرنامج السنوي":"برنامج منفصل",
      status:formatStatus(state),
      pct:`${pct}%`
    });
  });
  const enrollmentKeys=new Set(activeEnrollments.map(e=>String(e.id)));
  progress.forEach(p=>{
    if(p.enrollmentId&&enrollmentKeys.has(String(p.enrollmentId))) return;
    if(!p.enrollmentId && activeEnrollments.some(e=>String(e.programId)===String(p.programId))) return;
    learningRows.push({name:p.programName||"برنامج تدريبي",type:p.pathType==="annual"?"البرنامج السنوي":"برنامج منفصل",status:formatStatus(p.status||"not_started"),pct:`${Math.max(0,Math.min(100,Number(p.progressPercent||0)))}%`});
  });
  if(!learningRows.length) body.innerHTML='<tr><td colspan="4">لم تسجل في أي برنامج بعد. اختر البرنامج السنوي أو استكشف البرامج المنفصلة أعلاه.</td></tr>';
  learningRows.forEach(p=>{
    const tr=document.createElement("tr");
    [p.name,p.type,p.status,p.pct].forEach(value=>{const td=document.createElement("td");td.textContent=value;tr.append(td);});
    body.append(tr);
  });
  $("programCount").textContent=learningRows.length;
  $("completedCount").textContent=learningRows.filter(p=>["مكتمل","تمت الموافقة","completed","passed","approved"].includes(String(p.status).toLowerCase())).length;
  const details=[
    ["الاسم بالعربي",data.fullNameAr],["Full name",data.fullNameEn],["WhatsApp",data.whatsapp],
    ["التخصص",data.specialty],["رقم الهوية / الجواز",data.nationalIdOrPassport?("••••"+String(data.nationalIdOrPassport).slice(-4)):"—"],["الدولة",data.country],
    ["المحافظة",data.governorate],["جهة العمل",data.workplace],["الكلية",data.college],["الجامعة",data.university]
  ];
  const grid=$("profileDetails");grid.replaceChildren();
  details.forEach(([label,value])=>{const item=document.createElement("div");item.className="profile-item";const small=document.createElement("small");small.textContent=label;const strong=document.createElement("strong");strong.textContent=value||"—";item.append(small,strong);grid.append(item);});
  drawCharts(progress,payments,enrollmentTotal,enrollmentPaid);
}

async function submitPayment() {
  const user=auth.currentUser;
  const amount=Number($("amount")?.value);
  const paymentDate=$("paymentDate")?.value;
  const enrollmentId=$("paymentEnrollment")?.value;
  const enrollment=currentEnrollments.find(e=>e.id===enrollmentId);
  const progressEl=$("paymentProgress"),submitBtn=$("paymentSubmitBtn");
  const showProgress=(message,isError=false)=>{
    if(progressEl){progressEl.textContent=message;progressEl.className=isError?"status error":"status";}
    else status(message,isError);
  };
  if(!user||!enrollment||!(amount>0)||!paymentDate){showProgress("اختر التسجيل، وأدخل تاريخ الدفع والمبلغ.",true);return;}
  const remaining=Math.max(0,Number(enrollment.totalFee||0)-Number(enrollment.paidAmount||0));
  if(amount>remaining){showProgress(`المبلغ أكبر من الرصيد المتبقي (${money(remaining)}).`,true);return;}
  if(new Date(paymentDate+"T00:00:00")>new Date(new Date().toDateString())){showProgress("تاريخ الدفع لا يمكن أن يكون في المستقبل.",true);return;}
  if(submitBtn){submitBtn.disabled=true;submitBtn.textContent="جارٍ تسجيل الدفعة...";}
  try{
    await addDoc(collection(db,"paymentSubmissions"),{
      uid:user.uid,enrollmentId,programId:enrollment.programId,programName:enrollment.programName,
      amount,paymentDate,status:"pending",createdAt:serverTimestamp()
    });
    showProgress("تم تسجيل بيانات الدفع وإرسالها للإدارة للمراجعة.");
    $("paymentForm").reset();
    populatePaymentEnrollmentSelect();
    selectEnrollmentForPayment(enrollmentId);
    await loadTrainee(user);
  }catch(error){
    console.error("Payment submission failed:",error);
    showProgress(`تعذر تسجيل الدفعة (${error.code||"unknown"}): ${error.message||"راجع صلاحيات Firestore."}`,true);
  }finally{
    if(submitBtn){submitBtn.disabled=false;submitBtn.textContent="تسجيل الدفعة للمراجعة";}
  }
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
  const enrollmentRows=await getDocs(collection(db,"programEnrollments"));
  const adminEnrollmentBody=$("adminEnrollments");
  if(adminEnrollmentBody) {
    adminEnrollmentBody.replaceChildren();
    for(const item of enrollmentRows.docs) {
      const e=item.data(),traineeSnap=await getDoc(doc(db,"trainees",e.uid));
      const trainee=traineeSnap.exists()?traineeSnap.data():{};
      const row=document.createElement("tr");
      [trainee.fullNameAr||trainee.displayName||e.uid,e.programName||"برنامج تدريبي",formatStatus(e.enrollmentStatus),formatStatus(e.paymentStatus),money(e.totalFee)].forEach(value=>{
        const td=document.createElement("td");td.textContent=value;row.append(td);
      });
      const action=document.createElement("td");
      const approve=document.createElement("button");
      approve.textContent="تأكيد التسجيل الإداري";
      approve.disabled=["confirmed","admin_enrolled"].includes(String(e.enrollmentStatus||"").toLowerCase());
      approve.onclick=async()=>{
        approve.disabled=true;
        try {
          await setDoc(doc(db,"programEnrollments",item.id),{
            enrollmentStatus:"admin_enrolled",
            enrollmentMethod:"admin",
            adminConfirmedAt:serverTimestamp()
          },{merge:true});
          status("تم تأكيد التسجيل بواسطة الإدارة مع الاحتفاظ بحالة الدفع المستقلة.");
          await adminLoad();
        } catch(error) {
          status(`تعذر تأكيد التسجيل: ${error.code||error.message}`,true);approve.disabled=false;
        }
      };
      action.append(approve);row.append(action);adminEnrollmentBody.append(row);
    }
    if(!enrollmentRows.size) adminEnrollmentBody.innerHTML='<tr><td colspan="6">لا توجد طلبات تسجيل حتى الآن.</td></tr>';
  }
  const cancellationRows=await getDocs(query(collection(db,"enrollmentCancellationRequests"),where("status","==","pending")));
  const cancellationBody=$("adminCancellationRequests");
  if(cancellationBody) {
    cancellationBody.replaceChildren();
    for(const item of cancellationRows.docs) {
      const r=item.data(),traineeSnap=await getDoc(doc(db,"trainees",r.uid));
      const trainee=traineeSnap.exists()?traineeSnap.data():{};
      const row=document.createElement("tr");
      [trainee.fullNameAr||trainee.displayName||r.uid,r.programName||"برنامج تدريبي",r.reason||"—",money(r.paidAmount||0),money(r.totalFee||0)].forEach(value=>{
        const td=document.createElement("td");td.textContent=value;row.append(td);
      });
      const action=document.createElement("td");
      const approve=document.createElement("button");approve.textContent="الموافقة على الإلغاء";
      approve.onclick=async()=>{
        const note=prompt("ملاحظة أو قرار الاسترداد (اختياري). لن يتم رد أي مبلغ تلقائيًا.","");
        if(note===null)return;
        approve.disabled=true;
        try{
          const enrollmentRef=doc(db,"programEnrollments",r.enrollmentId);
          const enrollmentSnap=await getDoc(enrollmentRef);
          if(!enrollmentSnap.exists()||enrollmentSnap.data().uid!==r.uid)throw new Error("تعذر العثور على تسجيل المتدرب.");
          await setDoc(enrollmentRef,{
            enrollmentStatus:"cancelled",cancelledAt:serverTimestamp(),
            cancellationApprovedAt:serverTimestamp(),cancellationAdminNote:note.trim()
          },{merge:true});
          await setDoc(doc(db,"enrollmentCancellationRequests",item.id),{
            status:"approved",reviewedAt:serverTimestamp(),reviewedBy:auth.currentUser.email,
            adminDecisionNote:note.trim()
          },{merge:true});
          status("تمت الموافقة على إلغاء التسجيل. لم يتم تنفيذ استرداد مالي تلقائي.");
          await adminLoad();
        }catch(error){status(`تعذر اعتماد الإلغاء: ${error.code||error.message}`,true);approve.disabled=false;}
      };
      const reject=document.createElement("button");reject.textContent="رفض الطلب";
      reject.onclick=async()=>{
        const note=prompt("سبب رفض طلب الإلغاء:");
        if(note===null)return;
        if(!note.trim()){status("اكتب سبب الرفض.",true);return;}
        reject.disabled=true;
        try{
          await setDoc(doc(db,"enrollmentCancellationRequests",item.id),{
            status:"rejected",reviewedAt:serverTimestamp(),reviewedBy:auth.currentUser.email,
            adminDecisionNote:note.trim()
          },{merge:true});
          status("تم رفض طلب الإلغاء.");await adminLoad();
        }catch(error){status(`تعذر رفض الطلب: ${error.code||error.message}`,true);reject.disabled=false;}
      };
      action.append(approve,document.createTextNode(" "),reject);row.append(action);cancellationBody.append(row);
    }
    if(!cancellationRows.size)cancellationBody.innerHTML='<tr><td colspan="6">لا توجد طلبات إلغاء معلقة.</td></tr>';
  }

  const adminTraineeSelect=$("adminTraineeSelect"),adminProgramSelect=$("adminProgramSelect");
  if(adminTraineeSelect) {
    adminTraineeSelect.replaceChildren(new Option("اختر المتدرب",""));
    traineesSnapshot.forEach(s=>{const t=s.data();adminTraineeSelect.add(new Option(`${t.fullNameAr||t.displayName||t.email} — ${t.email}`,s.id));});
  }
  if(adminProgramSelect) {
    adminProgramSelect.replaceChildren(new Option("اختر البرنامج",""));
    (window.HIGHFIELD_PROGRAMS||[]).forEach(p=>adminProgramSelect.add(new Option(`${p[1]} — ${money(window.HIGHFIELD_GET_PROGRAM_PRICE?.(p)?.price||0)}`,String(p[0]))));
  }
  const pending=await getDocs(query(collection(db,"paymentSubmissions"),where("status","==","pending")));
  $("pendingPayments").replaceChildren();
  if(!pending.size) $("pendingPayments").innerHTML='<tr><td colspan="6">لا توجد دفعات قيد المراجعة.</td></tr>';
  for(const paymentDoc of pending.docs){
    const p=paymentDoc.data(),row=document.createElement("tr");
    const traineeSnap=await getDoc(doc(db,"trainees",p.uid));
    const trainee=traineeSnap.exists()?traineeSnap.data():{};
    [trainee.fullNameAr||trainee.displayName||p.uid,p.programName||"—",money(p.amount),p.paymentDate||"—",formatStatus(p.status)].forEach(v=>{const td=document.createElement("td");td.textContent=v;row.append(td);});
    const action=document.createElement("td");
    const approve=document.createElement("button");approve.textContent="اعتماد الدفعة";
    approve.onclick=async()=>{
      approve.disabled=true;
      try{
        await runTransaction(db,async transaction=>{
          const paymentRef=doc(db,"paymentSubmissions",paymentDoc.id);
          const latestPayment=await transaction.get(paymentRef);
          if(!latestPayment.exists()||latestPayment.data().status!=="pending")throw new Error("تمت مراجعة هذه الدفعة بالفعل.");
          const traineeRef=doc(db,"trainees",p.uid),latestTrainee=await transaction.get(traineeRef);
          if(!latestTrainee.exists())throw new Error("ملف المتدرب غير موجود.");
          let enrollmentRef=null,enrollmentData=null;
          if(p.enrollmentId){enrollmentRef=doc(db,"programEnrollments",p.enrollmentId);const enrollmentSnap=await transaction.get(enrollmentRef);if(!enrollmentSnap.exists()||enrollmentSnap.data().uid!==p.uid)throw new Error("تعذر العثور على تسجيل البرنامج المرتبط بالدفعة.");enrollmentData=enrollmentSnap.data();}
          transaction.update(paymentRef,{status:"approved",reviewedAt:serverTimestamp(),reviewedBy:auth.currentUser.email});
          transaction.update(traineeRef,{totalPaid:Number(latestTrainee.data().totalPaid||0)+Number(p.amount||0)});
          if(enrollmentRef&&enrollmentData){
            const paid=Number(enrollmentData.paidAmount||0)+Number(p.amount||0),total=Number(enrollmentData.totalFee||0);
            transaction.update(enrollmentRef,{paidAmount:paid,paymentStatus:paid>=total?"paid":"partial",enrollmentStatus:paid>=total?"confirmed":"pending_payment",lastPaymentApprovedAt:serverTimestamp()});
          }
        });
        status("تم اعتماد الدفعة وتحديث رصيد المتدرب والبرنامج.");await adminLoad();
      }catch(error){status(`تعذر اعتماد الدفعة: ${error.code||error.message}`,true);approve.disabled=false;}
    };
    const reject=document.createElement("button");reject.className="secondary";reject.textContent="رفض الدفعة";
    reject.onclick=async()=>{
      const reason=prompt("اكتب سبب رفض تسجيل الدفعة:");
      if(reason===null)return;
      if(!reason.trim()){status("يجب كتابة سبب الرفض.",true);return;}
      reject.disabled=true;
      try{
        await setDoc(doc(db,"paymentSubmissions",paymentDoc.id),{status:"rejected",rejectionReason:reason.trim(),reviewedAt:serverTimestamp(),reviewedBy:auth.currentUser.email},{merge:true});
        status("تم رفض الدفعة وتسجيل سبب الرفض.");await adminLoad();
      }catch(error){status(`تعذر رفض الدفعة: ${error.code||error.message}`,true);reject.disabled=false;}
    };
    action.append(approve,document.createTextNode(" "),reject);row.append(action);$("pendingPayments").append(row);
  }

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
$("adminEnrollmentForm")?.addEventListener("submit",async e=>{
  e.preventDefault();
  const uid=$("adminTraineeSelect").value,programId=$("adminProgramSelect").value;
  const program=(window.HIGHFIELD_PROGRAMS||[]).find(p=>String(p[0])===programId);
  if(!uid||!program){status("اختر المتدرب والبرنامج.",true);return;}
  const fee=Number(window.HIGHFIELD_GET_PROGRAM_PRICE?.(program)?.price||0);
  const paymentStatus=$("adminPaymentStatus").value;
  try{
    await addDoc(collection(db,"programEnrollments"),{
      uid,pathType:"individual",programId,programName:program[1],totalFee:fee,
      paidAmount:paymentStatus==="paid"||paymentStatus==="waived"?fee:0,
      dueNow:fee,paymentStatus:paymentStatus==="waived"?"waived":paymentStatus,
      enrollmentStatus:"admin_enrolled",enrollmentMethod:"admin",
      adminNote:$("adminEnrollmentNote").value.trim(),createdAt:serverTimestamp()
    });
    status("تم تسجيل المتدرب في البرنامج بواسطة الإدارة.");$("adminEnrollmentForm").reset();await adminLoad();
  }catch(error){status(`تعذر إضافة البرنامج: ${error.code||error.message}`,true);}
});
$("chooseAnnualPath")?.addEventListener("click",()=>createEnrollmentRequest("annual"));
$("chooseIndividualPath")?.addEventListener("click",()=>{
  const id=Number($("individualProgramSelect")?.value);
  const program=(window.HIGHFIELD_PROGRAMS||[]).find(x=>Number(x[0])===id);
  createEnrollmentRequest("individual",program);
});
$("useSelectedEnrollment")?.addEventListener("click",()=>selectEnrollmentForPayment(selectedEnrollmentId));
$("paymentEnrollment")?.addEventListener("change",e=>selectEnrollmentForPayment(e.target.value));
