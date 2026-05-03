let withdrawalCases = [];
let activeWithdrawalCase = null;

document.addEventListener('DOMContentLoaded', () => {
  checkSession();
  wireModal();
  loadWithdrawals();
  loadBadgeIndicators();

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      loadWithdrawals();
      loadBadgeIndicators();
    }
  });

  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      loadWithdrawals();
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
      setNavInfo(data.name);
    })
    .catch(() => {
      window.location.href = 'citizenLogin.html';
    });
}

function setNavInfo(fullName) {
  document.getElementById('citizenName').textContent = fullName;
  const parts = fullName.trim().split(' ');
  const initials = parts.length >= 2
    ? parts[0][0] + parts[parts.length - 1][0]
    : parts[0].substring(0, 2);
  document.getElementById('citizenInitials').textContent = initials.toUpperCase();
}

function loadWithdrawals() {
  fetch('../php/citizenGetWithdrawals.php')
    .then(r => r.json())
    .then(data => {
      document.getElementById('loadingState').style.display = 'none';

      if (!data.success) {
        showAlert('withdrawalAlert', 'error', data.message || 'Failed to load withdrawal cases.');
        return;
      }

      withdrawalCases = data.cases || [];
      setStats(withdrawalCases);
      renderCases(withdrawalCases);
    })
    .catch(() => {
      document.getElementById('loadingState').style.display = 'none';
      showAlert('withdrawalAlert', 'error', 'Connection error. Please refresh and try again.');
    });
}

function setStats(cases) {
  const eligible = cases.filter(c => c.can_withdraw).length;
  const pending = cases.filter(c => c.status === 'Withdrawal Pending' || c.latest_request_status === 'Pending').length;
  const withdrawn = cases.filter(c => c.status === 'Withdrawn').length;

  document.getElementById('statEligible').textContent = eligible;
  document.getElementById('statPending').textContent = pending;
  document.getElementById('statWithdrawn').textContent = withdrawn;
}

function renderCases(cases) {
  const list = document.getElementById('withdrawalsList');
  const visibleCases = cases.filter(c =>
    c.can_withdraw || c.status === 'Withdrawal Pending' || c.status === 'Withdrawn' || c.latest_request_status
  );

  if (!visibleCases.length) {
    document.getElementById('emptyState').style.display = 'flex';
    list.innerHTML = '';
    return;
  }

  document.getElementById('emptyState').style.display = 'none';

  list.innerHTML = visibleCases.map(c => `
    <div class="withdrawal-card">
      <div class="withdrawal-card-head">
        <div>
          <div class="withdrawal-card-ref">${escHtml(c.reference_number)}</div>
          <div class="withdrawal-card-title">${escHtml(c.category)}${c.incident_area ? ` — ${escHtml(c.incident_area)}` : ''}</div>
          <div class="withdrawal-card-sub">${escHtml(c.station_name || 'Station not assigned')}</div>
        </div>
        <div class="status-pill s-${escAttr(c.status)}">${escHtml(c.status)}</div>
      </div>

      <div class="withdrawal-card-grid">
        <div class="withdrawal-kv">
          <div class="withdrawal-kv-label">Officer</div>
          <div class="withdrawal-kv-value">${c.has_assigned_officer ? escHtml(c.assigned_officer_name) : 'Not assigned'}</div>
        </div>
        <div class="withdrawal-kv">
          <div class="withdrawal-kv-label">Withdrawal Mode</div>
          <div class="withdrawal-kv-value">${getModeLabel(c)}</div>
        </div>
        <div class="withdrawal-kv">
          <div class="withdrawal-kv-label">Latest Request</div>
          <div class="withdrawal-kv-value">${c.latest_request_status ? escHtml(c.latest_request_status) : 'None'}</div>
        </div>
        <div class="withdrawal-kv">
          <div class="withdrawal-kv-label">Submitted</div>
          <div class="withdrawal-kv-value">${formatDate(c.submitted_at)}</div>
        </div>
      </div>

      ${(c.latest_request_reason || c.latest_rejection_note) ? `
        <div class="withdrawal-hint" style="margin-bottom:12px;">
          ${c.latest_request_reason ? `<strong>Reason:</strong> ${escHtml(c.latest_request_reason)}` : ''}
          ${c.latest_request_reason && c.latest_rejection_note ? '<br>' : ''}
          ${c.latest_rejection_note ? `<strong>SHO Note:</strong> ${escHtml(c.latest_rejection_note)}` : ''}
        </div>
      ` : ''}

      <div class="withdrawal-card-footer">
        <div class="withdrawal-hint">${getHelpText(c)}</div>
        <div>
          <a href="caseDetail.html?ref=${encodeURIComponent(c.reference_number)}" class="btn-secondary">View Case</a>
          ${c.can_withdraw ? `<button type="button" class="btn-primary btn-open-withdrawal" data-id="${c.complaint_id}">${c.withdrawal_mode === 'direct' ? 'Withdraw Now' : 'Request Withdrawal'}</button>` : ''}
        </div>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.btn-open-withdrawal').forEach(btn => {
    btn.addEventListener('click', () => openWithdrawalModal(parseInt(btn.dataset.id, 10)));
  });
}

function getModeLabel(c) {
  if (c.status === 'Withdrawn') return 'Completed';
  if (c.status === 'Withdrawal Pending' || c.latest_request_status === 'Pending') return 'Pending SHO review';
  if (c.withdrawal_mode === 'direct') return 'Direct withdrawal';
  if (c.withdrawal_mode === 'request') return 'SHO approval required';
  return 'Not available';
}

function getHelpText(c) {
  if (c.status === 'Withdrawn') {
    return 'This case has already been withdrawn.';
  }
  if (c.status === 'Withdrawal Pending' || c.latest_request_status === 'Pending') {
    return 'Your withdrawal request is pending with the SHO.';
  }
  if (c.latest_request_status === 'Rejected') {
    return 'Your last withdrawal request was rejected. You may submit a new one if the case is still active.';
  }
  if (c.withdrawal_mode === 'direct') {
    return 'No officer has been assigned yet, so this withdrawal will happen immediately.';
  }
  if (c.withdrawal_mode === 'request') {
    return 'An officer is already assigned, so the SHO must review this request.';
  }
  return 'Withdrawal is not available for this case.';
}

function wireModal() {
  document.getElementById('closeModalBtn').addEventListener('click', closeWithdrawalModal);
  document.getElementById('cancelModalBtn').addEventListener('click', closeWithdrawalModal);
  document.getElementById('confirmWithdrawalBtn').addEventListener('click', submitWithdrawal);

  document.getElementById('withdrawalModal').addEventListener('click', e => {
    if (e.target.id === 'withdrawalModal') {
      closeWithdrawalModal();
    }
  });
}

function openWithdrawalModal(complaintId) {
  activeWithdrawalCase = withdrawalCases.find(c => c.complaint_id === complaintId) || null;
  if (!activeWithdrawalCase) return;

  document.getElementById('modalRef').textContent = activeWithdrawalCase.reference_number;
  document.getElementById('withdrawalReason').value = activeWithdrawalCase.latest_request_status === 'Rejected'
    ? ''
    : (activeWithdrawalCase.latest_request_reason || '');
  document.getElementById('confirmWithdrawalBtn').textContent = activeWithdrawalCase.withdrawal_mode === 'direct'
    ? 'Withdraw Case'
    : 'Submit Request';
  document.getElementById('modalModeText').textContent = activeWithdrawalCase.withdrawal_mode === 'direct'
    ? 'No officer has been assigned yet. Submitting this form will withdraw the case immediately.'
    : 'An officer is already assigned. Submitting this form will send a withdrawal request to the SHO.';
  hideAlert('modalAlert');
  document.getElementById('withdrawalModal').classList.add('open');
}

function closeWithdrawalModal() {
  document.getElementById('withdrawalModal').classList.remove('open');
  activeWithdrawalCase = null;
  hideAlert('modalAlert');
}

function submitWithdrawal() {
  if (!activeWithdrawalCase) return;

  const btn = document.getElementById('confirmWithdrawalBtn');
  const reason = document.getElementById('withdrawalReason').value.trim();

  if (reason.length < 10) {
    showAlert('modalAlert', 'error', 'Please enter at least 10 characters explaining why you want to withdraw this case.');
    return;
  }

  btn.disabled = true;
  btn.textContent = activeWithdrawalCase.withdrawal_mode === 'direct' ? 'Withdrawing...' : 'Submitting...';
  hideAlert('modalAlert');

  fetch('../php/citizenSubmitWithdrawal.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      complaint_id: activeWithdrawalCase.complaint_id,
      reason,
    }),
  })
    .then(r => r.json())
    .then(data => {
      if (!data.success) {
        showAlert('modalAlert', 'error', data.message || 'Unable to submit withdrawal.');
        return;
      }

      closeWithdrawalModal();
      showAlert('withdrawalAlert', 'success', data.message || 'Withdrawal submitted successfully.');
      document.getElementById('loadingState').style.display = 'flex';
      loadWithdrawals();
    })
    .catch(() => {
      showAlert('modalAlert', 'error', 'Connection error. Please try again.');
    })
    .finally(() => {
      btn.disabled = false;
      btn.textContent = activeWithdrawalCase && activeWithdrawalCase.withdrawal_mode === 'direct'
        ? 'Withdraw Case'
        : 'Submit Request';
    });
}

function showAlert(id, type, message) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `page-alert show ${type}`;
  el.textContent = message;
}

function hideAlert(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = 'page-alert';
  el.textContent = '';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
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
  fetch('../php/getComplaints.php')
    .then(r => r.json())
    .then(data => {
      if (!data.success || !Array.isArray(data.complaints)) return;
      const badge = document.getElementById('complaintBadge');
      if (badge) {
        badge.textContent = data.complaints.length;
        if (data.complaints.length > 0) {
          badge.classList.add('visible');
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
