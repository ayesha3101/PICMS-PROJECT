// ══════════════════════════════════════════════
// complaintForm.js
// Job: multi-step form logic, validation,
//      station auto-assignment, submit to PHP
// ══════════════════════════════════════════════

let currentStep = 1;
let hasWitness  = false;

// ── Area → Station mapping
//    Matches area_covered values seeded in stations table
const AREA_STATION_MAP = {
  'Clifton':         { id: 1, name: 'Clifton Police Station' },
  'DHA':             { id: 2, name: 'Defence Police Station' },
  'Gulshan-e-Iqbal': { id: 3, name: 'Gulshan-e-Iqbal Police Station' },
  'Saddar':          { id: 4, name: 'Saddar Police Station' },
  'Korangi':         { id: 5, name: 'Korangi Police Station' },
  'North Nazimabad': { id: 6, name: 'North Nazimabad Police Station' },
  'Malir':           { id: 7, name: 'Malir Police Station' },
  'Orangi Town':     { id: 8, name: 'Orangi Police Station' },
  'Landhi':          { id: 9, name: 'Landhi Police Station' },
  'Baldia Town':     { id: 10, name: 'Baldia Police Station' },
  'SITE':            { id: 11, name: 'SITE Police Station' },
  'Lyari':           { id: 12, name: 'Lyari Police Station' },
  'Kemari':          { id: 13, name: 'Kemari Police Station' },
  'Garden':          { id: 14, name: 'Garden Police Station' },
  'Frere Town':      { id: 15, name: 'Frere Police Station' },
  'Other':           { id: 4,  name: 'Saddar Police Station (Central)' },
};

// ── Category ID map matching complaint_categories seed data
const CATEGORY_ID_MAP = {
  'Theft':             1,
  'Fraud':             2,
  'Harassment':        3,
  'Domestic Violence': 4,
  'Missing Person':    5,
  'Drug Related':      6,
  'Assault':           7,
  'Kidnapping':        8,
  'Property Dispute':  9,
  'Other':             10,
};

// ── Subcategory options per category (matching DB seed)
const SUBCATEGORIES = {
  'Theft':             [{ id: 1, name: 'Vehicle Theft' }, { id: 2, name: 'Mobile Phone Theft' }, { id: 3, name: 'House Burglary' }, { id: 4, name: 'Robbery' }],
  'Fraud':             [{ id: 5, name: 'Online Fraud' }, { id: 6, name: 'Financial Fraud' }, { id: 7, name: 'Identity Fraud' }],
  'Harassment':        [{ id: 8, name: 'Street Harassment' }, { id: 9, name: 'Workplace Harassment' }, { id: 10, name: 'Cyber Harassment' }],
  'Drug Related':      [{ id: 11, name: 'Possession' }, { id: 12, name: 'Trafficking' }],
  'Assault':           [{ id: 13, name: 'Physical Assault' }, { id: 14, name: 'Armed Assault' }],
  'Property Dispute':  [{ id: 15, name: 'Land Dispute' }, { id: 16, name: 'Rent Dispute' }],
};

document.addEventListener('DOMContentLoaded', () => {
  checkSession();

  // Set max date on incident_date to today
  document.getElementById('incident_date').max = new Date().toISOString().split('T')[0];

  // Character counter for description
  document.getElementById('description').addEventListener('input', function () {
    const len = this.value.length;
    document.getElementById('descCount').textContent = len;
    if (len > 500) this.value = this.value.substring(0, 500);
  });
});

// ── Session guard — redirect if not logged in
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

// ── Update subcategory dropdown when category changes
function updateSubcategory() {
  const catName = document.getElementById('category').value;
  const wrap    = document.getElementById('subcategory-wrap');
  const sel     = document.getElementById('subcategory');

  // Store category_id in hidden field
  const catId = CATEGORY_ID_MAP[catName] || 0;
  document.getElementById('category_id').value = catId;

  const subs = SUBCATEGORIES[catName];
  if (!catName || !subs) {
    wrap.style.display = 'none';
    sel.innerHTML = '<option value="">— Select sub-category —</option>';
    document.getElementById('subcategory_id').value = '';
    return;
  }

  sel.innerHTML = '<option value="">— Select sub-category —</option>';
  subs.forEach(s => {
    const opt       = document.createElement('option');
    opt.value       = s.id;
    opt.textContent = s.name;
    sel.appendChild(opt);
  });
  wrap.style.display = 'block';
}

// ── Keep subcategory_id hidden field in sync
function syncSubcategoryId() {
  const sel = document.getElementById('subcategory');
  document.getElementById('subcategory_id').value = sel.value;
}

// ── Auto-assign station based on selected area
function autoAssignStation() {
  const area    = document.getElementById('incident_area').value;
  const preview = document.getElementById('stationPreview');

  if (!area) { preview.style.display = 'none'; return; }

  const station = AREA_STATION_MAP[area];
  if (station) {
    document.getElementById('assignedStationName').textContent = station.name;
    document.getElementById('station_id').value = station.id;
    preview.style.display = 'flex';
  }
}

// ── Witness toggle
function toggleWitness(show) {
  hasWitness = show;
  document.getElementById('witnessFields').style.display = show ? 'block' : 'none';
  document.getElementById('witnessYes').classList.toggle('active', show);
  document.getElementById('witnessNo').classList.toggle('active', !show);
}

// ── Step navigation — next
function nextStep(from) {
  if (!validateStep(from)) return;
  if (from === 3) buildReviewGrid();

  // Mark current as done
  document.getElementById(`step-ind-${from}`).classList.remove('active');
  document.getElementById(`step-ind-${from}`).classList.add('done');

  // Activate next
  document.getElementById(`step-${from}`).classList.remove('active');
  document.getElementById(`step-${from + 1}`).classList.add('active');
  document.getElementById(`step-ind-${from + 1}`).classList.add('active');

  currentStep = from + 1;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Step navigation — back
function prevStep(from) {
  document.getElementById(`step-ind-${from}`).classList.remove('active');
  document.getElementById(`step-${from}`).classList.remove('active');

  const prev = from - 1;
  document.getElementById(`step-${prev}`).classList.add('active');
  document.getElementById(`step-ind-${prev}`).classList.remove('done');
  document.getElementById(`step-ind-${prev}`).classList.add('active');

  currentStep = prev;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Validate each step before proceeding
function validateStep(step) {
  clearErrors();

  if (step === 1) {
    const catId = document.getElementById('category_id').value;
    const date  = document.getElementById('incident_date').value;
    const desc  = document.getElementById('description').value.trim();
    let ok = true;

    if (!catId || catId === '0') { showError('category-error', 'Please select a complaint category'); ok = false; }
    if (!date) { showError('date-error', 'Please select the date of the incident'); ok = false; }
    if (desc.length < 20) { showError('desc-error', 'Please provide at least 20 characters of description'); ok = false; }

    return ok;
  }

  if (step === 2) {
    const area = document.getElementById('incident_area').value;
    if (!area) { showError('area-error', 'Please select the incident area'); return false; }
    return true;
  }

  // Step 3 has no required fields
  return true;
}

// ── Build the review summary grid from all form values
function buildReviewGrid() {
  const catName   = document.getElementById('category').value;
  const subSel    = document.getElementById('subcategory');
  const subName   = subSel.options[subSel.selectedIndex]?.text || '—';
  const date      = document.getElementById('incident_date').value;
  const time      = document.getElementById('incident_time').value || '—';
  const desc      = document.getElementById('description').value.trim();
  const area      = document.getElementById('incident_area').value;
  const landmark  = document.getElementById('incident_landmark').value.trim() || '—';
  const station   = document.getElementById('assignedStationName').textContent;
  const witness   = hasWitness
    ? (document.getElementById('witness_name').value || 'Yes (unnamed)')
    : 'No';

  document.getElementById('reviewGrid').innerHTML = `
    <div class="review-item"><div class="review-key">Category</div><div class="review-val">${escHtml(catName)}</div></div>
    <div class="review-item"><div class="review-key">Sub-category</div><div class="review-val">${escHtml(subName)}</div></div>
    <div class="review-item"><div class="review-key">Date</div><div class="review-val">${escHtml(date)}</div></div>
    <div class="review-item"><div class="review-key">Time</div><div class="review-val">${escHtml(time)}</div></div>
    <div class="review-item full"><div class="review-key">Description</div><div class="review-val">${escHtml(desc)}</div></div>
    <div class="review-item"><div class="review-key">Incident Area</div><div class="review-val">${escHtml(area)}</div></div>
    <div class="review-item"><div class="review-key">Landmark</div><div class="review-val">${escHtml(landmark)}</div></div>
    <div class="review-item full"><div class="review-key">Assigned Station</div><div class="review-val">${escHtml(station)}</div></div>
    <div class="review-item"><div class="review-key">Witnesses</div><div class="review-val">${escHtml(witness)}</div></div>
  `;
}

// ── Submit complaint to PHP
async function submitComplaint() {
  clearErrors();

  if (!document.getElementById('confirmCheck').checked) {
    showError('confirm-error', 'Please confirm that the information is accurate');
    return;
  }

  const btn = document.getElementById('submitBtn');
  btn.textContent = 'Submitting...';
  btn.disabled    = true;

  const payload = {
    category_id:        parseInt(document.getElementById('category_id').value) || 0,
    subcategory_id:     parseInt(document.getElementById('subcategory_id').value) || 0,
    incident_date:      document.getElementById('incident_date').value,
    incident_time:      document.getElementById('incident_time').value,
    description:        document.getElementById('description').value.trim(),
    incident_area:      document.getElementById('incident_area').value,
    incident_landmark:  document.getElementById('incident_landmark').value.trim(),
    station_id:         parseInt(document.getElementById('station_id').value) || 0,
    has_witnesses:      hasWitness ? 1 : 0,
    witness_name:       hasWitness ? document.getElementById('witness_name').value.trim() : '',
    witness_contact:    hasWitness ? document.getElementById('witness_contact').value.trim() : '',
  };

  try {
    const response = await fetch('../php/submitComplaint.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.success) {
      // Hide form, show success card with reference number
      document.querySelector('.form-card').style.display   = 'none';
      document.querySelector('.steps-bar').style.display   = 'none';
      document.getElementById('successCard').style.display = 'block';
      document.getElementById('refNumber').textContent     = data.reference_number;
    } else {
      alert(data.message || 'Something went wrong. Please try again.');
      btn.textContent = 'Submit Complaint';
      btn.disabled    = false;
    }

  } catch (err) {
    alert('Could not connect to server. Please try again.');
    btn.textContent = 'Submit Complaint';
    btn.disabled    = false;
    console.error(err);
  }
}

// ── Helpers
function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}
function clearErrors() {
  document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
}
function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}