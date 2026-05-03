let allComplaints = [];

document.addEventListener('DOMContentLoaded', () => {
  checkSession();
  loadComplaints();
  loadBadgeIndicators();
  wireFilters();

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      loadComplaints();
      loadBadgeIndicators();
    }
  });

  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      loadComplaints();
      loadBadgeIndicators();
    }
  });
});

function checkSession() {
  fetch('../php/checkSession.php')
    .then(r => r.json())
    .then(data => {
      if (!data.logged_in) {
        window.location.href = 'citizenLogin.html';
        return;
      }
      const nameEl = document.getElementById('citizenName');
      const initialsEl = document.getElementById('citizenInitials');
      if (nameEl) nameEl.textContent = data.name || 'Citizen';
      if (initialsEl) {
        const fullName = (data.name || 'Citizen').trim();
        const parts = fullName.split(' ');
        const initials = parts.length >= 2
          ? parts[0][0] + parts[parts.length - 1][0]
          : fullName.slice(0, 2);
        initialsEl.textContent = initials.toUpperCase();
      }
    })
    .catch(() => {
      window.location.href = 'citizenLogin.html';
    });
}

function loadComplaints() {
  fetch('../php/getComplaints.php')
    .then(r => r.json())
    .then(data => {
      const loading = document.getElementById('loadingState');
      if (loading) loading.style.display = 'none';

      if (!data.success) {
        showEmpty('Failed to load your complaints.');
        return;
      }
      allComplaints = Array.isArray(data.complaints) ? data.complaints : [];
      applyFilters();
    })
    .catch(() => {
      const loading = document.getElementById('loadingState');
      if (loading) loading.style.display = 'none';
      showEmpty('Connection error. Please refresh and try again.');
    });
}

function wireFilters() {
  const search = document.getElementById('searchRef');
  const status = document.getElementById('filterStatus');
  const clearBtn = document.getElementById('clearFiltersBtn');
  if (search) search.addEventListener('input', applyFilters);
  if (status) status.addEventListener('change', applyFilters);
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (search) search.value = '';
      if (status) status.value = '';
      applyFilters();
    });
  }
}

function applyFilters() {
  const searchVal = (document.getElementById('searchRef')?.value || '').trim().toLowerCase();
  const statusVal = document.getElementById('filterStatus')?.value || '';

  const filtered = allComplaints.filter(c => {
    if (statusVal && c.status !== statusVal) return false;
    if (searchVal) {
      const ref = (c.reference_number || '').toLowerCase();
      const area = (c.incident_area || '').toLowerCase();
      if (!ref.includes(searchVal) && !area.includes(searchVal)) return false;
    }
    return true;
  });

  const summary = document.getElementById('resultSummary');
  if (summary) {
    summary.textContent = `${filtered.length} complaint${filtered.length === 1 ? '' : 's'}`;
  }
  renderList(filtered);
}

function renderList(items) {
  const list = document.getElementById('complaintsList');
  const empty = document.getElementById('emptyState');
  if (!list) return;

  if (!items.length) {
    list.innerHTML = '';
    if (empty) empty.style.display = 'flex';
    return;
  }

  if (empty) empty.style.display = 'none';
  list.innerHTML = items.map(c => `
    <div class="complaint-card">
      <div class="card-inner">
        <div class="card-body">
          <div class="card-ref">${escHtml(c.reference_number)}</div>
          <div class="card-title">${escHtml(c.category || 'General')} — ${escHtml(c.incident_area || 'N/A')}</div>
          <div class="card-sub">${escHtml(c.station_name || 'Station pending')} · ${formatDate(c.submitted_at)}</div>
        </div>
        <div class="card-right">
          <span class="status-pill s-${escAttr(c.status)}">${escHtml(c.status)}</span>
          <a class="btn-primary" style="padding:8px 12px;font-size:12px;" href="caseDetail.html?ref=${encodeURIComponent(c.reference_number)}">Open</a>
        </div>
      </div>
    </div>
  `).join('');
}

function showEmpty(msg) {
  const empty = document.getElementById('emptyState');
  const text = document.getElementById('emptyText');
  if (empty) empty.style.display = 'flex';
  if (text) text.textContent = msg;
  const list = document.getElementById('complaintsList');
  if (list) list.innerHTML = '';
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function escHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escAttr(str) {
  if (!str) return '';
  return String(str).replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '');
}

function loadBadgeIndicators() {
  fetch('../php/citizenGetWithdrawals.php')
    .then(r => r.json())
    .then(data => {
      if (!data.success || !Array.isArray(data.cases)) return;
      const pending = data.cases.filter(c =>
        c.status === 'Withdrawal Pending' || c.latest_request_status === 'Pending'
      ).length;
      const badge = document.getElementById('withdrawalBadge');
      if (badge) {
        if (pending > 0) {
          badge.textContent = pending;
          badge.classList.add('visible');
        } else {
          badge.classList.remove('visible');
        }
      }
    })
    .catch(() => {});

  fetch('../php/citizenGetAppointments.php?count_only=1')
    .then(r => r.json())
    .then(data => {
      if (!data.success) return;
      const pending = Number(data.pending || 0);
      const badge = document.getElementById('appointmentBadge');
      if (badge) {
        if (pending > 0) {
          badge.textContent = pending;
          badge.classList.add('visible');
        } else {
          badge.classList.remove('visible');
        }
      }
    })
    .catch(() => {});
}
