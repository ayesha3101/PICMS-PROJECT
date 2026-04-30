// ══════════════════════════════════════════════
// shoDashboard.js  —  PICMS SHO Portal
// Pages: cases, appointments, officers,
//        schedule, updates, withdrawals
// ══════════════════════════════════════════════


let SHO          = null;   // session data
let casesData    = [];
let apptData     = [];
let officersData = [];
let scheduleData = [];
let updatesData  = [];
let wdData       = [];

// Active IDs for modals
let activeCaseId      = null;
let activeApptId      = null;
let activeAssignCaseId = null;
let activeWdId        = null;
let activeSlotId      = null;   // null = new slot

// Review reject mode
let reviewRejectMode = false;
// Withdrawal reject mode
let wdRejectMode = false;

/* ══════════════════════════
   BOOT
══════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  setTopbarDate();
  checkSession();
  wireNav();
  wireModalCloseButtons();
  wireFilterResets();
  wireScheduleTimeTriggers();
  wireApptTimeTriggers();
  wireProfileActions();
});

function setTopbarDate() {
  const d = new Date();
  document.getElementById('topbarDate').textContent =
    d.toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

/* ══════════════════════════
   SESSION CHECK
══════════════════════════ */
async function checkSession() {
  try {
    const res  = await fetch('../php/shoCheckSession.php');
    const data = await res.json();
    if (!data.valid) { window.location.href = 'officerLogin.html'; return; }
    SHO = data;
    populateSessionUI();
    loadCases();           // load first page data
    loadWithdrawalBadge(); // load pending withdrawal count for badge
  } catch {
    window.location.href = 'officerLogin.html';
  }
}

function populateSessionUI() {
  const initials = SHO.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  document.getElementById('shoAvatarSidebar').textContent = initials;
  document.getElementById('shoNameSidebar').textContent   = SHO.name;
  document.getElementById('shoBadgeSidebar').textContent  = SHO.badge;
  document.getElementById('shoAvatarTop').textContent     = initials;
  document.getElementById('shoNameTop').textContent       = SHO.name;
  document.getElementById('shoRankTop').textContent       = SHO.rank;
  loadProfilePage();
}

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch('../php/officerLogout.php', { method: 'POST' });
  window.location.href = 'officerLogin.html';
});

document.getElementById('sidebarToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

/* ══════════════════════════
   NAVIGATION
══════════════════════════ */
const PAGE_META = {
  cases:       { title: 'Station Cases',         sub: 'Review and manage all complaints at your station' },
  appointments:{ title: 'Appointments',           sub: 'Manage citizen appointment scheduling and outcomes' },
  officers:    { title: 'Officers',               sub: 'View and manage investigating officers at your station' },
  schedule:    { title: 'My Schedule',            sub: 'View and update your personal schedule' },
  updates:     { title: 'Case Updates',           sub: 'Track all status changes across station cases' },
  withdrawals: { title: 'Withdrawal Requests',    sub: 'Review and action citizen withdrawal requests' },
  profile:     { title: 'My Profile',             sub: 'View account details and change password' },
};

const PAGE_LOADERS = {
  cases:        loadCases,
  appointments: loadAppointments,
  officers:     loadOfficers,
  schedule:     loadSchedule,
  updates:      loadUpdates,
  withdrawals:  loadWithdrawals,
  profile:      loadProfilePage,
};

function wireNav() {
  document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.page));
  });
}

function navigateTo(page) {
  document.querySelectorAll('.nav-item[data-page]').forEach(b =>
    b.classList.toggle('active', b.dataset.page === page));
  document.querySelectorAll('.page-section').forEach(s =>
    s.classList.toggle('active', s.id === `page-${page}`));
  const meta = PAGE_META[page] || {};
  document.getElementById('pageTitle').textContent    = meta.title || page;
  document.getElementById('pageSubtitle').textContent = meta.sub   || '';
  document.getElementById('sidebar').classList.remove('open');
  if (PAGE_LOADERS[page]) PAGE_LOADERS[page]();
}

/* ══════════════════════════
   HELPERS
══════════════════════════ */
function esc(s) {
  if (s === null || s === undefined) return '—';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
}
function fmtDT(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) + ' · ' +
         dt.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
}
function fmtTime(t) { return t ? t.slice(0,5) : '—'; }

function showAlert(id, type, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `alert show alert-${type}`;
  el.textContent = msg;
}
function hideAlert(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = 'alert';
  el.textContent = '';
}
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function wireModalCloseButtons() {
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });
  // close on backdrop click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });
}

// Status badge HTML
function statusBadge(s) {
  const map = {
    'Submitted':'b-submitted','Under Review':'b-review','Accepted':'b-accepted',
    'Rejected':'b-rejected','Officer Assigned':'b-assigned','Investigation Ongoing':'b-ongoing',
    'Resolved':'b-resolved','Closed':'b-closed','Withdrawal Pending':'b-review','Withdrawn':'b-closed',
  };
  return `<span class="badge ${map[s]||'b-submitted'}">${esc(s)}</span>`;
}
function apptBadge(s) {
  const map = { 'Pending':'b-appt-pending','Accepted':'b-appt-confirmed','Completed':'b-appt-completed','Cancelled':'b-appt-cancelled' };
  return `<span class="badge ${map[s]||'b-submitted'}">${esc(s)}</span>`;
}
function rankBadge(r) {
  const map = { Inspector:'b-rank-insp', DSP:'b-rank-dsp', SI:'b-rank-si', ASI:'b-rank-asi' };
  return `<span class="badge ${map[r]||'b-submitted'}">${esc(r)}</span>`;
}
function wdBadge(s) {
  const map = { Pending:'b-wd-pending', Approved:'b-wd-approved', Rejected:'b-wd-rejected' };
  return `<span class="badge ${map[s]||'b-submitted'}">${esc(s)}</span>`;
}
function setCount(id, n) {
  const el = document.getElementById(id);
  if (el) el.textContent = `${n} record${n!==1?'s':''}`;
}

/* ══════════════════════════
   PAGE: CASES
══════════════════════════ */
async function loadCases() {
  document.getElementById('casesTbody').innerHTML =
    '<tr><td colspan="9" class="tbl-empty"><div class="loading-row"><div class="mini-spin"></div>Loading…</div></td></tr>';
  try {
    const res  = await fetch('../php/shoGetCases.php');
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    casesData = data.cases;
    populateCaseFilters(casesData);
    fillCaseStats(casesData);
    renderCases(casesData);
  } catch (e) {
    document.getElementById('casesTbody').innerHTML =
      `<tr><td colspan="9" class="tbl-empty">Failed to load: ${esc(e.message)}</td></tr>`;
  }
}

function fillCaseStats(list) {
  document.getElementById('stTotal').textContent    = list.length;
  document.getElementById('stPending').textContent  = list.filter(c => ['Submitted','Under Review','Accepted'].includes(c.status)).length;
  document.getElementById('stAssigned').textContent = list.filter(c => ['Officer Assigned','Investigation Ongoing'].includes(c.status)).length;
  document.getElementById('stUrgent').textContent   = list.filter(c => c.is_urgent == 1).length;
  document.getElementById('stResolved').textContent = list.filter(c => ['Resolved','Closed'].includes(c.status)).length;
}

function populateCaseFilters(list) {
  // Category filter
  const catSel = document.getElementById('fCaseCategory');
  const existing = new Set([...catSel.options].map(o => o.value).filter(Boolean));
  list.forEach(c => {
    if (!existing.has(String(c.category_id))) {
      existing.add(String(c.category_id));
      const o = new Option(c.category_name, c.category_id);
      catSel.appendChild(o);
    }
  });
  // Officer filter
  const offSel = document.getElementById('fCaseOfficer');
  const existOff = new Set([...offSel.options].map(o => o.value).filter(v => v && v !== 'unassigned'));
  list.forEach(c => {
    if (c.assigned_officer_id && !existOff.has(String(c.assigned_officer_id))) {
      existOff.add(String(c.assigned_officer_id));
      offSel.appendChild(new Option(c.assigned_officer_name || 'Unknown', c.assigned_officer_id));
    }
  });
}

function renderCases(list) {
  const tbody = document.getElementById('casesTbody');
  setCount('casesCount', list.length);
  const badge = document.getElementById('navBadgeCases');
  const pending = list.filter(c=>['Submitted','Under Review'].includes(c.status)).length;
  if (pending > 0) { badge.textContent = pending; badge.classList.add('visible'); }
  else badge.classList.remove('visible');

  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="tbl-empty">No cases match the current filters.</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(c => `
    <tr>
      <td><span style="font-family:monospace;font-size:11px;color:var(--gold-dim)">${esc(c.reference_number)}</span></td>
      <td>${esc(c.category_name)}</td>
      <td style="font-size:12px;color:var(--muted)">${esc(c.incident_area)||'—'}</td>
      <td style="font-family:monospace;font-size:11px;color:var(--muted)">${esc(c.cnic)}</td>
      <td>${statusBadge(c.status)}</td>
      <td>${c.is_urgent==1 ? '<span class="badge b-urgent">⚑ Urgent</span>' : '<span class="badge b-normal">Normal</span>'}</td>
      <td style="font-size:12px;color:var(--muted)">${esc(c.assigned_officer_name)||'<em style="color:var(--muted)">Unassigned</em>'}</td>
      <td style="font-size:12px;color:var(--muted)">${fmtDate(c.submitted_at)}</td>
      <td>
        <button class="tbl-btn btn-view-case" data-id="${c.complaint_id}">
          <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          View
        </button>
      </td>
    </tr>`).join('');

  document.querySelectorAll('.btn-view-case').forEach(btn =>
    btn.addEventListener('click', () => openCaseDetail(parseInt(btn.dataset.id))));
}

/* Case filters */
function wireFilterResets() {
  document.getElementById('resetCaseFilters').addEventListener('click', () => {
    ['fCaseStatus','fCaseUrgency','fCaseCategory','fCaseOfficer','fCaseSort'].forEach(id => document.getElementById(id).value = '');
    ['fCaseDateFrom','fCaseDateTo','fCaseSearch'].forEach(id => document.getElementById(id).value = '');
    renderCases(casesData);
  });
  ['fCaseStatus','fCaseUrgency','fCaseCategory','fCaseOfficer','fCaseDateFrom','fCaseDateTo','fCaseSearch','fCaseSort']
    .forEach(id => document.getElementById(id)?.addEventListener('input', applyCaseFilters));

  document.getElementById('resetApptFilters').addEventListener('click', () => {
    ['fApptStatus','fApptDateFrom','fApptDateTo','fApptSearch'].forEach(id => document.getElementById(id).value = '');
    renderAppointments(apptData);
  });
  ['fApptStatus','fApptDateFrom','fApptDateTo','fApptSearch']
    .forEach(id => document.getElementById(id)?.addEventListener('input', applyApptFilters));

  document.getElementById('resetOfficerFilters').addEventListener('click', () => {
    ['fOfficerRank','fOfficerLoad','fOfficerSearch'].forEach(id => document.getElementById(id).value = '');
    renderOfficers(officersData);
  });
  ['fOfficerRank','fOfficerLoad','fOfficerSearch']
    .forEach(id => document.getElementById(id)?.addEventListener('input', applyOfficerFilters));

  document.getElementById('resetUpdFilters').addEventListener('click', () => {
    ['fUpdStatus','fUpdBy','fUpdDateFrom','fUpdDateTo','fUpdSearch'].forEach(id => document.getElementById(id).value = '');
    renderUpdates(updatesData);
  });
  ['fUpdStatus','fUpdBy','fUpdDateFrom','fUpdDateTo','fUpdSearch']
    .forEach(id => document.getElementById(id)?.addEventListener('input', applyUpdateFilters));

  document.getElementById('resetWdFilters').addEventListener('click', () => {
    ['fWdStatus','fWdDateFrom','fWdDateTo','fWdSearch'].forEach(id => document.getElementById(id).value = '');
    renderWithdrawals(wdData);
  });
  ['fWdStatus','fWdDateFrom','fWdDateTo','fWdSearch']
    .forEach(id => document.getElementById(id)?.addEventListener('input', applyWdFilters));

  document.getElementById('fScheduleMonth').addEventListener('change', applyScheduleFilters);
  document.getElementById('fScheduleType').addEventListener('change', applyScheduleFilters);
}

function loadProfilePage() {
  if (!SHO) return;
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val || '—';
  };
  set('spName', SHO.name);
  set('spBadge', SHO.badge);
  set('spRank', SHO.rank);
  set('spStation', SHO.station_name);
  set('spEmail', SHO.email);
}

function wireProfileActions() {
  const btn = document.getElementById('spChangePwdBtn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    hideAlert('spPwdAlert');
    const current_password = document.getElementById('spCurrentPwd').value;
    const new_password = document.getElementById('spNewPwd').value;
    const confirm_password = document.getElementById('spConfirmPwd').value;
    btn.disabled = true;
    btn.textContent = 'Updating...';
    try {
      const res = await fetch('../php/officerChangePassword.php', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ current_password, new_password, confirm_password }),
      });
      const data = await res.json();
      if (data.success) {
        showAlert('spPwdAlert', 'success', data.message || 'Password updated.');
        document.getElementById('spCurrentPwd').value = '';
        document.getElementById('spNewPwd').value = '';
        document.getElementById('spConfirmPwd').value = '';
      } else {
        showAlert('spPwdAlert', 'error', data.message || 'Failed to update password.');
      }
    } catch {
      showAlert('spPwdAlert', 'error', 'Connection error.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Update Password';
    }
  });
}

function applyCaseFilters() {
  const status   = document.getElementById('fCaseStatus').value;
  const urgency  = document.getElementById('fCaseUrgency').value;
  const category = document.getElementById('fCaseCategory').value;
  const officer  = document.getElementById('fCaseOfficer').value;
  const dateFrom = document.getElementById('fCaseDateFrom').value;
  const dateTo   = document.getElementById('fCaseDateTo').value;
  const search   = document.getElementById('fCaseSearch').value.trim().toLowerCase();
  const sort     = document.getElementById('fCaseSort').value;

  let filtered = casesData.filter(c => {
    if (status   && c.status !== status) return false;
    if (urgency  && String(c.is_urgent) !== urgency) return false;
    if (category && String(c.category_id) !== category) return false;
    if (officer === 'unassigned' && c.assigned_officer_id) return false;
    if (officer && officer !== 'unassigned' && String(c.assigned_officer_id) !== officer) return false;
    if (dateFrom && c.submitted_at < dateFrom) return false;
    if (dateTo   && c.submitted_at.slice(0,10) > dateTo) return false;
    if (search && !c.reference_number.toLowerCase().includes(search)
               && !(c.incident_area||'').toLowerCase().includes(search)
               && !(c.cnic||'').toLowerCase().includes(search)) return false;
    return true;
  });

  if (sort === 'oldest') filtered.sort((a,b) => new Date(a.submitted_at) - new Date(b.submitted_at));
  else if (sort === 'urgent') filtered.sort((a,b) => b.is_urgent - a.is_urgent);
  else filtered.sort((a,b) => new Date(b.submitted_at) - new Date(a.submitted_at));

  renderCases(filtered);
}

/* ══════════════════════════
   CASE DETAIL MODAL
══════════════════════════ */
async function openCaseDetail(caseId) {
  activeCaseId = caseId;
  hideAlert('mdCaseActions');
  // clear previous content
  document.getElementById('mdCaseInfo').innerHTML      = '<div class="loading-row"><div class="mini-spin"></div></div>';
  document.getElementById('mdCaseTimeline').innerHTML  = '<div class="loading-row"><div class="mini-spin"></div></div>';
  document.getElementById('mdCaseAppts').innerHTML     = '<div class="loading-row"><div class="mini-spin"></div></div>';
  document.getElementById('mdCaseActions').innerHTML   = '';
  openModal('modalCaseDetail');

  try {
    const res  = await fetch(`../php/shoGetCaseDetail.php?complaint_id=${caseId}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    renderCaseDetailModal(data);
  } catch(e) {
    document.getElementById('mdCaseInfo').textContent = 'Failed to load: ' + e.message;
  }
}

function renderCaseDetailModal(data) {
  const c = data.complaint;
  document.getElementById('mdCaseCategory').textContent = c.category_name;
  document.getElementById('mdCaseRef').textContent      = c.reference_number;

  // Info rows
  document.getElementById('mdCaseInfo').innerHTML = `
    <div class="info-row"><span class="info-key">Status</span><span class="info-val">${statusBadge(c.status)}</span></div>
    <div class="info-row"><span class="info-key">Sub-category</span><span class="info-val">${esc(c.subcategory_name)||'—'}</span></div>
    <div class="info-row"><span class="info-key">Incident Area</span><span class="info-val">${esc(c.incident_area)}</span></div>
    <div class="info-row"><span class="info-key">Landmark</span><span class="info-val">${esc(c.incident_landmark)||'—'}</span></div>
    <div class="info-row"><span class="info-key">Incident Date</span><span class="info-val">${fmtDate(c.incident_date)}</span></div>
    <div class="info-row"><span class="info-key">Incident Time</span><span class="info-val">${fmtTime(c.incident_time)}</span></div>
    <div class="info-row"><span class="info-key">Citizen CNIC</span><span class="info-val" style="font-family:monospace;font-size:11px">${esc(c.cnic)}</span></div>
    <div class="info-row"><span class="info-key">Urgency</span><span class="info-val">${c.is_urgent==1?'<span class="badge b-urgent">⚑ Urgent</span>':'Normal'}</span></div>
    <div class="info-row"><span class="info-key">Submitted</span><span class="info-val">${fmtDT(c.submitted_at)}</span></div>
    <div class="info-row"><span class="info-key">Assigned Officer</span><span class="info-val">${esc(c.assigned_officer_name)||'<em>Unassigned</em>'}</span></div>
    ${c.rejection_reason ? `<div class="info-row"><span class="info-key">Rejection Reason</span><span class="info-val" style="color:#e88080">${esc(c.rejection_reason)}</span></div>` : ''}
  `;

  document.getElementById('mdCaseDesc').textContent = c.description || '—';

  // Witnesses
  document.getElementById('mdCaseWitnesses').innerHTML = data.witnesses && data.witnesses.length
    ? data.witnesses.map(w => `<div class="info-row"><span class="info-key">${esc(w.witness_name)}</span><span class="info-val">${esc(w.witness_contact)||'—'}</span></div>`).join('')
    : '<p style="font-size:12px;color:var(--muted)">None reported.</p>';

  // Timeline
  const tlWrap = document.getElementById('mdCaseTimeline');
  if (!data.timeline || !data.timeline.length) {
    tlWrap.innerHTML = '<p style="font-size:12px;color:var(--muted)">No updates yet.</p>';
  } else {
    const sorted = [...data.timeline].sort((a,b) => new Date(a.updated_at)-new Date(b.updated_at));
    tlWrap.innerHTML = sorted.map((u,i) => `
      <div class="tl-item">
        <div class="tl-dot ${i===sorted.length-1?'current':'done'}"></div>
        <div class="tl-body">
          <div class="tl-status">${esc(u.status)}</div>
          ${u.note ? `<div class="tl-note">${esc(u.note)}</div>` : ''}
          <div class="tl-meta">${esc(u.updated_by)} · ${fmtDT(u.updated_at)}</div>
        </div>
      </div>`).join('');
  }

  // Appointment history
  const apptWrap = document.getElementById('mdCaseAppts');
  if (!data.appointments || !data.appointments.length) {
    apptWrap.innerHTML = '<p style="font-size:12px;color:var(--muted)">No appointments yet.</p>';
  } else {
    apptWrap.innerHTML = data.appointments.map(a => `
      <div class="appt-item">
        <div class="appt-dot appt-dot-${(a.status||'').toLowerCase()}"></div>
        <div>
          <div class="appt-date">${fmtDate(a.scheduled_date)} · ${fmtTime(a.start_time)} – ${fmtTime(a.end_time)}</div>
          <div class="appt-meta">${esc(a.location)} · ${apptBadge(a.status)}</div>
          ${a.cancellation_reason ? `<div class="appt-meta" style="color:#e88080">Reason: ${esc(a.cancellation_reason)}</div>` : ''}
        </div>
      </div>`).join('');
  }

  // Actions
  buildCaseActions(c, data.appointments || [], data.miss_count || 0);
}

function buildCaseActions(c, appointments, missCount) {
  const zone = document.getElementById('mdCaseActions');
  zone.innerHTML = '';
  const lastAppt = appointments.length ? appointments[appointments.length - 1] : null;
  const hasCompletedAppt = appointments.some(a => a.status === 'Completed');
  const hasPendingOrAcceptedAppt = lastAppt && ['Pending','Accepted'].includes(lastAppt.status);

  // 1. Submitted → can review
  if (c.status === 'Submitted') {
    zone.innerHTML = `
      <button class="btn btn-primary" id="btnOpenReview">
        <svg viewBox="0 0 24 24"><polyline points="20,6 9,17 4,12"/></svg>
        Review Complaint
      </button>`;
    document.getElementById('btnOpenReview').addEventListener('click', () => openReviewModal(c));
    return;
  }

  // 2. Accepted & no pending appt → schedule appointment
  if (c.status === 'Accepted' && !hasPendingOrAcceptedAppt) {
    zone.innerHTML = `
      <button class="btn btn-primary" id="btnOpenAppt">
        <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        Schedule Appointment
      </button>`;
    document.getElementById('btnOpenAppt').addEventListener('click', () => openApptModal(c, false));
    return;
  }

  // 3. Pending/Accepted appt exists → can mark outcome
  if (hasPendingOrAcceptedAppt && lastAppt.status === 'Accepted') {
    zone.innerHTML = `
      <p style="font-size:12px;color:var(--muted);margin-bottom:10px">Appointment accepted by citizen. You can mark the outcome after meeting.</p>
      <button class="btn btn-primary" id="btnOpenMark">
        Mark Appointment Outcome
      </button>`;
    document.getElementById('btnOpenMark').addEventListener('click', () => openMarkApptModal(lastAppt, missCount));
    return;
  }
  if (hasPendingOrAcceptedAppt && lastAppt.status === 'Pending') {
    zone.innerHTML = `<p style="font-size:12px;color:var(--amber)">Waiting for citizen to accept the appointment before its scheduled time.</p>`;
    return;
  }

  // 4. Completed appt → assign officer (if not yet assigned) OR reassign
  if (hasCompletedAppt || c.status === 'Officer Assigned' || c.status === 'Investigation Ongoing') {
    const assignBtnLabel = c.assigned_officer_name ? `Reassign Officer (currently: ${c.assigned_officer_name})` : 'Assign Investigating Officer';
    zone.innerHTML = `
      <button class="btn btn-primary" id="btnOpenAssign">
        <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        ${esc(assignBtnLabel)}
      </button>`;
    document.getElementById('btnOpenAssign').addEventListener('click', () => openAssignModal(c));
    return;
  }

  // 5. Cancelled appointments — can reschedule if miss_count < 2
  if (lastAppt && lastAppt.status === 'Cancelled') {
    if (missCount < 2) {
      zone.innerHTML = `
        <p style="font-size:12px;color:#e88080;margin-bottom:10px">Previous appointment was cancelled (no-show: ${missCount}).</p>
        <button class="btn btn-primary" id="btnReschedule">
          Reschedule Appointment
        </button>`;
      document.getElementById('btnReschedule').addEventListener('click', () => openApptModal(c, true));
    } else {
      zone.innerHTML = `<p style="font-size:12px;color:#e88080">Case closed — citizen did not attend two appointments.</p>`;
    }
    return;
  }

  // Default
  if (['Resolved','Closed','Rejected','Withdrawn'].includes(c.status)) {
    zone.innerHTML = `<p style="font-size:12px;color:var(--muted)">This case is ${c.status.toLowerCase()}. No further actions available.</p>`;
  }
}

/* ══════════════════════════
   REVIEW MODAL (Accept / Reject)
══════════════════════════ */
let reviewingCase = null;

function openReviewModal(c) {
  reviewingCase    = c;
  reviewRejectMode = false;
  document.getElementById('reviewModalRef').textContent = c.reference_number;
  document.getElementById('rejectionReasonField').style.display = 'none';
  document.getElementById('rejectionReason').value = '';
  document.getElementById('btnRejectComplaint').textContent = '✕ Reject Complaint';
  hideAlert('reviewAlert');
  openModal('modalReview');
}

document.getElementById('btnAcceptComplaint').addEventListener('click', () => doReview('accept'));
document.getElementById('btnRejectComplaint').addEventListener('click', () => {
  if (!reviewRejectMode) {
    reviewRejectMode = true;
    document.getElementById('rejectionReasonField').style.display = 'block';
    document.getElementById('btnRejectComplaint').textContent = '✕ Confirm Rejection';
  } else {
    doReview('reject');
  }
});

async function doReview(action) {
  hideAlert('reviewAlert');
  const reason = document.getElementById('rejectionReason').value.trim();
  if (action === 'reject' && !reason) {
    showAlert('reviewAlert', 'error', 'A rejection reason is required.');
    return;
  }
  const btn = action === 'accept'
    ? document.getElementById('btnAcceptComplaint')
    : document.getElementById('btnRejectComplaint');
  btn.disabled = true;
  try {
    const res  = await fetch('../php/shoReviewComplaint.php', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ complaint_id: reviewingCase.complaint_id, action, reason }),
    });
    const data = await res.json();
    if (data.success) {
      closeModal('modalReview');
      await loadCases();
      openCaseDetail(reviewingCase.complaint_id);
    } else {
      showAlert('reviewAlert', 'error', data.message || 'Failed. Please try again.');
    }
  } catch { showAlert('reviewAlert', 'error', 'Connection error.'); }
  finally { btn.disabled = false; }
}

/* ══════════════════════════
   APPOINTMENT MODAL (Set/Reschedule)
══════════════════════════ */
let apptForComplaint = null;

function openApptModal(c, isReschedule) {
  apptForComplaint = c;
  document.getElementById('apptModalRef').textContent = (isReschedule ? 'Reschedule: ' : '') + c.reference_number;
  document.getElementById('apptDate').value     = '';
  document.getElementById('apptStart').value    = '';
  document.getElementById('apptEnd').value      = '';
  document.getElementById('apptLocation').value = `SHO Office${SHO?.station_name ? ', ' + SHO.station_name : ''}`;
  const res = document.getElementById('scheduleCheckResult');
  res.style.display = 'none'; res.className = 'schedule-check-result';
  hideAlert('apptAlert');
  // min date = tomorrow
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
  document.getElementById('apptDate').min = tomorrow.toISOString().split('T')[0];
  openModal('modalSetAppt');
}

function wireApptTimeTriggers() {
  ['apptDate','apptStart','apptEnd'].forEach(id =>
    document.getElementById(id).addEventListener('change', checkApptConflict));
}

async function checkApptConflict() {
  const date  = document.getElementById('apptDate').value;
  const start = document.getElementById('apptStart').value;
  const end   = document.getElementById('apptEnd').value;
  const box   = document.getElementById('scheduleCheckResult');
  if (!date || !start || !end) { box.style.display='none'; return; }
  if (start >= end) {
    box.style.display = 'block';
    box.className = 'schedule-check-result check-conflict';
    box.textContent = '⚠ End time must be after start time.';
    return;
  }
  box.style.display = 'block';
  box.className = 'schedule-check-result';
  box.textContent = 'Checking schedule…';
  try {
    const res  = await fetch('../php/shoCheckSchedule.php', {
      method: 'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ date, start_time: start, end_time: end }),
    });
    const data = await res.json();
    if (data.conflict) {
      box.className = 'schedule-check-result check-conflict';
      box.textContent = `⚠ Conflict: "${data.conflict_note}" is already scheduled in this slot.`;
    } else {
      box.className = 'schedule-check-result check-ok';
      box.textContent = '✓ Time slot is available.';
    }
  } catch { box.style.display='none'; }
}

document.getElementById('btnConfirmAppt').addEventListener('click', async function() {
  hideAlert('apptAlert');
  const date     = document.getElementById('apptDate').value;
  const start    = document.getElementById('apptStart').value;
  const end      = document.getElementById('apptEnd').value;
  const location = document.getElementById('apptLocation').value.trim();
  if (!date || !start || !end || !location) { showAlert('apptAlert','error','All fields are required.'); return; }
  if (start >= end) { showAlert('apptAlert','error','End time must be after start time.'); return; }
  const box = document.getElementById('scheduleCheckResult');
  if (box.classList.contains('check-conflict')) { showAlert('apptAlert','error','Please resolve the schedule conflict first.'); return; }
  this.disabled = true; this.textContent = 'Scheduling…';
  try {
    const res  = await fetch('../php/shoSetAppointment.php', {
      method: 'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ complaint_id: apptForComplaint.complaint_id, date, start_time: start, end_time: end, location }),
    });
    const data = await res.json();
    if (data.success) {
      closeModal('modalSetAppt');
      await loadCases();
      openCaseDetail(apptForComplaint.complaint_id);
    } else { showAlert('apptAlert','error', data.message || 'Failed.'); }
  } catch { showAlert('apptAlert','error','Connection error.'); }
  finally { this.disabled = false; this.textContent = 'Schedule Appointment'; }
});

/* ══════════════════════════
   MARK APPOINTMENT OUTCOME
══════════════════════════ */
let activeMarkAppt = null;

function openMarkApptModal(appt, missCount) {
  activeMarkAppt = appt;
  document.getElementById('markApptRef').textContent = appt.reference_number || '—';
  hideAlert('markApptAlert');
  const warn = document.getElementById('markApptWarn');
  if (missCount >= 1) {
    warn.style.display = 'block';
    warn.textContent = `⚠ This citizen already missed ${missCount} appointment${missCount>1?'s':''}. If cancelled again the case will be automatically closed.`;
  } else {
    warn.style.display = 'none';
  }
  openModal('modalMarkAppt');
}

document.getElementById('btnMarkCompleted').addEventListener('click', () => doMarkOutcome('Completed'));
document.getElementById('btnMarkCancelled').addEventListener('click', () => doMarkOutcome('Cancelled'));

async function doMarkOutcome(outcome) {
  hideAlert('markApptAlert');
  const btn = outcome === 'Completed' ? document.getElementById('btnMarkCompleted') : document.getElementById('btnMarkCancelled');
  btn.disabled = true;
  try {
    const res  = await fetch('../php/shoMarkAppointment.php', {
      method: 'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ appointment_id: activeMarkAppt.appointment_id, outcome }),
    });
    const data = await res.json();
    if (data.success) {
      closeModal('modalMarkAppt');
      await loadCases();
      // If completed → immediately open assign modal
      if (outcome === 'Completed') {
        const updatedCase = casesData.find(c => c.complaint_id === activeCaseId);
        if (updatedCase) openAssignModal(updatedCase);
        else openCaseDetail(activeCaseId);
      } else {
        openCaseDetail(activeCaseId);
      }
    } else { showAlert('markApptAlert','error', data.message || 'Failed.'); }
  } catch { showAlert('markApptAlert','error','Connection error.'); }
  finally { btn.disabled = false; }
}

/* ══════════════════════════
   ASSIGN OFFICER MODAL
══════════════════════════ */
let assignForCase = null;

async function openAssignModal(c) {
  assignForCase = c;
  document.getElementById('assignModalRef').textContent = c.reference_number;
  document.getElementById('selectedOfficerIdInput').value = '';
  document.getElementById('assignModalNote').textContent =
    c.assigned_officer_name
      ? `Currently assigned to: ${c.assigned_officer_name}. Select a different officer to reassign.`
      : 'Select an officer from your station to investigate this case.';
  hideAlert('assignAlert');
  document.getElementById('officerSelectGrid').innerHTML = '<div class="loading-row"><div class="mini-spin"></div>Loading officers…</div>';
  openModal('modalAssignOfficer');

  try {
    const res  = await fetch('../php/shoGetOfficers.php');
    const data = await res.json();
    if (!data.success || !data.officers.length) {
      document.getElementById('officerSelectGrid').innerHTML = '<p class="tbl-empty">No available investigating officers at your station.</p>';
      return;
    }
    document.getElementById('officerSelectGrid').innerHTML = data.officers.map(o => `
      <div class="officer-select-card ${c.assigned_officer_id == o.officer_id ? 'selected' : ''}" data-id="${o.officer_id}">
        <div class="osc-name">${esc(o.full_name)}</div>
        <div class="osc-meta">${rankBadge(o.rank)} · ${esc(o.badge_number)}</div>
        <div class="osc-load ${o.active_caseload > 6 ? 'overloaded' : ''}">${o.active_caseload} active case${o.active_caseload!=1?'s':''}</div>
      </div>`).join('');

    document.querySelectorAll('.officer-select-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.officer-select-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        document.getElementById('selectedOfficerIdInput').value = card.dataset.id;
      });
    });
    // pre-select existing
    if (c.assigned_officer_id) document.getElementById('selectedOfficerIdInput').value = c.assigned_officer_id;
  } catch {
    document.getElementById('officerSelectGrid').innerHTML = '<p class="tbl-empty">Failed to load officers.</p>';
  }
}

document.getElementById('btnConfirmAssign').addEventListener('click', async function() {
  hideAlert('assignAlert');
  const officerId = document.getElementById('selectedOfficerIdInput').value;
  if (!officerId) { showAlert('assignAlert','error','Please select an officer.'); return; }
  if (String(officerId) === String(assignForCase.assigned_officer_id)) {
    showAlert('assignAlert','error','This officer is already assigned. Select a different officer to reassign.');
    return;
  }
  this.disabled = true; this.textContent = 'Assigning…';
  try {
    const res  = await fetch('../php/shoAssignOfficer.php', {
      method: 'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ complaint_id: assignForCase.complaint_id, officer_id: parseInt(officerId) }),
    });
    const data = await res.json();
    if (data.success) {
      closeModal('modalAssignOfficer');
      await loadCases();
      openCaseDetail(assignForCase.complaint_id);
    } else { showAlert('assignAlert','error', data.message || 'Failed.'); }
  } catch { showAlert('assignAlert','error','Connection error.'); }
  finally { this.disabled = false; this.textContent = 'Assign Officer'; }
});

/* ══════════════════════════
   PAGE: APPOINTMENTS
══════════════════════════ */
async function loadAppointments() {
  document.getElementById('apptTbody').innerHTML =
    '<tr><td colspan="8" class="tbl-empty"><div class="loading-row"><div class="mini-spin"></div>Loading…</div></td></tr>';
  try {
    const res  = await fetch('../php/shoGetAppointments.php');
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    apptData = data.appointments;
    renderAppointments(apptData);
  } catch(e) {
    document.getElementById('apptTbody').innerHTML =
      `<tr><td colspan="8" class="tbl-empty">Failed to load: ${esc(e.message)}</td></tr>`;
  }
}

function renderAppointments(list) {
  setCount('apptCount', list.length);
  const badge = document.getElementById('navBadgeAppt');
  const pending = list.filter(a=>a.status==='Pending').length;
  if (pending>0) { badge.textContent=pending; badge.classList.add('visible'); }
  else badge.classList.remove('visible');

  const tbody = document.getElementById('apptTbody');
  if (!list.length) { tbody.innerHTML='<tr><td colspan="8" class="tbl-empty">No appointments found.</td></tr>'; return; }
  tbody.innerHTML = list.map(a => {
    const canMark    = a.status === 'Accepted';
    const canReschedule = a.status === 'Cancelled' && (a.miss_count||0) < 2;
    return `<tr>
      <td><span style="font-family:monospace;font-size:11px;color:var(--gold-dim)">${esc(a.reference_number)}</span></td>
      <td style="font-family:monospace;font-size:11px;color:var(--muted)">${esc(a.cnic)}</td>
      <td>${fmtDate(a.scheduled_date)}</td>
      <td>${fmtTime(a.start_time)} – ${fmtTime(a.end_time)}</td>
      <td style="font-size:12px;color:var(--muted)">${esc(a.location)}</td>
      <td>${apptBadge(a.status)}</td>
      <td style="text-align:center;color:${(a.miss_count||0)>0?'#e88080':'var(--muted)'}">${a.miss_count||0}</td>
      <td>
        <button class="tbl-btn btn-view-appt-case" data-id="${a.complaint_id}">View Case</button>
        ${canMark    ? `<button class="tbl-btn btn-mark-appt" data-appt='${JSON.stringify({appointment_id:a.appointment_id,reference_number:a.reference_number,miss_count:a.miss_count||0})}'>Mark Outcome</button>` : ''}
        ${canReschedule ? `<button class="tbl-btn btn-reschedule-appt" data-id="${a.complaint_id}">Reschedule</button>` : ''}
      </td>
    </tr>`;
  }).join('');

  document.querySelectorAll('.btn-view-appt-case').forEach(b =>
    b.addEventListener('click', () => { navigateTo('cases'); openCaseDetail(parseInt(b.dataset.id)); }));
  document.querySelectorAll('.btn-mark-appt').forEach(b =>
    b.addEventListener('click', () => { const a=JSON.parse(b.dataset.appt); openMarkApptModal(a, a.miss_count); }));
  document.querySelectorAll('.btn-reschedule-appt').forEach(b =>
    b.addEventListener('click', async () => {
      const c = casesData.find(x=>x.complaint_id==b.dataset.id) || await fetchCaseMin(b.dataset.id);
      if (c) openApptModal(c, true);
    }));
}

async function fetchCaseMin(id) {
  try {
    const res=await fetch(`../php/shoGetCaseDetail.php?complaint_id=${id}`);
    const d=await res.json();
    return d.success ? d.complaint : null;
  } catch { return null; }
}

function applyApptFilters() {
  const status   = document.getElementById('fApptStatus').value;
  const dateFrom = document.getElementById('fApptDateFrom').value;
  const dateTo   = document.getElementById('fApptDateTo').value;
  const search   = document.getElementById('fApptSearch').value.trim().toLowerCase();
  renderAppointments(apptData.filter(a => {
    if (status   && a.status !== status) return false;
    if (dateFrom && a.scheduled_date < dateFrom) return false;
    if (dateTo   && a.scheduled_date > dateTo)   return false;
    if (search   && !a.reference_number.toLowerCase().includes(search)
                 && !(a.cnic||'').toLowerCase().includes(search)) return false;
    return true;
  }));
}

/* ══════════════════════════
   PAGE: OFFICERS
══════════════════════════ */
async function loadOfficers() {
  document.getElementById('officersTbody').innerHTML =
    '<tr><td colspan="6" class="tbl-empty"><div class="loading-row"><div class="mini-spin"></div>Loading…</div></td></tr>';
  try {
    const res  = await fetch('../php/shoGetOfficers.php?full=1');
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    officersData = data.officers;
    renderOfficers(officersData);
    setCount('officerCount', officersData.length);
  } catch(e) {
    document.getElementById('officersTbody').innerHTML =
      `<tr><td colspan="6" class="tbl-empty">Failed: ${esc(e.message)}</td></tr>`;
  }
}

function renderOfficers(list) {
  setCount('officerCount', list.length);
  const tbody = document.getElementById('officersTbody');
  if (!list.length) { tbody.innerHTML='<tr><td colspan="6" class="tbl-empty">No officers found.</td></tr>'; return; }
  tbody.innerHTML = list.map(o => {
    const initials = o.full_name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
    const caseList = o.assigned_cases && o.assigned_cases.length
      ? o.assigned_cases.map(r=>`<span style="font-size:10px;font-family:monospace;color:var(--gold-dim)">${esc(r)}</span>`).join(', ')
      : '<em style="color:var(--muted);font-size:11px">None</em>';
    return `<tr>
      <td>
        <div class="officer-cell">
          <div class="officer-avatar-sm">${initials}</div>
          <div>
            <div class="officer-name-cell">${esc(o.full_name)}</div>
            <div class="officer-sub-cell">${esc(o.email)}</div>
          </div>
        </div>
      </td>
      <td style="font-family:monospace;font-size:11px;color:var(--gold-dim)">${esc(o.badge_number)}</td>
      <td>${rankBadge(o.rank)}</td>
      <td style="text-align:center;color:${o.active_caseload>6?'#e88080':'var(--offwhite)'}">${o.active_caseload}</td>
      <td>${o.is_active==1?'<span class="badge b-accepted">Active</span>':'<span class="badge b-rejected">Inactive</span>'}</td>
      <td style="font-size:11.5px">${caseList}</td>
    </tr>`;
  }).join('');
}

function applyOfficerFilters() {
  const rank   = document.getElementById('fOfficerRank').value;
  const load   = document.getElementById('fOfficerLoad').value;
  const search = document.getElementById('fOfficerSearch').value.trim().toLowerCase();
  renderOfficers(officersData.filter(o => {
    if (rank && o.rank !== rank) return false;
    if (load === 'low'    && o.active_caseload > 3) return false;
    if (load === 'medium' && (o.active_caseload < 4 || o.active_caseload > 6)) return false;
    if (load === 'high'   && o.active_caseload <= 6) return false;
    if (search && !o.full_name.toLowerCase().includes(search) && !o.badge_number.toLowerCase().includes(search)) return false;
    return true;
  }));
}

/* ══════════════════════════
   PAGE: SCHEDULE
══════════════════════════ */
async function loadSchedule() {
  document.getElementById('scheduleTbody').innerHTML =
    '<tr><td colspan="5" class="tbl-empty"><div class="loading-row"><div class="mini-spin"></div>Loading…</div></td></tr>';
  try {
    const res  = await fetch('../php/shoGetSchedule.php');
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    scheduleData = data.slots;
    // Set month filter to current month if empty
    if (!document.getElementById('fScheduleMonth').value) {
      document.getElementById('fScheduleMonth').value = new Date().toISOString().slice(0,7);
    }
    applyScheduleFilters();
  } catch(e) {
    document.getElementById('scheduleTbody').innerHTML =
      `<tr><td colspan="5" class="tbl-empty">Failed: ${esc(e.message)}</td></tr>`;
  }
}

function applyScheduleFilters() {
  const month  = document.getElementById('fScheduleMonth').value;
  const type   = document.getElementById('fScheduleType').value;
  const filtered = scheduleData.filter(s => {
    if (month && !s.scheduled_date.startsWith(month)) return false;
    if (type  && s.slot_type !== type) return false;
    return true;
  });
  renderSchedule(filtered);
}

function renderSchedule(list) {
  const tbody = document.getElementById('scheduleTbody');
  if (!list.length) { tbody.innerHTML='<tr><td colspan="5" class="tbl-empty">No slots found for this period.</td></tr>'; return; }
  const sorted = [...list].sort((a,b)=>a.scheduled_date.localeCompare(b.scheduled_date)||(a.start_time.localeCompare(b.start_time)));
  tbody.innerHTML = sorted.map(s => {
    const isAppt = s.slot_type === 'Appointment';
    const canEdit = !isAppt; // appointment slots are auto-created and locked
    return `<tr>
      <td>${fmtDate(s.scheduled_date)}</td>
      <td>${fmtTime(s.start_time)} – ${fmtTime(s.end_time)}</td>
      <td><span class="badge ${isAppt?'b-appt-completed':'b-review'}">${esc(s.slot_type)}</span></td>
      <td style="font-size:12px;color:var(--muted)">${esc(s.notes)||'—'}</td>
      <td>
        ${canEdit ? `<button class="tbl-btn btn-edit-slot" data-id="${s.schedule_id}">Edit</button>` : ''}
        ${canEdit ? `<button class="tbl-btn danger btn-del-slot" data-id="${s.schedule_id}" data-date="${esc(s.scheduled_date)}">Delete</button>` : ''}
        ${isAppt  ? `<span style="font-size:11px;color:var(--muted)">Auto (appointment)</span>` : ''}
      </td>
    </tr>`;
  }).join('');

  document.querySelectorAll('.btn-edit-slot').forEach(btn =>
    btn.addEventListener('click', () => openSlotModal(parseInt(btn.dataset.id))));
  document.querySelectorAll('.btn-del-slot').forEach(btn =>
    btn.addEventListener('click', () => deleteSlot(parseInt(btn.dataset.id), btn.dataset.date)));
}

/* Add slot btn */
document.getElementById('btnAddSlot').addEventListener('click', () => openSlotModal(null));

function openSlotModal(slotId) {
  activeSlotId = slotId;
  document.getElementById('slotModalTitle').textContent = slotId ? 'Edit Slot' : 'Add Slot';
  document.getElementById('slotId').value = slotId || '';
  hideAlert('slotAlert');
  const conflBox = document.getElementById('slotConflictResult');
  conflBox.style.display='none'; conflBox.className='schedule-check-result';

  if (slotId) {
    const slot = scheduleData.find(s=>s.schedule_id==slotId);
    if (slot) {
      document.getElementById('slotDate').value  = slot.scheduled_date;
      document.getElementById('slotStart').value = slot.start_time.slice(0,5);
      document.getElementById('slotEnd').value   = slot.end_time.slice(0,5);
      document.getElementById('slotType').value  = slot.slot_type;
      document.getElementById('slotNotes').value = slot.notes || '';
    }
  } else {
    document.getElementById('slotDate').value  = '';
    document.getElementById('slotStart').value = '';
    document.getElementById('slotEnd').value   = '';
    document.getElementById('slotType').value  = 'Duty';
    document.getElementById('slotNotes').value = '';
  }
  openModal('modalScheduleSlot');
}

function wireScheduleTimeTriggers() {
  ['slotDate','slotStart','slotEnd'].forEach(id =>
    document.getElementById(id).addEventListener('change', checkSlotConflict));
}

async function checkSlotConflict() {
  const date  = document.getElementById('slotDate').value;
  const start = document.getElementById('slotStart').value;
  const end   = document.getElementById('slotEnd').value;
  const box   = document.getElementById('slotConflictResult');
  if (!date || !start || !end) { box.style.display='none'; return; }
  if (start >= end) {
    box.style.display='block'; box.className='schedule-check-result check-conflict';
    box.textContent='⚠ End time must be after start time.'; return;
  }
  box.style.display='block'; box.className='schedule-check-result'; box.textContent='Checking…';
  try {
    const res  = await fetch('../php/shoCheckSchedule.php', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ date, start_time: start, end_time: end, exclude_id: activeSlotId }),
    });
    const data = await res.json();
    if (data.conflict) {
      box.className='schedule-check-result check-conflict';
      box.textContent=`⚠ Conflict: "${data.conflict_note}" is already in this slot.`;
    } else {
      box.className='schedule-check-result check-ok';
      box.textContent='✓ Time slot is available.';
    }
  } catch { box.style.display='none'; }
}

// Save slot (single or batch — batch wrapped in transaction server-side)
document.getElementById('btnConfirmSlot').addEventListener('click', async function() {
  hideAlert('slotAlert');
  const date  = document.getElementById('slotDate').value;
  const start = document.getElementById('slotStart').value;
  const end   = document.getElementById('slotEnd').value;
  const type  = document.getElementById('slotType').value;
  const notes = document.getElementById('slotNotes').value.trim();
  if (!date || !start || !end || !type) { showAlert('slotAlert','error','Date, times and type are required.'); return; }
  if (start >= end) { showAlert('slotAlert','error','End time must be after start time.'); return; }
  const box = document.getElementById('slotConflictResult');
  if (box.classList.contains('check-conflict')) { showAlert('slotAlert','error','Please resolve the conflict first.'); return; }
  this.disabled=true; this.textContent='Saving…';
  try {
    const res  = await fetch('../php/shoSaveScheduleSlot.php', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ schedule_id: activeSlotId, date, start_time: start, end_time: end, slot_type: type, notes }),
    });
    const data = await res.json();
    if (data.success) {
      closeModal('modalScheduleSlot');
      loadSchedule();
    } else { showAlert('slotAlert','error', data.message || 'Failed.'); }
  } catch { showAlert('slotAlert','error','Connection error.'); }
  finally { this.disabled=false; this.textContent='Save Slot'; }
});

async function deleteSlot(slotId, dateStr) {
  if (!confirm(`Delete schedule slot on ${dateStr}? This cannot be undone.`)) return;
  try {
    const res  = await fetch('../php/shoDeleteScheduleSlot.php', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ schedule_id: slotId }),
    });
    const data = await res.json();
    if (data.success) loadSchedule();
    else alert('Failed: ' + (data.message||'Server error.'));
  } catch { alert('Connection error.'); }
}

/* ══════════════════════════
   PAGE: CASE UPDATES
══════════════════════════ */
async function loadUpdates() {
  document.getElementById('updatesTbody').innerHTML =
    '<tr><td colspan="5" class="tbl-empty"><div class="loading-row"><div class="mini-spin"></div>Loading…</div></td></tr>';
  try {
    const res  = await fetch('../php/shoGetCaseUpdates.php');
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    updatesData = data.updates;
    renderUpdates(updatesData);
  } catch(e) {
    document.getElementById('updatesTbody').innerHTML =
      `<tr><td colspan="5" class="tbl-empty">Failed: ${esc(e.message)}</td></tr>`;
  }
}

function renderUpdates(list) {
  setCount('updatesCount', list.length);
  const tbody = document.getElementById('updatesTbody');
  if (!list.length) { tbody.innerHTML='<tr><td colspan="5" class="tbl-empty">No updates found.</td></tr>'; return; }
  tbody.innerHTML = list.map(u => `
    <tr>
      <td><span style="font-family:monospace;font-size:11px;color:var(--gold-dim)">${esc(u.reference_number)}</span></td>
      <td>${statusBadge(u.status)}</td>
      <td style="font-size:12px;color:var(--muted);max-width:220px">${esc(u.note)||'—'}</td>
      <td style="font-size:12px;color:var(--muted)">${esc(u.updated_by)}</td>
      <td style="font-size:12px;color:var(--muted)">${fmtDT(u.updated_at)}</td>
    </tr>`).join('');
}

function applyUpdateFilters() {
  const status   = document.getElementById('fUpdStatus').value;
  const by       = document.getElementById('fUpdBy').value;
  const dateFrom = document.getElementById('fUpdDateFrom').value;
  const dateTo   = document.getElementById('fUpdDateTo').value;
  const search   = document.getElementById('fUpdSearch').value.trim().toLowerCase();
  renderUpdates(updatesData.filter(u => {
    if (status   && u.status !== status) return false;
    if (by === 'System' && u.updated_by !== 'System') return false;
    if (by === 'SHO'    && !u.updated_by.toLowerCase().includes('sho')) return false;
    if (by === 'Officer'&& u.updated_by === 'System') return false;
    if (dateFrom && u.updated_at.slice(0,10) < dateFrom) return false;
    if (dateTo   && u.updated_at.slice(0,10) > dateTo)   return false;
    if (search   && !(u.reference_number||'').toLowerCase().includes(search)) return false;
    return true;
  }));
}

/* ══════════════════════════
   PAGE: WITHDRAWALS
══════════════════════════ */
async function loadWithdrawalBadge() {
  try {
    const res  = await fetch('../php/shoGetWithdrawals.php?count_only=1');
    const data = await res.json();
    if (data.success && data.pending > 0) {
      const badge = document.getElementById('navBadgeWd');
      badge.textContent = data.pending;
      badge.classList.add('visible');
    }
  } catch { /* silent */ }
}

async function loadWithdrawals() {
  document.getElementById('wdTbody').innerHTML =
    '<tr><td colspan="7" class="tbl-empty"><div class="loading-row"><div class="mini-spin"></div>Loading…</div></td></tr>';
  try {
    const res  = await fetch('../php/shoGetWithdrawals.php');
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    wdData = data.requests;
    renderWithdrawals(wdData);
  } catch(e) {
    document.getElementById('wdTbody').innerHTML =
      `<tr><td colspan="7" class="tbl-empty">Failed: ${esc(e.message)}</td></tr>`;
  }
}

function renderWithdrawals(list) {
  setCount('wdCount', list.length);
  const badge = document.getElementById('navBadgeWd');
  const pending = list.filter(w=>w.status==='Pending').length;
  if (pending>0) { badge.textContent=pending; badge.classList.add('visible'); }
  else badge.classList.remove('visible');

  const tbody = document.getElementById('wdTbody');
  if (!list.length) { tbody.innerHTML='<tr><td colspan="7" class="tbl-empty">No withdrawal requests.</td></tr>'; return; }
  tbody.innerHTML = list.map(w => `
    <tr>
      <td><span style="font-family:monospace;font-size:11px;color:var(--gold-dim)">${esc(w.reference_number)}</span></td>
      <td style="font-family:monospace;font-size:11px;color:var(--muted)">${esc(w.cnic)}</td>
      <td>${statusBadge(w.complaint_status)}</td>
      <td style="font-size:12px;color:var(--muted);max-width:180px">${esc(w.reason)||'—'}</td>
      <td>${wdBadge(w.status)}</td>
      <td style="font-size:12px;color:var(--muted)">${fmtDT(w.created_at)}</td>
      <td>
        ${w.status==='Pending'
          ? `<button class="tbl-btn btn-wd-action" data-id="${w.request_id}">Review</button>`
          : `<span style="font-size:11px;color:var(--muted)">${w.actioned_at ? fmtDate(w.actioned_at) : '—'}</span>`}
      </td>
    </tr>`).join('');

  document.querySelectorAll('.btn-wd-action').forEach(btn =>
    btn.addEventListener('click', () => openWdModal(parseInt(btn.dataset.id))));
}

function applyWdFilters() {
  const status   = document.getElementById('fWdStatus').value;
  const dateFrom = document.getElementById('fWdDateFrom').value;
  const dateTo   = document.getElementById('fWdDateTo').value;
  const search   = document.getElementById('fWdSearch').value.trim().toLowerCase();
  renderWithdrawals(wdData.filter(w => {
    if (status   && w.status !== status) return false;
    if (dateFrom && w.created_at.slice(0,10) < dateFrom) return false;
    if (dateTo   && w.created_at.slice(0,10) > dateTo)   return false;
    if (search   && !(w.reference_number||'').toLowerCase().includes(search)
                 && !(w.cnic||'').toLowerCase().includes(search)) return false;
    return true;
  }));
}

function openWdModal(requestId) {
  activeWdId  = requestId;
  wdRejectMode = false;
  const wd = wdData.find(w=>w.request_id===requestId);
  if (!wd) return;
  document.getElementById('wdModalRef').textContent = wd.reference_number;
  document.getElementById('wdModalInfo').innerHTML = `
    <div class="info-row"><span class="info-key">Citizen CNIC</span><span class="info-val" style="font-family:monospace;font-size:11px">${esc(wd.cnic)}</span></div>
    <div class="info-row"><span class="info-key">Case Status</span><span class="info-val">${statusBadge(wd.complaint_status)}</span></div>
    <div class="info-row"><span class="info-key">Requested At</span><span class="info-val">${fmtDT(wd.created_at)}</span></div>`;
  document.getElementById('wdModalReason').textContent = wd.reason || '—';
  document.getElementById('wdRejectionNote').value = '';
  document.getElementById('wdRejectionNote').style.display = 'none';
  document.getElementById('wdNoteLabel').style.display    = 'none';
  document.getElementById('wdActionBtns').style.display   = 'flex';
  document.getElementById('btnWdReject').textContent = '✕ Reject Withdrawal';
  hideAlert('wdAlert');
  openModal('modalWithdrawal');
}

document.getElementById('btnWdApprove').addEventListener('click', () => doWithdrawalAction('Approved'));
document.getElementById('btnWdReject').addEventListener('click', () => {
  if (!wdRejectMode) {
    wdRejectMode = true;
    document.getElementById('wdNoteLabel').style.display    = 'block';
    document.getElementById('wdRejectionNote').style.display = 'block';
    document.getElementById('btnWdReject').textContent = '✕ Confirm Rejection';
  } else {
    doWithdrawalAction('Rejected');
  }
});

async function doWithdrawalAction(action) {
  hideAlert('wdAlert');
  const note = document.getElementById('wdRejectionNote').value.trim();
  const btn  = action==='Approved' ? document.getElementById('btnWdApprove') : document.getElementById('btnWdReject');
  btn.disabled = true;
  try {
    const res  = await fetch('../php/shoWithdrawalAction.php', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ request_id: activeWdId, action, rejection_note: note }),
    });
    const data = await res.json();
    if (data.success) {
      closeModal('modalWithdrawal');
      loadWithdrawals();
      loadCases(); // refresh cases since status may have changed
    } else { showAlert('wdAlert','error', data.message||'Failed.'); }
  } catch { showAlert('wdAlert','error','Connection error.'); }
  finally { btn.disabled=false; }
}