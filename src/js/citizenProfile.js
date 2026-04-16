// ══════════════════════════════════════════════
// citizenProfile.js
// Job: load citizen profile from DB,
//      allow editing of name fields only
//      email/CNIC are locked (read-only)
// ══════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  checkSession();
  loadProfile();
});

// ── Session guard
function checkSession() {
  fetch('../php/checkSession.php')
    .then(r => r.json())
    .then(data => {
      if (!data.logged_in) { window.location.href = 'citizenLogin.html'; return; }
      setNavInfo(data.name);
    })
    .catch(() => window.location.href = 'citizenLogin.html');
}

function setNavInfo(fullName) {
  document.getElementById('citizenName').textContent = fullName;
  const parts    = fullName.trim().split(' ');
  const initials = parts.length >= 2
    ? parts[0][0] + parts[parts.length - 1][0]
    : parts[0].substring(0, 2);
  document.getElementById('citizenInitials').textContent = initials.toUpperCase();
}

// ── Load profile data from PHP
function loadProfile() {
  fetch('../php/getProfile.php')
    .then(r => r.json())
    .then(data => {
      document.getElementById('loadingState').style.display = 'none';

      if (!data.success) { window.location.href = 'citizenLogin.html'; return; }

      renderProfile(data.citizen);
      document.getElementById('profileContent').style.display = 'block';
    })
    .catch(() => window.location.href = 'citizenDashboard.html');
}

// ── Render all profile fields
function renderProfile(c) {
  const fullName = [c.c_fname, c.c_minit, c.c_lname].filter(Boolean).join(' ');
  const initials = c.c_fname[0] + (c.c_lname ? c.c_lname[0] : '');

  // Header card
  document.getElementById('profileAvatarLg').textContent = initials.toUpperCase();
  document.getElementById('profileFullName').textContent = fullName;
  document.getElementById('profileCnic').textContent     = c.cnic;

  // View mode rows
  document.getElementById('viewFname').textContent = c.c_fname || '—';
  document.getElementById('viewMinit').textContent = c.c_minit || '—';
  document.getElementById('viewLname').textContent = c.c_lname || '—';
  document.getElementById('viewEmail').textContent = c.email;
  document.getElementById('viewCnic').textContent  = c.cnic;
  document.getElementById('viewSince').textContent = formatDate(c.created_at);

  // Edit mode pre-fill
  document.getElementById('editFname').value = c.c_fname || '';
  document.getElementById('editMinit').value = c.c_minit || '';
  document.getElementById('editLname').value = c.c_lname || '';

  // Locked fields in security section
  document.getElementById('lockedEmail').textContent = c.email;
  document.getElementById('lockedCnic').textContent  = c.cnic;
}

// ── Toggle edit mode on/off
function toggleEdit() {
  document.getElementById('viewMode').style.display = 'none';
  document.getElementById('editMode').style.display = 'block';
  document.getElementById('editBtn').style.display  = 'none';
}

function cancelEdit() {
  document.getElementById('editMode').style.display = 'none';
  document.getElementById('viewMode').style.display = 'block';
  document.getElementById('editBtn').style.display  = 'inline-flex';
  document.getElementById('profile-error').textContent = '';
}

// ── Save profile name changes
async function saveProfile() {
  const fname = document.getElementById('editFname').value.trim();
  const minit = document.getElementById('editMinit').value.trim();
  const lname = document.getElementById('editLname').value.trim();

  document.getElementById('profile-error').textContent = '';

  if (!fname || fname.length < 2) {
    document.getElementById('profile-error').textContent = 'First name must be at least 2 characters';
    return;
  }
  if (!lname || lname.length < 2) {
    document.getElementById('profile-error').textContent = 'Last name must be at least 2 characters';
    return;
  }

  const btn       = document.querySelector('.btn-save');
  btn.textContent = 'Saving...';
  btn.disabled    = true;

  try {
    const response = await fetch('../php/updateProfile.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ c_fname: fname, c_minit: minit, c_lname: lname }),
    });

    const data = await response.json();

    if (data.success) {
      // Update view mode with new values
      document.getElementById('viewFname').textContent  = fname;
      document.getElementById('viewMinit').textContent  = minit || '—';
      document.getElementById('viewLname').textContent  = lname;

      const fullName = [fname, minit, lname].filter(Boolean).join(' ');
      document.getElementById('profileFullName').textContent = fullName;
      document.getElementById('citizenName').textContent     = fullName;

      const initials = fname[0] + (lname ? lname[0] : '');
      document.getElementById('profileAvatarLg').textContent = initials.toUpperCase();
      document.getElementById('citizenInitials').textContent = initials.toUpperCase();

      cancelEdit();
    } else {
      document.getElementById('profile-error').textContent = data.message || 'Failed to save. Try again.';
    }

  } catch (err) {
    document.getElementById('profile-error').textContent = 'Server error. Please try again.';
  } finally {
    btn.textContent = 'Save Changes';
    btn.disabled    = false;
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

// ── Toggle inline change password form
function togglePassForm() {
  document.getElementById('passForm').style.display = 'block';
  document.getElementById('passBtn').style.display  = 'none';
  document.getElementById('currentPass').focus();
}

function cancelPassForm() {
  document.getElementById('passForm').style.display  = 'none';
  document.getElementById('passBtn').style.display   = 'inline-flex';
  document.getElementById('currentPass').value       = '';
  document.getElementById('newPass').value           = '';
  document.getElementById('confirmPass').value       = '';
  document.getElementById('pass-error').textContent   = '';
  document.getElementById('pass-success').textContent = '';
}

// ── Submit password change to changePasswordAuth.php
async function savePassword() {
  const current = document.getElementById('currentPass').value;
  const newPass = document.getElementById('newPass').value;
  const confirm = document.getElementById('confirmPass').value;

  document.getElementById('pass-error').textContent   = '';
  document.getElementById('pass-success').textContent = '';

  // Client-side pre-checks before hitting server
  if (!current || !newPass || !confirm) {
    document.getElementById('pass-error').textContent = 'All fields are required';
    return;
  }
  if (newPass.length < 8) {
    document.getElementById('pass-error').textContent = 'New password must be at least 8 characters';
    return;
  }
  if (newPass !== confirm) {
    document.getElementById('pass-error').textContent = 'New passwords do not match';
    return;
  }

  const btn       = document.getElementById('passSaveBtn');
  btn.textContent = 'Updating...';
  btn.disabled    = true;

  try {
    const response = await fetch('../php/changePasswordAuth.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        current_password: current,
        new_password:     newPass,
        confirm_password: confirm,
      }),
    });

    const data = await response.json();

    if (data.success) {
      // Show success, clear fields, collapse form after 2s
      document.getElementById('pass-success').textContent = '✓ Password updated successfully';
      document.getElementById('currentPass').value = '';
      document.getElementById('newPass').value     = '';
      document.getElementById('confirmPass').value = '';
      setTimeout(() => cancelPassForm(), 2000);
    } else {
      document.getElementById('pass-error').textContent = data.message || 'Failed to update password';
    }

  } catch (err) {
    document.getElementById('pass-error').textContent = 'Server error. Please try again.';
  } finally {
    btn.textContent = 'Update Password';
    btn.disabled    = false;
  }
}

// ── Toggle password field visibility (eye icon)
function togglePassVis(inputId, btn) {
  const input   = document.getElementById(inputId);
  const visible = input.type === 'text';
  input.type    = visible ? 'password' : 'text';
  // Swap icon between eye and eye-off
  btn.querySelector('svg').innerHTML = visible
    ? '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
    : '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>';
}