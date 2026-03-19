let currentEmail = '';

function fpSetHidden(id, hidden) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('fp-hidden', hidden);
}

function otpMove(current, nextId) {
  current.classList.add('filled');
  if (current.value && nextId) document.getElementById(nextId).focus();
}

function otpBack(event, prevId) {
  if (event.key === 'Backspace' && !event.target.value) {
    event.target.classList.remove('filled');
    if (prevId) document.getElementById(prevId).focus();
  }
}

function getOtp() {
  const digits = ['o1','o2','o3','o4','o5','o6']
    .map(id => document.getElementById(id).value)
    .join('');
  return digits;
}

function setError(id, message) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message || '';
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function sendOtp() {
  setError('email-error', '');
  setError('otp-error', '');
  setError('reset-error', '');

  const email = document.getElementById('email').value.trim();
  currentEmail = email;

  if (!email || !validateEmail(email)) {
    setError('email-error', 'Please enter a valid email address.');
    return;
  }

  const btn = document.querySelector('#step-email .fp-btn');
  if (btn) {
    btn.textContent = 'Sending...';
    btn.disabled = true;
  }

  try {
    const response = await fetch('../php/forgotPassword.php', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await response.json();
    if (!data.success) {
      setError('otp-error', data.message || 'Could not send OTP. Try again.');
      return;
    }

    // Clear any previous OTP inputs
    ['o1','o2','o3','o4','o5','o6'].forEach(id => {
      const box = document.getElementById(id);
      if (box) box.value = '';
    });

    fpSetHidden('step-email', true);
    fpSetHidden('step-otp', false);
    fpSetHidden('step-reset', true);
    fpSetHidden('step-success', true);

    document.getElementById('o1')?.focus();
  } catch (err) {
    setError('otp-error', 'Server error. Please try again.');
    console.error(err);
  } finally {
    if (btn) {
      btn.textContent = 'Send OTP';
      btn.disabled = false;
    }
  }
}

async function verifyOtp() {
  setError('otp-error', '');
  setError('reset-error', '');

  const otp = getOtp();
  if (!otp || otp.length !== 6) {
    setError('otp-error', 'Please enter all 6 digits.');
    return;
  }

  const btn = document.querySelector('#step-otp .fp-btn');
  if (btn) {
    btn.textContent = 'Verifying...';
    btn.disabled = true;
  }

  try {
    const response = await fetch('../php/verifyOTP.php', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp })
    });

    const data = await response.json();
    if (!data.success) {
      setError('otp-error', data.message || 'Invalid or expired OTP. Try again.');
      return;
    }

    fpSetHidden('step-email', true);
    fpSetHidden('step-otp', true);
    fpSetHidden('step-reset', false);
    fpSetHidden('step-success', true);
  } catch (err) {
    setError('otp-error', 'Server error. Please try again.');
    console.error(err);
  } finally {
    if (btn) {
      btn.textContent = 'Verify OTP';
      btn.disabled = false;
    }
  }
}

async function resendOtp() {
  setError('otp-error', '');
  setError('reset-error', '');

  if (!currentEmail) {
    const email = document.getElementById('email').value.trim();
    currentEmail = email;
  }

  if (!currentEmail || !validateEmail(currentEmail)) {
    setError('otp-error', 'Please enter your email first.');
    return;
  }

  try {
    const response = await fetch('../php/forgotPassword.php', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: currentEmail })
    });

    const data = await response.json();
    if (!data.success) {
      setError('otp-error', data.message || 'Could not resend OTP. Try again.');
      return;
    }

    ['o1','o2','o3','o4','o5','o6'].forEach(id => {
      const box = document.getElementById(id);
      if (box) box.value = '';
    });
    document.getElementById('o1')?.focus();
    alert('OTP resent to your email!');
  } catch (err) {
    setError('otp-error', 'Server error. Please try again.');
    console.error(err);
  }
}

async function changePassword() {
  setError('reset-error', '');

  const newPassword = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  if (!newPassword || newPassword.length < 8) {
    setError('reset-error', 'Password must be at least 8 characters.');
    return;
  }
  if (newPassword !== confirmPassword) {
    setError('reset-error', 'Passwords do not match.');
    return;
  }

  const btn = document.querySelector('#step-reset .fp-btn');
  if (btn) {
    btn.textContent = 'Updating...';
    btn.disabled = true;
  }

  try {
    const response = await fetch('../php/changePassword.php', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword, confirm_password: confirmPassword })
    });

    const data = await response.json();
    if (!data.success) {
      setError('reset-error', data.message || 'Failed to update password. Try again.');
      return;
    }

    fpSetHidden('step-email', true);
    fpSetHidden('step-otp', true);
    fpSetHidden('step-reset', true);
    fpSetHidden('step-success', false);
  } catch (err) {
    setError('reset-error', 'Server error. Please try again.');
    console.error(err);
  } finally {
    if (btn) {
      btn.textContent = 'Reset Password';
      btn.disabled = false;
    }
  }
}

