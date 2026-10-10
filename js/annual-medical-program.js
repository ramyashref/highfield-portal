(() => {
  const form = document.getElementById('annualRegistrationForm');
  const status = document.getElementById('annualFormStatus');
  const button = form.querySelector('button[type="submit"]');
  const menu = document.querySelector('.annual-menu');
  const links = document.querySelector('.annual-links');
  menu?.addEventListener('click', () => { const open = links.classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)); });
  links?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { links.classList.remove('open'); menu?.setAttribute('aria-expanded','false'); }));
  const setStatus = (type, message) => { status.className = `annual-form-status ${type}`; status.textContent = message; };
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); setStatus('error','Please complete all required fields correctly. / برجاء استكمال الحقول الإلزامية بصورة صحيحة.'); return; }
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    payload.programName = 'Highfield Annual Medical Program';
    payload.programYear = '2027';
    payload.fullName = payload.englishName;
    payload.nationalId = payload.nationalIdOrPassport || '';
    payload.submittedAt = new Date().toISOString();
    payload.sourcePage = location.href;
    payload.consent = fd.has('consent');
    button.disabled = true; button.querySelector('span').textContent = 'Submitting...';
    setStatus('loading','Sending your registration request... / جارٍ إرسال طلب التسجيل.');
    const config = window.HIGHFIELD_CONFIG || {};
    try {
      if (!config.registrationApiUrl) throw new Error('Registration endpoint is not configured');
      const response = await fetch(config.registrationApiUrl, { method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify(payload) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false) throw new Error(result.message || 'Submission failed');
      setStatus('success','Your registration request has been sent successfully. The Highfield team will contact you. / تم إرسال طلب التسجيل بنجاح، وسيتواصل معك فريق هايفيلد.');
      form.reset();
    } catch (error) {
      console.error(error);
      setStatus('error','Online submission was not confirmed. Please contact Highfield on WhatsApp: 01101669115. / لم نتمكن من تأكيد الإرسال إلكترونيًا؛ يُرجى التواصل مع هايفيلد عبر واتساب 01101669115.');
    } finally {
      button.disabled = false; button.querySelector('span').textContent = 'Submit Registration';
    }
  });
})();
