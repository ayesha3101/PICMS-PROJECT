// shoDashboard.js — PICMS SHO Portal
// Pages: complaints, appointments, profile
// Actions: review, set appointment (collision-checked), mark outcome, assign officer

/* ══════════════════════════
   GLOBALS
══════════════════════════ */
let shoSession   = null;
let complaintsData = [];
let appointmentsData = [];
let stationOfficers = [];
let activeComplaintId = null;
let activeApptId = null;

/* ══════════════════════════
   INIT
══════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  setDate();
  checkSession();
  wireNav();
  wireModals();
});

function setDate() {
  document.getElementById('topbarDate').textContent =
    new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

/* ══════════════════════════
   SESSION GUARD
══════════════════════════ */
async function checkSession() {
  try {
    const res  = await fetch('../php/officerCheckSession.php');
    const data = await res.json();
    if (!data.valid || !data.is_sho) {
      window.location.href = 'officerLogin.html';
      return;
    }
    shoSession = data;
    document.getElementById('shoName').textContent    = data.name;
    document.getElementById('shoBadge').textContent   = data.badge;
    document.getElementById('shoInitials').textContent = data.name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
    loadComplaints();
  } catch {
    window.location.href = 'officerLogin.html';
  }
}

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch('../php/officerLogout.php', { method: 'POST' });
  window.location.href = 'officerLogin.html';
});

/* ══════════════════════════
   NAV
══════════════════════════ */
const PAGE_META = {
  complaints:   { title: 'Station Complaints', sub: 'Review and manage complaints assigned to your station' },
  appointments: { title: 'Appointments',       sub: 'Manage citizen appointments and schedule meetings' },
  profile:      { title: 'My Profile',         sub: 'Account information' },
};

function wireNav() {
  document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.page));
  });
}

function navigateTo(page) {
  document.querySelectorAll('.nav-item[data-page]').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  document.querySelectorAll('.page-section').forEach(s => s.classList.toggle('active', s.id === `page-${page}`));
  const meta = PAGE_META[page] || {};
  document.getElementById('pageTitle').textContent    = meta.title || page;
  document.getElementById('pageSubtitle').textContent = meta.sub || '';
  if (page === 'appointments') loadAppointments();
  if (page === 'profile')      fillProfile();
}

/* ══════════════════════════
   HELPERS
══════════════════════════ */
function esc(s) {
  if (!s && s !== 0) return '—';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
}
function fmtDT(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-GB',{day:'numeric',month:'short'}) + ' · ' +
         dt.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
}
function statusBadge(s) {
  const map = {
    'Submitted':'b-submitted','Under Review':'b-review','Accepted':'b-accepted',
    'Rejected':'b-rejected','Officer Assigned':'b-assigned','Investigation Ongoing':'b-ongoing',
    'Resolved':'b-resolved','Closed':'b-submitted','Withdrawal Pending':'b-review',
    'Withdrawn':'b-submitted',
  };
  return `<span class="badge ${map[s]||'b-submitted'}">${esc(s)}</span>`;
}
function apptBadge(s) {
  const map = { 'Pending':'b-pending-appt','Confirmed':'b-confirmed','Completed':'b-completed','Cancelled':'b-cancelled' };
  return `<span class="badge ${map[s]||'b-submitted'}">${esc(s)}</span>`;
}
function showAlert(id, type, msg) {
  const el = document.getElementById(id);
  el.className = `alert show alert-${type}`;
  el.textContent = msg;
}
function hideAlert(id) {
  const el = document.getElementById(id);
  el.className = 'alert';
  el.textContent = '';
}

/* ══════════════════════════
   COMPLAINTS PAGE
══════════════════════════ */
async function loadComplaints() {
  try {
    const res  = await fetch('../php/shoGetComplaints.php');
    const data = await res.json();
    if (!data.success) return;
    complaintsData = data.complaints;
    renderComplaints(complaintsData);
    fillStats(complaintsData);
  } catch { /* silent */ }
}

function fillStats(list) {
  document.getElementById('sTotal').textContent   = list.length;
  document.getElementById('sPending').textContent  = list.filter(c => ['Submitted','Under Review','Accepted'].includes(c.status)).length;
  document.getElementById('sAssigned').textContent = list.filter(c => ['Officer Assigned','Investigation Ongoing'].includes(c.status)).length;
  document.getElementById('sUrgent').textContent   = list.filter(c => c.is_urgent).length;
}

function renderComplaints(list) {
  const tbody = document.getElementById('complaintsTbody');
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-row">No complaints for your station.</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(c => `
    <tr>
      <td style="font-family:monospace;font-size:11px;color:var(--gold-dim)">${esc(c.reference_number)}</td>
      <td>${esc(c.category_name)}</td>
      <td style="color:var(--muted);font-size:12px">${esc(c.incident_area)}</td>
      <td>${statusBadge(c.status)}</td>
      <td>${c.is_urgent ? '<span class="badge b-urgent">⚑ Urgent</span>' : '<span class="badge b-submitted">Normal</span>'}</td>
      <td style="color:var(--muted);font-size:12px">${fmtDate(c.submitted_at)}</td>
      <td><button class="btn btn-ghost btn-sm view-complaint" data-id="${c.complaint_id}">View</button></td>
    </tr>`).join('');

  document.querySelectorAll('.view-complaint').forEach(btn =>
    btn.addEventListener('click', () => openComplaintModal(parseInt(btn.dataset.id)))
  );
}

// Filters
document.getElementById('filterStatus').addEventListener('change', applyFilters);
document.getElementById('filterUrgency').addEventListener('change', applyFilters);
document.getElementById('searchComplaint').addEventListener('input', applyFilters);

function applyFilters() {
  const status  = document.getElementById('filterStatus').value;
  const urgency = document.getElementById('filterUrgency').value;
  const search  = document.getElementById('searchComplaint').value.trim().toLowerCase();
  const filtered = complaintsData.filter(c => {
    if (status  && c.status !== status) return false;
    if (urgency && String(c.is_urgent ? '1' : '0') !== urgency) return false;
    if (search  && !c.reference_number.toLowerCase().includes(search)
                && !(c.incident_area||'').toLowerCase().includes(search)) return false;
    return true;
  });
  renderComplaints(filtered);
}

/* ══════════════════════════
   COMPLAINT MODAL
══════════════════════════ */
async function openComplaintModal(id) {
  activeComplaintId = id;
  hideAlert('mdAlert');
  const c = complaintsData.find(x => x.complaint_id == id);
  if (!c) return;

  document.getElementById('mdCategory').textContent   = c.category_name;
  document.getElementById('mdRef').textContent        = c.reference_number;
  document.getElementById('mdStatus').innerHTML       = statusBadge(c.status);
  document.getElementById('mdArea').textContent       = c.incident_area || '—';
  document.getElementById('mdDate').textContent       = fmtDate(c.incident_date);
  document.getElementById('mdCnic').textContent       = c.cnic;
  document.getElementById('mdOfficer').textContent    = c.assigned_officer || 'Not assigned';
  document.getElementById('mdUrgency').innerHTML      = c.is_urgent ? '<span class="badge b-urgent">⚑ Urgent</span>' : 'Normal';
  document.getElementById('mdDescription').textContent = c.description || '—';

  // Load appointment history
  await loadApptHistory(id);

  // Build action area
  buildActionArea(c);

  document.getElementById('complaintModal').classList.add('open');
}

async function loadApptHistory(complaintId) {
  const container = document.getElementById('mdApptHistory');
  container.innerHTML = '<p style="font-size:12px;color:var(--muted);">Loading…</p>';
  try {
    const res  = await fetch(`../php/shoGetAppointments.php?complaint_id=${complaintId}`);
    const data = await res.json();
    if (!data.success || !data.appointments.length) {
      container.innerHTML = '<p style="font-size:12px;color:var(--muted);font-style:italic;">No appointments yet.</p>';
      return;
    }
    container.innerHTML = data.appointments.map(a => `
      <div class="appt-item">
        <div class="appt-dot ${(a.status||'').toLowerCase()}"></div>
        <div class="appt-info">
          <div class="appt-date">${fmtDate(a.scheduled_date)} · ${a.start_time||''} – ${a.end_time||''}</div>
          <div class="appt-meta">${esc(a.location)} &nbsp;·&nbsp; ${apptBadge(a.status)}</div>
        </div>
      </div>`).join('');
  } catch {
    container.innerHTML = '<p style="font-size:12px;color:var(--muted);">Failed to load.</p>';
  }
}

function buildActionArea(c) {
  const area = document.getElementById('mdActions');
  area.innerHTML = '';

  // Submitted → can review (accept/reject)
  if (c.status === 'Submitted') {
    area.innerHTML = `
      <button class="btn btn-gold" id="btnOpenReview" style="margin-right:8px;">
        <svg viewBox="0 0 24 24"><polyline points="20,6 9,17 4,12"/></svg>
        Review Complaint
      </button>`;
    document.getElementById('btnOpenReview').addEventListener('click', () => openReviewModal(c));
  }

  // Accepted → can set appointment
  if (c.status === 'Accepted') {
    area.innerHTML = `
      <button class="btn btn-gold" id="btnOpenAppt">
        <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        Schedule Appointment
      </button>`;
    document.getElementById('btnOpenAppt').addEventListener('click', () => openApptModal(c));
  }

  // Officer Assigned or Investigation Ongoing → no SHO actions needed here
  if (['Officer Assigned', 'Investigation Ongoing'].includes(c.status)) {
    area.innerHTML = `<p style="font-size:12px;color:var(--muted);">Officer assigned. Investigation in progress.</p>`;
  }
}

/* ══════════════════════════
   REVIEW MODAL (Accept/Reject)
══════════════════════════ */
let reviewingComplaint = null;

function openReviewModal(c) {
  reviewingComplaint = c;
  document.getElementById('reviewModalRef').textContent = c.reference_number;
  document.getElementById('rejectionField').style.display = 'none';
  document.getElementById('rejectionReason').value = '';
  hideAlert('reviewAlert');

  let rejectMode = false;
  document.getElementById('btnAccept').onclick = () => doReview('accept');
  document.getElementById('btnReject').onclick = () => {
    if (!rejectMode) {
      rejectMode = true;
      document.getElementById('rejectionField').style.display = 'block';
      document.getElementById('btnReject').textContent = '✕ Confirm Rejection';
    } else {
      doReview('reject');
    }
  };
  document.getElementById('reviewModal').classList.add('open');
}

async function doReview(action) {
  hideAlert('reviewAlert');
  const reason = document.getElementById('rejectionReason').value.trim();
  if (action === 'reject' && !reason) {
    showAlert('reviewAlert', 'error', 'Please provide a rejection reason.');
    return;
  }
  try {
    const res  = await fetch('../php/shoReviewComplaint.php', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ complaint_id: reviewingComplaint.complaint_id, action, reason }),
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('reviewModal').classList.remove('open');
      await loadComplaints();
      openComplaintModal(reviewingComplaint.complaint_id);
    } else {
      showAlert('reviewAlert', 'error', data.message || 'Failed.');
    }
  } catch { showAlert('reviewAlert', 'error', 'Connection error.'); }
}

/* ══════════════════════════
   APPOINTMENT MODAL
══════════════════════════ */
let apptComplaint = null;

function openApptModal(c) {
  apptComplaint = c;
  document.getElementById('apptModalRef').textContent = c.reference_number;
  document.getElementById('apptDate').value     = '';
  document.getElementById('apptStart').value    = '';
  document.getElementById('apptEnd').value      = '';
  document.getElementById('apptLocation').value = 'SHO Office, ' + (shoSession?.station_name || '');
  document.getElementById('scheduleConflict').style.display = 'none';
  document.getElementById('scheduleOk').style.display = 'none';
  hideAlert('apptAlert');

  // Set min date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  document.getElementById('apptDate').min = tomorrow.toISOString().split('T')[0];

  document.getElementById('apptModal').classList.add('open');
}

// Check schedule collision on time change
['apptDate','apptStart','apptEnd'].forEach(id => {
  document.getElementById(id).addEventListener('change', checkSchedule);
});

async function checkSchedule() {
  const date  = document.getElementById('apptDate').value;
  const start = document.getElementById('apptStart').value;
  const end   = document.getElementById('apptEnd').value;
  if (!date || !start || !end) return;
  if (start >= end) {
    document.getElementById('scheduleConflict').style.display = 'block';
    document.getElementById('scheduleConflict').textContent = '⚠ End time must be after start time.';
    document.getElementById('scheduleOk').style.display = 'none';
    return;
  }
  try {
    const res  = await fetch('../php/shoCheckSchedule.php', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ date, start_time: start, end_time: end }),
    });
    const data = await res.json();
    if (data.conflict) {
      document.getElementById('scheduleConflict').style.display = 'block';
      document.getElementById('scheduleConflict').textContent = `⚠ Conflict: you have "${data.conflict_note}" at this time.`;
      document.getElementById('scheduleOk').style.display = 'none';
    } else {
      document.getElementById('scheduleConflict').style.display = 'none';
      document.getElementById('scheduleOk').style.display = 'block';
    }
  } catch { /* silent */ }
}

document.getElementById('confirmApptBtn').addEventListener('click', async function() {
  hideAlert('apptAlert');
  const date     = document.getElementById('apptDate').value;
  const start    = document.getElementById('apptStart').value;
  const end      = document.getElementById('apptEnd').value;
  const location = document.getElementById('apptLocation').value.trim();
  if (!date || !start || !end || !location) {
    showAlert('apptAlert', 'error', 'All fields are required.');
    return;
  }
  if (start >= end) { showAlert('apptAlert', 'error', 'End time must be after start time.'); return; }
  if (document.getElementById('scheduleConflict').style.display !== 'none' &&
      document.getElementById('scheduleConflict').textContent.startsWith('⚠')) {
    showAlert('apptAlert', 'error', 'Please resolve the schedule conflict first.');
    return;
  }
  this.disabled = true; this.textContent = 'Scheduling…';
  try {
    const res  = await fetch('../php/shoSetAppointment.php', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        complaint_id: apptComplaint.complaint_id,
        date, start_time: start, end_time: end, location,
      }),
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('apptModal').classList.remove('open');
      await loadComplaints();
      // Update the open complaint modal
      const updated = complaintsData.find(x => x.complaint_id == apptComplaint.complaint_id);
      if (updated) openComplaintModal(updated.complaint_id);
    } else {
      showAlert('apptAlert', 'error', data.message || 'Failed.');
    }
  } catch { showAlert('apptAlert', 'error', 'Connection error.'); }
  finally { this.disabled = false; this.textContent = 'Schedule Appointment'; }
});

/* ══════════════════════════
   APPOINTMENTS PAGE
══════════════════════════ */
async function loadAppointments() {
  const tbody = document.getElementById('apptTbody');
  tbody.innerHTML = '<tr><td colspan="7" class="empty-row">Loading…</td></tr>';
  try {
    const res  = await fetch('../php/shoGetAppointments.php');
    const data = await res.json();
    if (!data.success || !data.appointments.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-row">No appointments yet.</td></tr>';
      return;
    }
    appointmentsData = data.appointments;
    renderAppts(appointmentsData);
  } catch {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-row">Failed to load.</td></tr>';
  }
}

function renderAppts(list) {
  const tbody = document.getElementById('apptTbody');
  if (!list.length) { tbody.innerHTML = '<tr><td colspan="7" class="empty-row">No appointments.</td></tr>'; return; }
  tbody.innerHTML = list.map(a => {
    const canMark = a.status === 'Confirmed';
    const canSetNew = a.status === 'Cancelled';
    return `<tr>
      <td style="font-family:monospace;font-size:11px;color:var(--gold-dim)">${esc(a.reference_number)}</td>
      <td style="font-family:monospace;font-size:11px;color:var(--muted)">${esc(a.cnic)}</td>
      <td>${fmtDate(a.scheduled_date)} · ${a.start_time||''}</td>
      <td style="font-size:12px;color:var(--muted)">${esc(a.location)}</td>
      <td>${apptBadge(a.status)}</td>
      <td style="text-align:center;color:${a.miss_count>=1?'var(--danger)':'var(--muted)'}">${a.miss_count||0}</td>
      <td style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
        ${canMark ? `<button class="btn btn-ghost btn-sm mark-appt" data-id="${a.appointment_id}" data-ref="${a.reference_number}" data-miss="${a.miss_count}">Mark Outcome</button>` : ''}
        ${canSetNew && a.miss_count < 2 ? `<button class="btn btn-ghost btn-sm reschedule-appt" data-complaint="${a.complaint_id}" data-ref="${a.reference_number}">Reschedule</button>` : ''}
      </td>
    </tr>`;
  }).join('');

  document.querySelectorAll('.mark-appt').forEach(btn => btn.addEventListener('click', () => {
    openMarkApptModal(parseInt(btn.dataset.id), btn.dataset.ref, parseInt(btn.dataset.miss));
  }));
  document.querySelectorAll('.reschedule-appt').forEach(btn => btn.addEventListener('click', () => {
    const c = complaintsData.find(x => x.complaint_id == btn.dataset.complaint);
    if (c) openApptModal(c);
    else navigateTo('complaints');
  }));
}

document.getElementById('filterApptStatus').addEventListener('change', function() {
  const val = this.value;
  renderAppts(val ? appointmentsData.filter(a => a.status === val) : appointmentsData);
});

/* ══════════════════════════
   MARK APPOINTMENT MODAL
══════════════════════════ */
function openMarkApptModal(apptId, ref, missCount) {
  activeApptId = apptId;
  document.getElementById('markApptRef').textContent = ref;
  hideAlert('markApptAlert');
  const warn = document.getElementById('missWarning');
  warn.textContent = missCount >= 1
    ? '⚠ This citizen already missed one appointment. If cancelled again, the case will be automatically closed.'
    : '';
  document.getElementById('markApptModal').classList.add('open');
}

document.getElementById('btnMarkComplete').addEventListener('click', () => doMarkAppt('completed'));
document.getElementById('btnMarkCancelled').addEventListener('click', () => doMarkAppt('cancelled'));

async function doMarkAppt(outcome) {
  hideAlert('markApptAlert');
  try {
    const res  = await fetch('../php/shoMarkAppointment.php', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ appointment_id: activeApptId, outcome }),
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('markApptModal').classList.remove('open');
      if (outcome === 'completed') {
        // Open assign officer modal
        const appt = appointmentsData.find(a => a.appointment_id == activeApptId);
        if (appt) await openAssignModal(appt.complaint_id, appt.reference_number);
      }
      await loadComplaints();
      loadAppointments();
    } else {
      showAlert('markApptAlert', 'error', data.message || 'Failed.');
    }
  } catch { showAlert('markApptAlert', 'error', 'Connection error.'); }
}

/* ══════════════════════════
   ASSIGN OFFICER MODAL
══════════════════════════ */
let assignComplaintId = null;

async function openAssignModal(complaintId, ref) {
  assignComplaintId = complaintId;
  document.getElementById('assignModalRef').textContent = ref || '';
  document.getElementById('selectedOfficerId').value = '';
  hideAlert('assignAlert');
  document.getElementById('officerCards').innerHTML = '<p style="color:var(--muted);font-size:12px;font-style:italic;grid-column:1/-1;">Loading…</p>';
  document.getElementById('assignModal').classList.add('open');

  try {
    const res  = await fetch('../php/shoGetOfficers.php');
    const data = await res.json();
    if (!data.success || !data.officers.length) {
      document.getElementById('officerCards').innerHTML = '<p style="color:var(--muted);font-size:12px;grid-column:1/-1;">No available officers at your station.</p>';
      return;
    }
    stationOfficers = data.officers;
    document.getElementById('officerCards').innerHTML = data.officers.map(o => `
      <div class="officer-card" data-id="${o.officer_id}">
        <div class="oc-name">${esc(o.full_name)}</div>
        <div class="oc-meta">${esc(o.rank)} · ${esc(o.badge_number)}</div>
        <div class="oc-cases">${o.active_caseload} active cases</div>
      </div>`).join('');

    document.querySelectorAll('.officer-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.officer-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        document.getElementById('selectedOfficerId').value = card.dataset.id;
      });
    });
  } catch {
    document.getElementById('officerCards').innerHTML = '<p style="color:var(--muted);font-size:12px;grid-column:1/-1;">Failed to load officers.</p>';
  }
}

document.getElementById('confirmAssignBtn').addEventListener('click', async function() {
  hideAlert('assignAlert');
  const officerId = document.getElementById('selectedOfficerId').value;
  if (!officerId) { showAlert('assignAlert', 'error', 'Please select an officer.'); return; }
  this.disabled = true; this.textContent = 'Assigning…';
  try {
    const res  = await fetch('../php/shoAssignOfficer.php', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ complaint_id: assignComplaintId, officer_id: parseInt(officerId) }),
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('assignModal').classList.remove('open');
      await loadComplaints();
      loadAppointments();
    } else {
      showAlert('assignAlert', 'error', data.message || 'Failed.');
    }
  } catch { showAlert('assignAlert', 'error', 'Connection error.'); }
  finally { this.disabled = false; this.textContent = 'Assign Officer'; }
});

/* ══════════════════════════
   PROFILE PAGE
══════════════════════════ */
function fillProfile() {
  if (!shoSession) return;
  document.getElementById('pName').textContent    = shoSession.name    || '—';
  document.getElementById('pBadge').textContent   = shoSession.badge   || '—';
  document.getElementById('pRank').textContent    = shoSession.rank    || '—';
  document.getElementById('pStation').textContent = shoSession.station_name || '—';
  document.getElementById('pEmail').textContent   = shoSession.email   || '—';
}

/* ══════════════════════════
   WIRE MODALS
══════════════════════════ */
function wireModals() {
  // complaint modal
  document.getElementById('closeComplaintModal').addEventListener('click', () =>
    document.getElementById('complaintModal').classList.remove('open'));
  document.getElementById('complaintModal').addEventListener('click', e => {
    if (e.target === document.getElementById('complaintModal'))
      document.getElementById('complaintModal').classList.remove('open');
  });

  // appt modal
  document.getElementById('closeApptModal').addEventListener('click', () =>
    document.getElementById('apptModal').classList.remove('open'));
  document.getElementById('cancelApptModal').addEventListener('click', () =>
    document.getElementById('apptModal').classList.remove('open'));

  // assign modal
  document.getElementById('closeAssignModal').addEventListener('click', () =>
    document.getElementById('assignModal').classList.remove('open'));
  document.getElementById('cancelAssignModal').addEventListener('click', () =>
    document.getElementById('assignModal').classList.remove('open'));

  // mark appt modal
  document.getElementById('closeMarkApptModal').addEventListener('click', () =>
    document.getElementById('markApptModal').classList.remove('open'));

  // review modal
  document.getElementById('closeReviewModal').addEventListener('click', () =>
    document.getElementById('reviewModal').classList.remove('open'));
}