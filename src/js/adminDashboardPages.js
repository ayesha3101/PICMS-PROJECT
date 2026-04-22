// adminDashboardPages.js — PICMS Admin
// Officers (read-only view), Stations, Complaints, SHO, Superintendent, Profile.
// Admin CANNOT add/edit/delete officers — only views them and manages SHO/Superintendent roles.
// All data fetched from real PHP API endpoints — zero mock data.

/* ══════════════════════════════════════
   SHARED CONSTANTS + HELPERS
══════════════════════════════════════ */
const RANK_COLORS = {
  Inspector: 'badge-assigned', DSP: 'badge-ongoing',
  SI: 'badge-submitted', ASI: 'badge-normal',
};

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
   PAGE INIT MAP — called by navigateTo
══════════════════════════════════════ */
const PAGE_INIT = {
  officers:       initOfficersPage,
  stations:       initStationsPage,
  complaints:     initComplaintsPage,
  sho:            initSHOPage,
  superintendent: initSuperintendentPage,
  profile:        initProfilePage,
};

/* ══════════════════════════════════════
   OFFICERS PAGE  (read-only)
══════════════════════════════════════ */
let officersData   = [];
let stationsCache  = [];
let officersLoaded = false;

async function initOfficersPage() {
  if (!officersLoaded) await fetchOfficers();
  if (!stationsLoaded) await fetchStations();
  populateOfficerStationFilter();
  renderOfficers(officersData);
  wireOfficerFilters();
  wireOfficerDrawer();
}

async function fetchOfficers() {
  try {
    const res  = await fetch('../php/adminGetOfficers.php');
    const data = await res.json();
    if (data.success) {
      officersData   = data.officers;
      officersLoaded = true;
    }
  } catch { /* silent */ }
}

function populateOfficerStationFilter() {
  const sel = document.getElementById('filterOfficerStation');
  if (!sel || sel.options.length > 1) return;
  stationsCache.forEach(s => {
    const o = document.createElement('option');
    o.value = s.station_id; o.textContent = s.station_name;
    sel.appendChild(o);
  });
}

function renderOfficers(list) {
  const tbody = document.getElementById('officersTbody');
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="table-empty">No officers found.</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(o => {
    const initials = o.full_name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
    const roleCls  = o.role_id == 2 ? 'role-sho' : o.role_id == 3 ? 'role-superintendent' : 'role-investigating';
    return `<tr data-officer-id="${o.officer_id}">
      <td>
        <div class="officer-cell">
          <div class="officer-avatar-sm">${initials}</div>
          <div>
            <div class="officer-name">${escHtml(o.full_name)}</div>
            <div class="officer-email">${escHtml(o.email)}</div>
          </div>
        </div>
      </td>
      <td style="font-family:monospace;font-size:11px;color:var(--gold-dim)">${escHtml(o.badge_number)}</td>
      <td><span class="badge ${RANK_COLORS[o.rank]||'badge-normal'}">${escHtml(o.rank)}</span></td>
      <td><span class="role-badge ${roleCls}">${escHtml(o.role_name)}</span></td>
      <td style="color:var(--muted);font-size:12px">${escHtml(o.station_name) || '—'}</td>
      <td style="text-align:center;color:${o.active_caseload>5?'#e88080':'var(--offwhite)'}">${o.active_caseload}</td>
      <td>${o.is_active
        ? '<span class="status-active">Active</span>'
        : '<span class="status-inactive">Inactive</span>'}</td>
    </tr>`;
  }).join('');
}

function wireOfficerFilters() {
  ['filterOfficerRank','filterOfficerStation','filterOfficerRole','filterOfficerSort'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', applyOfficerFilters);
  });
  document.getElementById('searchOfficer')?.addEventListener('input', applyOfficerFilters);
}

function applyOfficerFilters() {
  const rank    = document.getElementById('filterOfficerRank')?.value    || '';
  const station = document.getElementById('filterOfficerStation')?.value || '';
  const role    = document.getElementById('filterOfficerRole')?.value    || '';
  const sort    = document.getElementById('filterOfficerSort')?.value    || 'alpha';
  const search  = (document.getElementById('searchOfficer')?.value || '').trim().toLowerCase();

  let filtered = officersData.filter(o => {
    if (rank    && o.rank                 !== rank)    return false;
    if (station && String(o.station_id)   !== station) return false;
    if (role    && String(o.role_id)      !== role)    return false;
    if (search  && !o.full_name.toLowerCase().includes(search)
                && !o.badge_number.toLowerCase().includes(search)) return false;
    return true;
  });

  if (sort === 'alpha')         filtered.sort((a,b) => a.full_name.localeCompare(b.full_name));
  if (sort === 'alpha_desc')    filtered.sort((a,b) => b.full_name.localeCompare(a.full_name));
  if (sort === 'caseload_desc') filtered.sort((a,b) => b.active_caseload - a.active_caseload);
  if (sort === 'caseload_asc')  filtered.sort((a,b) => a.active_caseload - b.active_caseload);

  renderOfficers(filtered);
}

function wireOfficerDrawer() {
  document.getElementById('closeOfficerDrawer')?.addEventListener('click', closeOfficerDrawer);
  document.getElementById('officerDrawerBackdrop')?.addEventListener('click', closeOfficerDrawer);
  // Row click opens drawer
  document.getElementById('officersTbody')?.addEventListener('click', e => {
    const row = e.target.closest('tr[data-officer-id]');
    if (row) openOfficerDrawer(parseInt(row.dataset.officerId));
  });
}

function openOfficerDrawer(id) {
  const o = officersData.find(x => x.officer_id == id);
  if (!o) return;
  const roleCls = o.role_id == 2 ? 'role-sho' : o.role_id == 3 ? 'role-superintendent' : 'role-investigating';
  document.getElementById('drawerOfficerName').textContent  = o.full_name;
  document.getElementById('drawerOfficerBadge').textContent = o.badge_number;
  document.getElementById('drawerRank').innerHTML  = `<span class="badge ${RANK_COLORS[o.rank]||''}">${escHtml(o.rank)}</span>`;
  document.getElementById('drawerRole').innerHTML  = `<span class="role-badge ${roleCls}">${escHtml(o.role_name)}</span>`;
  document.getElementById('drawerStation').textContent  = o.station_name || '—';
  document.getElementById('drawerEmail').textContent    = o.email;
  document.getElementById('drawerCaseload').textContent = `${o.active_caseload} active cases`;
  document.getElementById('drawerStatus').innerHTML = o.is_active
    ? '<span class="status-active">Active</span>'
    : '<span class="status-inactive">Inactive</span>';
  document.getElementById('drawerCasesList').innerHTML =
    '<p class="drawer-empty">Open Complaints section to view case details.</p>';
  document.getElementById('officerDrawer').classList.add('open');
  document.getElementById('officerDrawerBackdrop').classList.add('visible');
}

function closeOfficerDrawer() {
  document.getElementById('officerDrawer').classList.remove('open');
  document.getElementById('officerDrawerBackdrop').classList.remove('visible');
}

/* ══════════════════════════════════════
   STATIONS PAGE
══════════════════════════════════════ */
let stationsLoaded = false;

async function initStationsPage() {
  if (!stationsLoaded) await fetchStations();
  if (!officersLoaded) await fetchOfficers();
  renderStations(stationsCache);
  document.getElementById('searchStation')?.addEventListener('input', function() {
    const q = this.value.trim().toLowerCase();
    renderStations(stationsCache.filter(s =>
      s.station_name.toLowerCase().includes(q) ||
      (s.area_covered||'').toLowerCase().includes(q)
    ));
  });
}

async function fetchStations() {
  try {
    const res  = await fetch('../php/adminGetStations.php');
    const data = await res.json();
    if (data.success) {
      stationsCache  = data.stations;
      stationsLoaded = true;
    }
  } catch { /* silent */ }
}

function renderStations(list) {
  const grid = document.getElementById('stationsGrid');
  if (!list.length) {
    grid.innerHTML = '<div class="table-empty" style="grid-column:1/-1;padding:40px;text-align:center">No stations found.</div>';
    return;
  }
  grid.innerHTML = list.map(s => `
    <div class="station-card" data-station-id="${s.station_id}" style="cursor:pointer">
      <div class="station-card-header">
        <div>
          <div class="station-card-name">${escHtml(s.station_name)}</div>
          <div class="station-card-area">${escHtml(s.area_covered)}</div>
        </div>
        <div class="station-card-icon">🏛</div>
      </div>
      <div class="station-stat-row">
        <div class="station-stat">
          <span class="station-stat-num">${s.officer_count}</span>
          <span class="station-stat-lbl">Officers</span>
        </div>
        <div class="station-stat">
          <span class="station-stat-num">${s.case_count}</span>
          <span class="station-stat-lbl">Active Cases</span>
        </div>
      </div>
      <div class="station-sho-row">
        <span>SHO:</span>
        <span class="sho-name-sm">${s.sho_name ? escHtml(s.sho_name) : 'Not appointed'}</span>
      </div>
    </div>`).join('');

  document.querySelectorAll('.station-card').forEach(card => {
    card.addEventListener('click', () => openStationModal(parseInt(card.dataset.stationId)));
  });
}

function openStationModal(id) {
  const s = stationsCache.find(x => x.station_id == id);
  if (!s) return;
  document.getElementById('stationModalArea').textContent = s.area_covered || '';
  document.getElementById('stationModalName').textContent = s.station_name;
  document.getElementById('smAddress').textContent        = s.address || '—';
  document.getElementById('smPhone').textContent          = s.phone   || '—';
  document.getElementById('smSHO').textContent            = s.sho_name           || 'Not appointed';
  document.getElementById('smSuperintendent').textContent = s.superintendent_name || 'Not appointed';
  document.getElementById('smOfficerCount').textContent   = s.officer_count;
  document.getElementById('smCaseCount').textContent      = s.case_count;

  const officers = officersData.filter(o => o.station_id == id);
  const list = document.getElementById('smOfficerList');
  list.innerHTML = officers.length
    ? officers.map(o => {
        const rc = o.role_id == 2 ? 'role-sho' : o.role_id == 3 ? 'role-superintendent' : 'role-investigating';
        return `<div class="drawer-row">
          <span class="dr-key">${escHtml(o.full_name)}</span>
          <span class="dr-val" style="display:flex;gap:6px;align-items:center;">
            <span class="badge ${RANK_COLORS[o.rank]||''}">${escHtml(o.rank)}</span>
            <span class="role-badge ${rc}">${escHtml(o.role_name)}</span>
          </span>
        </div>`;
      }).join('')
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
let complaintsData   = [];
let complaintsLoaded = false;

async function initComplaintsPage() {
  if (!stationsLoaded) await fetchStations();
  // Populate station filter
  const stSel = document.getElementById('filterComplaintStation');
  if (stSel && stSel.options.length < 2) {
    stationsCache.forEach(s => {
      const o = document.createElement('option');
      o.value = s.station_id; o.textContent = s.station_name;
      stSel.appendChild(o);
    });
  }
  if (!complaintsLoaded) await fetchComplaints();
  renderComplaintsTable(complaintsData);
  wireComplaintFilters();
}

async function fetchComplaints() {
  const tbody = document.getElementById('complaintsTbodyFull');
  tbody.innerHTML = '<tr><td colspan="8" class="table-empty"><div class="loading-row"><div class="mini-spinner"></div> Loading…</div></td></tr>';
  try {
    const res  = await fetch('../php/adminGetComplaints.php');
    const data = await res.json();
    if (data.success) {
      complaintsData   = data.complaints;
      complaintsLoaded = true;
    }
  } catch { /* silent */ }
}

function renderComplaintsTable(list) {
  const tbody = document.getElementById('complaintsTbodyFull');
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="table-empty">No complaints found.</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(c => `
    <tr>
      <td style="font-family:monospace;font-size:11px;color:var(--gold-dim)">${escHtml(c.reference_number)}</td>
      <td>${escHtml(c.category_name)}</td>
      <td style="color:var(--muted);font-size:12px">${escHtml(c.station_name)}</td>
      <td style="font-family:monospace;font-size:11px;color:var(--muted)">${escHtml(c.cnic)}</td>
      <td>${statusBadge(c.status)}</td>
      <td>${c.is_urgent
        ? '<span class="urgency-badge urgency-urgent">⚑ Urgent</span>'
        : '<span class="urgency-badge urgency-normal">Normal</span>'}</td>
      <td style="color:var(--muted);font-size:12px">${formatDate(c.submitted_at)}</td>
      <td><button class="tbl-action-btn view-complaint-btn" data-id="${c.complaint_id}">View</button></td>
    </tr>`).join('');

  document.querySelectorAll('.view-complaint-btn').forEach(btn => {
    btn.addEventListener('click', () => openComplaintModal(parseInt(btn.dataset.id)));
  });
}

function wireComplaintFilters() {
  ['filterComplaintStation','filterComplaintStatus','filterComplaintCategory',
   'filterComplaintUrgency','filterComplaintSort'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', applyComplaintFilters);
  });
  document.getElementById('searchComplaint')?.addEventListener('input', applyComplaintFilters);
}

function applyComplaintFilters() {
  const station  = document.getElementById('filterComplaintStation')?.value  || '';
  const status   = document.getElementById('filterComplaintStatus')?.value   || '';
  const category = document.getElementById('filterComplaintCategory')?.value || '';
  const urgency  = document.getElementById('filterComplaintUrgency')?.value  || '';
  const sort     = document.getElementById('filterComplaintSort')?.value     || 'recent';
  const search   = (document.getElementById('searchComplaint')?.value || '').trim().toLowerCase();

  let filtered = complaintsData.filter(c => {
    if (station  && String(c.station_id)                  !== station)  return false;
    if (status   && c.status                              !== status)   return false;
    if (category && String(c.category_id)                 !== category) return false;
    if (urgency  && String(c.is_urgent ? '1' : '0')       !== urgency)  return false;
    if (search   && !c.reference_number.toLowerCase().includes(search)
                 && !(c.incident_area||'').toLowerCase().includes(search)) return false;
    return true;
  });

  filtered.sort((a,b) => {
    const ta = new Date(a.submitted_at), tb = new Date(b.submitted_at);
    return sort === 'oldest' ? ta - tb : tb - ta;
  });
  renderComplaintsTable(filtered);
}

function openComplaintModal(id) {
  const c = complaintsData.find(x => x.complaint_id == id);
  if (!c) return;
  document.getElementById('cmCategory').textContent    = c.category_name;
  document.getElementById('cmRef').textContent         = c.reference_number;
  document.getElementById('cmStatus').innerHTML        = statusBadge(c.status);
  document.getElementById('cmStation').textContent     = c.station_name || '—';
  document.getElementById('cmArea').textContent        = c.incident_area || '—';
  document.getElementById('cmDate').textContent        = formatDate(c.submitted_at);
  document.getElementById('cmSubmitted').textContent   = fmtDateTime(c.submitted_at);
  document.getElementById('cmOfficer').textContent     = c.assigned_officer || 'Not yet assigned';
  document.getElementById('cmDescription').textContent = '(Full description visible in officer/SHO dashboard)';

  const tl = document.getElementById('cmTimeline');
  if (!c.timeline || !c.timeline.length) {
    tl.innerHTML = '<p class="drawer-empty">No updates yet.</p>';
  } else {
    tl.innerHTML = c.timeline.map((u,i) => {
      const isLast = i === c.timeline.length - 1;
      return `<div class="cm-tl-item">
        <div class="cm-tl-dot ${isLast?'current':'done'}"></div>
        <div>
          <div class="cm-tl-status">${escHtml(u.status)}</div>
          ${u.note ? `<div class="cm-tl-note">${escHtml(u.note)}</div>` : ''}
          <div class="cm-tl-meta">${escHtml(u.updated_by)} · ${fmtDateTime(u.updated_at)}</div>
        </div>
      </div>`;
    }).join('');
  }
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
   Admin appoints/removes SHO from ANY active officer
══════════════════════════════════════ */
let shoActiveStationId = null;

async function initSHOPage() {
  if (!stationsLoaded) await fetchStations();
  if (!officersLoaded) await fetchOfficers();
  renderSHOGrid();
}

function renderSHOGrid() {
  const grid = document.getElementById('shoGrid');
  if (!stationsCache.length) {
    grid.innerHTML = '<div class="table-empty" style="padding:40px;text-align:center;grid-column:1/-1;">No stations found.</div>';
    return;
  }
  grid.innerHTML = stationsCache.map(s => `
    <div class="sho-station-card">
      <div class="ssc-name">${escHtml(s.station_name)}</div>
      <div class="ssc-current">
        <div class="ssc-current-label">Current SHO</div>
        ${s.sho_name
          ? `<div class="ssc-current-name">${escHtml(s.sho_name)}</div>`
          : `<div class="ssc-current-empty">No SHO appointed</div>`}
      </div>
      <button class="ssc-btn ${s.sho_name ? 'has-sho' : ''}" data-station-id="${s.station_id}">
        ${s.sho_name ? 'Manage SHO' : 'Appoint SHO'}
      </button>
    </div>`).join('');

  document.querySelectorAll('#shoGrid .ssc-btn').forEach(btn => {
    btn.addEventListener('click', () => openSHOModal(parseInt(btn.dataset.stationId)));
  });
}

function openSHOModal(stationId) {
  shoActiveStationId = stationId;
  const s = stationsCache.find(x => x.station_id == stationId);
  if (!s) return;

  document.getElementById('shoModalStationName').textContent = s.station_name;
  hideAlert('shoModalAlert');
  const reasonEl = document.getElementById('shoRemoveReason');
  if (reasonEl) reasonEl.value = '';

  // Current SHO display
  const curDisplay    = document.getElementById('shoCurrentDisplay');
  const removeSection = document.getElementById('shoRemoveSection');
  if (s.sho_name) {
    // Find the current SHO officer details
    const shoOfficer = officersData.find(o => o.full_name === s.sho_name && o.role_id == 2);
    curDisplay.innerHTML = `
      <div class="drawer-row"><span class="dr-key">Name</span><span class="dr-val">${escHtml(s.sho_name)}</span></div>
      ${shoOfficer ? `<div class="drawer-row"><span class="dr-key">Badge</span><span class="dr-val">${escHtml(shoOfficer.badge_number)}</span></div>
      <div class="drawer-row"><span class="dr-key">Rank</span><span class="dr-val">${escHtml(shoOfficer.rank)}</span></div>` : ''}
      <div class="drawer-row"><span class="dr-key">Station</span><span class="dr-val">${escHtml(s.station_name)}</span></div>`;
    removeSection.style.display = 'block';
  } else {
    curDisplay.innerHTML = '<p class="drawer-empty">No SHO currently appointed.</p>';
    removeSection.style.display = 'none';
  }

  // Officer dropdown — ALL active officers eligible (admin picks anyone)
  // Officers already serving as SHO at another station are shown but labelled
  const sel = document.getElementById('shoOfficerSelect');
  sel.innerHTML = '<option value="">— Select an officer to appoint —</option>';
  document.getElementById('shoOfficerPreview').style.display = 'none';

  const activeOfficers = officersData
    .filter(o => o.is_active)
    .sort((a,b) => a.full_name.localeCompare(b.full_name));

  activeOfficers.forEach(o => {
    const opt = document.createElement('option');
    opt.value = o.officer_id;
    let label = `${o.full_name} (${o.rank} · ${o.badge_number})`;
    if (o.role_id == 2) label += ' — currently SHO';
    if (o.role_id == 3) label += ' — currently Superintendent';
    opt.textContent = label;
    sel.appendChild(opt);
  });

  document.getElementById('shoModal').classList.add('active');
}

document.getElementById('shoOfficerSelect')?.addEventListener('change', function() {
  const id      = parseInt(this.value);
  const preview = document.getElementById('shoOfficerPreview');
  if (!id) { preview.style.display = 'none'; return; }
  const o = officersData.find(x => x.officer_id == id);
  if (!o) return;
  document.getElementById('previewRank').textContent    = o.rank;
  document.getElementById('previewRole').textContent    = o.role_name;
  document.getElementById('previewStation').textContent = o.station_name || 'Unassigned';
  document.getElementById('previewCases').textContent   = o.active_caseload;
  preview.style.display = 'block';
});

document.getElementById('btnAppointSHO')?.addEventListener('click', async function() {
  hideAlert('shoModalAlert');
  const officerId = parseInt(document.getElementById('shoOfficerSelect').value);
  if (!officerId) { showAlert('shoModalAlert','error','Please select an officer to appoint.'); return; }

  this.disabled = true; this.textContent = 'Appointing…';
  try {
    const res  = await fetch('../php/adminManageSHO.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'appoint', station_id: shoActiveStationId, officer_id: officerId }),
    });
    const data = await res.json();
    if (data.success) {
      showAlert('shoModalAlert','success','SHO appointed successfully.');
      officersLoaded = false; stationsLoaded = false;
      await Promise.all([fetchOfficers(), fetchStations()]);
      renderSHOGrid();
      setTimeout(() => document.getElementById('shoModal').classList.remove('active'), 1400);
    } else { showAlert('shoModalAlert','error', data.message || 'Failed to appoint SHO.'); }
  } catch { showAlert('shoModalAlert','error','Connection error. Please try again.'); }
  finally { this.disabled = false; this.textContent = 'Appoint as SHO'; }
});

document.getElementById('btnRemoveSHO')?.addEventListener('click', async function() {
  hideAlert('shoModalAlert');
  const removeType = document.querySelector('input[name="removeType"]:checked')?.value || 'position';
  const reason     = document.getElementById('shoRemoveReason')?.value.trim() || '';

  this.disabled = true; this.textContent = 'Removing…';
  try {
    const res  = await fetch('../php/adminManageSHO.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove', station_id: shoActiveStationId, remove_type: removeType, reason }),
    });
    const data = await res.json();
    if (data.success) {
      showAlert('shoModalAlert','success','SHO removed successfully.');
      officersLoaded = false; stationsLoaded = false;
      await Promise.all([fetchOfficers(), fetchStations()]);
      renderSHOGrid();
      setTimeout(() => document.getElementById('shoModal').classList.remove('active'), 1400);
    } else { showAlert('shoModalAlert','error', data.message || 'Failed to remove SHO.'); }
  } catch { showAlert('shoModalAlert','error','Connection error. Please try again.'); }
  finally { this.disabled = false; this.textContent = 'Remove SHO'; }
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
   Admin appoints/removes Superintendent from ANY active officer
══════════════════════════════════════ */
let suptActiveStationId = null;

async function initSuperintendentPage() {
  if (!stationsLoaded) await fetchStations();
  if (!officersLoaded) await fetchOfficers();
  renderSuptGrid();
}

function renderSuptGrid() {
  const grid = document.getElementById('superintendentGrid');
  if (!stationsCache.length) {
    grid.innerHTML = '<div class="table-empty" style="padding:40px;text-align:center;grid-column:1/-1;">No stations found.</div>';
    return;
  }
  grid.innerHTML = stationsCache.map(s => `
    <div class="sho-station-card">
      <div class="ssc-name">${escHtml(s.station_name)}</div>
      <div class="ssc-current">
        <div class="ssc-current-label">Current Superintendent</div>
        ${s.superintendent_name
          ? `<div class="ssc-current-name">${escHtml(s.superintendent_name)}</div>`
          : `<div class="ssc-current-empty">Not appointed</div>`}
      </div>
      <button class="ssc-btn ${s.superintendent_name ? 'has-sho' : ''}" data-station-id="${s.station_id}">
        ${s.superintendent_name ? 'Manage Superintendent' : 'Appoint Superintendent'}
      </button>
    </div>`).join('');

  document.querySelectorAll('#superintendentGrid .ssc-btn').forEach(btn => {
    btn.addEventListener('click', () => openSuptModal(parseInt(btn.dataset.stationId)));
  });
}

function openSuptModal(stationId) {
  suptActiveStationId = stationId;
  const s = stationsCache.find(x => x.station_id == stationId);
  if (!s) return;

  document.getElementById('suptModalStationName').textContent = s.station_name;
  hideAlert('suptModalAlert');

  const curDisplay    = document.getElementById('suptCurrentDisplay');
  const removeSection = document.getElementById('suptRemoveSection');
  if (s.superintendent_name) {
    const suptOfficer = officersData.find(o => o.full_name === s.superintendent_name && o.role_id == 3);
    curDisplay.innerHTML = `
      <div class="drawer-row"><span class="dr-key">Name</span><span class="dr-val">${escHtml(s.superintendent_name)}</span></div>
      ${suptOfficer ? `<div class="drawer-row"><span class="dr-key">Badge</span><span class="dr-val">${escHtml(suptOfficer.badge_number)}</span></div>
      <div class="drawer-row"><span class="dr-key">Rank</span><span class="dr-val">${escHtml(suptOfficer.rank)}</span></div>` : ''}`;
    removeSection.style.display = 'block';
  } else {
    curDisplay.innerHTML = '<p class="drawer-empty">No Superintendent appointed.</p>';
    removeSection.style.display = 'none';
  }

  // Officer dropdown — ALL active officers
  const sel = document.getElementById('suptOfficerSelect');
  sel.innerHTML = '<option value="">— Select an officer to appoint —</option>';

  officersData
    .filter(o => o.is_active)
    .sort((a,b) => a.full_name.localeCompare(b.full_name))
    .forEach(o => {
      const opt = document.createElement('option');
      opt.value = o.officer_id;
      let label = `${o.full_name} (${o.rank} · ${o.badge_number})`;
      if (o.role_id == 2) label += ' — currently SHO';
      if (o.role_id == 3) label += ' — currently Superintendent';
      opt.textContent = label;
      sel.appendChild(opt);
    });

  document.getElementById('superintendentModal').classList.add('active');
}

document.getElementById('btnAppointSupt')?.addEventListener('click', async function() {
  hideAlert('suptModalAlert');
  const oid = parseInt(document.getElementById('suptOfficerSelect').value);
  if (!oid) { showAlert('suptModalAlert','error','Please select an officer to appoint.'); return; }

  this.disabled = true; this.textContent = 'Appointing…';
  try {
    const res  = await fetch('../php/adminManageSuperintendent.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'appoint', station_id: suptActiveStationId, officer_id: oid }),
    });
    const data = await res.json();
    if (data.success) {
      showAlert('suptModalAlert','success','Superintendent appointed successfully.');
      officersLoaded = false; stationsLoaded = false;
      await Promise.all([fetchOfficers(), fetchStations()]);
      renderSuptGrid();
      setTimeout(() => document.getElementById('superintendentModal').classList.remove('active'), 1400);
    } else { showAlert('suptModalAlert','error', data.message || 'Failed to appoint.'); }
  } catch { showAlert('suptModalAlert','error','Connection error. Please try again.'); }
  finally { this.disabled = false; this.textContent = 'Appoint as Superintendent'; }
});

document.getElementById('btnRemoveSupt')?.addEventListener('click', async function() {
  hideAlert('suptModalAlert');
  const removeType = document.querySelector('input[name="suptRemoveType"]:checked')?.value || 'position';
  const reason     = document.getElementById('suptRemoveReason')?.value.trim() || '';

  this.disabled = true; this.textContent = 'Removing…';
  try {
    const res  = await fetch('../php/adminManageSuperintendent.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove', station_id: suptActiveStationId, remove_type: removeType, reason }),
    });
    const data = await res.json();
    if (data.success) {
      showAlert('suptModalAlert','success','Superintendent removed.');
      officersLoaded = false; stationsLoaded = false;
      await Promise.all([fetchOfficers(), fetchStations()]);
      renderSuptGrid();
      setTimeout(() => document.getElementById('superintendentModal').classList.remove('active'), 1400);
    } else { showAlert('suptModalAlert','error', data.message || 'Failed to remove.'); }
  } catch { showAlert('suptModalAlert','error','Connection error. Please try again.'); }
  finally { this.disabled = false; this.textContent = 'Remove Superintendent'; }
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
async function initProfilePage() {
  try {
    const res  = await fetch('../php/adminCheckSession.php');
    const data = await res.json();
    if (!data.valid) return;
    const name    = data.name  || '—';
    const badge   = data.badge || '—';
    const initial = name[0].toUpperCase();

    document.getElementById('profileAvatarAdmin').textContent = initial;
    document.getElementById('profileNameAdmin').textContent   = name;
    document.getElementById('profileBadgeAdmin').textContent  = badge;
    document.getElementById('pFullName').textContent          = name;
    document.getElementById('pBadge').textContent             = badge;
    document.getElementById('pEmail').textContent             = '(contact system administrator)';
  } catch { /* silent */ }

  document.getElementById('pNewPwd')?.addEventListener('input', function() {
    const v = this.value; let s = 0;
    if (v.length >= 8) s++;
    if (/[A-Z]/.test(v)) s++;
    if (/[0-9]/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    const bar = document.getElementById('profileStrengthBar');
    const lbl = document.getElementById('profileStrengthLbl');
    if (!v) { bar.style.width='0'; lbl.textContent=''; return; }
    const i = Math.max(0, s-1);
    bar.style.width      = ['25%','50%','75%','100%'][i];
    bar.style.background = ['#d95f5f','#c9a84c','#8a9e6a','#4caf80'][i];
    lbl.textContent      = ['Weak','Fair','Good','Strong'][i];
  });

  document.getElementById('btnChangePassword')?.addEventListener('click', handleChangePassword);
}

async function handleChangePassword() {
  hideAlert('profileAlert');
  const current = document.getElementById('pCurrentPwd').value;
  const newPwd  = document.getElementById('pNewPwd').value;
  const confirm = document.getElementById('pConfirmPwd').value;

  if (!current || !newPwd || !confirm) { showAlert('profileAlert','error','All fields are required.'); return; }
  if (newPwd.length < 8) { showAlert('profileAlert','error','Password must be at least 8 characters.'); return; }
  if (newPwd !== confirm) { showAlert('profileAlert','error','Passwords do not match.'); return; }

  const btn = document.getElementById('btnChangePassword');
  btn.disabled = true; btn.textContent = 'Updating…';
  try {
    const res  = await fetch('../php/changeAdminPassword.php', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ current_password: current, new_password: newPwd }),
    });
    const data = await res.json();
    if (data.success) {
      showAlert('profileAlert','success','Password updated successfully!');
      document.getElementById('pCurrentPwd').value = '';
      document.getElementById('pNewPwd').value     = '';
      document.getElementById('pConfirmPwd').value = '';
      document.getElementById('profileStrengthBar').style.width = '0';
      document.getElementById('profileStrengthLbl').textContent = '';
    } else { showAlert('profileAlert','error', data.message || 'Failed to update password.'); }
  } catch { showAlert('profileAlert','error','Connection error. Please try again.'); }
  finally { btn.disabled = false; btn.textContent = 'Update Password'; }
}

function toggleAdminPwd(inputId, btn) {
  const inp  = document.getElementById(inputId);
  const show = inp.type === 'password';
  inp.type = show ? 'text' : 'password';
  btn.textContent = show ? '🙈' : '👁';
}