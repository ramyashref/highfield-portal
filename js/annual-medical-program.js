
(() => {
  'use strict';

  const form = document.getElementById('annualRegistrationForm');
  const status = document.getElementById('annualFormStatus');
  const button = form?.querySelector('button[type="submit"]');
  const buttonText = button?.querySelector('span');
  const menu = document.querySelector('.annual-menu');
  const links = document.querySelector('.annual-links');

  const ENDPOINT =
    'https://script.google.com/macros/s/AKfycbwwNqM8XNOB5sEtlgiM-5ivyQvrLCd5O2SE1b0iawto7eVSfSIkmD5k0KCZAWPjGIfKvw/exec';

  // Mobile navigation
  menu?.addEventListener('click', () => {
    if (!links) return;

    const isOpen = links.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(isOpen));
  });

  links?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      links.classList.remove('open');
      menu?.setAttribute('aria-expanded', 'false');
    });
  });

  // Reveal animations with reduced-motion support
  const revealItems = document.querySelectorAll('.reveal');

  if (
    'IntersectionObserver' in window &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('is-visible'));
  }

  if (!form || !status) {
    console.error(
      'HIGHFIELD SCHOLARS: registration form or status element not found.'
    );
    return;
  }

  let isSubmitting = false;

  function setStatus(type, message) {
    status.className = `annual-form-status ${type}`;
    status.textContent = message;
    status.setAttribute('role', type === 'error' ? 'alert' : 'status');
    status.setAttribute('aria-live', 'polite');
  }

  function setButtonState(isLoading) {
    if (button) {
      button.disabled = isLoading;
      button.setAttribute('aria-busy', String(isLoading));
    }

    if (buttonText) {
      buttonText.textContent = isLoading
        ? 'Submitting...'
        : 'Submit Registration';
    }
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();

    // Prevent duplicate submissions
    if (isSubmitting) return;

    if (!form.checkValidity()) {
      form.reportValidity();
      setStatus(
        'error',
        'Please complete all required fields correctly. / برجاء استكمال الحقول الإلزامية بصورة صحيحة.'
      );
      return;
    }

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    // Registration metadata
    payload.programName = 'HIGHFIELD SCHOLARS';
    payload.programYear = '2027';
    payload.fullName = payload.englishName || '';
    payload.nationalId = payload.nationalIdOrPassport || '';
    payload.submittedAt = new Date().toISOString();
    payload.sourcePage = window.location.href;
    payload.consent = formData.has('consent');

    if (!payload.consent) {
      setStatus(
        'error',
        'Please confirm your information before submitting. / برجاء تأكيد صحة البيانات قبل الإرسال.'
      );
      return;
    }

    isSubmitting = true;
    setButtonState(true);

    setStatus(
      'loading',
      'Sending your registration request... / جارٍ إرسال طلب التسجيل.'
    );

    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload),
        redirect: 'follow'
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      let result;

      try {
        result = await response.json();
      } catch {
        throw new Error('The server response was not valid JSON.');
      }

      if (!result || result.success !== true) {
        throw new Error(
          result?.message || 'The registration was not accepted.'
        );
      }

      setStatus(
        'success',
        'Your registration request has been sent successfully. The Highfield team will contact you. / تم إرسال طلب التسجيل بنجاح، وسيتواصل معك فريق هايفيلد.'
      );

      form.reset();

    } catch (error) {
      console.error(
        'HIGHFIELD SCHOLARS registration error:',
        error
      );

      setStatus(
        'error',
        'Online submission could not be confirmed. Please contact Highfield on WhatsApp: 01101669115. / لم نتمكن من تأكيد الإرسال إلكترونيًا؛ يُرجى التواصل مع هايفيلد عبر واتساب 01101669115.'
      );

    } finally {
      isSubmitting = false;
      setButtonState(false);
    }
  });
})();
