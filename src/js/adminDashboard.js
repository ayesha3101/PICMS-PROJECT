// adminDashboard.js
// Session guard, sidebar navigation, topbar date,
// dummy stat cards and table data for layout preview.
// Real data fetching will be wired in next phase.

/* ══════════════════════════
   SESSION GUARD
══════════════════════════ */
async function checkSession() {
  try {
    const res  = await fetch('../php/adminCheckSession.php');
    const data = await res.json();
    if (!data.valid) {
      window.location.href = 'adminLogin.html';
    } else {
      document.getElementById('adminName').textContent  = data.name  || 'Admin';
      document.getElementById('adminBadge').textContent = data.badge || '';
      // set avatar initial
      const initial = (data.name || 'A')[0].toUpperCase();
      document.querySelector('.admin-avatar').textContent = initial;
    }
  } catch {
    window.location.href = 'adminLogin.html';
  }
}
checkSession();

/* ══════════════════════════
   TOPBAR DATE
══════════════════════════ */
function setDate() {
  const now = new Date();
  const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('topbarDate').textContent = now.toLocaleDateString('en-PK', opts);
}
setDate();

/* ══════════════════════════
   SIDEBAR NAVIGATION
══════════════════════════ */
const pageTitles = {
  dashboard:      ['Dashboard',                 'System overview and quick actions'],
  officers:       ['Officers',                  'Manage all officers across stations'],
  stations:       ['Stations',                  'Karachi police station directory'],
  sho:            ['SHO Appointments',          'Appoint and manage Station House Officers'],
  superintendent: ['Superintendent Appointments','Appoint and manage Jail Superintendents'],
  complaints:     ['All Complaints',            'System-wide complaint management'],
  logs:           ['Activity Logs',             'Full audit trail of admin actions'],
};

function navigateTo(page) {
  // update nav items
  document.querySelectorAll('.nav-item[data-page]').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  // update page sections
  document.querySelectorAll('.page-section').forEach(el => {
    el.classList.toggle('active', el.id === `page-${page}`);
  });

  // update topbar title
  const [title, subtitle] = pageTitles[page] || ['Dashboard', ''];
  document.getElementById('pageTitle').textContent    = title;
  document.getElementById('pageSubtitle').innerHTML   =
    `Welcome back, <span id="adminName">${document.getElementById('adminName')?.textContent || 'Admin'}</span>`;

  // on mobile close sidebar
  document.getElementById('sidebar').classList.remove('open');
}

document.querySelectorAll('.nav-item[data-page]').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    navigateTo(el.dataset.page);
  });
});

// quick action buttons also navigate
document.querySelectorAll('.qa-btn[data-page]').forEach(el => {
  el.addEventListener('click', () => navigateTo(el.dataset.page));
});

/* ── Sidebar toggle (mobile) ── */
document.getElementById('sidebarToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

/* ══════════════════════════
   LOGOUT
══════════════════════════ */
document.getElementById('logoutBtn').addEventListener('click', async e => {
  e.preventDefault();
  try {
    await fetch('../php/adminLogout.php', { method: 'POST' });
  } finally {
    window.location.href = 'adminLogin.html';
  }
});

/* ══════════════════════════
   DUMMY DATA — stat cards
   Replace with real fetch calls in next phase
══════════════════════════ */
function loadDummyStats() {
  document.getElementById('statOfficers').textContent  = '47';
  document.getElementById('statComplaints').textContent = '134';
  document.getElementById('statResolved').textContent  = '28';
  document.getElementById('statUrgent').textContent    = '9';
}
loadDummyStats();

/* ══════════════════════════
   DUMMY DATA — complaints table
══════════════════════════ */
const dummyComplaints = [
  { ref: 'KHI-25-00142', category: 'Theft',            station: 'Clifton',         status: 'Accepted',    priority: 'Normal' },
  { ref: 'KHI-25-00139', category: 'Domestic Violence',station: 'Saddar',          status: 'Ongoing',     priority: 'Urgent' },
  { ref: 'KHI-25-00135', category: 'Fraud',            station: 'DHA',             status: 'Submitted',   priority: 'Normal' },
  { ref: 'KHI-25-00130', category: 'Missing Person',   station: 'Gulshan-e-Iqbal', status: 'Assigned',    priority: 'Urgent' },
  { ref: 'KHI-25-00128', category: 'Harassment',       station: 'Korangi',         status: 'Resolved',    priority: 'Normal' },
];

function statusBadge(status) {
  const map = {
    'Submitted': 'badge-submitted', 'Accepted': 'badge-accepted',
    'Rejected':  'badge-rejected',  'Assigned': 'badge-assigned',
    'Ongoing':   'badge-ongoing',   'Resolved': 'badge-resolved',
  };
  return `<span class="badge ${map[status] || 'badge-submitted'}">${status}</span>`;
}

function priorityBadge(p) {
  return p === 'Urgent'
    ? `<span class="badge badge-urgent">Urgent</span>`
    : `<span class="badge badge-normal">Normal</span>`;
}

function loadDummyComplaints() {
  const tbody = document.getElementById('complaintsTbody');
  tbody.innerHTML = dummyComplaints.map(c => `
    <tr>
      <td style="font-family:monospace;font-size:12px;color:var(--gold-dim)">${c.ref}</td>
      <td>${c.category}</td>
      <td style="color:var(--muted)">${c.station}</td>
      <td>${statusBadge(c.status)}</td>
      <td>${priorityBadge(c.priority)}</td>
    </tr>
  `).join('');
}
loadDummyComplaints();

/* ══════════════════════════
   DUMMY DATA — stations list
══════════════════════════ */
const dummyStations = [
  { name: 'Clifton Police Station',         area: 'Clifton' },
  { name: 'Defence Police Station',         area: 'DHA' },
  { name: 'Gulshan-e-Iqbal Police Station', area: 'Gulshan-e-Iqbal' },
  { name: 'Saddar Police Station',          area: 'Saddar' },
  { name: 'Korangi Police Station',         area: 'Korangi' },
];

function loadDummyStations() {
  const list = document.getElementById('stationList');
  list.innerHTML = dummyStations.map(s => `
    <div class="station-row">
      <span class="station-name">${s.name}</span>
      <span class="station-area">${s.area}</span>
    </div>
  `).join('') + `<p style="font-size:11px;color:var(--muted);text-align:center;margin-top:8px">+ 10 more stations</p>`;
}
loadDummyStations();