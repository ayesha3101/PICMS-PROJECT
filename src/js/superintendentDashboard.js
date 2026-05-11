const state = { detainees: [], cells: [], hearings: [], cases: [], profile: null };

const byId = (id) => document.getElementById(id);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (m) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
const fullName = (d) => [d.d_fname, d.d_minit, d.d_lname].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
const fmtDate = (v) => v ? new Date(v).toLocaleDateString('en-GB') : '—';

function openModal(id) { byId(id).classList.add('open'); }
function closeModal(id) { byId(id).classList.remove('open'); }

function showAlert(id, type, msg) {
  const el = byId(id);
  if (!el) return;
  el.className = `alert show alert-${type}`;
  el.textContent = msg;
}

function hideAlert(id) {
  const el = byId(id);
  if (!el) return;
  el.className = 'alert';
  el.textContent = '';
}

function wireModalCloseButtons() {
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });
}

function setTopbarDate() {
  const d = new Date();
  byId('topbarDate').textContent = d.toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

async function api(url, options = {}) {
  const res = await fetch(url, options);
  return res.json();
}

async function checkSession() {
  const data = await api('../php/superintendentCheckSession.php');
  if (!data.success) { window.location.href = 'officerLogin.html'; return false; }
  return true;
}

function wireNavigation() {
  document.querySelectorAll('.nav-item[data-page]').forEach((item) => {
    item.addEventListener('click', () => {
      const page = item.dataset.page;
      document.querySelectorAll('.nav-item[data-page]').forEach((x) => x.classList.remove('active'));
      item.classList.add('active');
      document.querySelectorAll('.page-section').forEach((s) => s.classList.remove('active'));
      const pageEl = document.getElementById(`page-${page}`);
      if (pageEl) pageEl.classList.add('active');
      updatePageTitle(page);
    });
  });
}

function updatePageTitle(page) {
  const titles = {
    detainees: { title: 'Detainee Management', subtitle: 'Add, edit, and manage detainee records' },
    cells: { title: 'Cell Management', subtitle: 'View cell occupancy and availability' },
    hearings: { title: 'Court Hearings', subtitle: 'Upcoming hearings for detainees' },
    cases: { title: 'Linked Cases', subtitle: 'Citizen-registered cases linked to detainees' },
    profile: { title: 'My Profile', subtitle: 'Account details and security settings' }
  };
  const data = titles[page] || { title: 'Dashboard', subtitle: 'Custody Operations Portal' };
  byId('pageTitle').textContent = data.title;
  byId('pageSubtitle').textContent = data.subtitle;
}

async function loadStats() {
  try {
    const d = await api('../php/superintendentGetStats.php');
    if (!d.success) {
      console.warn('Failed to load stats:', d.message);
      return;
    }
    byId('stDetainees').textContent = d.active_detainees || 0;
    byId('stCells').textContent = d.cells || 0;
    byId('stHearings').textContent = d.upcoming_hearings || 0;
  } catch (e) {
    console.error('Error loading stats:', e);
  }
}

async function loadProfile() {
  try {
    const d = await api('../php/superintendentGetProfile.php');
    if (!d.success) {
      console.warn('Failed to load profile:', d.message);
      return;
    }
    state.profile = d.profile || {};
    const name = d.profile?.full_name || 'Officer';
    const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '—';
    byId('suptInitials').textContent = initials;
    byId('suptName').textContent = name;
    byId('suptBadge').textContent = d.profile?.badge_number || '—';
    byId('suptAvatarTop').textContent = initials;
    byId('suptNameTop').textContent = name;
    byId('suptRankTop').textContent = d.profile?.rank || '—';
    byId('pFullName').textContent = name;
    byId('pBadgeSub').textContent = `Badge: ${d.profile?.badge_number || '—'}`;
    byId('pAvatarLg').textContent = initials;
    byId('pName').textContent = name;
    byId('pBadge').textContent = d.profile?.badge_number || '—';
    byId('pRank').textContent = d.profile?.rank || '—';
    byId('pEmail').textContent = d.profile?.email || '—';
    byId('pStation').textContent = d.profile?.station_name || '—';
  } catch (e) {
    console.error('Error loading profile:', e);
  }
}

async function loadDetainees() {
  try {
    const d = await api('../php/superintendentGetDetainees.php');
    if (!d.success) {
      console.warn('Failed to load detainees:', d.message);
      return;
    }
    state.detainees = d.detainees || [];
    renderDetainees();
  } catch (e) {
    console.error('Error loading detainees:', e);
  }
}

async function loadCells() {
  try {
    const d = await api('../php/superintendentGetCells.php');
    if (!d.success) {
      console.warn('Failed to load cells:', d.message);
      return;
    }
    state.cells = d.cells || [];
    renderCells();
  } catch (e) {
    console.error('Error loading cells:', e);
  }
}

async function loadHearings() {
  try {
    const d = await api('../php/superintendentGetHearings.php');
    if (!d.success) {
      console.warn('Failed to load hearings:', d.message);
      return;
    }
    state.hearings = d.hearings || [];
    renderHearings();
  } catch (e) {
    console.error('Error loading hearings:', e);
  }
}

async function loadCases() {
  try {
    const d = await api('../php/superintendentGetCases.php');
    if (!d.success) {
      console.warn('Failed to load cases:', d.message);
      return;
    }
    state.cases = d.cases || [];
    renderCases();
  } catch (e) {
    console.error('Error loading cases:', e);
  }
}

function renderDetainees() {
  const g = byId('fDetGender').value;
  const cellState = byId('fDetCell').value;
  const s = byId('fDetSearch').value.trim().toLowerCase();
  let rows = state.detainees.filter((d) => {
    if (g && d.gender !== g) return false;
    if (cellState === 'assigned' && !d.cell_code) return false;
    if (cellState === 'unassigned' && d.cell_code) return false;
    if (s) {
      const hit = `${fullName(d)} ${d.cnic || ''} ${d.reference_number || ''}`.toLowerCase();
      if (!hit.includes(s)) return false;
    }
    return true;
  });
  byId('detCount').textContent = rows.length;
  byId('detTbody').innerHTML = rows.length ? rows.map((d) => `
    <tr>
      <td>${esc(fullName(d))}</td>
      <td><span class="pill">${esc(d.gender)}</span></td>
      <td>${esc(d.age)}</td>
      <td>${d.cell_code ? `${esc(d.cell_code)}` : '<span class="muted">Unassigned</span>'}</td>
      <td>${d.reference_number ? esc(d.reference_number) : '<span class="muted">—</span>'}</td>
      <td>${fmtDate(d.admission_date)}</td>
      <td class="actions">
        <button class="btn-action" onclick="openEditDetainee(${d.detainee_id})">Edit</button>
        <button class="btn-action" onclick="openAssignCellModal(${d.detainee_id})">Assign Cell</button>
        <button class="btn-action btn-danger" onclick="openDeleteModal(${d.detainee_id})">Remove</button>
      </td>
    </tr>`).join('') : '<tr><td colspan="7" class="tbl-empty"><div class="loading-row">No detainees found.</div></td></tr>';
}

function renderCells() {
  const g = byId('fCellGender').value;
  const a = byId('fCellAvail').value;
  const s = byId('fCellSearch').value.trim().toLowerCase();
  const rows = state.cells.filter((c) => {
    if (g && c.gender !== g) return false;
    const available = Number(c.capacity) - Number(c.occupied);
    if (a === 'available' && available <= 0) return false;
    if (a === 'full' && available > 0) return false;
    if (s && !String(c.cell_code).toLowerCase().includes(s)) return false;
    return true;
  });
  byId('cellCount').textContent = rows.length;
  byId('cellTbody').innerHTML = rows.length ? rows.map((c) => {
    const available = Number(c.capacity) - Number(c.occupied);
    return `<tr><td>${esc(c.cell_code)}</td><td>${esc(c.gender)}</td><td>${esc(c.capacity)}</td><td>${esc(c.occupied)}</td><td>${available}</td></tr>`;
  }).join('') : '<tr><td colspan="5" class="tbl-empty"><div class="loading-row">No cells found.</div></td></tr>';
}

function renderHearings() {
  const g = byId('fHearGender').value;
  const dt = byId('fHearDate').value;
  const s = byId('fHearSearch').value.trim().toLowerCase();
  const rows = state.hearings.filter((h) => {
    if (g && h.gender !== g) return false;
    if (dt && h.hearing_date !== dt) return false;
    if (s) {
      const hit = `${h.detainee_name || ''} ${h.court_name || ''} ${h.reference_number || ''}`.toLowerCase();
      if (!hit.includes(s)) return false;
    }
    return true;
  });
  byId('hearCount').textContent = rows.length;
  byId('hearTbody').innerHTML = rows.length ? rows.map((h) => `
    <tr>
      <td>${esc(h.detainee_name)}</td>
      <td>${fmtDate(h.hearing_date)} ${h.hearing_time ? ` ${esc(String(h.hearing_time).slice(0,5))}` : ''}</td>
      <td>${esc(h.court_name || '—')}</td>
      <td>${esc(h.hearing_type || '—')}</td>
      <td>${esc(h.result || '—')}</td>
      <td>${esc(h.reference_number || '—')}</td>
    </tr>`).join('') : '<tr><td colspan="6" class="tbl-empty"><div class="loading-row">No hearings found.</div></td></tr>';
}

function renderCases() {
  const g = byId('fCaseGender').value;
  const s = byId('fCaseSearch').value.trim().toLowerCase();
  const rows = state.cases.filter((c) => {
    if (g && c.gender !== g) return false;
    if (s) {
      const hit = `${c.detainee_name || ''} ${c.reference_number || ''} ${c.cnic || ''} ${c.incident_area || ''}`.toLowerCase();
      if (!hit.includes(s)) return false;
    }
    return true;
  });
  byId('caseCount').textContent = rows.length;
  byId('caseTbody').innerHTML = rows.length ? rows.map((c) => `
    <tr>
      <td>${esc(c.detainee_name)}</td>
      <td>${esc(c.reference_number)}</td>
      <td><span class="pill">${esc(c.status)}</span></td>
      <td>${esc(c.incident_area || '—')}</td>
      <td>${esc(c.cnic || '—')}</td>
      <td>${fmtDate(c.incident_date)}</td>
    </tr>`).join('') : '<tr><td colspan="6" class="tbl-empty"><div class="loading-row">No linked cases found.</div></td></tr>';
}

function wireFilters() {
  [['fDetGender','change',renderDetainees],['fDetCell','change',renderDetainees],['fDetSearch','input',renderDetainees]]
    .forEach(([id, ev, fn]) => byId(id).addEventListener(ev, fn));
  byId('fDetClear').addEventListener('click', () => { byId('fDetGender').value=''; byId('fDetCell').value=''; byId('fDetSearch').value=''; renderDetainees(); });

  [['fCellGender','change',renderCells],['fCellAvail','change',renderCells],['fCellSearch','input',renderCells]]
    .forEach(([id, ev, fn]) => byId(id).addEventListener(ev, fn));
  byId('fCellClear').addEventListener('click', () => { byId('fCellGender').value=''; byId('fCellAvail').value=''; byId('fCellSearch').value=''; renderCells(); });

  [['fHearGender','change',renderHearings],['fHearDate','change',renderHearings],['fHearSearch','input',renderHearings]]
    .forEach(([id, ev, fn]) => byId(id).addEventListener(ev, fn));
  byId('fHearClear').addEventListener('click', () => { byId('fHearGender').value=''; byId('fHearDate').value=''; byId('fHearSearch').value=''; renderHearings(); });

  [['fCaseGender','change',renderCases],['fCaseSearch','input',renderCases]]
    .forEach(([id, ev, fn]) => byId(id).addEventListener(ev, fn));
  byId('fCaseClear').addEventListener('click', () => { byId('fCaseGender').value=''; byId('fCaseSearch').value=''; renderCases(); });
}

function wireSidebarToggle() {
  const toggle = byId('sidebarToggle');
  const sidebar = byId('sidebar');
  if (toggle) toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
}

function openDetaineeModal(d = null) {
  byId('detModalTitle').textContent = d ? 'Edit Detainee' : 'Add Detainee';
  byId('detId').value = d?.detainee_id || '';
  byId('detFName').value = d?.d_fname || '';
  byId('detMInit').value = d?.d_minit || '';
  byId('detLName').value = d?.d_lname || '';
  byId('detCNIC').value = d?.cnic || '';
  byId('detAge').value = d?.age || '';
  byId('detGender').value = d?.gender || '';
  byId('detPurpose').value = d?.purpose_of_admission || 'Remand';
  byId('detAdmission').value = d?.admission_date || '';
  byId('detComplaint').value = d?.complaint_id || '';
  hideAlert('detAlert');
  openModal('detModalBg');
}

window.openEditDetainee = (id) => openDetaineeModal(state.detainees.find((d) => Number(d.detainee_id) === Number(id)));

// Delete confirmation state
let deleteConfirmMode = false;
let deleteTargetId = null;

window.openDeleteModal = (id) => {
  const d = state.detainees.find((x) => Number(x.detainee_id) === Number(id));
  if (!d) return;
  deleteTargetId = id;
  deleteConfirmMode = false;
  byId('delName').textContent = esc(fullName(d));
  byId('btnConfirmDelete').textContent = 'Delete (Click Again to Confirm)';
  hideAlert('alertDeleteConfirm');
  openModal('modalDeleteDetainee');
};

byId('btnConfirmDelete').addEventListener('click', async () => {
  if (!deleteConfirmMode) {
    deleteConfirmMode = true;
    byId('btnConfirmDelete').textContent = '⚠ Click Again to Confirm Deletion';
    showAlert('alertDeleteConfirm', 'warning', '⚠ This action cannot be undone. All records will be permanently deleted.');
  } else {
    byId('btnConfirmDelete').disabled = true;
    byId('btnConfirmDelete').textContent = 'Deleting…';
    const res = await api('../php/superintendentDeleteDetainee.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ detainee_id: deleteTargetId })
    });
    byId('btnConfirmDelete').disabled = false;
    if (!res.success) {
      deleteConfirmMode = false;
      byId('btnConfirmDelete').textContent = 'Delete (Click Again to Confirm)';
      showAlert('alertDeleteConfirm', 'error', res.message || 'Failed to delete detainee.');
      return;
    }
    closeModal('modalDeleteDetainee');
    await Promise.all([loadDetainees(), loadCells(), loadStats()]);
  }
});

// Cell assignment state
let assignTargetDetainee = null;

window.openAssignCellModal = (id) => {
  const d = state.detainees.find((x) => Number(x.detainee_id) === Number(id));
  if (!d) return;
  assignTargetDetainee = d;
  byId('assignDetName').textContent = esc(fullName(d));
  byId('assignCellGender').textContent = esc(d.gender);
  const options = state.cells
    .filter((c) => c.gender === d.gender)
    .map((c) => ({ ...c, available: Number(c.capacity) - Number(c.occupied) }));
  const select = byId('assignCellSelect');
  select.innerHTML = '<option value="">Choose a cell…</option>' +
    options.map((c) => `<option value="${c.cell_id}">${esc(c.cell_code)} (${c.occupied}/${c.capacity})</option>`).join('');
  hideAlert('alertAssignCell');
  byId('assignCellInfo').style.display = 'none';
  openModal('modalAssignCell');
};

byId('assignCellSelect').addEventListener('change', () => {
  const cellId = Number(byId('assignCellSelect').value);
  if (!cellId) {
    byId('assignCellInfo').style.display = 'none';
    return;
  }
  const cell = state.cells.find((c) => Number(c.cell_id) === cellId);
  if (!cell) return;
  const available = Number(cell.capacity) - Number(cell.occupied);
  byId('infoCapacity').textContent = esc(cell.capacity);
  byId('infoOccupied').textContent = esc(cell.occupied);
  byId('infoAvailable').textContent = esc(available);
  byId('infoGender').textContent = esc(cell.gender);
  byId('assignCellInfo').style.display = 'block';
});

byId('btnAssignCell').addEventListener('click', async () => {
  const cellId = Number(byId('assignCellSelect').value);
  if (!cellId || !assignTargetDetainee) {
    showAlert('alertAssignCell', 'error', 'Please select a cell.');
    return;
  }
  byId('btnAssignCell').disabled = true;
  byId('btnAssignCell').textContent = 'Assigning…';
  const res = await api('../php/superintendentAssignCell.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ detainee_id: assignTargetDetainee.detainee_id, cell_id: cellId })
  });
  byId('btnAssignCell').disabled = false;
  byId('btnAssignCell').textContent = 'Assign Cell';
  if (!res.success) {
    showAlert('alertAssignCell', 'error', res.message || 'Failed to assign cell.');
    return;
  }
  closeModal('modalAssignCell');
  await Promise.all([loadDetainees(), loadCells()]);
});

function wireDetaineeModal() {
  byId('addDetaineeBtn').addEventListener('click', () => openDetaineeModal());
  byId('detSaveBtn').addEventListener('click', async () => {
    const payload = {
      detainee_id: byId('detId').value || null,
      d_fname: byId('detFName').value.trim(),
      d_minit: byId('detMInit').value.trim(),
      d_lname: byId('detLName').value.trim(),
      cnic: byId('detCNIC').value.trim(),
      age: Number(byId('detAge').value),
      gender: byId('detGender').value,
      purpose_of_admission: byId('detPurpose').value,
      admission_date: byId('detAdmission').value,
      complaint_id: byId('detComplaint').value || null,
    };
    byId('detSaveBtn').disabled = true;
    byId('detSaveBtn').textContent = 'Saving…';
    const res = await api('../php/superintendentSaveDetainee.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    byId('detSaveBtn').disabled = false;
    byId('detSaveBtn').textContent = 'Save Detainee';
    if (!res.success) {
      showAlert('detAlert', 'error', res.message || 'Failed to save detainee.');
      return;
    }
    showAlert('detAlert', 'success', 'Saved successfully.');
    setTimeout(() => {
      closeModal('detModalBg');
      Promise.all([loadDetainees(), loadCells(), loadCases(), loadStats()]);
    }, 600);
  });
}

function wireProfileActions() {
  byId('cpBtn').addEventListener('click', async () => {
    const body = {
      current_password: byId('cpCurrent').value,
      new_password: byId('cpNew').value,
      confirm_password: byId('cpConfirm').value,
    };
    const res = await api('../php/superintendentChangePassword.php', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    byId('cpMsg').textContent = res.success ? 'Password updated.' : (res.message || 'Failed to update password.');
    if (res.success) { byId('cpCurrent').value=''; byId('cpNew').value=''; byId('cpConfirm').value=''; }
  });
  byId('logoutBtn').addEventListener('click', () => {
    fetch('../php/officerLogout.php', { method:'POST' }).finally(() => window.location.href = 'officerLogin.html');
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const ok = await checkSession();
  if (!ok) return;
  setTopbarDate();
  wireModalCloseButtons();
  wireNavigation();
  wireSidebarToggle();
  wireFilters();
  wireDetaineeModal();
  wireProfileActions();
  await Promise.all([loadStats(), loadProfile(), loadDetainees(), loadCells(), loadHearings(), loadCases()]);
});
