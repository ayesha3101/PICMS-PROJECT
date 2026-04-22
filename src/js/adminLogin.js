// adminLogin.js
// Handles: badge/email toggle, login submit,
// first-login mandatory password change modal,
// forgot password 3-step flow (email → OTP → reset)
// Remember Me removed.

/* ══════════════════════════
   UTILITIES
══════════════════════════ */
function eye(btnId, inputId) {
  document.getElementById(btnId).addEventListener('click', () => {
    const inp  = document.getElementById(inputId);
    const show = inp.type === 'password';
    inp.type = show ? 'text' : 'password';
    document.getElementById(btnId).textContent = show ? '🙈' : '👁';
  });
}
eye('eyeLogin',    'loginPwd');
eye('eyeNew',      'newPwd');
eye('eyeConfirm',  'confirmPwd');
eye('eyeReset',    'resetPwd');
eye('eyeResetConf','resetConfirm');

function setAlert(id, type, msg) {
  const el = document.getElementById(id);
  el.className  = `alert ${type}`;
  el.textContent = msg;
}
function clearAlert(id) {
  const el = document.getElementById(id);
  el.className  = 'alert';
  el.textContent = '';
}

function strengthCheck(inputId, barId, lblId) {
  document.getElementById(inputId).addEventListener('input', function () {
    const v = this.value; let s = 0;
    if (v.length >= 8)           s++;
    if (/[A-Z]/.test(v))         s++;
    if (/[0-9]/.test(v))         s++;
    if (/[^A-Za-z0-9]/.test(v))  s++;
    const bar = document.getElementById(barId);
    const lbl = document.getElementById(lblId);
    if (!v) { bar.style.width = '0'; lbl.textContent = ''; return; }
    const i            = Math.max(0, s - 1);
    bar.style.width      = ['25%','50%','75%','100%'][i];
    bar.style.background = ['#d95f5f','#c9a84c','#8a9e6a','#4caf80'][i];
    lbl.textContent      = ['Weak','Fair','Good','Strong'][i];
  });
}
strengthCheck('newPwd',   'strengthBar', 'strengthLbl');
strengthCheck('resetPwd', 'resetStrBar', 'resetStrLbl');

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  btn.classList.toggle('loading', loading);
  btn.disabled = loading;
}

/* ══════════════════════════
   LOGIN MODE TOGGLE
══════════════════════════ */
let loginMode = 'badge';
const idInput = document.getElementById('identifier');

document.getElementById('btnBadge').addEventListener('click', () => {
  loginMode = 'badge';
  document.getElementById('btnBadge').classList.add('active');
  document.getElementById('btnEmail').classList.remove('active');
  document.getElementById('idLabel').textContent  = 'Badge Number';
  idInput.placeholder = 'e.g. ADMIN-001';
  idInput.type        = 'text';
  document.getElementById('idIcon').textContent   = '🪪';
  clearLoginErrors();
});

document.getElementById('btnEmail').addEventListener('click', () => {
  loginMode = 'email';
  document.getElementById('btnEmail').classList.add('active');
  document.getElementById('btnBadge').classList.remove('active');
  document.getElementById('idLabel').textContent  = 'Email Address';
  idInput.placeholder = 'your.email@karachi.police.gov';
  idInput.type        = 'email';
  document.getElementById('idIcon').textContent   = '✉';
  clearLoginErrors();
});

function clearLoginErrors() {
  document.getElementById('idErr').textContent  = '';
  document.getElementById('pwdErr').textContent = '';
  idInput.classList.remove('err');
  document.getElementById('loginPwd').classList.remove('err');
  clearAlert('loginAlert');
}

/* ══════════════════════════
   LOGIN SUBMIT
══════════════════════════ */
async function doLogin() {
  clearLoginErrors();
  const id  = idInput.value.trim();
  const pwd = document.getElementById('loginPwd').value;
  let valid = true;

  if (!id) {
    document.getElementById('idErr').textContent =
      loginMode === 'badge' ? 'Badge number is required.' : 'Email address is required.';
    idInput.classList.add('err');
    valid = false;
  } else if (loginMode === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id)) {
    document.getElementById('idErr').textContent = 'Enter a valid email address.';
    idInput.classList.add('err');
    valid = false;
  }
  if (!pwd) {
    document.getElementById('pwdErr').textContent = 'Password is required.';
    document.getElementById('loginPwd').classList.add('err');
    valid = false;
  }
  if (!valid) return;

  setLoading('loginBtn', true);
  try {
    const body = { password: pwd };
    if (loginMode === 'badge') body.badge_number = id;
    else                        body.email        = id;

    const res  = await fetch('../php/adminLogin.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body)
    });
    const data = await res.json();

    if (data.success) {
      if (!data.password_changed) {
        document.getElementById('firstLoginModal').classList.add('active');
      } else {
        window.location.href = 'adminDashboard.html';
      }
    } else {
      setAlert('loginAlert', 'error', data.message || 'Invalid credentials. Please try again.');
    }
  } catch {
    setAlert('loginAlert', 'error', 'Connection error. Please try again.');
  } finally {
    setLoading('loginBtn', false);
  }
}

document.getElementById('loginBtn').addEventListener('click', doLogin);
['identifier', 'loginPwd'].forEach(id =>
  document.getElementById(id).addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
  })
);

/* ══════════════════════════
   FIRST-LOGIN MODAL
   Backdrop + Escape blocked
══════════════════════════ */
const firstLoginModal = document.getElementById('firstLoginModal');

firstLoginModal.addEventListener('click', e => e.stopPropagation());
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && firstLoginModal.classList.contains('active')) e.preventDefault();
});

document.getElementById('confirmPwdBtn').addEventListener('click', async function () {
  clearAlert('firstLoginAlert');
  document.getElementById('newPwdErr').textContent     = '';
  document.getElementById('confirmPwdErr').textContent = '';

  const np = document.getElementById('newPwd').value;
  const cp = document.getElementById('confirmPwd').value;
  let valid = true;

  if (np.length < 8) {
    document.getElementById('newPwdErr').textContent = 'Password must be at least 8 characters.';
    valid = false;
  }
  if (np !== cp) {
    document.getElementById('confirmPwdErr').textContent = 'Passwords do not match.';
    valid = false;
  }
  if (!valid) return;

  setLoading('confirmPwdBtn', true);
  try {
    const res  = await fetch('../php/changeAdminPassword.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ new_password: np })
    });
    const text = await res.text();
    console.log("SERVER RESPONSE:", text);
    if (data.success) {
      firstLoginModal.classList.remove('active');
      window.location.href = 'adminDashboard.html';
    } else {
      setAlert('firstLoginAlert', 'error', data.message || 'Failed to update password.');
    }
  } catch {
    setAlert('firstLoginAlert', 'error', 'Connection error. Please try again.');
  } finally {
    setLoading('confirmPwdBtn', false);
  }
});

/* ══════════════════════════
   FORGOT PASSWORD MODAL
   3 steps: email → OTP → new password
══════════════════════════ */
const forgotModal = document.getElementById('forgotModal');

document.getElementById('forgotLink').addEventListener('click', () => {
  if (loginMode === 'email' && idInput.value.trim())
    document.getElementById('forgotEmail').value = idInput.value.trim();
  forgotModal.classList.add('active');
});

function closeForgot() {
  forgotModal.classList.remove('active');
  showStep('stepEmail');
  ['forgotAlert','otpAlert','resetAlert'].forEach(clearAlert);
  ['forgotEmailErr','otpErr','resetPwdErr','resetConfErr'].forEach(id => {
    document.getElementById(id).textContent = '';
  });
  document.getElementById('forgotEmail').value  = '';
  document.getElementById('resetPwd').value     = '';
  document.getElementById('resetConfirm').value = '';
  document.querySelectorAll('#otpRow input').forEach(i => i.value = '');
  const rb = document.getElementById('resetStrBar');
  rb.style.width = '0';
  document.getElementById('resetStrLbl').textContent = '';
}

forgotModal.addEventListener('click', e => { if (e.target === forgotModal) closeForgot(); });
document.getElementById('forgotCancel').addEventListener('click', closeForgot);

function showStep(stepId) {
  ['stepEmail','stepOtp','stepNewPwd'].forEach(id => {
    document.getElementById(id).style.display = id === stepId ? 'block' : 'none';
  });
}

// Step 1 — send OTP
document.getElementById('forgotSendOtp').addEventListener('click', async function () {
  clearAlert('forgotAlert');
  document.getElementById('forgotEmailErr').textContent = '';
  const email = document.getElementById('forgotEmail').value.trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.getElementById('forgotEmailErr').textContent = 'Enter a valid email address.';
    return;
  }

  this.disabled = true; this.textContent = 'Sending…';
  try {
    const res  = await fetch('../php/adminForgotPassword.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email })
    });
    const data = await res.json();

    if (data.success) {
      document.getElementById('otpSentTo').textContent = `Code sent to ${email}`;
      showStep('stepOtp');
      document.querySelector('#otpRow input').focus();
    } else {
      setAlert('forgotAlert', 'error', data.message || 'Could not send code. Please try again.');
    }
  } catch {
    setAlert('forgotAlert', 'error', 'Connection error. Please try again.');
  } finally {
    this.disabled = false; this.textContent = 'Send Code';
  }
});

// OTP auto-advance
document.querySelectorAll('#otpRow input').forEach((inp, idx, all) => {
  inp.addEventListener('input', () => {
    inp.value = inp.value.replace(/[^0-9]/g, '').slice(-1);
    if (inp.value && idx < all.length - 1) all[idx + 1].focus();
  });
  inp.addEventListener('keydown', e => {
    if (e.key === 'Backspace' && !inp.value && idx > 0) all[idx - 1].focus();
  });
});

// Resend OTP
document.getElementById('resendOtp').addEventListener('click', async function () {
  const email = document.getElementById('forgotEmail').value.trim();
  this.style.pointerEvents = 'none'; this.textContent = 'Sending…';
  try {
    await fetch('../php/adminForgotPassword.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email })
    });
    document.querySelectorAll('#otpRow input').forEach(i => i.value = '');
    document.querySelector('#otpRow input').focus();
    clearAlert('otpAlert');
    setAlert('otpAlert', 'success', 'New code sent.');
  } catch {
    setAlert('otpAlert', 'error', 'Could not resend. Please try again.');
  } finally {
    this.style.pointerEvents = ''; this.textContent = 'Resend code';
  }
});

document.getElementById('otpBack').addEventListener('click', () => showStep('stepEmail'));

// Step 2 — verify OTP
document.getElementById('otpVerify').addEventListener('click', async function () {
  clearAlert('otpAlert');
  document.getElementById('otpErr').textContent = '';
  const otp = [...document.querySelectorAll('#otpRow input')].map(i => i.value).join('');

  if (otp.length < 6) {
    document.getElementById('otpErr').textContent = 'Enter all 6 digits.';
    return;
  }

  this.disabled = true; this.textContent = 'Verifying…';
  try {
    const res  = await fetch('../php/adminVerifyOTP.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ otp, email: document.getElementById('forgotEmail').value.trim() })
    });
    const data = await res.json();

    if (data.success) {
      showStep('stepNewPwd');
    } else {
      setAlert('otpAlert', 'error', data.message || 'Incorrect code. Please try again.');
    }
  } catch {
    console.error("ERROR:", err);
    setAlert('otpAlert', 'error', 'Connection error. Please try again.');
  } finally {
    this.disabled = false; this.textContent = 'Verify Code';
  }
});

// Step 3 — reset password
document.getElementById('resetSubmit').addEventListener('click', async function () {
  clearAlert('resetAlert');
  document.getElementById('resetPwdErr').textContent = '';
  document.getElementById('resetConfErr').textContent = '';

  const np = document.getElementById('resetPwd').value;
  const cp = document.getElementById('resetConfirm').value;
  let valid = true;

  if (np.length < 8) {
    document.getElementById('resetPwdErr').textContent = 'Minimum 8 characters.';
    valid = false;
  }
  if (np !== cp) {
    document.getElementById('resetConfErr').textContent = 'Passwords do not match.';
    valid = false;
  }
  if (!valid) return;

  this.disabled = true; this.textContent = 'Updating…';
  try {
    const res  = await fetch('../php/adminResetPassword.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ new_password: np, email: document.getElementById('forgotEmail').value.trim() })
    });
    const data = await res.json();

    if (data.success) {
      closeForgot();
      setAlert('loginAlert', 'success', 'Password updated. Please sign in with your new password.');
    } else {
      setAlert('resetAlert', 'error', data.message || 'Failed to update password.');
    }
  } catch {
    setAlert('resetAlert', 'error', 'Connection error. Please try again.');
  } finally {
    this.disabled = false; this.textContent = 'Update Password';
  }
});