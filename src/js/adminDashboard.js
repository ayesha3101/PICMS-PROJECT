// adminDashboard.js — PICMS Admin Dashboard
// Session guard, topbar, sidebar nav, dashboard stats + recent data
// All data fetched from real PHP API endpoints.

/* ══════════════════════════
   SESSION GUARD
══════════════════════════ */
let adminName  = 'Admin';
let adminBadge = '';

async function checkSession() {
  try {
    const res  = await fetch('../php/adminCheckSession.php');
    const data = await res.json();
    if (!data.valid) {
      window.location.href = 'adminLogin.html';
      return;
    }
    adminName  = data.name  || 'Admin';
    adminBadge = data.badge || '';

    const initial = adminName[0].toUpperCase();
    // Topbar
    document.getElementById('adminNameTop').textContent  = adminName;
    document.getElementById('adminBadgeTop').textContent = adminBadge;
    document.getElementById('adminAvatarTop').textContent = initial;
    // Subtitle span (set once here; navigateTo will update it too)
    const sub = document.getElementById('adminName');
    if (sub) sub.textContent = adminName;
  } catch {
    window.location.href = 'adminLogin.html';
  }
}
checkSession();

/* ══════════════════════════
   TOPBAR DATE
══════════════════════════ */
(function setDate() {
  const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('topbarDate').textContent =
    new Date().toLocaleDateString('en-PK', opts);
})();

/* ══════════════════════════
   SIDEBAR NAVIGATION
══════════════════════════ */
const pageTitles = {
  dashboard:      'Dashboard',
  officers:       'Officers',
  stations:       'Stations',
  sho:            'SHO Management',
  superintendent: 'Superintendent Management',
  complaints:     'All Complaints',
  logs:           'Activity Logs',
  profile:        'My Profile',
};

function navigateTo(page) {
  document.querySelectorAll('.nav-item[data-page]').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
  document.querySelectorAll('.page-section').forEach(el => {
    el.classList.toggle('active', el.id === `page-${page}`);
  });

  document.getElementById('pageTitle').textContent = pageTitles[page] || 'Dashboard';
  const sub = document.getElementById('adminName');
  if (sub) sub.textContent = adminName;

  document.getElementById('sidebar').classList.remove('open');

  // trigger page initialisation
  if (typeof PAGE_INIT === 'object' && PAGE_INIT[page]) PAGE_INIT[page]();
}

document.querySelectorAll('.nav-item[data-page]').forEach(el => {
  el.addEventListener('click', e => { e.preventDefault(); navigateTo(el.dataset.page); });
});
document.querySelectorAll('.qa-btn[data-page], .dash-link[data-page]').forEach(el => {
  el.addEventListener('click', () => navigateTo(el.dataset.page));
});

/* ── Mobile sidebar toggle ── */
document.getElementById('sidebarToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

/* ══════════════════════════
   LOGOUT
══════════════════════════ */
document.getElementById('logoutBtn').addEventListener('click', async e => {
  e.preventDefault();
  try { await fetch('../php/adminLogout.php', { method: 'POST' }); } finally {
    window.location.href = 'adminLogin.html';
  }
});

/* ══════════════════════════
   SHARED HELPERS
══════════════════════════ */
function escHtml(str) {
  if (!str && str !== 0) return '—';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
}
function fmtDateTime(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-GB',{day:'numeric',month:'short'}) + ' · ' +
         dt.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
}

const STATUS_COLORS = {
  'Submitted':'badge-submitted','Under Review':'badge-ongoing','Accepted':'badge-accepted',
  'Rejected':'badge-rejected','Officer Assigned':'badge-assigned',
  'Investigation Ongoing':'badge-ongoing','Withdrawal Pending':'badge-submitted',
  'Withdrawn':'badge-normal','Resolved':'badge-resolved','Closed':'badge-normal',
};
function statusBadge(s) {
  return `<span class="badge ${STATUS_COLORS[s]||'badge-submitted'}">${escHtml(s)}</span>`;
}

/* ══════════════════════════
   DASHBOARD — real data
══════════════════════════ */
async function loadDashboard() {
  // ── Stats
  try {
    const res  = await fetch('../php/adminGetStats.php');
    const data = await res.json();
    if (data.success) {
      document.getElementById('statOfficers').textContent   = data.officers;
      document.getElementById('statComplaints').textContent = data.active_complaints;
      document.getElementById('statResolved').textContent   = data.resolved;
      document.getElementById('statUrgent').textContent     = data.urgent;
    }
  } catch { /* silently fail — numbers stay at — */ }

  // ── Recent complaints
  try {
    const res  = await fetch('../php/adminGetComplaints.php');
    const data = await res.json();
    const tbody = document.getElementById('complaintsTbody');
    if (!data.success || !data.complaints.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="table-empty">No complaints yet.</td></tr>';
    } else {
      const recent = data.complaints.slice(0, 5);
      tbody.innerHTML = recent.map(c => `
        <tr>
          <td style="font-family:monospace;font-size:11px;color:var(--gold-dim)">${escHtml(c.reference_number)}</td>
          <td>${escHtml(c.category_name)}</td>
          <td style="color:var(--muted)">${escHtml(c.station_name)}</td>
          <td>${statusBadge(c.status)}</td>
          <td>${c.is_urgent ? '<span class="badge badge-urgent">Urgent</span>' : '<span class="badge badge-normal">Normal</span>'}</td>
        </tr>`).join('');
    }
  } catch {
    document.getElementById('complaintsTbody').innerHTML =
      '<tr><td colspan="5" class="table-empty">Failed to load.</td></tr>';
  }

  // ── Stations sidebar list
  try {
    const res  = await fetch('../php/adminGetStations.php');
    const data = await res.json();
    const list = document.getElementById('stationList');
    if (data.success && data.stations.length) {
      const show = data.stations.slice(0, 5);
      list.innerHTML = show.map(s => `
        <div class="station-row">
          <span class="station-name">${escHtml(s.station_name)}</span>
          <span class="station-area">${escHtml(s.area_covered)}</span>
        </div>`).join('');
      if (data.stations.length > 5) {
        list.innerHTML += `<p style="font-size:11px;color:var(--muted);text-align:center;margin-top:8px">
          + ${data.stations.length - 5} more stations</p>`;
      }
    } else {
      list.innerHTML = '<p style="font-size:12px;color:var(--muted);padding:8px">No stations found.</p>';
    }
  } catch { /* silent */ }
}

loadDashboard();