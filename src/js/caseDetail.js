// ══════════════════════════════════════════════
// caseDetail.js
// Job: read reference number from URL param,
//      fetch full complaint detail + timeline
//      + officer assignment + appointment
// ══════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  checkSession();

  // ── Read reference number from URL: caseDetail.html?ref=KHI-26-00001
  const params = new URLSearchParams(window.location.search);
  const ref    = params.get('ref');

  if (!ref) {
    window.location.href = 'citizenDashboard.html';
    return;
  }

  loadCaseDetail(ref);
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

// ── Fetch and render full case detail
function loadCaseDetail(ref) {
  fetch(`../php/getCaseDetails.php?ref=${encodeURIComponent(ref)}`)
    .then(r => r.json())
    .then(data => {
      document.getElementById('loadingState').style.display = 'none';

      if (!data.success) {
        window.location.href = 'citizenDashboard.html';
        return;
      }

      document.getElementById('caseContent').style.display = 'block';
      renderCase(data);
    })
    .catch(() => window.location.href = 'citizenDashboard.html');
}

// ── Render everything from the API response
function renderCase(data) {
  const c = data.complaint;

  // ── Header
  document.getElementById('caseRef').textContent   = c.reference_number;
  document.getElementById('caseTitle').textContent = `${c.category} — ${c.incident_area}`;
  document.title = `PICMS — ${c.reference_number}`;

  // ── Status card
  document.getElementById('statusLarge').textContent = c.status;
  document.getElementById('statusDate').textContent  = `Filed ${formatDate(c.submitted_at)}`;

  // ── Station card
  document.getElementById('stationName').textContent    = c.station_name    || '—';
  document.getElementById('stationAddress').textContent = c.station_address  || '—';

  // ── Officer card
  if (data.officer) {
    document.getElementById('officerName').textContent  = data.officer.full_name;
    document.getElementById('officerBadge').textContent = `Badge #${data.officer.badge_number} · ${data.officer.rank}`;
  } else {
    document.getElementById('officerName').textContent  = 'Not yet assigned';
    document.getElementById('officerBadge').textContent = 'Pending SHO review';
  }

  // ── Witnesses string (fetched from witnesses table, not inline columns)
  const witnessDisplay = (data.witnesses && data.witnesses.length > 0)
    ? data.witnesses.map(w => w.witness_name + (w.witness_contact ? ` (${w.witness_contact})` : '')).join(', ')
    : 'None';

  // ── Detail rows — uses category/subcategory names from JOIN, not IDs
  const rows = [
    { key: 'Category',      val: c.category },
    { key: 'Sub-category',  val: c.subcategory  || '—' },
    { key: 'Incident Date', val: formatDate(c.incident_date) },
    { key: 'Incident Time', val: c.incident_time || '—' },
    { key: 'Area',          val: c.incident_area },
    { key: 'Landmark',      val: c.incident_landmark || '—' },
    { key: 'Witnesses',     val: witnessDisplay },
  ];

  document.getElementById('detailRows').innerHTML = rows.map(r => `
    <div class="detail-row">
      <span class="detail-row-key">${escHtml(r.key)}</span>
      <span class="detail-row-val">${escHtml(r.val)}</span>
    </div>
  `).join('');

  // ── Timeline
  renderTimeline(data.timeline);

  // ── Appointment
  //    API now returns scheduled_date, start_time, end_time (from sho_schedule JOIN)
  if (data.appointment) {
    renderAppointment(data.appointment);
  }
}

// ── Render timeline from case_updates rows
function renderTimeline(updates) {
  const container = document.getElementById('timeline');

  if (!updates || updates.length === 0) {
    container.innerHTML = '<p style="font-size:0.75rem;color:var(--muted);">No updates yet.</p>';
    return;
  }

  // Sort oldest first (already sorted by PHP, but guard here too)
  const sorted = [...updates].sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at));

  container.innerHTML = sorted.map((u, i) => {
    const isLast   = i === sorted.length - 1;
    const dotClass = isLast ? 'current' : 'done';

    return `
      <div class="timeline-item">
        <div class="timeline-dot ${dotClass}"></div>
        <div class="timeline-body">
          <div class="timeline-status">${escHtml(u.status)}</div>
          ${u.note ? `<div class="timeline-note">${escHtml(u.note)}</div>` : ''}
          <div class="timeline-meta">${escHtml(u.updated_by)} · ${formatDateTime(u.updated_at)}</div>
        </div>
      </div>
    `;
  }).join('');
}

// ── Render appointment
//    Uses scheduled_date + start_time from the sho_schedule JOIN
function renderAppointment(appt) {
  const section = document.getElementById('appointmentSection');
  const card    = document.getElementById('appointmentCard');

  section.style.display = 'block';

  // Format time range e.g. "10:00 – 11:00"
  const timeRange = appt.start_time
    ? `${appt.start_time}${appt.end_time ? ' – ' + appt.end_time : ''}`
    : '—';

  card.innerHTML = `
    <div class="appt-icon">
      <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    </div>
    <div class="appt-body">
      <div class="appt-title">${formatDate(appt.scheduled_date)} at ${timeRange}</div>
      <div class="appt-sub">${escHtml(appt.location || 'Location to be confirmed')}</div>
    </div>
    <span class="appt-badge appt-${appt.status}">${appt.status}</span>
  `;
}

// ── Helpers
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    + ' · '
    + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}