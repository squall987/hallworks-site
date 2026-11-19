const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.primary-navigation');

if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
    navigation.classList.toggle('is-open', !isOpen);
  });

  navigation.addEventListener('click', (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Open navigation');
      navigation.classList.remove('is-open');
    }
  });
}

document.querySelectorAll('.waitlist-form').forEach((form) => {
  const phone = form.querySelector('input[name="phone"]');
  const defaultPreference = form.querySelector('.contact-preference-default');
  const contactFieldset = form.querySelector('.contact-preferences');
  const preferences = Array.from(form.querySelectorAll('input[type="radio"][name="contact_preference"]'));
  const emailOnly = preferences.find((input) => input.value === 'email_only');
  const consent = form.querySelector('.phone-consent');
  const smsConsentBox = form.querySelector('.sms-consent');
  const smsConsent = form.querySelector('input[name="sms_consent"]');
  const smsConsentError = form.querySelector('.sms-consent-error');

  const updatePhoneContactOptions = () => {
    if (!phone || !defaultPreference || !emailOnly) return;
    const hasPhone = phone.value.trim().length > 0;
    defaultPreference.disabled = hasPhone;
    if (contactFieldset) contactFieldset.disabled = !hasPhone;
    preferences.forEach((input) => {
      input.disabled = !hasPhone;
    });

    if (!hasPhone) emailOnly.checked = true;
    if (hasPhone && !preferences.some((input) => input.checked)) emailOnly.checked = true;

    const contactPreference = hasPhone
      ? preferences.find((input) => input.checked)?.value ?? 'email_only'
      : defaultPreference.value;
    const needsPhoneConsent = hasPhone && (contactPreference === 'call' || contactPreference === 'text');
    const needsTextConsent = hasPhone && contactPreference === 'text';

    if (consent) consent.hidden = !needsPhoneConsent;
    if (smsConsentBox) smsConsentBox.hidden = !needsTextConsent;
    if (smsConsent) {
      smsConsent.disabled = !needsTextConsent;
      smsConsent.required = needsTextConsent;
      if (!needsTextConsent) smsConsent.checked = false;
    }
    if (smsConsentError && !needsTextConsent) smsConsentError.hidden = true;
  };

  if (phone) phone.addEventListener('input', updatePhoneContactOptions);
  preferences.forEach((input) => input.addEventListener('change', updatePhoneContactOptions));
  if (smsConsent) {
    smsConsent.addEventListener('invalid', () => {
      if (smsConsentError) smsConsentError.hidden = false;
    });
    smsConsent.addEventListener('change', () => {
      if (smsConsent.checked && smsConsentError) smsConsentError.hidden = true;
    });
  }
  updatePhoneContactOptions();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = form.querySelector('.form-message');
    const button = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    const phoneValue = phone?.value.trim() ?? '';
    const contactPreference = String(formData.get('contact_preference') ?? 'email_only');
    const role = String(formData.get('role') ?? '');
    const phoneForSubject = phoneValue.replace(/[^\d+(). -]/g, '').slice(0, 32) || 'not provided';
    formData.set('phone', phoneValue);
    formData.set('contact_preference', contactPreference);
    formData.set('_subject', `Hallworks early access — ${role} — ${contactPreference} — phone ${phoneForSubject}`);
    if (button) button.disabled = true;
    if (message) message.textContent = 'Sending…';
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' }
      });
      if (response.ok) {
        form.reset();
        updatePhoneContactOptions();
        if (message) message.textContent = 'Thanks. You are on the early-access list.';
      } else if (message) {
        message.textContent = 'Something went wrong. Please try again in a moment.';
      }
    } catch (error) {
      if (message) message.textContent = 'Network error. Please try again.';
    }
    if (button) button.disabled = false;
  });
});
