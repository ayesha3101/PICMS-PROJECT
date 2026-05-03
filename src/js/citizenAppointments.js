let appointmentData = [];

document.addEventListener('DOMContentLoaded', () => {
  checkSession();
  loadAppointments();
  loadBadgeIndicators();

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      loadAppointments();
      loadBadgeIndicators();
    }
  });

  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      loadAppointments();
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

function loadAppointments() {
  fetch('../php/citizenGetAppointments.php')
    .then(r => r.json())
    .then(data => {
      document.getElementById('loadingState').style.display = 'none';

      if (!data.success) {
        showAlert('pageAlert', 'error', data.message || 'Failed to load appointments.');
        return;
      }

      appointmentData = data.appointments || [];
      setStats(appointmentData);
      renderAppointments(appointmentData);
    })
    .catch(() => {
      document.getElementById('loadingState').style.display = 'none';
      showAlert('pageAlert', 'error', 'Connection error. Please refresh and try again.');
    });
}

function setStats(list) {
  document.getElementById('statPending').textContent = list.filter(a => a.status === 'Pending').length;
  document.getElementById('statAccepted').textContent = list.filter(a => a.status === 'Accepted').length;
  document.getElementById('statTotal').textContent = list.length;
}

function renderAppointments(list) {
  const container = document.getElementById('appointmentList');

  if (!list.length) {
    document.getElementById('emptyState').style.display = 'flex';
    container.innerHTML = '';
    return;
  }

  document.getElementById('emptyState').style.display = 'none';

  container.innerHTML = list.map(appt => `
    <div class="appointment-record">
      <div class="appointment-record-head">
        <div>
          <div class="appointment-ref">${escHtml(appt.reference_number)}</div>
          <div class="appointment-title">${formatDate(appt.scheduled_date)} at ${formatTime(appt.start_time)} - ${formatTime(appt.end_time)}</div>
          <div class="appointment-sub">${escHtml(appt.station_name || 'Station pending')} · ${escHtml(appt.location || 'Location pending')}</div>
        </div>
        <div class="status-pill s-${escAttr(appt.status)}">${escHtml(appt.status)}</div>
      </div>

      <div class="appointment-grid">
        <div class="appointment-box">
          <div class="appointment-box-label">Response Needed</div>
          <div class="appointment-box-value">${appt.status === 'Pending' ? 'Accept before the scheduled time' : 'No action needed'}</div>
        </div>
        <div class="appointment-box">
          <div class="appointment-box-label">Strike Count</div>
          <div class="appointment-box-value">${Number(appt.miss_count || 0)} missed appointment(s)</div>
        </div>
        <div class="appointment-box">
          <div class="appointment-box-label">Created</div>
          <div class="appointment-box-value">${formatDateTime(appt.created_at)}</div>
        </div>
        <div class="appointment-box">
          <div class="appointment-box-label">Cancellation Note</div>
          <div class="appointment-box-value">${escHtml(appt.cancellation_reason || 'None')}</div>
        </div>
      </div>

      <div class="appointment-footer">
        <div class="appointment-hint">${getAppointmentHint(appt)}</div>
        <div>
          <a href="caseDetail.html?ref=${encodeURIComponent(appt.reference_number)}" class="btn-secondary">View Case</a>
          ${appt.can_accept ? `<button type="button" class="btn-primary btn-accept-appointment" data-id="${appt.appointment_id}">Accept Appointment</button>` : ''}
        </div>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.btn-accept-appointment').forEach(btn => {
    btn.addEventListener('click', () => acceptAppointment(parseInt(btn.dataset.id, 10), btn));
  });
}

function acceptAppointment(appointmentId, button) {
  button.disabled = true;
  button.textContent = 'Accepting...';
  hideAlert('pageAlert');

  fetch('../php/citizenAppointmentAction.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appointment_id: appointmentId, action: 'accept' }),
  })
    .then(r => r.json())
    .then(data => {
      if (!data.success) {
        showAlert('pageAlert', 'error', data.message || 'Failed to accept appointment.');
        return;
      }

      showAlert('pageAlert', 'success', data.message || 'Appointment accepted.');
      document.getElementById('loadingState').style.display = 'flex';
      loadAppointments();
    })
    .catch(() => {
      showAlert('pageAlert', 'error', 'Connection error. Please try again.');
    })
    .finally(() => {
      button.disabled = false;
      button.textContent = 'Accept Appointment';
    });
}

function getAppointmentHint(appt) {
  if (appt.status === 'Pending') {
    return 'You must accept this appointment before its scheduled start time.';
  }
  if (appt.status === 'Accepted') {
    return 'You have accepted this appointment. Attend it on time to avoid cancellation.';
  }
  if (appt.status === 'Cancelled') {
    return 'This appointment was cancelled. After two missed or unaccepted meetings, the case is closed.';
  }
  if (appt.status === 'Completed') {
    return 'This meeting has been completed.';
  }
  return '';
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
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(timeStr) {
  if (!timeStr) return '—';
  return timeStr.slice(0, 5);
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    + ' · '
    + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
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
}
