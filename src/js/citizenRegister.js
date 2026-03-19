// ── HELPERS ──
function showError(id, msg) {
    document.getElementById(id).textContent = msg;
    const field = document.getElementById(id.replace('-error', ''));
    if (field) { field.classList.add('invalid'); field.classList.remove('valid'); }
  }
  function showValid(id) {
    const errEl = document.getElementById(id + '-error');
    if (errEl) errEl.textContent = '';
    const field = document.getElementById(id);
    if (field) { field.classList.remove('invalid'); field.classList.add('valid'); }
  }
  
  // ── CNIC AUTO FORMAT (12345-1234567-1) ──
  document.getElementById('cnic').addEventListener('input', function () {
    let val = this.value.replace(/\D/g, '');
    if (val.length > 5)  val = val.slice(0, 5)  + '-' + val.slice(5);
    if (val.length > 13) val = val.slice(0, 13) + '-' + val.slice(13);
    this.value = val.slice(0, 15);
  });
  
  // ── SHOW / HIDE PASSWORD ──
  function togglePass(inputId, iconId) {
    const inp     = document.getElementById(inputId);
    const ico     = document.getElementById(iconId);
    const visible = inp.type === 'text';
    inp.type      = visible ? 'password' : 'text';
    ico.innerHTML = visible
      ? '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
      : '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>';
  }
  
  // ── VALIDATION ──
  function validate() {
    let valid = true;
  
    // First name
    const firstname = document.getElementById('firstname').value.trim();
    if (!firstname || firstname.length < 2) {
      showError('firstname-error', 'Please enter your first name');
      valid = false;
    } else { showValid('firstname'); }
  
    // Middle name — optional, skip validation
  
    // Last name
    const lastname = document.getElementById('lastname').value.trim();
    if (!lastname || lastname.length < 2) {
      showError('lastname-error', 'Please enter your last name');
      valid = false;
    } else { showValid('lastname'); }
  
    // CNIC
    const cnic      = document.getElementById('cnic').value.trim();
    const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
    if (!cnicRegex.test(cnic)) {
      showError('cnic-error', 'CNIC must be in format: 12345-1234567-1');
      valid = false;
    } else { showValid('cnic'); }
  
    // Email
    const email      = document.getElementById('email').value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError('email-error', 'Please enter a valid email address');
      valid = false;
    } else { showValid('email'); }
  
    // Password
    const password  = document.getElementById('password').value;
    const passRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
    if (!passRegex.test(password)) {
      showError('password-error', 'Min 8 characters, at least 1 number & 1 special character (!@#$%^&*)');
      valid = false;
    } else { showValid('password'); }
  
    // Confirm password
    const confirm = document.getElementById('confirm-password').value;
    if (confirm !== password) {
      showError('confirm-error', 'Passwords do not match');
      valid = false;
    } else if (confirm) { showValid('confirm-password'); }
  
    return valid;
  }
  
  // ── REGISTER HANDLER ──
  async function handleRegister() {
    if (!validate()) return;
  
    const firstname  = document.getElementById('firstname').value.trim();
    const middlename = document.getElementById('middlename').value.trim();
    const lastname   = document.getElementById('lastname').value.trim();
    const fullname   = [firstname, middlename, lastname].filter(Boolean).join(' ');
    const cnic       = document.getElementById('cnic').value.trim();
    const email      = document.getElementById('email').value.trim();
    const password   = document.getElementById('password').value;
  
    // Show loading state
    const btn       = document.querySelector('.btn-register');
    btn.textContent = 'Sending OTP...';
    btn.disabled    = true;
  
    try {
      const response = await fetch('../php/citizenRegister.php', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ firstname, middlename, lastname, fullname, cnic, email, password })
      });
  
      const data = await response.json();
  
      if (data.success) {
        document.getElementById('otp-subtext').textContent =
          `A 6-digit OTP has been sent to ${email}`;
        document.getElementById('overlay').classList.add('active');
        document.getElementById('otp-modal').classList.add('active');
        document.getElementById('o1').focus();
      } else {
        alert(data.message || 'Something went wrong. Please try again.');
      }
  
    } catch (err) {
      alert('Could not connect to server. Please try again.');
      console.error(err);
    } finally {
      btn.textContent = 'Create Account & Send OTP';
      btn.disabled    = false;
    }
  }
  
  // ── OTP BOX NAVIGATION ──
  function otpMove(current, nextId) {
    current.classList.add('filled');
    if (current.value && nextId) document.getElementById(nextId).focus();
  }
  
  function otpBack(event, prevId) {
    if (event.key === 'Backspace' && !event.target.value) {
      event.target.classList.remove('filled');
      document.getElementById(prevId).focus();
    }
  }
  
  // ── VERIFY OTP ──
  async function verifyOTP() {
    const otp = ['o1','o2','o3','o4','o5','o6']
      .map(id => document.getElementById(id).value)
      .join('');
  
    if (otp.length < 6) {
      document.getElementById('otp-error').textContent = 'Please enter all 6 digits';
      return;
    }
  
    document.getElementById('otp-error').textContent = '';
  
    const btn       = document.querySelector('.btn-verify');
    btn.textContent = 'Verifying...';
    btn.disabled    = true;
  
    try {
      const response = await fetch('../php/verifyOTP.php', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ otp })
      });
  
      const data = await response.json();
  
      if (data.success) {
        document.getElementById('otp-modal').classList.remove('active');
        document.getElementById('success-modal').classList.add('active');
        // Redirect to login after 2 seconds
        setTimeout(() => { window.location.href = 'citizenLogin.html'; }, 2000);
      } else {
        document.getElementById('otp-error').textContent =
          data.message || 'Invalid or expired OTP. Try again.';
      }
  
    } catch (err) {
      document.getElementById('otp-error').textContent = 'Server error. Please try again.';
      console.error(err);
    } finally {
      btn.textContent = 'Verify OTP';
      btn.disabled    = false;
    }
  }
  
  // ── RESEND OTP ──
  async function resendOTP() {
    ['o1','o2','o3','o4','o5','o6'].forEach(id => {
      const box = document.getElementById(id);
      box.value = '';
      box.classList.remove('filled');
    });
    document.getElementById('otp-error').textContent = '';
  
    const cnic  = document.getElementById('cnic').value.trim();
    const email = document.getElementById('email').value.trim();
    const firstname = document.getElementById('firstname').value.trim();
  
    try {
      const response = await fetch('../php/sendOTP.php', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ cnic, email, firstname, resend: true })
      });
  
      const data = await response.json();
  
      if (data.success) {
        alert('OTP resent to your email!');
      } else {
        document.getElementById('otp-error').textContent =
          data.message || 'Could not resend OTP. Try again.';
      }
  
    } catch (err) {
      document.getElementById('otp-error').textContent = 'Server error. Please try again.';
    }
  
    document.getElementById('o1').focus();
  }