(() => {
  const form = document.getElementById('annualRegistrationForm');
  const status = document.getElementById('annualFormStatus');
  const button = form?.querySelector('button[type="submit"]');
  const buttonText = button?.querySelector('span');
  const menu = document.querySelector('.annual-menu');
  const links = document.querySelector('.annual-links');

  // Responsive navigation for this page only.
  menu?.addEventListener('click', () => {
    if (!links) return;
    const open = links.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open));
  });
  links?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    links.classList.remove('open');
    menu?.setAttribute('aria-expanded', 'false');
  }));

  // Gentle reveal animation, with an accessible reduced-motion fallback.
  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('is-visible'));
  }

  // Keep the existing working annual-program Google Apps Script endpoint.
  const ENDPOINT = 'https://script.google.com/macros/s/AKfycbwwNqM8XNOB5sEtlgiM-5ivyQvrLCd5O2SE1b0iawto7eVSfSIkmD5k0KCZAWPjGIfKvw/exec';
  if (!form || !status) {
    console.error('Annual registration form or status element was not found.');
    return;
  }
  const setStatus = (type, message) => {
    status.className = `annual-form-status ${type}`;
    status.textContent = message;
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      setStatus('error', 'Please complete all required fields correctly. / برجاء استكمال الحقول الإلزامية بصورة صحيحة.');
      return;
    }
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    payload.programName = 'Highfield Annual Medical Program';
    payload.programYear = '2027';
    payload.fullName = payload.englishName || '';
    payload.nationalId = payload.nationalIdOrPassport || '';
    payload.submittedAt = new Date().toISOString();
    payload.sourcePage = window.location.href;
    payload.consent = fd.has('consent');

    if (!payload.consent) {
      setStatus('error', 'Please confirm your information before submitting. / برجاء تأكيد صحة البيانات قبل الإرسال.');
      return;
    }
    if (button) button.disabled = true;
    if (buttonText) buttonText.textContent = 'Submitting...';
    setStatus('loading', 'Sending your registration request... / جارٍ إرسال طلب التسجيل.');

    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        redirect: 'follow'
      });
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      const result = await response.json();
      if (result.success !== true) throw new Error(result.message || 'Registration was not accepted.');
      setStatus('success', 'Your registration request has been sent successfully. The Highfield team will contact you. / تم إرسال طلب التسجيل بنجاح، وسيتواصل معك فريق هايفيلد.');
      form.reset();
    } catch (error) {
      console.error('Annual program registration error:', error);
      setStatus('error', 'Online submission could not be confirmed. Please contact Highfield on WhatsApp: 01101669115. / لم نتمكن من تأكيد الإرسال إلكترونيًا؛ يُرجى التواصل مع هايفيلد عبر واتساب 01101669115.');
    } finally {
      if (button) button.disabled = false;
      if (buttonText) buttonText.textContent = 'Submit Registration';
    }
  });
})();
