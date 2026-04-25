// officerDashboard.js — Investigating Officer Dashboard

// ── HELPERS 
function formatDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
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
  const cls = map[status] || 'b-submitted';
  return `<span class="badge ${cls}">${status}</span>`;
}

// ── TOPBAR DATE ───────────────────────────────────────────
function setDate() {
  const el = document.getElementById('topbarDate');
  if (!el) return;
  el.textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

// ── LOAD PROFILE (name, badge, rank, station) ─────────────
async function loadProfile() {
  try {
    const res  = await fetch('../php/ioGetProfile.php');
    const data = await res.json();
    if (!data.success) return;

    // Sidebar chip
    document.getElementById('offName').textContent     = data.full_name     || '—';
    document.getElementById('offBadge').textContent    = data.badge_number  || '—';
    document.getElementById('offInitials').textContent = (data.full_name || 'O').charAt(0).toUpperCase();

    // Profile page
    document.getElementById('pAvatarLg').textContent   = (data.full_name || 'O').charAt(0).toUpperCase();
    document.getElementById('pFullName').textContent   = data.full_name    || '—';
    document.getElementById('pBadgeSub').textContent   = `${data.rank || ''} · ${data.badge_number || ''}`;
    document.getElementById('pName').textContent       = data.full_name    || '—';
    document.getElementById('pBadge').textContent      = data.badge_number || '—';
    document.getElementById('pRank').textContent       = data.rank         || '—';
    document.getElementById('pStation').textContent    = data.station_name || '—';
    document.getElementById('pEmail').textContent      = data.email        || '—';

  } catch (e) {
    console.error('Profile load error:', e);
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
    console.error('Stats error:', e);
  }
}

// ── LOAD ALL CASES (cases table) ──────────────────────────
let allCases = [];

async function loadCases() {
  const tbody = document.getElementById('casesTbody');
  try {
    const res  = await fetch('../php/ioGetCases.php');
    const data = await res.json();

    if (!data.success || !data.cases.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-row">No cases assigned yet.</td></tr>';
      allCases = [];
      return;
    }

    allCases = data.cases;
    renderCases(allCases);
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-row">Failed to load cases.</td></tr>';
  }
}

function renderCases(cases) {
  const tbody = document.getElementById('casesTbody');
  if (!cases.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-row">No cases found.</td></tr>';
    return;
  }

  tbody.innerHTML = cases.map(c => `
    <tr>
      <td>${c.reference_number}</td>
      <td>${c.category_name}${c.is_urgent == 1 ? ' <span class="badge b-urgent">Urgent</span>' : ''}</td>
      <td>${c.incident_area || '—'}</td>
      <td>${c.station_name || '—'}</td>
      <td>${statusBadge(c.status)}</td>
      <td>${c.is_urgent == 1 ? '<span class="badge b-urgent">Urgent</span>' : '<span class="badge b-submitted">Normal</span>'}</td>
      <td>${formatDate(c.assigned_at)}</td>
      <td>
        <button class="btn btn-steel btn-sm" onclick="openCaseModal(${c.complaint_id})">
          <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          View
        </button>
      </td>
    </tr>
  `).join('');
}

// ── FILTERS ───────────────────────────────────────────────
function setupFilters() {
  document.getElementById('filterCaseStatus').addEventListener('change', applyFilters);
  document.getElementById('searchCase').addEventListener('input', applyFilters);
}

function applyFilters() {
  const status = document.getElementById('filterCaseStatus').value;
  const search = document.getElementById('searchCase').value.trim().toLowerCase();

  let filtered = allCases;

  if (status) {
    filtered = filtered.filter(c => c.status === status);
  }
  if (search) {
    filtered = filtered.filter(c =>
      c.reference_number.toLowerCase().includes(search) ||
      (c.incident_area || '').toLowerCase().includes(search)
    );
  }

  renderCases(filtered);
}

// ── CASE DETAIL MODAL ─────────────────────────────────────
async function openCaseModal(complaintId) {
  document.getElementById('caseModal').classList.add('open');
  document.getElementById('cmRef').textContent      = 'Loading…';
  document.getElementById('cmCategory').textContent = '—';
  document.getElementById('cmStatus').textContent   = '—';
  document.getElementById('cmArea').textContent     = '—';
  document.getElementById('cmStation').textContent  = '—';
  document.getElementById('cmDate').textContent     = '—';
  document.getElementById('cmCnic').textContent     = '—';
  document.getElementById('cmDescription').textContent = '—';
  document.getElementById('cmTimeline').innerHTML   = '<p style="font-size:12px;color:var(--muted);">Loading…</p>';

  try {
    const res  = await fetch(`../php/ioGetCaseDetail.php?id=${complaintId}`);
    const data = await res.json();
    if (!data.success) return;

    const c = data.case;
    document.getElementById('cmRef').textContent         = c.reference_number || '—';
    document.getElementById('cmCategory').textContent    = c.category_name    || '—';
    document.getElementById('cmStatus').innerHTML        = statusBadge(c.status);
    document.getElementById('cmArea').textContent        = c.incident_area    || '—';
    document.getElementById('cmStation').textContent     = c.station_name     || '—';
    document.getElementById('cmDate').textContent        = formatDate(c.incident_date);
    document.getElementById('cmCnic').textContent        = c.cnic             || '—';
    document.getElementById('cmDescription').textContent = c.description      || 'No description provided.';

    // Timeline
    const timeline = document.getElementById('cmTimeline');
    if (data.updates && data.updates.length) {
      timeline.innerHTML = data.updates.map((u, i, arr) => `
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
      timeline.innerHTML = '<p style="font-size:12px;color:var(--muted);font-style:italic;">No updates yet.</p>';
    }

  } catch (e) {
    document.getElementById('cmRef').textContent = 'Failed to load case.';
  }
}

document.getElementById('closeCaseModal').addEventListener('click', () => {
  document.getElementById('caseModal').classList.remove('open');
});
document.getElementById('caseModal').addEventListener('click', function(e) {
  if (e.target === this) this.classList.remove('open');
});

// ── PAGE NAVIGATION ───────────────────────────────────────
function setupNav() {
  const pageMap = {
    cases:   'page-cases',
    profile: 'page-profile',
  };

  const titleMap = {
    cases:   { title: 'My Assigned Cases', sub: 'Cases assigned to you for investigation' },
    profile: { title: 'My Profile',        sub: 'View your account details' },
  };

  function switchPage(key) {
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

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

  // Logout
  document.getElementById('logoutBtn')?.addEventListener('click', e => {
    e.preventDefault();
    fetch('../php/officerLogout.php').finally(() => {
      window.location.href = 'officerLogin.html';
    });
  });
}

// ── INIT ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setDate();
  loadProfile();
  loadStats();
  loadCases();
  setupFilters();
  setupNav();
});