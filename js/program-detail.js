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
    "Family Medicine": "comprehensive first-contact care, continuity, prevention, common clinical presentations, and appropriate referral"
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

  const isBLS = programId === 2;
  const blsSummary = "A two-day, hands-on Basic Life Support training program accredited by the Egyptian Health Council, awarding 8 CPD points. Limited to 10 participants.";
  const blsOverview = "The Basic Life Support (BLS) Program is a practical, skills-focused training program designed to equip healthcare professionals with the essential knowledge and clinical skills required to recognize life-threatening emergencies and provide immediate, effective life support. The program covers cardiac and respiratory arrest recognition, CPR, AED use, BLS assessment, choking management, and team-based resuscitation practice.";
  const blsObjectives = [
    "Recognize or suspect sudden and secondary cardiac arrest.",
    "Describe the Chain of Survival in in-hospital and out-of-hospital settings, including for children and infants.",
    "Demonstrate high-quality CPR and chest compressions for adults, children, and infants.",
    "Perform BLS assessment for an unresponsive person and identify when to call for help.",
    "Demonstrate rescue breathing using appropriate airway positioning, CPR mask, and bag-mask techniques.",
    "Describe and demonstrate the use of an Automated External Defibrillator (AED).",
    "Demonstrate a multiple-provider approach to CPR and effective resuscitation team function.",
    "Recognize and demonstrate the management of choking, including infant choking.",
    "Explain and demonstrate the administration techniques covered in the course for naloxone devices."
  ];

  const courseOutline = [
    { day: "DAY 1 – Basic Life Support Fundamentals", sessions: [
      { title: "Initial Class Outline & Time Frame", duration: "30 min", type: "Theoretical", items: ["Initial class outline and time frame."] },
      { title: "Program Introduction", duration: "15 min", type: "Theoretical", items: ["Describe the purpose of the program.", "Health and safety precautions.", "Conduct a warm-up exercise."] },
      { title: "External Pre-Test", duration: "15 min", type: "Theoretical", items: ["External Pre-Test."] },
      { title: "Sudden Cardiac Arrest", duration: "25 min", type: "Theoretical & Practical", items: ["Describe how to recognize or suspect and provide treatment for sudden cardiac arrest.", "Describe the links in the Chain of Survival for inside and outside the hospital, and for children and infants."] },
      { title: "Secondary Cardiac Arrest", duration: "25 min", type: "Practical", items: ["Describe how to recognize and provide treatment for secondary cardiac arrest including opioid overdose."] },
      { title: "High-Performance CPR", duration: "15 min", type: "Theoretical", items: ["Describe the qualities of high-performance CPR."] },
      { title: "Protecting Yourself", duration: "15 min", type: "Theoretical", items: ["Describe the importance of personal safety, standard precautions, and using protective barriers."] },
      { title: "Calling for Help", duration: "10 min", type: "Practical", items: ["Describe the steps of a BLS assessment for an unresponsive person."] },
      { title: "BLS Skills – CPR Feedback Devices & AED Training", duration: "20 min", type: "Theoretical", items: ["Describe what a CPR feedback device is and how one is used."] },
      { title: "BLS Skills – Chest Compressions", duration: "60 min", type: "Practical", items: ["Correctly demonstrate high-quality chest compressions on an adult, child, and infant."] },
      { title: "BLS Skills – Rescue Breaths", duration: "90 min", type: "Practical", items: ["Correctly demonstrate high-quality rescue breaths using head tilt–chin lift and a CPR mask on an adult, child, and infant.", "Optional: jaw thrust.", "Also demonstrate using bag mask."] },
      { title: "BLS Skills – Automated External Defibrillation", duration: "35 min", type: "Practical", items: ["Describe the steps to use an AED on an adult, child, and infant.", "Optional demonstration of AED use."] },
      { title: "BLS Skills – BLS Assessment", duration: "35 min", type: "Practical", items: ["Describe the steps of a BLS assessment.", "Describe recovery position.", "Optional demonstration."] }
    ]},
    { day: "DAY 2 – BLS Care", sessions: [
      { title: "Caring for Respiratory Arrest", duration: "60 min", type: "Practical", items: ["Correctly demonstrate how to determine respiratory arrest using BLS assessment and perform rescue breathing."] },
      { title: "Caring for Cardiac Arrest", duration: "90 min", type: "Practical", items: ["Correctly demonstrate cardiac arrest response, CPR, and AED use for adult, child, infant."] },
      { title: "Multiple Provider Approach to CPR", duration: "90 min", type: "Theoretical & Practical", items: ["Describe the qualities of high-performance CPR.", "Perform CPR with multiple providers and function in a resuscitation team."] },
      { title: "Additional Consideration – Naloxone (Prefilled Syringe)", duration: "15 min", type: "Practical", items: ["Explain how to administer naloxone intranasally using prefilled syringe.", "Demonstrate administration."] },
      { title: "Additional Consideration – Naloxone (Narcan Nasal Spray)", duration: "15 min", type: "Practical", items: ["Explain how to administer naloxone using Narcan spray.", "Demonstrate administration."] },
      { title: "Additional Consideration – Naloxone (Evzio Auto-Injector)", duration: "15 min", type: "Practical", items: ["Explain how to administer naloxone using autoinjector.", "Demonstrate administration."] },
      { title: "Additional Consideration – Choking", duration: "15 min", type: "Practical", items: ["Describe recognition and treatment of choking.", "Demonstrate treatment for choking infant."] },
      { title: "Final Test", duration: "60 min", type: "Theoretical & Practical", items: ["Final theoretical and practical examination."] }
    ]}
  ];

  document.getElementById("pageTitle").textContent = `${title} | Highfield Egypt`;
  document.getElementById("metaDescription").content = isBLS ? blsSummary : buildSummary();
  const pageUrl = `${location.origin}${location.pathname}?id=${programId}`;
  document.getElementById("canonicalUrl").href = pageUrl;
  document.getElementById("ogTitle").content = `${title} | Highfield Egypt`;
  document.getElementById("ogDescription").content = isBLS ? blsSummary : buildSummary();
  document.getElementById("ogUrl").content = pageUrl;
  document.getElementById("twitterTitle").content = `${title} | Highfield Egypt`;
  document.getElementById("twitterDescription").content = isBLS ? blsSummary : buildSummary();

  document.getElementById("programCategory").textContent = category;
  document.getElementById("programTitle").textContent = title;
  document.getElementById("programSummary").textContent = isBLS ? blsSummary : buildSummary();
  document.getElementById("programDays").textContent = `${days} ${days === 1 ? "Training Day" : "Training Days"}`;
  document.getElementById("programOverview").textContent = isBLS ? blsOverview : buildOverview();
  document.getElementById("targetAudience").textContent = isBLS
    ? audience
    : `${audience}. Admission remains subject to the announced professional requirements and the scope of practice applicable to each participant.`;
  document.getElementById("detailSpecialty").textContent = isBLS ? "Basic Life Support" : category;
  document.getElementById("detailDays").textContent = `${days} ${days === 1 ? "day" : "days"}`;
  document.getElementById("learningOutcomes").innerHTML = (isBLS ? blsObjectives : buildOutcomes()).map(item => `<li>${item}</li>`).join("");

  if (isBLS) {
    // BLS is delivered on-site only.
    const onlineBadge = document.getElementById("onlineDeliveryBadge");
    if (onlineBadge) onlineBadge.hidden = true;
    const onsiteBadge = document.getElementById("onsiteDeliveryBadge");
    if (onsiteBadge) onsiteBadge.textContent = "⌂ On-site Only";
    const availability = document.getElementById("deliveryAvailability");
    if (availability) availability.textContent = "This program is delivered on-site only.";
    const deliveryFact = document.getElementById("detailDelivery");
    if (deliveryFact) deliveryFact.textContent = "On-site Only";

    document.getElementById("programOverviewTitle").textContent = "BLS Program Overview";
    document.getElementById("learningSectionTitle").textContent = "Learning Objectives";
    document.getElementById("blsCourseOutlineSection").hidden = false;
    document.getElementById("blsPracticalSection").hidden = false;
    document.getElementById("blsAssessmentSection").hidden = false;
    document.getElementById("blsExtraFacts").hidden = false;
    document.getElementById("blsCapacityNote").hidden = false;

    document.getElementById("blsCourseOutline").innerHTML = courseOutline.map(day => `
      <section class="bls-day">
        <h3>${day.day}</h3>
        ${day.sessions.map(session => `
          <article class="bls-session">
            <div class="bls-session-heading">
              <strong>${session.title}</strong>
              <span>${session.duration} · ${session.type}</span>
            </div>
            <ul>${session.items.map(item => `<li>${item}</li>`).join("")}</ul>
          </article>
        `).join("")}
      </section>
    `).join("");

    const practicalSkills = [
      "High-quality chest compressions on adults, children, and infants.",
      "Rescue breathing using head tilt–chin lift, CPR mask, and bag-mask ventilation.",
      "Optional jaw-thrust technique demonstration.",
      "AED use for adults, children, and infants.",
      "BLS assessment and recovery position demonstration.",
      "Respiratory arrest assessment and rescue breathing.",
      "Cardiac arrest response, CPR, and AED use.",
      "Multiple-provider CPR and resuscitation team practice.",
      "Naloxone administration demonstrations using the listed delivery devices.",
      "Recognition and treatment of choking, including infant choking."
    ];
    document.getElementById("blsPracticalSkills").innerHTML = practicalSkills.map(item => `<li>${item}</li>`).join("");
  }

  const registrationUrl = `register.html?id=${programId}&program=${slugify(title)}`;
  document.getElementById("registerButton").href = registrationUrl;
  document.getElementById("sideRegisterButton").href = registrationUrl;

  const message = encodeURIComponent(`Hello Highfield Egypt, I would like to inquire about the ${title} program – ${intake} intake.`);
  const whatsapp = `https://wa.me/201101669115?text=${message}`;
  ["whatsappButton", "sideWhatsappButton"].forEach(id => document.getElementById(id).href = whatsapp);
})();
