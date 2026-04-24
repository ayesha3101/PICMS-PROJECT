// Investigating Officer Dashboard

// ── helpers 
function formatDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function statusBadge(status) {
  const map = {
    'Submitted':            'badge-submitted',
    'Under Review':         'badge-submitted',
    'Accepted':             'badge-accepted',
    'Rejected':             'badge-rejected',
    'Officer Assigned':     'badge-assigned',
    'Investigation Ongoing':'badge-ongoing',
    'Withdrawal Pending':   'badge-submitted',
    'Withdrawn':            'badge-rejected',
    'Resolved':             'badge-resolved',
    'Closed':               'badge-resolved',
  };
  const cls = map[status] || 'badge-submitted';
  return `<span class="badge ${cls}">${status}</span>`;
}

// ── topbar date ───────────────────────────────────────────
function setDate() {
  const el = document.getElementById('topbarDate');
  if (!el) return;
  el.textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

// ── session info ──────────────────────────────────────────
function loadSessionInfo() {
  const name  = sessionStorage.getItem('io_name')  || localStorage.getItem('io_name')  || 'Officer';
  const badge = sessionStorage.getItem('io_badge') || localStorage.getItem('io_badge') || '—';
  const rank  = sessionStorage.getItem('io_rank')  || localStorage.getItem('io_rank')  || '—';

  document.getElementById('officerNameTop').textContent  = name;
  document.getElementById('officerBadgeTop').textContent = badge;
  document.getElementById('officerRankTop').textContent  = rank;
  document.getElementById('officerAvatarTop').textContent = name.charAt(0).toUpperCase();

  document.getElementById('infoBadge').textContent = badge;
  document.getElementById('infoRank').textContent  = rank;
}

// ── stats ─────────────────────────────────────────────────
async function loadStats() {
  try {
    const res  = await fetch('../php/iogetstats.php');
    const data = await res.json();
    if (!data.success) return;

    document.getElementById('statTotal').textContent   = data.totalCases;
    document.getElementById('statActive').textContent  = data.activeCases;
    document.getElementById('statResolved').textContent = data.resolvedCases;
    document.getElementById('statPending').textContent = data.pendingUpdates;
  } catch (e) {
    console.error('Stats error:', e);
  }
}

// ── station name ──────────────────────────────────────────
async function loadStationName() {
  try {
    const res  = await fetch('../php/IOgetprofile.php');
    const data = await res.json();
    if (!data.success) return;

    const stationEl = document.getElementById('infoStation');
    if (stationEl) stationEl.textContent = data.station_name || '—';

    // Also cache name/badge/rank from server (more reliable than sessionStorage)
    document.getElementById('officerNameTop').textContent   = data.full_name  || '—';
    document.getElementById('officerBadgeTop').textContent  = data.badge_number || '—';
    document.getElementById('officerRankTop').textContent   = data.rank       || '—';
    document.getElementById('officerAvatarTop').textContent = (data.full_name || 'I').charAt(0).toUpperCase();
    document.getElementById('infoBadge').textContent        = data.badge_number || '—';
    document.getElementById('infoRank').textContent         = data.rank       || '—';
  } catch (e) {
    // ioGetProfile.php will be built next — silently fail for now
  }
}

// ── recent cases ──────────────────────────────────────────
async function loadRecentCases() {
  const tbody = document.getElementById('recentCasesTbody');
  try {
    const res  = await fetch('../php/iogetcases.php');
    const data = await res.json();

    if (!data.success || !data.cases.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="table-empty">No cases assigned yet.</td></tr>';
      return;
    }

    tbody.innerHTML = data.cases.map(c => `
      <tr>
        <td>${c.reference_number}</td>
        <td>${c.cnic}</td>
        <td>
          ${c.category_name}
          ${c.is_urgent == 1 ? '<span class="badge badge-urgent" style="margin-left:4px;">Urgent</span>' : ''}
        </td>
        <td>${statusBadge(c.status)}</td>
        <td>${formatDate(c.assigned_at)}</td>
      </tr>
    `).join('');
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="5" class="table-empty">Failed to load cases.</td></tr>';
  }
}

// ── page navigation ───────────────────────────────────────
function setupNav() {
  const pageMap = {
    dashboard:   'page-dashboard',
    myCases:     'page-myCases',
    caseUpdates: 'page-caseUpdates',
    profile:     'page-profile',
  };

  const titleMap = {
    dashboard:   { title: 'Dashboard',     sub: 'Overview of your assigned cases' },
    myCases:     { title: 'My Cases',      sub: 'All cases assigned to you' },
    caseUpdates: { title: 'Case Updates',  sub: 'Submit investigation updates' },
    profile:     { title: 'My Profile',    sub: 'View and manage your account' },
  };

  function switchPage(key) {
    // hide all sections
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const section = document.getElementById(pageMap[key]);
    if (section) section.classList.add('active');

    const navItems = document.querySelectorAll(`[data-page="${key}"]`);
    navItems.forEach(n => n.classList.add('active'));

    const info = titleMap[key] || { title: key, sub: '' };
    document.getElementById('pageTitle').textContent    = info.title;
    document.getElementById('pageSubtitle').innerHTML   =
      `Welcome back, <span id="officerNameTop">${document.getElementById('officerNameTop')?.textContent || 'Officer'}</span>`;

    if (key === 'dashboard') {
      // re-read name from DOM
      const name = document.getElementById('officerNameTop')?.textContent || 'Officer';
      document.getElementById('pageSubtitle').innerHTML = `Welcome back, <span>${name}</span>`;
    }
  }

  // nav clicks
  document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      const key = el.getAttribute('data-page');
      if (pageMap[key]) switchPage(key);
    });
  });

  // sidebar toggle (mobile)
  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });

  // logout
  function doLogout() {
    fetch('../php/officerLogout.php').finally(() => {
      window.location.href = 'officerLogin.html';
    });
  }
  document.getElementById('logoutBtn')?.addEventListener('click', e => { e.preventDefault(); doLogout(); });
  document.getElementById('qaLogout')?.addEventListener('click',  e => { e.preventDefault(); doLogout(); });
}

// ── init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setDate();
  loadSessionInfo();
  loadStationName();
  loadStats();
  loadRecentCases();
  setupNav();
});