// adminDashboardPages.js
// Handles: Officers, Stations, Complaints, SHO Management,
// Superintendent Management, Admin Profile pages

/* ══════════════════════════════════════
   SHARED CONSTANTS
══════════════════════════════════════ */
const ROLE_LABELS = { 1: 'Investigating Officer', 2: 'SHO', 3: 'Jail Superintendent' };
const RANK_COLORS = { Inspector: 'badge-assigned', DSP: 'badge-ongoing', SI: 'badge-submitted', ASI: 'badge-normal' };
const STATUS_COLORS = {
  'Submitted':             'badge-submitted',
  'Under Review':          'badge-ongoing',
  'Accepted':              'badge-accepted',
  'Rejected':              'badge-rejected',
  'Officer Assigned':      'badge-assigned',
  'Investigation Ongoing': 'badge-ongoing',
  'Withdrawal Pending':    'badge-submitted',
  'Withdrawn':             'badge-normal',
  'Resolved':              'badge-resolved',
  'Closed':                'badge-normal',
};

function statusBadge(s) {
  return `<span class="badge ${STATUS_COLORS[s] || 'badge-submitted'}">${escHtml(s)}</span>`;
}
function escHtml(str) {
  if (!str) return '—';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtDateTime(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' · ' +
         dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

/* alert box helper */
function showAlert(id, type, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `alert-box ${type}`;
  el.textContent = msg;
  el.style.display = 'block';
}
function hideAlert(id) {
  const el = document.getElementById(id);
  if (el) { el.style.display = 'none'; el.textContent = ''; }
}

/* ══════════════════════════════════════
   MOCK DATA
   Replace fetch() calls below with real
   API endpoints when PHP is wired up.
══════════════════════════════════════ */

const STATIONS_DATA = [
  { id:1,  name:'Clifton Police Station',          area:'Clifton',         address:'Clifton Block 2, Karachi',          phone:'021-35871234', sho:'Inspector Ahmed Raza',    superintendent:'DSP Tariq Mahmood', officerCount:12, caseCount:28 },
  { id:2,  name:'Defence Police Station',          area:'DHA',             address:'DHA Phase 4, Karachi',             phone:'021-35311234', sho:'SI Usman Khan',            superintendent:'SI Farida Bibi',    officerCount:9,  caseCount:19 },
  { id:3,  name:'Gulshan-e-Iqbal Police Station',  area:'Gulshan-e-Iqbal', address:'Block 3, Gulshan-e-Iqbal',         phone:'021-34821234', sho:'Inspector Nadia Saleem',   superintendent:'ASI Zubair Ali',    officerCount:11, caseCount:34 },
  { id:4,  name:'Saddar Police Station',           area:'Saddar',          address:'Saddar, Karachi',                  phone:'021-32211234', sho:'DSP Javed Iqbal',          superintendent:'SI Rehman Gul',     officerCount:15, caseCount:47 },
  { id:5,  name:'Korangi Police Station',          area:'Korangi',         address:'Korangi Industrial Area, Karachi', phone:'021-35121234', sho:null,                        superintendent:null,                officerCount:8,  caseCount:12 },
  { id:6,  name:'North Nazimabad Police Station',  area:'North Nazimabad', address:'Block H, North Nazimabad, Karachi',phone:'021-36611234', sho:'SI Asim Butt',             superintendent:'ASI Mehwish Ali',   officerCount:10, caseCount:22 },
  { id:7,  name:'Malir Police Station',            area:'Malir',           address:'Malir City, Karachi',              phone:'021-34511234', sho:'Inspector Rizwan Shah',     superintendent:null,                officerCount:7,  caseCount:18 },
  { id:8,  name:'Orangi Police Station',           area:'Orangi Town',     address:'Orangi Town, Karachi',             phone:'021-36811234', sho:'ASI Khalid Mehmood',       superintendent:'SI Rubina Khan',    officerCount:9,  caseCount:31 },
  { id:9,  name:'Landhi Police Station',           area:'Landhi',          address:'Landhi, Karachi',                  phone:'021-35051234', sho:null,                        superintendent:'ASI Farhan Syed',   officerCount:6,  caseCount:14 },
  { id:10, name:'Baldia Police Station',           area:'Baldia Town',     address:'Baldia Town, Karachi',             phone:'021-32551234', sho:'SI Naeem Baig',            superintendent:null,                officerCount:8,  caseCount:9  },
  { id:11, name:'SITE Police Station',             area:'SITE',            address:'SITE Area, Karachi',               phone:'021-32571234', sho:'Inspector Saima Mirza',     superintendent:'SI Irfan Ansari',   officerCount:10, caseCount:25 },
  { id:12, name:'Lyari Police Station',            area:'Lyari',           address:'Lyari, Karachi',                   phone:'021-32231234', sho:'DSP Waseem Akram',         superintendent:'SI Hina Qureshi',   officerCount:14, caseCount:41 },
  { id:13, name:'Kemari Police Station',           area:'Kemari',          address:'Kemari, Karachi',                  phone:'021-32851234', sho:null,                        superintendent:null,                officerCount:5,  caseCount:8  },
  { id:14, name:'Garden Police Station',           area:'Garden',          address:'Garden Road, Karachi',             phone:'021-99214000', sho:'Inspector Bilal Hassan',    superintendent:'DSP Shazia Nawaz',  officerCount:12, caseCount:36 },
  { id:15, name:'Frere Police Station',            area:'Frere Town',      address:'Frere Town, Karachi',              phone:'021-35221234', sho:'SI Aamir Zulfiqar',        superintendent:'ASI Zafar Ullah',   officerCount:7,  caseCount:16 },
];

const OFFICERS_DATA = [
  { id:1,  name:'Ahmed Raza',      badge:'KHI-2023-001', email:'ahmed.raza@police.gov',      rank:'Inspector', role_id:2, role:'SHO',                    station:'Clifton',          station_id:1,  active_caseload:0,  is_active:1 },
  { id:2,  name:'Usman Khan',      badge:'KHI-2023-002', email:'usman.khan@police.gov',       rank:'SI',        role_id:2, role:'SHO',                    station:'DHA',              station_id:2,  active_caseload:0,  is_active:1 },
  { id:3,  name:'Nadia Saleem',    badge:'KHI-2022-011', email:'nadia.saleem@police.gov',     rank:'Inspector', role_id:2, role:'SHO',                    station:'Gulshan-e-Iqbal',  station_id:3,  active_caseload:0,  is_active:1 },
  { id:4,  name:'Javed Iqbal',     badge:'KHI-2021-003', email:'javed.iqbal@police.gov',      rank:'DSP',       role_id:2, role:'SHO',                    station:'Saddar',           station_id:4,  active_caseload:0,  is_active:1 },
  { id:5,  name:'Asim Butt',       badge:'KHI-2024-007', email:'asim.butt@police.gov',        rank:'SI',        role_id:2, role:'SHO',                    station:'North Nazimabad',  station_id:6,  active_caseload:0,  is_active:1 },
  { id:6,  name:'Tariq Mahmood',   badge:'KHI-2020-005', email:'tariq.mahmood@police.gov',    rank:'DSP',       role_id:3, role:'Jail Superintendent',     station:'Clifton',          station_id:1,  active_caseload:0,  is_active:1 },
  { id:7,  name:'Farida Bibi',     badge:'KHI-2023-014', email:'farida.bibi@police.gov',      rank:'SI',        role_id:3, role:'Jail Superintendent',     station:'DHA',              station_id:2,  active_caseload:0,  is_active:1 },
  { id:8,  name:'Rizwan Shah',     badge:'KHI-2022-009', email:'rizwan.shah@police.gov',      rank:'Inspector', role_id:2, role:'SHO',                    station:'Malir',            station_id:7,  active_caseload:0,  is_active:1 },
  { id:9,  name:'Bilal Hassan',    badge:'KHI-2023-016', email:'bilal.hassan@police.gov',     rank:'Inspector', role_id:2, role:'SHO',                    station:'Garden',           station_id:14, active_caseload:0,  is_active:1 },
  { id:10, name:'Farrukh Ali',     badge:'KHI-2024-021', email:'farrukh.ali@police.gov',      rank:'ASI',       role_id:1, role:'Investigating Officer',   station:'Saddar',           station_id:4,  active_caseload:4,  is_active:1 },
  { id:11, name:'Sana Rehman',     badge:'KHI-2024-022', email:'sana.rehman@police.gov',      rank:'SI',        role_id:1, role:'Investigating Officer',   station:'Clifton',          station_id:1,  active_caseload:6,  is_active:1 },
  { id:12, name:'Malik Ghulam',    badge:'KHI-2023-018', email:'malik.ghulam@police.gov',     rank:'Inspector', role_id:1, role:'Investigating Officer',   station:'Lyari',            station_id:12, active_caseload:8,  is_active:1 },
  { id:13, name:'Hina Qureshi',    badge:'KHI-2024-031', email:'hina.qureshi@police.gov',     rank:'SI',        role_id:3, role:'Jail Superintendent',     station:'Lyari',            station_id:12, active_caseload:0,  is_active:1 },
  { id:14, name:'Irfan Ansari',    badge:'KHI-2023-025', email:'irfan.ansari@police.gov',     rank:'SI',        role_id:3, role:'Jail Superintendent',     station:'SITE',             station_id:11, active_caseload:0,  is_active:1 },
  { id:15, name:'Zafar Ullah',     badge:'KHI-2025-001', email:'zafar.ullah@police.gov',      rank:'ASI',       role_id:3, role:'Jail Superintendent',     station:'Frere Town',       station_id:15, active_caseload:0,  is_active:1 },
  { id:16, name:'Rubina Khan',     badge:'KHI-2023-030', email:'rubina.khan@police.gov',      rank:'SI',        role_id:3, role:'Jail Superintendent',     station:'Orangi Town',      station_id:8,  active_caseload:0,  is_active:1 },
  { id:17, name:'Shazia Nawaz',    badge:'KHI-2021-008', email:'shazia.nawaz@police.gov',     rank:'DSP',       role_id:3, role:'Jail Superintendent',     station:'Garden',           station_id:14, active_caseload:0,  is_active:1 },
  { id:18, name:'Omar Farooq',     badge:'KHI-2025-004', email:'omar.farooq@police.gov',      rank:'ASI',       role_id:1, role:'Investigating Officer',   station:'Korangi',          station_id:5,  active_caseload:3,  is_active:1 },
  { id:19, name:'Sara Malik',      badge:'KHI-2024-040', email:'sara.malik@police.gov',       rank:'SI',        role_id:1, role:'Investigating Officer',   station:'Gulshan-e-Iqbal',  station_id:3,  active_caseload:5,  is_active:1 },
  { id:20, name:'Adnan Siddiqui',  badge:'KHI-2019-002', email:'adnan.siddiqui@police.gov',   rank:'DSP',       role_id:1, role:'Investigating Officer',   station:'Saddar',           station_id:4,  active_caseload:9,  is_active:0 },
];

const COMPLAINTS_DATA = [
  { id:1,  ref:'KHI-25-00142', category:'Theft',            category_id:1, station:'Clifton',           station_id:1,  cnic:'42101-1234567-1', status:'Accepted',              urgent:0, incident_date:'2025-04-10', submitted_at:'2025-04-10T09:24:00', description:'My mobile phone was snatched near Sea View by two individuals on a motorcycle.', officer:'Farrukh Ali', timeline:[{status:'Submitted',note:'Complaint submitted by citizen',updated_by:'System',updated_at:'2025-04-10T09:24:00'},{status:'Under Review',note:'Assigned to SHO for review',updated_by:'SHO Ahmed Raza',updated_at:'2025-04-10T11:00:00'},{status:'Accepted',note:'Complaint accepted',updated_by:'SHO Ahmed Raza',updated_at:'2025-04-11T08:30:00'}]},
  { id:2,  ref:'KHI-25-00139', category:'Domestic Violence', category_id:4, station:'Saddar',            station_id:4,  cnic:'42201-9876543-2', status:'Investigation Ongoing',  urgent:1, incident_date:'2025-04-08', submitted_at:'2025-04-08T14:55:00', description:'Repeated physical abuse by spouse over a period of 3 months.', officer:'Adnan Siddiqui', timeline:[{status:'Submitted',note:'Complaint submitted',updated_by:'System',updated_at:'2025-04-08T14:55:00'},{status:'Under Review',note:'Escalated due to urgency',updated_by:'System',updated_at:'2025-04-08T15:00:00'},{status:'Accepted',note:'Accepted by SHO',updated_by:'SHO Javed Iqbal',updated_at:'2025-04-09T09:00:00'},{status:'Officer Assigned',note:'Officer assigned for investigation',updated_by:'SHO Javed Iqbal',updated_at:'2025-04-09T12:00:00'},{status:'Investigation Ongoing',note:'Initial witness statements recorded',updated_by:'Adnan Siddiqui',updated_at:'2025-04-12T10:00:00'}]},
  { id:3,  ref:'KHI-25-00135', category:'Fraud',             category_id:2, station:'DHA',               station_id:2,  cnic:'42301-5551234-3', status:'Submitted',              urgent:0, incident_date:'2025-04-06', submitted_at:'2025-04-06T17:30:00', description:'Online investment scam. Transferred PKR 500,000 to a fraudulent trading platform.', officer:null, timeline:[{status:'Submitted',note:'Complaint submitted',updated_by:'System',updated_at:'2025-04-06T17:30:00'}]},
  { id:4,  ref:'KHI-25-00130', category:'Missing Person',    category_id:5, station:'Gulshan-e-Iqbal',   station_id:3,  cnic:'42401-7778899-4', status:'Officer Assigned',       urgent:1, incident_date:'2025-04-05', submitted_at:'2025-04-05T08:10:00', description:'13-year-old daughter missing since morning, last seen near school gate.', officer:'Sara Malik', timeline:[{status:'Submitted',note:'Complaint submitted',updated_by:'System',updated_at:'2025-04-05T08:10:00'},{status:'Accepted',note:'Urgent — accepted immediately',updated_by:'SHO Nadia Saleem',updated_at:'2025-04-05T08:30:00'},{status:'Officer Assigned',note:'Officer Sara Malik assigned',updated_by:'SHO Nadia Saleem',updated_at:'2025-04-05T09:00:00'}]},
  { id:5,  ref:'KHI-25-00128', category:'Harassment',        category_id:3, station:'Korangi',           station_id:5,  cnic:'42501-3334455-5', status:'Resolved',              urgent:0, incident_date:'2025-04-01', submitted_at:'2025-04-01T12:00:00', description:'Workplace harassment by supervisor over 6 months.', officer:'Omar Farooq', timeline:[{status:'Submitted',note:'Complaint submitted',updated_by:'System',updated_at:'2025-04-01T12:00:00'},{status:'Accepted',note:'Accepted',updated_by:'System',updated_at:'2025-04-02T09:00:00'},{status:'Resolved',note:'Matter resolved through mediation',updated_by:'Omar Farooq',updated_at:'2025-04-14T16:00:00'}]},
  { id:6,  ref:'KHI-25-00121', category:'Assault',           category_id:7, station:'Lyari',             station_id:12, cnic:'42601-2223344-6', status:'Under Review',           urgent:0, incident_date:'2025-03-28', submitted_at:'2025-03-28T22:15:00', description:'Physical assault outside a restaurant.', officer:null, timeline:[{status:'Submitted',note:'Complaint submitted',updated_by:'System',updated_at:'2025-03-28T22:15:00'},{status:'Under Review',note:'Under SHO review',updated_by:'SHO Waseem Akram',updated_at:'2025-03-29T09:00:00'}]},
  { id:7,  ref:'KHI-25-00115', category:'Kidnapping',        category_id:8, station:'Garden',            station_id:14, cnic:'42701-6667788-7', status:'Rejected',              urgent:1, incident_date:'2025-03-25', submitted_at:'2025-03-25T10:30:00', description:'Claim of kidnapping — insufficient evidence provided.', officer:null, timeline:[{status:'Submitted',note:'Complaint submitted',updated_by:'System',updated_at:'2025-03-25T10:30:00'},{status:'Rejected',note:'Insufficient evidence — complainant asked to provide more details',updated_by:'SHO Bilal Hassan',updated_at:'2025-03-26T14:00:00'}]},
  { id:8,  ref:'KHI-25-00109', category:'Theft',             category_id:1, station:'Saddar',            station_id:4,  cnic:'42801-9990011-8', status:'Closed',                urgent:0, incident_date:'2025-03-20', submitted_at:'2025-03-20T14:00:00', description:'Vehicle theft from outside residential building.', officer:'Farrukh Ali', timeline:[{status:'Submitted',note:'Complaint submitted',updated_by:'System',updated_at:'2025-03-20T14:00:00'},{status:'Accepted',note:'Accepted',updated_by:'SHO Javed Iqbal',updated_at:'2025-03-21T09:00:00'},{status:'Resolved',note:'Vehicle recovered',updated_by:'Farrukh Ali',updated_at:'2025-04-02T11:00:00'},{status:'Closed',note:'Case closed after resolution',updated_by:'SHO Javed Iqbal',updated_at:'2025-04-03T10:00:00'}]},
];

/* ══════════════════════════════════════
   NAVIGATION (extend existing)
══════════════════════════════════════ */
const PAGE_INIT = {
  officers:       initOfficersPage,
  stations:       initStationsPage,
  complaints:     initComplaintsPage,
  sho:            initSHOPage,
  superintendent: initSuperintendentPage,
  profile:        initProfilePage,
};

// Hook into existing navigateTo from adminDashboard.js
const _origNavigateTo = window.navigateTo || function(){};
window.navigateTo = function(page) {
  _origNavigateTo(page);
  if (PAGE_INIT[page]) PAGE_INIT[page]();
};

// Also handle sidebar clicks for pages not in original JS
document.querySelectorAll('.nav-item[data-page]').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    window.navigateTo(el.dataset.page);
  });
});
document.querySelectorAll('.qa-btn[data-page], .dash-link[data-page]').forEach(el => {
  el.addEventListener('click', () => window.navigateTo(el.dataset.page));
});

/* ══════════════════════════════════════
   OFFICERS PAGE
══════════════════════════════════════ */
let officersData = [];

function initOfficersPage() {
  if (officersData.length) { renderOfficers(officersData); return; }
  officersData = OFFICERS_DATA; // swap with fetch in production

  // populate station filter
  const stationSel = document.getElementById('filterOfficerStation');
  STATIONS_DATA.forEach(s => {
    const o = document.createElement('option');
    o.value = s.name; o.textContent = s.name;
    stationSel.appendChild(o);
  });

  // also populate add-officer station dropdown
  const addStn = document.getElementById('newOfficerStation');
  STATIONS_DATA.forEach(s => {
    const o = document.createElement('option');
    o.value = s.id; o.textContent = s.name;
    addStn.appendChild(o);
  });

  renderOfficers(officersData);
  wireOfficerFilters();
  wireOfficerDrawer();
  wireAddOfficerModal();
}

function renderOfficers(data) {
  const tbody = document.getElementById('officersTbody');
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="table-empty">No officers found.</td></tr>';
    return;
  }
  tbody.innerHTML = data.map(o => {
    const initials = o.name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
    const roleCls  = o.role_id === 2 ? 'role-sho' : o.role_id === 3 ? 'role-superintendent' : 'role-investigating';
    return `<tr data-officer-id="${o.id}">
      <td>
        <div class="officer-cell">
          <div class="officer-avatar-sm">${initials}</div>
          <div>
            <div class="officer-name">${escHtml(o.name)}</div>
            <div class="officer-email">${escHtml(o.email)}</div>
          </div>
        </div>
      </td>
      <td style="font-family:monospace;font-size:11px;color:var(--gold-dim)">${escHtml(o.badge)}</td>
      <td><span class="badge ${RANK_COLORS[o.rank] || 'badge-normal'}">${escHtml(o.rank)}</span></td>
      <td><span class="role-badge ${roleCls}">${escHtml(o.role)}</span></td>
      <td style="color:var(--muted);font-size:12px">${escHtml(o.station || '—')}</td>
      <td style="text-align:center;color:${o.active_caseload > 5 ? '#e88080':'var(--offwhite)'}">${o.active_caseload}</td>
      <td>${o.is_active ? '<span class="status-active">Active</span>' : '<span class="status-inactive">Inactive</span>'}</td>
      <td>
        <button class="tbl-action-btn view-officer-btn" data-id="${o.id}">View</button>
      </td>
    </tr>`;
  }).join('');
}

function wireOfficerFilters() {
  const filters = ['filterOfficerRank','filterOfficerStation','filterOfficerRole','filterOfficerSort','searchOfficer'];
  filters.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', applyOfficerFilters);
    if (id === 'searchOfficer' && el) el.addEventListener('input', applyOfficerFilters);
  });
}

function applyOfficerFilters() {
  const rank    = document.getElementById('filterOfficerRank').value;
  const station = document.getElementById('filterOfficerStation').value;
  const role    = document.getElementById('filterOfficerRole').value;
  const sort    = document.getElementById('filterOfficerSort').value;
  const search  = document.getElementById('searchOfficer').value.trim().toLowerCase();

  let filtered = officersData.filter(o => {
    if (rank    && o.rank    !== rank)           return false;
    if (station && o.station !== station)        return false;
    if (role    && String(o.role_id) !== role)   return false;
    if (search  && !o.name.toLowerCase().includes(search) && !o.badge.toLowerCase().includes(search)) return false;
    return true;
  });

  if (sort === 'alpha')         filtered.sort((a,b) => a.name.localeCompare(b.name));
  if (sort === 'alpha_desc')    filtered.sort((a,b) => b.name.localeCompare(a.name));
  if (sort === 'caseload_desc') filtered.sort((a,b) => b.active_caseload - a.active_caseload);
  if (sort === 'caseload_asc')  filtered.sort((a,b) => a.active_caseload - b.active_caseload);

  renderOfficers(filtered);
  wireOfficerDrawer();
}

function wireOfficerDrawer() {
  document.querySelectorAll('.view-officer-btn').forEach(btn => {
    btn.addEventListener('click', () => openOfficerDrawer(parseInt(btn.dataset.id)));
  });
}

function openOfficerDrawer(id) {
  const o = officersData.find(x => x.id === id);
  if (!o) return;

  document.getElementById('drawerOfficerName').textContent  = o.name;
  document.getElementById('drawerOfficerBadge').textContent = o.badge;
  document.getElementById('drawerRank').textContent         = o.rank;
  document.getElementById('drawerRole').textContent         = o.role;
  document.getElementById('drawerStation').textContent      = o.station || '—';
  document.getElementById('drawerEmail').textContent        = o.email;
  document.getElementById('drawerCaseload').textContent     = `${o.active_caseload} active cases`;
  document.getElementById('drawerStatus').innerHTML         = o.is_active
    ? '<span class="status-active">Active</span>'
    : '<span class="status-inactive">Inactive</span>';

  // cases (mock — filter complaints by officer name)
  const cases = COMPLAINTS_DATA.filter(c => c.officer === o.name);
  const casesList = document.getElementById('drawerCasesList');
  if (!cases.length) {
    casesList.innerHTML = '<p class="drawer-empty">No cases currently assigned.</p>';
  } else {
    casesList.innerHTML = cases.map(c => {
      const latestUpdate = c.timeline[c.timeline.length - 1];
      return `<div class="drawer-case-item">
        <div class="dci-ref">${escHtml(c.ref)}</div>
        <div class="dci-title">${escHtml(c.category)} — ${escHtml(c.station)}</div>
        <div class="dci-status">${statusBadge(c.status)}</div>
        ${latestUpdate ? `<div class="dci-update">${escHtml(latestUpdate.note)} · ${fmtDateTime(latestUpdate.updated_at)}</div>` : ''}
      </div>`;
    }).join('');
  }

  document.getElementById('officerDrawer').classList.add('open');
  document.getElementById('officerDrawerBackdrop').classList.add('visible');
}

function wireOfficerDrawer() {
  document.querySelectorAll('.view-officer-btn').forEach(btn => {
    btn.addEventListener('click', () => openOfficerDrawer(parseInt(btn.dataset.id)));
  });
}

document.getElementById('closeOfficerDrawer')?.addEventListener('click', closeOfficerDrawer);
document.getElementById('officerDrawerBackdrop')?.addEventListener('click', closeOfficerDrawer);

function closeOfficerDrawer() {
  document.getElementById('officerDrawer').classList.remove('open');
  document.getElementById('officerDrawerBackdrop').classList.remove('visible');
}

function wireAddOfficerModal() {
  document.getElementById('btnAddOfficer')?.addEventListener('click', () => {
    document.getElementById('addOfficerModal').classList.add('active');
    hideAlert('addOfficerAlert');
  });
  document.getElementById('closeAddOfficerModal')?.addEventListener('click', () => {
    document.getElementById('addOfficerModal').classList.remove('active');
  });
  document.getElementById('cancelAddOfficer')?.addEventListener('click', () => {
    document.getElementById('addOfficerModal').classList.remove('active');
  });
  document.getElementById('addOfficerModal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('addOfficerModal')) {
      document.getElementById('addOfficerModal').classList.remove('active');
    }
  });
  document.getElementById('submitAddOfficer')?.addEventListener('click', handleAddOfficer);
}

async function handleAddOfficer() {
  hideAlert('addOfficerAlert');
  const name    = document.getElementById('newOfficerName').value.trim();
  const badge   = document.getElementById('newOfficerBadge').value.trim();
  const email   = document.getElementById('newOfficerEmail').value.trim();
  const rank    = document.getElementById('newOfficerRank').value;
  const role    = document.getElementById('newOfficerRole').value;
  const station = document.getElementById('newOfficerStation').value;
  const pwd     = document.getElementById('newOfficerPwd').value;

  if (!name || !badge || !email || !rank || !role || !pwd) {
    showAlert('addOfficerAlert','error','Please fill in all required fields.'); return;
  }
  if (pwd.length < 8) {
    showAlert('addOfficerAlert','error','Password must be at least 8 characters.'); return;
  }

  const btn = document.getElementById('submitAddOfficer');
  btn.disabled = true; btn.textContent = 'Adding…';
  try {
    // Production: POST to addOfficer.php
    await new Promise(r => setTimeout(r, 800)); // mock delay
    showAlert('addOfficerAlert','success','Officer added successfully!');
    setTimeout(() => {
      document.getElementById('addOfficerModal').classList.remove('active');
      // In production, refresh the officers list from server
    }, 1200);
  } finally {
    btn.disabled = false; btn.textContent = 'Add Officer';
  }
}

/* ══════════════════════════════════════
   STATIONS PAGE
══════════════════════════════════════ */
function initStationsPage() {
  renderStations(STATIONS_DATA);
  document.getElementById('searchStation')?.addEventListener('input', function() {
    const q = this.value.trim().toLowerCase();
    const filtered = STATIONS_DATA.filter(s =>
      s.name.toLowerCase().includes(q) || s.area.toLowerCase().includes(q)
    );
    renderStations(filtered);
  });
  wireStationCards();
}

function renderStations(data) {
  const grid = document.getElementById('stationsGrid');
  if (!data.length) {
    grid.innerHTML = '<div class="table-empty" style="padding:40px;text-align:center;grid-column:1/-1;">No stations found.</div>';
    return;
  }
  grid.innerHTML = data.map(s => `
    <div class="station-card" data-station-id="${s.id}">
      <div class="station-card-header">
        <div>
          <div class="station-card-name">${escHtml(s.name)}</div>
          <div class="station-card-area">${escHtml(s.area)}</div>
        </div>
        <div class="station-card-icon">🏛</div>
      </div>
      <div class="station-stat-row">
        <div class="station-stat">
          <span class="station-stat-num">${s.officerCount}</span>
          <span class="station-stat-lbl">Officers</span>
        </div>
        <div class="station-stat">
          <span class="station-stat-num">${s.caseCount}</span>
          <span class="station-stat-lbl">Active Cases</span>
        </div>
      </div>
      <div class="station-sho-row">
        <span>SHO:</span>
        <span class="sho-name-sm">${s.sho ? escHtml(s.sho) : 'Not appointed'}</span>
      </div>
    </div>
  `).join('');
  wireStationCards();
}

function wireStationCards() {
  document.querySelectorAll('.station-card').forEach(card => {
    card.addEventListener('click', () => openStationModal(parseInt(card.dataset.stationId)));
  });
}

function openStationModal(id) {
  const s = STATIONS_DATA.find(x => x.id === id);
  if (!s) return;

  document.getElementById('stationModalArea').textContent = s.area;
  document.getElementById('stationModalName').textContent = s.name;
  document.getElementById('smAddress').textContent        = s.address;
  document.getElementById('smPhone').textContent          = s.phone;
  document.getElementById('smSHO').textContent            = s.sho || 'Not appointed';
  document.getElementById('smSuperintendent').textContent = s.superintendent || 'Not appointed';
  document.getElementById('smOfficerCount').textContent   = s.officerCount;
  document.getElementById('smCaseCount').textContent      = s.caseCount;

  // Officers at this station
  const officers = officersData.filter(o => o.station_id === id);
  const list = document.getElementById('smOfficerList');
  list.innerHTML = officers.length
    ? officers.map(o => `
        <div class="drawer-row">
          <span class="dr-key">${escHtml(o.name)}</span>
          <span class="dr-val" style="display:flex;gap:6px;align-items:center;">
            <span class="badge ${RANK_COLORS[o.rank]||'badge-normal'}">${escHtml(o.rank)}</span>
            <span class="role-badge ${o.role_id===2?'role-sho':o.role_id===3?'role-superintendent':'role-investigating'}">${escHtml(o.role)}</span>
          </span>
        </div>
      `).join('')
    : '<p class="drawer-empty">No officers assigned to this station.</p>';

  document.getElementById('stationModal').classList.add('active');
}

document.getElementById('closeStationModal')?.addEventListener('click', () => {
  document.getElementById('stationModal').classList.remove('active');
});
document.getElementById('stationModal')?.addEventListener('click', e => {
  if (e.target === document.getElementById('stationModal'))
    document.getElementById('stationModal').classList.remove('active');
});

/* ══════════════════════════════════════
   COMPLAINTS PAGE
══════════════════════════════════════ */
function initComplaintsPage() {
  // populate station filter
  const stSel = document.getElementById('filterComplaintStation');
  if (stSel.options.length < 2) {
    STATIONS_DATA.forEach(s => {
      const o = document.createElement('option');
      o.value = s.id; o.textContent = s.name;
      stSel.appendChild(o);
    });
  }
  renderComplaintsTable(COMPLAINTS_DATA);
  wireComplaintFilters();
}

function renderComplaintsTable(data) {
  const tbody = document.getElementById('complaintsTbodyFull');
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="table-empty">No complaints found.</td></tr>';
    return;
  }
  tbody.innerHTML = data.map(c => `
    <tr>
      <td style="font-family:monospace;font-size:11px;color:var(--gold-dim)">${escHtml(c.ref)}</td>
      <td>${escHtml(c.category)}</td>
      <td style="color:var(--muted);font-size:12px">${escHtml(c.station)}</td>
      <td style="font-family:monospace;font-size:11px;color:var(--muted)">${escHtml(c.cnic)}</td>
      <td>${statusBadge(c.status)}</td>
      <td>${c.urgent ? '<span class="urgency-badge urgency-urgent">⚑ Urgent</span>' : '<span class="urgency-badge urgency-normal">Normal</span>'}</td>
      <td style="color:var(--muted);font-size:12px">${formatDate(c.submitted_at)}</td>
      <td><button class="tbl-action-btn view-complaint-btn" data-id="${c.id}">View</button></td>
    </tr>
  `).join('');

  document.querySelectorAll('.view-complaint-btn').forEach(btn => {
    btn.addEventListener('click', () => openComplaintModal(parseInt(btn.dataset.id)));
  });
}

function wireComplaintFilters() {
  ['filterComplaintStation','filterComplaintStatus','filterComplaintCategory','filterComplaintUrgency','filterComplaintSort'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', applyComplaintFilters);
  });
  document.getElementById('searchComplaint')?.addEventListener('input', applyComplaintFilters);
}

function applyComplaintFilters() {
  const station  = document.getElementById('filterComplaintStation').value;
  const status   = document.getElementById('filterComplaintStatus').value;
  const category = document.getElementById('filterComplaintCategory').value;
  const urgency  = document.getElementById('filterComplaintUrgency').value;
  const sort     = document.getElementById('filterComplaintSort').value;
  const search   = document.getElementById('searchComplaint').value.trim().toLowerCase();

  let filtered = COMPLAINTS_DATA.filter(c => {
    if (station  && String(c.station_id)  !== station)  return false;
    if (status   && c.status             !== status)   return false;
    if (category && String(c.category_id) !== category) return false;
    if (urgency  && String(c.urgent)      !== urgency)  return false;
    if (search   && !c.ref.toLowerCase().includes(search) && !(c.incident_area||'').toLowerCase().includes(search)) return false;
    return true;
  });

  filtered.sort((a,b) => {
    const ta = new Date(a.submitted_at), tb = new Date(b.submitted_at);
    return sort === 'oldest' ? ta - tb : tb - ta;
  });

  renderComplaintsTable(filtered);
}

function openComplaintModal(id) {
  const c = COMPLAINTS_DATA.find(x => x.id === id);
  if (!c) return;

  document.getElementById('cmCategory').textContent  = c.category;
  document.getElementById('cmRef').textContent       = c.ref;
  document.getElementById('cmStatus').innerHTML      = statusBadge(c.status);
  document.getElementById('cmStation').textContent   = c.station;
  document.getElementById('cmArea').textContent      = c.incident_area || '—';
  document.getElementById('cmDate').textContent      = formatDate(c.incident_date);
  document.getElementById('cmSubmitted').textContent = fmtDateTime(c.submitted_at);
  document.getElementById('cmOfficer').textContent   = c.officer || 'Not yet assigned';
  document.getElementById('cmDescription').textContent = c.description;

  // timeline
  const tl = document.getElementById('cmTimeline');
  tl.innerHTML = c.timeline.map((u, i) => {
    const isLast = i === c.timeline.length - 1;
    return `<div class="cm-tl-item">
      <div class="cm-tl-dot ${isLast ? 'current' : 'done'}"></div>
      <div>
        <div class="cm-tl-status">${escHtml(u.status)}</div>
        ${u.note ? `<div class="cm-tl-note">${escHtml(u.note)}</div>` : ''}
        <div class="cm-tl-meta">${escHtml(u.updated_by)} · ${fmtDateTime(u.updated_at)}</div>
      </div>
    </div>`;
  }).join('');

  document.getElementById('complaintModal').classList.add('active');
}

document.getElementById('closeComplaintModal')?.addEventListener('click', () => {
  document.getElementById('complaintModal').classList.remove('active');
});
document.getElementById('complaintModal')?.addEventListener('click', e => {
  if (e.target === document.getElementById('complaintModal'))
    document.getElementById('complaintModal').classList.remove('active');
});

/* ══════════════════════════════════════
   SHO MANAGEMENT PAGE
══════════════════════════════════════ */
let shoActiveStation = null;

function initSHOPage() {
  renderSHOGrid();
}

function renderSHOGrid() {
  const grid = document.getElementById('shoGrid');
  grid.innerHTML = STATIONS_DATA.map(s => {
    const hasSHO = !!s.sho;
    return `<div class="sho-station-card">
      <div class="ssc-name">${escHtml(s.name)}</div>
      <div class="ssc-current">
        <div class="ssc-current-label">Current SHO</div>
        ${hasSHO
          ? `<div class="ssc-current-name">${escHtml(s.sho)}</div>`
          : `<div class="ssc-current-empty">No SHO appointed</div>`
        }
      </div>
      <button class="ssc-btn ${hasSHO ? 'has-sho' : ''}" data-station-id="${s.id}">
        ${hasSHO ? 'Manage SHO' : 'Appoint SHO'}
      </button>
    </div>`;
  }).join('');

  document.querySelectorAll('#shoGrid .ssc-btn').forEach(btn => {
    btn.addEventListener('click', () => openSHOModal(parseInt(btn.dataset.stationId)));
  });
}

function openSHOModal(stationId) {
  shoActiveStation = stationId;
  const s = STATIONS_DATA.find(x => x.id === stationId);
  if (!s) return;

  document.getElementById('shoModalStationName').textContent = s.name;
  hideAlert('shoModalAlert');
  document.getElementById('shoRemoveReason').value = '';

  // Current SHO display
  const curDisplay   = document.getElementById('shoCurrentDisplay');
  const removeSection = document.getElementById('shoRemoveSection');
  if (s.sho) {
    curDisplay.innerHTML = `
      <div class="drawer-row"><span class="dr-key">Name</span><span class="dr-val">${escHtml(s.sho)}</span></div>
      <div class="drawer-row"><span class="dr-key">Station</span><span class="dr-val">${escHtml(s.name)}</span></div>
    `;
    removeSection.style.display = 'block';
  } else {
    curDisplay.innerHTML = '<p class="drawer-empty">No SHO currently appointed.</p>';
    removeSection.style.display = 'none';
  }

  // Populate officer dropdown (eligible = active officers at or without a station)
  const sel = document.getElementById('shoOfficerSelect');
  sel.innerHTML = '<option value="">— Choose an officer —</option>';
  document.getElementById('shoOfficerPreview').style.display = 'none';

  const eligibleOfficers = officersData.filter(o =>
    o.is_active && o.role_id !== 2 // not already an SHO
  );
  eligibleOfficers.sort((a,b) => a.name.localeCompare(b.name));
  eligibleOfficers.forEach(o => {
    const opt = document.createElement('option');
    opt.value = o.id;
    opt.textContent = `${o.name} (${o.rank} · ${o.badge})`;
    sel.appendChild(opt);
  });

  document.getElementById('shoModal').classList.add('active');
}

// Preview selected officer
document.getElementById('shoOfficerSelect')?.addEventListener('change', function() {
  const id = parseInt(this.value);
  const preview = document.getElementById('shoOfficerPreview');
  if (!id) { preview.style.display = 'none'; return; }
  const o = officersData.find(x => x.id === id);
  if (!o) return;
  document.getElementById('previewRank').textContent  = o.rank;
  document.getElementById('previewRole').textContent  = o.role;
  document.getElementById('previewCases').textContent = o.active_caseload;
  preview.style.display = 'block';
});

document.getElementById('btnAppointSHO')?.addEventListener('click', async function() {
  hideAlert('shoModalAlert');
  const officerId = parseInt(document.getElementById('shoOfficerSelect').value);
  if (!officerId) { showAlert('shoModalAlert','error','Please select an officer.'); return; }

  this.disabled = true; this.textContent = 'Appointing…';
  try {
    // Production: POST to appointSHO.php
    await new Promise(r => setTimeout(r, 700));
    const s = STATIONS_DATA.find(x => x.id === shoActiveStation);
    const o = officersData.find(x => x.id === officerId);
    if (s && o) { s.sho = o.name; o.role_id = 2; o.role = 'SHO'; o.station_id = s.id; o.station = s.name; }
    showAlert('shoModalAlert','success',`${o?.name} appointed as SHO.`);
    renderSHOGrid();
    setTimeout(() => {
      document.getElementById('shoModal').classList.remove('active');
      renderOfficers(officersData);
    }, 1200);
  } finally {
    this.disabled = false; this.textContent = 'Appoint as SHO';
  }
});

document.getElementById('btnRemoveSHO')?.addEventListener('click', async function() {
  hideAlert('shoModalAlert');
  const removeType = document.querySelector('input[name="removeType"]:checked')?.value;
  const reason     = document.getElementById('shoRemoveReason').value.trim();

  this.disabled = true; this.textContent = 'Removing…';
  try {
    await new Promise(r => setTimeout(r, 700));
    const s = STATIONS_DATA.find(x => x.id === shoActiveStation);
    if (s) {
      const o = officersData.find(x => x.name === s.sho);
      if (o) {
        if (removeType === 'duty') {
          o.is_active = 0;
          o.role = 'Investigating Officer'; o.role_id = 1;
        } else {
          o.role = 'Investigating Officer'; o.role_id = 1;
        }
      }
      s.sho = null;
    }
    showAlert('shoModalAlert','success','SHO removed successfully.');
    renderSHOGrid();
    setTimeout(() => {
      document.getElementById('shoModal').classList.remove('active');
      renderOfficers(officersData);
    }, 1200);
  } finally {
    this.disabled = false; this.textContent = 'Remove SHO';
  }
});

document.getElementById('closeShoModal')?.addEventListener('click', () => {
  document.getElementById('shoModal').classList.remove('active');
});
document.getElementById('shoModal')?.addEventListener('click', e => {
  if (e.target === document.getElementById('shoModal'))
    document.getElementById('shoModal').classList.remove('active');
});

/* ══════════════════════════════════════
   SUPERINTENDENT PAGE
══════════════════════════════════════ */
let suptActiveStation = null;

function initSuperintendentPage() {
  renderSuptGrid();
}

function renderSuptGrid() {
  const grid = document.getElementById('superintendentGrid');
  grid.innerHTML = STATIONS_DATA.map(s => {
    const has = !!s.superintendent;
    return `<div class="sho-station-card">
      <div class="ssc-name">${escHtml(s.name)}</div>
      <div class="ssc-current">
        <div class="ssc-current-label">Current Superintendent</div>
        ${has
          ? `<div class="ssc-current-name">${escHtml(s.superintendent)}</div>`
          : `<div class="ssc-current-empty">Not appointed</div>`
        }
      </div>
      <button class="ssc-btn ${has ? 'has-sho' : ''}" data-station-id="${s.id}">
        ${has ? 'Manage Superintendent' : 'Appoint Superintendent'}
      </button>
    </div>`;
  }).join('');

  document.querySelectorAll('#superintendentGrid .ssc-btn').forEach(btn => {
    btn.addEventListener('click', () => openSuptModal(parseInt(btn.dataset.stationId)));
  });
}

function openSuptModal(stationId) {
  suptActiveStation = stationId;
  const s = STATIONS_DATA.find(x => x.id === stationId);
  if (!s) return;

  document.getElementById('suptModalStationName').textContent = s.name;
  hideAlert('suptModalAlert');

  const curDisplay    = document.getElementById('suptCurrentDisplay');
  const removeSection = document.getElementById('suptRemoveSection');
  if (s.superintendent) {
    curDisplay.innerHTML = `<div class="drawer-row"><span class="dr-key">Name</span><span class="dr-val">${escHtml(s.superintendent)}</span></div>`;
    removeSection.style.display = 'block';
  } else {
    curDisplay.innerHTML = '<p class="drawer-empty">No Superintendent appointed.</p>';
    removeSection.style.display = 'none';
  }

  const sel = document.getElementById('suptOfficerSelect');
  sel.innerHTML = '<option value="">— Choose an officer —</option>';
  officersData.filter(o => o.is_active && o.role_id !== 3).sort((a,b) => a.name.localeCompare(b.name)).forEach(o => {
    const opt = document.createElement('option');
    opt.value = o.id;
    opt.textContent = `${o.name} (${o.rank} · ${o.badge})`;
    sel.appendChild(opt);
  });

  document.getElementById('superintendentModal').classList.add('active');
}

document.getElementById('btnAppointSupt')?.addEventListener('click', async function() {
  hideAlert('suptModalAlert');
  const oid = parseInt(document.getElementById('suptOfficerSelect').value);
  if (!oid) { showAlert('suptModalAlert','error','Please select an officer.'); return; }

  this.disabled = true; this.textContent = 'Appointing…';
  try {
    await new Promise(r => setTimeout(r, 700));
    const s = STATIONS_DATA.find(x => x.id === suptActiveStation);
    const o = officersData.find(x => x.id === oid);
    if (s && o) { s.superintendent = o.name; o.role_id = 3; o.role = 'Jail Superintendent'; }
    showAlert('suptModalAlert','success',`${o?.name} appointed as Superintendent.`);
    renderSuptGrid();
    setTimeout(() => { document.getElementById('superintendentModal').classList.remove('active'); }, 1200);
  } finally {
    this.disabled = false; this.textContent = 'Appoint as Superintendent';
  }
});

document.getElementById('btnRemoveSupt')?.addEventListener('click', async function() {
  hideAlert('suptModalAlert');
  const removeType = document.querySelector('input[name="suptRemoveType"]:checked')?.value;
  this.disabled = true; this.textContent = 'Removing…';
  try {
    await new Promise(r => setTimeout(r, 700));
    const s = STATIONS_DATA.find(x => x.id === suptActiveStation);
    if (s) {
      const o = officersData.find(x => x.name === s.superintendent);
      if (o) {
        if (removeType === 'duty') o.is_active = 0;
        o.role_id = 1; o.role = 'Investigating Officer';
      }
      s.superintendent = null;
    }
    showAlert('suptModalAlert','success','Superintendent removed.');
    renderSuptGrid();
    setTimeout(() => { document.getElementById('superintendentModal').classList.remove('active'); }, 1200);
  } finally {
    this.disabled = false; this.textContent = 'Remove Superintendent';
  }
});

document.getElementById('closeSuptModal')?.addEventListener('click', () => {
  document.getElementById('superintendentModal').classList.remove('active');
});
document.getElementById('superintendentModal')?.addEventListener('click', e => {
  if (e.target === document.getElementById('superintendentModal'))
    document.getElementById('superintendentModal').classList.remove('active');
});

/* ══════════════════════════════════════
   PROFILE PAGE
══════════════════════════════════════ */
function initProfilePage() {
  fetch('../php/adminCheckSession.php')
    .then(r => r.json())
    .then(data => {
      if (!data.valid) return;
      const name  = data.name  || 'Ahmed Shah';
      const badge = data.badge || 'ADMIN-001';
      const email = 'policechief.karachi.picms@gmail.com'; // from session/DB

      const initial = name[0].toUpperCase();
      document.getElementById('profileAvatarAdmin').textContent = initial;
      document.getElementById('profileNameAdmin').textContent   = name;
      document.getElementById('profileBadgeAdmin').textContent  = badge;
      document.getElementById('pFullName').textContent          = name;
      document.getElementById('pBadge').textContent             = badge;
      document.getElementById('pEmail').textContent             = email;
    })
    .catch(() => {});

  // Password strength
  document.getElementById('pNewPwd')?.addEventListener('input', function() {
    const v = this.value; let s = 0;
    if (v.length >= 8) s++;
    if (/[A-Z]/.test(v)) s++;
    if (/[0-9]/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    const bar = document.getElementById('profileStrengthBar');
    const lbl = document.getElementById('profileStrengthLbl');
    if (!v) { bar.style.width = '0'; lbl.textContent = ''; return; }
    const i = Math.max(0, s-1);
    bar.style.width      = ['25%','50%','75%','100%'][i];
    bar.style.background = ['#d95f5f','#c9a84c','#8a9e6a','#4caf80'][i];
    lbl.textContent      = ['Weak','Fair','Good','Strong'][i];
  });

  document.getElementById('btnChangePassword')?.addEventListener('click', handleChangePassword);
}

async function handleChangePassword() {
  hideAlert('profileAlert');
  const current  = document.getElementById('pCurrentPwd').value;
  const newPwd   = document.getElementById('pNewPwd').value;
  const confirm  = document.getElementById('pConfirmPwd').value;

  if (!current || !newPwd || !confirm) { showAlert('profileAlert','error','All fields are required.'); return; }
  if (newPwd.length < 8) { showAlert('profileAlert','error','New password must be at least 8 characters.'); return; }
  if (newPwd !== confirm) { showAlert('profileAlert','error','Passwords do not match.'); return; }

  const btn = document.getElementById('btnChangePassword');
  btn.disabled = true; btn.textContent = 'Updating…';
  try {
    const res  = await fetch('../php/changeAdminPassword.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_password: current, new_password: newPwd })
    });
    const data = await res.json();
    if (data.success) {
      showAlert('profileAlert','success','Password updated successfully!');
      document.getElementById('pCurrentPwd').value = '';
      document.getElementById('pNewPwd').value     = '';
      document.getElementById('pConfirmPwd').value = '';
      const bar = document.getElementById('profileStrengthBar');
      bar.style.width = '0';
      document.getElementById('profileStrengthLbl').textContent = '';
    } else {
      showAlert('profileAlert','error', data.message || 'Failed to update password.');
    }
  } catch {
    showAlert('profileAlert','error','Connection error. Please try again.');
  } finally {
    btn.disabled = false; btn.textContent = 'Update Password';
  }
}

/* password eye toggles */
function toggleAdminPwd(inputId, btn) {
  const inp = document.getElementById(inputId);
  const show = inp.type === 'password';
  inp.type = show ? 'text' : 'password';
  btn.textContent = show ? '🙈' : '👁';
}

/* ══════════════════════════════════════
   DASHBOARD PAGE — real stat wiring
══════════════════════════════════════ */
(function initDashboard() {
  // stat cards
  document.getElementById('statOfficers').textContent  = OFFICERS_DATA.filter(o => o.is_active).length;
  document.getElementById('statComplaints').textContent = COMPLAINTS_DATA.filter(c => !['Resolved','Closed','Rejected','Withdrawn'].includes(c.status)).length;
  document.getElementById('statResolved').textContent  = COMPLAINTS_DATA.filter(c => c.status === 'Resolved').length;
  document.getElementById('statUrgent').textContent    = COMPLAINTS_DATA.filter(c => c.urgent).length;

  // recent complaints table
  const tbody = document.getElementById('complaintsTbody');
  const recent = [...COMPLAINTS_DATA].sort((a,b) => new Date(b.submitted_at)-new Date(a.submitted_at)).slice(0,5);
  tbody.innerHTML = recent.map(c => `
    <tr>
      <td style="font-family:monospace;font-size:11px;color:var(--gold-dim)">${escHtml(c.ref)}</td>
      <td>${escHtml(c.category)}</td>
      <td style="color:var(--muted)">${escHtml(c.station)}</td>
      <td>${statusBadge(c.status)}</td>
      <td>${c.urgent ? '<span class="badge badge-urgent">Urgent</span>' : '<span class="badge badge-normal">Normal</span>'}</td>
    </tr>
  `).join('');

  // stations list
  const list = document.getElementById('stationList');
  list.innerHTML = STATIONS_DATA.slice(0,5).map(s => `
    <div class="station-row">
      <span class="station-name">${escHtml(s.name)}</span>
      <span class="station-area">${escHtml(s.area)}</span>
    </div>
  `).join('') + `<p style="font-size:11px;color:var(--muted);text-align:center;margin-top:8px">+ ${STATIONS_DATA.length-5} more stations</p>`;
})();