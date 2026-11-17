const authToggle = document.querySelector('#auth-toggle');
const loginCard = document.querySelector('#login');
const signupCard = document.querySelector('#signup');

function updateAuthCardState() {
  const isSignup = authToggle.checked;
  loginCard.inert = isSignup;
  loginCard.setAttribute('aria-hidden', String(isSignup));
  signupCard.inert = !isSignup;
  signupCard.setAttribute('aria-hidden', String(!isSignup));
}

authToggle.addEventListener('change', updateAuthCardState);

document.querySelectorAll('[data-auth-state]').forEach((button) => {
  button.addEventListener('click', () => {
    authToggle.checked = button.dataset.authState === 'signup';
    updateAuthCardState();
  });
});

updateAuthCardState();

document.querySelectorAll('[data-password-toggle]').forEach((button) => {
  const passwordInput = document.getElementById(button.dataset.passwordToggle);
  const icon = button.querySelector('i');

  button.addEventListener('click', () => {
    const showPassword = passwordInput.type === 'password';
    passwordInput.type = showPassword ? 'text' : 'password';
    button.setAttribute('aria-label', showPassword ? 'Sembunyikan password' : 'Tampilkan password');
    icon.classList.toggle('uil-eye', !showPassword);
    icon.classList.toggle('uil-eye-slash', showPassword);
  });
});

document.querySelectorAll('.auth-provider').forEach((button) => {
  button.addEventListener('click', () => {
    const notice = button.closest('.auth-card').querySelector('.auth-notice');
    notice.textContent = `Masuk dengan ${button.dataset.provider} belum terhubung ke portal.`;
    notice.hidden = false;
  });
});

document.querySelectorAll('.auth-card form').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const notice = form.querySelector('.auth-notice');
    notice.textContent = form.id === 'login-form'
      ? 'Login belum terhubung ke layanan autentikasi.'
      : 'Pendaftaran belum terhubung ke layanan autentikasi.';
    notice.hidden = false;
  });
});
