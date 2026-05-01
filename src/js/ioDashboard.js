// ioDashboard.js — Investigating Officer Dashboard

// ── SESSION CHECK ─────────────────────────────────────────
async function checkSession() {
  try {
    const res  = await fetch('../php/ioCheckSession.php');
    const data = await res.json();
    if (!data.success) window.location.href = 'officerLogin.html';
  } catch {
    window.location.href = 'officerLogin.html';
  }
}

// ── HELPERS ───────────────────────────────────────────────
function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function statusBadge(status) {
  const map = {
    'Submitted':             'b-submitted',
    'Under Review':          'b-review',
    'Accepted':              'b-accepted',
    'Rejected':              'b-submitted',
    'Officer Assigned':      'b-assigned',
    'Investigation Ongoing': 'b-ongoing',
    'Withdrawal Pending':    'b-review',
    'Withdrawn':             'b-submitted',
    'Resolved':              'b-resolved',
    'Closed':                'b-resolved',
  };
  return `<span class="badge ${map[status] || 'b-submitted'}">${status}</span>`;
}

function esc(str) {
  // Escape for use inside HTML attribute strings (onclick args)
  return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function showAlert(id, type, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `um-alert ${type}`;
  el.textContent = msg;
}
function clearAlert(id) {
  const el = document.getElementById(id);
  if (el) { el.className = 'um-alert'; el.textContent = ''; }
}

// ── TOPBAR DATE ───────────────────────────────────────────
function setDate() {
  const el = document.getElementById('topbarDate');
  if (el) el.textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

// ── LOAD PROFILE ─────────────────────────────────────────
async function loadProfile() {
  try {
    const res  = await fetch('../php/ioGetProfile.php');
    const data = await res.json();
    if (!data.success) return;

    document.getElementById('offName').textContent     = data.full_name    || '—';
    document.getElementById('offBadge').textContent    = data.badge_number || '—';
    document.getElementById('offInitials').textContent = (data.full_name || 'O').charAt(0).toUpperCase();

    document.getElementById('pAvatarLg').textContent = (data.full_name || 'O').charAt(0).toUpperCase();
    document.getElementById('pFullName').textContent  = data.full_name    || '—';
    document.getElementById('pBadgeSub').textContent  = `${data.rank || ''} · ${data.badge_number || ''}`;
    document.getElementById('pName').textContent      = data.full_name    || '—';
    document.getElementById('pBadge').textContent     = data.badge_number || '—';
    document.getElementById('pRank').textContent      = data.rank         || '—';
    document.getElementById('pStation').textContent   = data.station_name || '—';
    document.getElementById('pEmail').textContent     = data.email        || '—';
  } catch (e) {
    // Keep UI usable even if profile fetch fails.
  }
}

// ── LOAD STATS ────────────────────────────────────────────
async function loadStats() {
  try {
    const res  = await fetch('../php/ioGetStats.php');
    const data = await res.json();
    if (!data.success) return;
    document.getElementById('oTotal').textContent    = data.totalCases;
    document.getElementById('oActive').textContent   = data.activeCases;
    document.getElementById('oResolved').textContent = data.resolvedCases;
  } catch (e) {
    // Keep UI usable even if stats fetch fails.
  }
}

// ── CASES DATA (shared between Cases page + Updates page) ─
let allCases = [];

async function loadCases() {
  try {
    const res  = await fetch('../php/ioGetCases.php');
    const data = await res.json();
    allCases = (data.success && data.cases) ? data.cases : [];
  } catch {
    allCases = [];
  }
  renderCasesTable();
  renderUpdateCards();
}

// ══════════════════════════════════════════════════════════
// ── CASES PAGE ────────────────────────────────────────────
// ══════════════════════════════════════════════════════════

function renderCasesTable() {
  const tbody  = document.getElementById('casesTbody');
  const status  = document.getElementById('filterCaseStatus').value;
  const urgency = document.getElementById('filterCaseUrgency').value;
  const search  = document.getElementById('searchCase').value.trim().toLowerCase();

  let filtered = allCases;
  if (status)  filtered = filtered.filter(c => c.status === status);
  if (urgency !== '') filtered = filtered.filter(c => String(c.is_urgent) === urgency);
  if (search)  filtered = filtered.filter(c =>
    c.reference_number.toLowerCase().includes(search) ||
    (c.incident_area || '').toLowerCase().includes(search)
  );

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-row">${allCases.length ? 'No cases match the current filters.' : 'No cases assigned yet.'}</td></tr>`;
    return;
  }

  const isResolved = s => ['Resolved','Closed'].includes(s);

  tbody.innerHTML = filtered.map(c => `
    <tr>
      <td>${c.reference_number}</td>
      <td>
        ${c.category_name}
        ${c.is_urgent == 1 ? ' <span class="badge b-urgent">Urgent</span>' : ''}
      </td>
      <td>${c.incident_area || '—'}</td>
      <td>${statusBadge(c.status)}</td>
      <td>${c.is_urgent == 1
        ? '<span class="badge b-urgent">Urgent</span>'
        : '<span class="badge b-submitted">Normal</span>'}</td>
      <td>${formatDate(c.assigned_at)}</td>
      <td style="display:flex;gap:5px;flex-wrap:wrap;">
        <button class="btn btn-steel btn-sm" onclick="openCaseModal(${c.complaint_id})">
          <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          View
        </button>
        ${!isResolved(c.status) ? `
        <button class="btn btn-gold btn-sm" onclick="openUpdateModal(${c.complaint_id},'${esc(c.reference_number)}','${esc(c.status)}')">
          <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Update
        </button>` : `<span style="font-size:10.5px;color:var(--success);padding:5px 2px;">✓ Resolved</span>`}
      </td>
    </tr>
  `).join('');
}

function setupCasesFilters() {
  document.getElementById('filterCaseStatus').addEventListener('change', renderCasesTable);
  document.getElementById('filterCaseUrgency').addEventListener('change', renderCasesTable);
  document.getElementById('searchCase').addEventListener('input', renderCasesTable);
  document.getElementById('clearCasesFilter').addEventListener('click', () => {
    document.getElementById('filterCaseStatus').value  = '';
    document.getElementById('filterCaseUrgency').value = '';
    document.getElementById('searchCase').value        = '';
    renderCasesTable();
  });
}

// ══════════════════════════════════════════════════════════
// ── CASE UPDATES PAGE ─────────────────────────────────────
// ══════════════════════════════════════════════════════════

function renderUpdateCards() {
  const container = document.getElementById('updatesList');
  const status    = document.getElementById('filterUpdStatus').value;
  const urgency   = document.getElementById('filterUpdUrgency').value;
  const search    = document.getElementById('searchUpd').value.trim().toLowerCase();

  let filtered = allCases;
  if (status)      filtered = filtered.filter(c => c.status === status);
  if (urgency !== '') filtered = filtered.filter(c => String(c.is_urgent) === urgency);
  if (search)      filtered = filtered.filter(c =>
    c.reference_number.toLowerCase().includes(search) ||
    (c.incident_area || '').toLowerCase().includes(search)
  );

  if (!filtered.length) {
    container.innerHTML = `<div style="text-align:center;color:var(--muted);padding:40px;font-size:12px;font-style:italic;">${allCases.length ? 'No cases match the current filters.' : 'No cases assigned yet.'}</div>`;
    return;
  }

  const isResolved = s => ['Resolved','Closed'].includes(s);

  container.innerHTML = filtered.map(c => `
    <div class="update-card" id="ucard-${c.complaint_id}">
      <div class="update-card-head" onclick="toggleCard(${c.complaint_id})">
        <div class="update-card-meta">
          <span class="update-card-ref">${c.reference_number}</span>
          <span class="update-card-cat">${c.category_name}</span>
          ${c.incident_area ? `<span class="update-card-cat">· ${c.incident_area}</span>` : ''}
          ${c.is_urgent == 1 ? '<span class="badge b-urgent">Urgent</span>' : ''}
        </div>
        <div class="update-card-right">
          ${statusBadge(c.status)}
          <span style="font-size:10px;color:var(--muted);">${formatDate(c.assigned_at)}</span>
          <svg class="chevron" viewBox="0 0 24 24"><polyline points="6,9 12,15 18,9"/></svg>
        </div>
      </div>
      <div class="update-card-body">
        <div class="update-body-inner">
          <!-- LEFT: Case info + Timeline -->
          <div class="update-panel">
            <div class="detail-section-title">Case Details</div>
            <div class="detail-row"><span class="dr-key">Status</span>        <span class="dr-val">${statusBadge(c.status)}</span></div>
            <div class="detail-row"><span class="dr-key">Incident Area</span> <span class="dr-val">${c.incident_area || '—'}</span></div>
            <div class="detail-row"><span class="dr-key">Assigned On</span>   <span class="dr-val">${formatDate(c.assigned_at)}</span></div>
            <div style="margin-top:16px;">
              <div class="detail-section-title">Update History</div>
              <div class="timeline" id="timeline-${c.complaint_id}">
                <p class="tl-empty">Click to load history…</p>
              </div>
            </div>
          </div>
          <!-- RIGHT: Submit Update -->
          <div class="update-panel">
            <div class="detail-section-title">Submit Update</div>
            ${isResolved(c.status)
              ? `<p class="resolved-notice">✓ This case is already ${c.status.toLowerCase()}. No further updates can be submitted.</p>`
              : `<div class="form-field" style="margin-bottom:12px;">
                  <label class="form-label">New Status <span style="color:var(--danger)">*</span></label>
                  <select class="form-select" id="sel-${c.complaint_id}">
                    <option value="">— Select status —</option>
                    <option value="Investigation Ongoing"${c.status === 'Investigation Ongoing' ? ' selected' : ''}>Investigation Ongoing</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
                <div class="form-field" style="margin-bottom:12px;">
                  <label class="form-label">Update Note</label>
                  <textarea class="form-textarea" id="note-${c.complaint_id}" rows="4" placeholder="Evidence found, witness interviewed, site visited, etc."></textarea>
                </div>
                <button class="btn-submit-inline" id="sbtn-${c.complaint_id}" onclick="submitInlineUpdate(${c.complaint_id})">Submit Update</button>
                <div class="inline-alert" id="ialert-${c.complaint_id}"></div>`
            }
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// Toggle expand/collapse + lazy-load timeline
async function toggleCard(complaintId) {
  const card = document.getElementById(`ucard-${complaintId}`);
  const wasExpanded = card.classList.contains('expanded');

  // Collapse all others
  document.querySelectorAll('.update-card.expanded').forEach(c => c.classList.remove('expanded'));

  if (wasExpanded) return; // just collapsed

  card.classList.add('expanded');

  // Load timeline if not yet loaded
  const tlEl = document.getElementById(`timeline-${complaintId}`);
  if (tlEl && tlEl.querySelector('.tl-empty')) {
    tlEl.innerHTML = '<p class="tl-empty">Loading…</p>';
    try {
      const res  = await fetch(`../php/ioGetCaseDetail.php?id=${complaintId}`);
      const data = await res.json();
      if (data.success && data.updates && data.updates.length) {
        tlEl.innerHTML = data.updates.map((u, i, arr) => `
          <div class="tl-item">
            <div class="tl-dot ${i === arr.length - 1 ? 'current' : 'done'}"></div>
            <div>
              <div class="tl-status">${u.status}</div>
              ${u.note ? `<div class="tl-note">${u.note}</div>` : ''}
              <div class="tl-meta">${u.updated_by} · ${formatDate(u.updated_at)}</div>
            </div>
          </div>
        `).join('');
      } else {
        tlEl.innerHTML = '<p class="tl-empty">No updates recorded yet.</p>';
      }
    } catch {
      tlEl.innerHTML = '<p class="tl-empty">Failed to load history.</p>';
    }
  }
}

// Inline update submit
async function submitInlineUpdate(complaintId) {
  const alertEl = document.getElementById(`ialert-${complaintId}`);
  const btn     = document.getElementById(`sbtn-${complaintId}`);
  const status  = document.getElementById(`sel-${complaintId}`).value;
  const note    = document.getElementById(`note-${complaintId}`).value.trim();

  alertEl.className   = 'inline-alert';
  alertEl.textContent = '';

  if (!status) {
    alertEl.className   = 'inline-alert error';
    alertEl.textContent = 'Please select a new status.';
    return;
  }

  btn.disabled    = true;
  btn.textContent = 'Submitting…';

  try {
    const res  = await fetch('../php/ioCaseUpdate.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ complaint_id: complaintId, status, note }),
    });
    const data = await res.json();

    if (data.success) {
      alertEl.className   = 'inline-alert success';
      alertEl.textContent = 'Case updated successfully.';
      // Reload everything to reflect new status
      await loadCases();
      await loadStats();
      // Re-expand this card and reload its timeline
      const card = document.getElementById(`ucard-${complaintId}`);
      if (card) {
        card.classList.add('expanded');
        const tlEl = document.getElementById(`timeline-${complaintId}`);
        if (tlEl) tlEl.innerHTML = '<p class="tl-empty">Click to load history…</p>';
        await toggleCard(complaintId);
      }
    } else {
      alertEl.className   = 'inline-alert error';
      alertEl.textContent = data.message || 'Failed to update case.';
      btn.disabled    = false;
      btn.textContent = 'Submit Update';
    }
  } catch {
    alertEl.className   = 'inline-alert error';
    alertEl.textContent = 'Connection error. Please try again.';
    btn.disabled    = false;
    btn.textContent = 'Submit Update';
  }
}

function setupUpdatesFilters() {
  document.getElementById('filterUpdStatus').addEventListener('change',  renderUpdateCards);
  document.getElementById('filterUpdUrgency').addEventListener('change', renderUpdateCards);
  document.getElementById('searchUpd').addEventListener('input',         renderUpdateCards);
  document.getElementById('clearUpdFilter').addEventListener('click', () => {
    document.getElementById('filterUpdStatus').value  = '';
    document.getElementById('filterUpdUrgency').value = '';
    document.getElementById('searchUpd').value        = '';
    renderUpdateCards();
  });
}

// ══════════════════════════════════════════════════════════
// ── CASE DETAIL MODAL (View) ──────────────────────────────
// ══════════════════════════════════════════════════════════

async function openCaseModal(complaintId) {
  document.getElementById('caseModal').classList.add('open');
  document.getElementById('cmRef').textContent         = 'Loading…';
  document.getElementById('cmCategory').textContent    = '—';
  document.getElementById('cmStatus').innerHTML        = '—';
  document.getElementById('cmArea').textContent        = '—';
  document.getElementById('cmStation').textContent     = '—';
  document.getElementById('cmDate').textContent        = '—';
  document.getElementById('cmCnic').textContent        = '—';
  document.getElementById('cmDescription').textContent = '—';
  document.getElementById('cmTimeline').innerHTML      = '<p class="tl-empty">Loading…</p>';

  try {
    const res  = await fetch(`../php/ioGetCaseDetail.php?id=${complaintId}`);
    const data = await res.json();
    if (!data.success) {
      document.getElementById('cmRef').textContent = data.message || 'Failed to load case.';
      return;
    }
    const c = data.case;
    document.getElementById('cmRef').textContent         = c.reference_number || '—';
    document.getElementById('cmCategory').textContent    = c.category_name    || '—';
    document.getElementById('cmStatus').innerHTML        = statusBadge(c.status);
    document.getElementById('cmArea').textContent        = c.incident_area    || '—';
    document.getElementById('cmStation').textContent     = c.station_name     || '—';
    document.getElementById('cmDate').textContent        = formatDate(c.incident_date);
    document.getElementById('cmCnic').textContent        = c.cnic             || '—';
    document.getElementById('cmDescription').textContent = c.description      || 'No description provided.';

    const tlEl = document.getElementById('cmTimeline');
    if (data.updates && data.updates.length) {
      tlEl.innerHTML = data.updates.map((u, i, arr) => `
        <div class="tl-item">
          <div class="tl-dot ${i === arr.length - 1 ? 'current' : 'done'}"></div>
          <div>
            <div class="tl-status">${u.status}</div>
            ${u.note ? `<div class="tl-note">${u.note}</div>` : ''}
            <div class="tl-meta">${u.updated_by} · ${formatDate(u.updated_at)}</div>
          </div>
        </div>
      `).join('');
    } else {
      tlEl.innerHTML = '<p class="tl-empty">No updates yet.</p>';
    }
  } catch {
    document.getElementById('cmRef').textContent = 'Failed to load case.';
  }
}

document.getElementById('closeCaseModal').addEventListener('click', () => {
  document.getElementById('caseModal').classList.remove('open');
});
document.getElementById('caseModal').addEventListener('click', function(e) {
  if (e.target === this) this.classList.remove('open');
});

// ══════════════════════════════════════════════════════════
// ── QUICK UPDATE MODAL (from Cases page) ─────────────────
// ══════════════════════════════════════════════════════════

let _updateComplaintId = null;

function openUpdateModal(complaintId, refNumber, currentStatus) {
  _updateComplaintId = complaintId;
  document.getElementById('umRef').textContent   = refNumber;
  document.getElementById('umCurrent').innerHTML = statusBadge(currentStatus);
  document.getElementById('umStatus').value      = '';
  document.getElementById('umNote').value        = '';
  clearAlert('umAlert');
  document.getElementById('updateModal').classList.add('open');
}

document.getElementById('closeUpdateModal').addEventListener('click', () => {
  document.getElementById('updateModal').classList.remove('open');
});
document.getElementById('updateModal').addEventListener('click', function(e) {
  if (e.target === this) this.classList.remove('open');
});

document.getElementById('submitUpdateBtn').addEventListener('click', async function () {
  clearAlert('umAlert');
  const status = document.getElementById('umStatus').value;
  const note   = document.getElementById('umNote').value.trim();

  if (!status) {
    showAlert('umAlert', 'error', 'Please select a new status.');
    return;
  }

  this.disabled    = true;
  this.textContent = 'Submitting…';

  try {
    const res  = await fetch('../php/ioCaseUpdate.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ complaint_id: _updateComplaintId, status, note }),
    });
    const data = await res.json();

    if (data.success) {
      document.getElementById('updateModal').classList.remove('open');
      await loadCases();
      await loadStats();
    } else {
      showAlert('umAlert', 'error', data.message || 'Failed to update case.');
    }
  } catch {
    showAlert('umAlert', 'error', 'Connection error. Please try again.');
  } finally {
    this.disabled    = false;
    this.textContent = 'Submit Update';
  }
});

// ══════════════════════════════════════════════════════════
// ── PAGE NAVIGATION ───────────────────────────────────────
// ══════════════════════════════════════════════════════════

function setupNav() {
  const pageMap  = {
    cases:   'page-cases',
    updates: 'page-updates',
    profile: 'page-profile',
  };
  const titleMap = {
    cases:   { title: 'My Assigned Cases', sub: 'Cases assigned to you for investigation at your station' },
    updates: { title: 'Case Updates',       sub: 'Submit and track updates on your assigned cases' },
    profile: { title: 'My Profile',         sub: 'View your account details' },
  };

  function switchPage(key) {
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item[data-page]').forEach(n => n.classList.remove('active'));
    const section = document.getElementById(pageMap[key]);
    if (section) section.classList.add('active');
    document.querySelectorAll(`[data-page="${key}"]`).forEach(n => n.classList.add('active'));
    const info = titleMap[key] || { title: key, sub: '' };
    document.getElementById('pageTitle').textContent    = info.title;
    document.getElementById('pageSubtitle').textContent = info.sub;
  }

  document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      const key = el.getAttribute('data-page');
      if (pageMap[key]) switchPage(key);
    });
  });

  document.getElementById('logoutBtn')?.addEventListener('click', e => {
    e.preventDefault();
    fetch('../php/officerLogout.php').finally(() => {
      window.location.href = 'officerLogin.html';
    });
  });
}

function setupProfileActions() {
  const btn = document.getElementById('ioChangePwdBtn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const msg = document.getElementById('ioPwdMsg');
    const current_password = document.getElementById('ioCurrentPwd').value;
    const new_password = document.getElementById('ioNewPwd').value;
    const confirm_password = document.getElementById('ioConfirmPwd').value;
    msg.style.color = 'var(--muted)';
    msg.textContent = 'Updating...';
    try {
      const res = await fetch('../php/officerChangePassword.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password, new_password, confirm_password }),
      });
      const data = await res.json();
      msg.style.color = data.success ? 'var(--success)' : 'var(--danger)';
      msg.textContent = data.message || (data.success ? 'Password updated.' : 'Failed to update password.');
      if (data.success) {
        document.getElementById('ioCurrentPwd').value = '';
        document.getElementById('ioNewPwd').value = '';
        document.getElementById('ioConfirmPwd').value = '';
      }
    } catch {
      msg.style.color = 'var(--danger)';
      msg.textContent = 'Connection error. Please try again.';
    }
  });
}

// ── INIT ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await checkSession();
  setDate();
  await loadProfile();
  await loadStats();
  await loadCases();
  setupCasesFilters();
  setupUpdatesFilters();
  setupNav();
  setupProfileActions();
});