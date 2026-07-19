(() => {
  const programs = window.HIGHFIELD_PROGRAMS || [];
  const config = window.HIGHFIELD_CONFIG || {};
  const params = new URLSearchParams(location.search);
  const id = Number(params.get("id"));
  const program = programs.find(item => item[0] === id);
  const title = program ? program[1] : "Selected Program";

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
  document.getElementById("registrationProgram").textContent = title;
  document.getElementById("programId").value = program ? program[0] : "";
  document.getElementById("programName").value = title;
  document.getElementById("intakeMonth").value = intake;
  document.getElementById("backToProgram").href = program ? `program.html?id=${program[0]}` : "programs.html";

  const whatsappText = encodeURIComponent(`Hello Highfield Egypt, I need assistance registering for the ${title} program – ${intake} intake.`);
  document.getElementById("registrationWhatsapp").href = `https://wa.me/201101669115?text=${whatsappText}`;

  const form = document.getElementById("registrationForm");
  const status = document.getElementById("formStatus");
  const submit = form.querySelector('button[type="submit"]');

  function setStatus(type, message) {
    status.className = `form-status ${type}`;
    status.textContent = message;
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      setStatus("error", "Please complete all required fields correctly.");
      return;
    }

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    payload.submittedAt = new Date().toISOString();
    payload.sourcePage = location.href;

    submit.disabled = true;
    submit.querySelector("span").textContent = "Submitting...";
    setStatus("loading", "Sending your registration request...");

    try {
      if (!config.registrationApiUrl) {
        localStorage.setItem(`highfield-registration-${Date.now()}`, JSON.stringify(payload));
        const message = encodeURIComponent(
          `Highfield Egypt Registration Request\nProgram: ${title}\nIntake: ${intake}\nName: ${payload.fullName}\nMobile: ${payload.mobileNumber}\nWhatsApp: ${payload.whatsappNumber}\nSpecialty: ${payload.specialty}\nAttendance: ${payload.attendanceMode}`
        );
        setStatus("success", "Your form has been prepared. WhatsApp will open so the registration team can receive and confirm your request.");
        setTimeout(() => window.open(`https://wa.me/201101669115?text=${message}`, "_blank", "noopener"), 450);
        form.reset();
        return;
      }

      const response = await fetch(config.registrationApiUrl, {
        method: "POST",
        headers: {"Content-Type": "text/plain;charset=utf-8"},
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false) throw new Error(result.message || "Submission failed");

      setStatus("success", "Your registration request has been received successfully. Our team will contact you to complete the registration process.");
      form.reset();
    } catch (error) {
      console.error(error);
      setStatus("error", "The online submission could not be completed. Please contact the registration team through WhatsApp: 01101669115.");
    } finally {
      submit.disabled = false;
      submit.querySelector("span").textContent = "Submit Registration";
    }
  });
})();