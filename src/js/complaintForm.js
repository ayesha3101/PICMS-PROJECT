// ══════════════════════════════════════════════
// complaintForm.js
// Job: multi-step form logic, validation,
//      station auto-assignment, submit to PHP
// ══════════════════════════════════════════════

let currentStep = 1;
let hasWitness  = false;
let isAnonymous = false;

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

// ── Subcategory options per category
const SUBCATEGORIES = {
  'Theft / Robbery':          ['Vehicle Theft', 'Mobile Snatching', 'Home Burglary', 'Shoplifting', 'Robbery at Gunpoint', 'Other'],
  'Harassment / Threats':     ['Verbal Threats', 'Physical Harassment', 'Online Harassment', 'Stalking', 'Other'],
  'Fraud / Cybercrime':       ['Online Scam', 'Bank Fraud', 'Identity Theft', 'Fake Documents', 'Social Media Fraud', 'Other'],
  'Missing Person':           ['Child Missing', 'Adult Missing', 'Suspected Abduction', 'Other'],
  'Property Dispute':         ['Land Grabbing', 'Illegal Possession', 'Boundary Dispute', 'Other'],
  'Domestic Violence':        ['Physical Abuse', 'Emotional Abuse', 'Financial Abuse', 'Other'],
  'Traffic Incident':         ['Hit and Run', 'Reckless Driving', 'Drunk Driving', 'Road Rage', 'Other'],
  'Corruption / Misconduct':  ['Bribery', 'Abuse of Power', 'Police Misconduct', 'Other'],
  'Other':                    ['Other'],
};

// ── Urgent categories — auto-set priority in PHP
const URGENT_CATEGORIES = ['Missing Person', 'Domestic Violence'];

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
  const cat  = document.getElementById('category').value;
  const wrap = document.getElementById('subcategory-wrap');
  const sel  = document.getElementById('subcategory');

  if (!cat || cat === 'Other') { wrap.style.display = 'none'; return; }

  const subs = SUBCATEGORIES[cat] || [];
  sel.innerHTML = '<option value="">— Select sub-category —</option>';
  subs.forEach(s => {
    const opt   = document.createElement('option');
    opt.value   = s;
    opt.textContent = s;
    sel.appendChild(opt);
  });
  wrap.style.display = 'block';
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

// ── Anonymous toggle
function toggleAnon(anon) {
  isAnonymous = anon;
  document.getElementById('anonYes').classList.toggle('active', anon);
  document.getElementById('anonNo').classList.toggle('active', !anon);
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
    const cat  = document.getElementById('category').value;
    const date = document.getElementById('incident_date').value;
    const desc = document.getElementById('description').value.trim();
    let ok = true;

    if (!cat) { showError('category-error', 'Please select a complaint category'); ok = false; }
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
  const category  = document.getElementById('category').value;
  const subcat    = document.getElementById('subcategory').value || '—';
  const date      = document.getElementById('incident_date').value;
  const time      = document.getElementById('incident_time').value || '—';
  const desc      = document.getElementById('description').value.trim();
  const area      = document.getElementById('incident_area').value;
  const landmark  = document.getElementById('incident_landmark').value.trim() || '—';
  const station   = document.getElementById('assignedStationName').textContent;
  const witness   = hasWitness
    ? (document.getElementById('witness_name').value || 'Yes (unnamed)')
    : 'No';
  const anon = isAnonymous ? 'Yes' : 'No';
  const priority = URGENT_CATEGORIES.includes(category) ? '🔴 Urgent' : 'Normal';

  document.getElementById('reviewGrid').innerHTML = `
    <div class="review-item"><div class="review-key">Category</div><div class="review-val">${escHtml(category)}</div></div>
    <div class="review-item"><div class="review-key">Sub-category</div><div class="review-val">${escHtml(subcat)}</div></div>
    <div class="review-item"><div class="review-key">Date</div><div class="review-val">${escHtml(date)}</div></div>
    <div class="review-item"><div class="review-key">Time</div><div class="review-val">${escHtml(time)}</div></div>
    <div class="review-item full"><div class="review-key">Description</div><div class="review-val">${escHtml(desc)}</div></div>
    <div class="review-item"><div class="review-key">Incident Area</div><div class="review-val">${escHtml(area)}</div></div>
    <div class="review-item"><div class="review-key">Landmark</div><div class="review-val">${escHtml(landmark)}</div></div>
    <div class="review-item full"><div class="review-key">Assigned Station</div><div class="review-val">${escHtml(station)}</div></div>
    <div class="review-item"><div class="review-key">Witnesses</div><div class="review-val">${escHtml(witness)}</div></div>
    <div class="review-item"><div class="review-key">Anonymous</div><div class="review-val">${anon}</div></div>
    <div class="review-item"><div class="review-key">Priority</div><div class="review-val">${priority}</div></div>
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
    category:           document.getElementById('category').value,
    subcategory:        document.getElementById('subcategory').value,
    incident_date:      document.getElementById('incident_date').value,
    incident_time:      document.getElementById('incident_time').value,
    description:        document.getElementById('description').value.trim(),
    incident_area:      document.getElementById('incident_area').value,
    incident_landmark:  document.getElementById('incident_landmark').value.trim(),
    station_id:         document.getElementById('station_id').value,
    has_witnesses:      hasWitness ? 1 : 0,
    witness_name:       hasWitness ? document.getElementById('witness_name').value.trim() : '',
    witness_contact:    hasWitness ? document.getElementById('witness_contact').value.trim() : '',
    is_anonymous:       isAnonymous ? 1 : 0,
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