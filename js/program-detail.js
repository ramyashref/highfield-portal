(() => {
  const data = window.HIGHFIELD_PROGRAMS || [];
  const params = new URLSearchParams(location.search);
  const id = Number(params.get("id"));
  const program = data.find(item => item[0] === id);

  const slugify = value => value.toLowerCase()
    .replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const getIntakeDate = () => {
    const now = new Date();
    let y = now.getFullYear(), m = now.getMonth();
    if (now.getDate() >= 25) m += 1;
    if (m > 11) { y += Math.floor(m / 12); m %= 12; }
    const base = new Date(2026, 7, 1);
    const candidate = new Date(y, m, 1);
    return candidate < base ? base : candidate;
  };

  const intake = getIntakeDate().toLocaleString("en-US", { month: "long", year: "numeric" });
  document.querySelectorAll("[data-intake-month]").forEach(el => el.textContent = intake);

  if (!program) {
    document.getElementById("programPage").hidden = true;
    document.getElementById("programNotFound").hidden = false;
    return;
  }

  const [programId, title, category, audience, days] = program;

  const categoryFocus = {
    "Emergency Medicine": "assessment, stabilization, prioritization, and safe early management of urgent and time-sensitive clinical presentations",
    "Critical Care": "structured assessment, monitoring, organ-support principles, and multidisciplinary decision-making in critically ill patients",
    "Cardiology": "cardiovascular assessment, clinical interpretation, risk recognition, and evidence-informed management principles",
    "Pediatrics": "age-appropriate assessment, recognition of pediatric warning signs, and safe clinical decision-making for infants and children",
    "Clinical Nutrition": "nutritional assessment, practical care planning, monitoring, and evidence-informed nutrition support",
    "Nutrition": "clinical assessment, individualized nutrition planning, obesity-related risk factors, and sustainable follow-up strategies",
    "Internal Medicine": "systematic clinical assessment, differential diagnosis, interpretation of common investigations, and practical management planning",
    "Obstetrics and Gynecology": "structured women’s health assessment, clinical decision-making, procedural principles, and patient-safety considerations",
    "Surgery": "safe surgical principles, preparation, procedural technique, complication awareness, and postoperative care",
    "Radiology": "systematic image review, recognition of relevant findings, clinical correlation, and clear reporting principles",
    "Dentistry": "evidence-informed dental assessment, treatment planning, clinical technique, and prevention of common procedural complications",
    "Dermatology": "structured skin and hair assessment, appropriate procedure selection, safety, and complication awareness",
    "Aesthetic Medicine": "facial and skin assessment, safe procedural planning, anatomy-based technique, and complication prevention",
    "Pharmacy": "patient-centered medication review, therapeutic decision-making, safety monitoring, and interprofessional communication",
    "Nursing": "structured nursing assessment, safe bedside practice, escalation of care, documentation, and patient-centered support",
    "Physical Therapy": "functional assessment, rehabilitation planning, safe therapeutic techniques, and outcome monitoring",
    "Quality": "quality improvement, risk reduction, patient safety, measurement, and sustainable healthcare processes",
    "Healthcare Management": "leadership, operational planning, team performance, service improvement, and data-informed decision-making",
    "Health Technology": "responsible use of digital tools, workflow improvement, data awareness, and practical healthcare innovation",
    "Administration": "professional communication, adult learning, facilitation, performance evaluation, and effective training delivery",
    "Medical Education": "critical appraisal, evidence application, structured clinical questions, and informed healthcare decision-making",
    "Family Medicine": "comprehensive first-contact care, continuity, prevention, common clinical presentations, and appropriate referral",
    "Pharmacy": "safe medication use, therapeutic review, monitoring, and collaborative pharmaceutical care"
  };

  const focus = categoryFocus[category] || `the essential knowledge, practical framework, and professional standards relevant to ${title.toLowerCase()}`;

  function buildOverview() {
    return `The ${title} program provides a focused and practical introduction to ${focus}. It is designed to connect essential scientific concepts with real professional situations, helping participants approach the subject in a structured, safe, and clinically relevant way. Delivery is available online and on-site to support different learning preferences.`;
  }

  function buildSummary() {
    return `A professional training program focused on ${focus}, with practical learning outcomes aligned with the needs of ${audience.toLowerCase()}.`;
  }

  function buildOutcomes() {
    const lower = title.toLowerCase();
    const outcomes = [
      `Explain the core principles and professional terminology related to ${title}.`,
      `Apply a structured approach to assessment, planning, and decision-making within the program scope.`,
      `Recognize common risks, limitations, warning signs, and situations that require escalation or referral.`,
      `Use practical checklists, clinical reasoning, and documentation principles to support safer professional practice.`
    ];
    if (/ultrasound|ct|mri|radiology|echo|ecg/.test(lower)) {
      outcomes[1] = "Use a systematic method to review, interpret, and communicate relevant diagnostic findings.";
    }
    if (/surgical|surgery|suturing|laparoscopic|iud|implant|endodont|orthodont|laser|filler|botulinum|prp|mesotherapy|peeling|microneedling|needling/.test(lower)) {
      outcomes[1] = "Describe the indications, preparation steps, procedural sequence, and post-procedure considerations.";
      outcomes[3] = "Identify common procedural complications and outline appropriate prevention and initial response measures.";
    }
    if (/leadership|management|quality|risk|accreditation|audit|patient experience|training of trainers/.test(lower)) {
      outcomes[1] = "Translate the program concepts into practical tools, workflows, and measurable improvement actions.";
      outcomes[3] = "Develop a simple implementation plan suitable for a healthcare team or organization.";
    }
    if (/nutrition|obesity|diabetes|hypertension|chronic/.test(lower)) {
      outcomes[1] = "Build an evidence-informed assessment and follow-up plan tailored to common clinical needs.";
    }
    return outcomes;
  }

  document.getElementById("pageTitle").textContent = `${title} | Highfield Egypt`;
  document.getElementById("metaDescription").content = buildSummary();
  document.getElementById("programCategory").textContent = category;
  document.getElementById("programTitle").textContent = title;
  document.getElementById("programSummary").textContent = buildSummary();
  document.getElementById("programDays").textContent = `${days} ${days === 1 ? "Training Day" : "Training Days"}`;
  document.getElementById("programOverview").textContent = buildOverview();
  document.getElementById("targetAudience").textContent = `${audience}. Admission remains subject to the announced professional requirements and the scope of practice applicable to each participant.`;
  document.getElementById("detailSpecialty").textContent = category;
  document.getElementById("detailDays").textContent = `${days} ${days === 1 ? "day" : "days"}`;
  document.getElementById("learningOutcomes").innerHTML = buildOutcomes().map(item => `<li>${item}</li>`).join("");

  const registrationUrl = `register.html?id=${programId}&program=${slugify(title)}`;
  document.getElementById("registerButton").href = registrationUrl;
  document.getElementById("sideRegisterButton").href = registrationUrl;

  const message = encodeURIComponent(`Hello Highfield Egypt, I would like to inquire about the ${title} program – ${intake} intake.`);
  const whatsapp = `https://wa.me/201101669115?text=${message}`;
  ["whatsappButton", "sideWhatsappButton"].forEach(id => document.getElementById(id).href = whatsapp);
})();