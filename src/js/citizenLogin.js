let mode = 'email';

// ── Switch between Email and CNIC login
function switchMode(m) {
  mode = m;
  const label = document.getElementById('id-label');
  const input = document.getElementById('id-input');
  const icon  = document.getElementById('id-icon');
  const btnE  = document.getElementById('btn-email');
  const btnC  = document.getElementById('btn-cnic');

  if (m === 'email') {
    label.textContent = 'Email Address';
    input.placeholder = 'you@example.com';
    input.type        = 'email';
    icon.innerHTML    = '<rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/>';
    btnE.classList.add('active');
    btnC.classList.remove('active');
  } else {
    label.textContent = 'CNIC Number';
    input.placeholder = '12345-1234567-1';
    input.type        = 'text';
    icon.innerHTML    = '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>';
    btnC.classList.add('active');
    btnE.classList.remove('active');
  }
  input.focus();
}

// ── Show / hide password
let passVisible = false;

function togglePassword() {
  passVisible   = !passVisible;
  const inp     = document.getElementById('pass-input');
  const ico     = document.getElementById('eye-icon');
  inp.type      = passVisible ? 'text' : 'password';
  ico.innerHTML = passVisible
    ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>'
    : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
}

// ── Handle login
async function handleLogin() {
  const identifier = document.getElementById('id-input').value.trim();
  const password   = document.getElementById('pass-input').value;

  if (!identifier || !password) {
    alert('Please fill in all fields.');
    return;
  }

  const btn       = document.querySelector('.btn-login');
  btn.textContent = 'Signing in...';
  btn.disabled    = true;

  try {
    const response = await fetch('../php/citizenLogin.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ identifier, password, mode })
    });

    const data = await response.json();

    if (data.success) {
      window.location.href = data.redirect || 'citizenDashboard.html';
    } else {
      alert(data.message || 'Login failed. Please try again.');
    }

  } catch (err) {
    alert('Could not connect to server. Please try again.');
    console.error(err);
  } finally {
    btn.textContent = 'Sign In to Portal';
    btn.disabled    = false;
  }
}