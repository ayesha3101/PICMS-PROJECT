// ══════════════════════════════════════════════
// citizenDashboard.js
// Job: session guard, load citizen info,
//      fetch complaints, render cards + stats
// ══════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    loadDashboard();
});

// ── 1. Session guard
//    Calls checkSession.php — if not logged in, redirect immediately
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

// ── 2. Set nav initials + name from session data
function setNavInfo(fullName) {
    document.getElementById('citizenName').textContent = fullName;

    // Build 2-letter initials from first + last name
    const parts    = fullName.trim().split(' ');
    const initials = parts.length >= 2
        ? parts[0][0] + parts[parts.length - 1][0]
        : parts[0].substring(0, 2);

    document.getElementById('citizenInitials').textContent = initials.toUpperCase();
}

// ── 3. Load complaints from DB and render dashboard
function loadDashboard() {
    fetch('../php/getComplaints.php')
        .then(r => r.json())
        .then(data => {
            document.getElementById('loadingState').style.display = 'none';

            // No complaints yet — show empty state
            if (!data.success || !data.complaints || data.complaints.length === 0) {
                document.getElementById('emptyState').style.display = 'flex';
                setStats([]);
                return;
            }

            renderCards(data.complaints);
            setStats(data.complaints);
        })
        .catch(() => {
            // Network or server error — show empty state as fallback
            document.getElementById('loadingState').style.display = 'none';
            document.getElementById('emptyState').style.display   = 'flex';
        });
}

// ── 4. Build and insert complaint cards into the DOM
function renderCards(complaints) {
    const list = document.getElementById('cardsList');
    list.innerHTML = '';

    complaints.forEach(c => {
        const card      = document.createElement('a');
        card.href       = `caseDetail.html?ref=${c.reference_number}`;
        card.className  = 'complaint-card';
        card.dataset.status = c.status;

        const icon = getCategoryIcon(c.category);
        const date = formatDate(c.submitted_at);

        // Sanitize all DB strings before inserting into HTML
        card.innerHTML = `
            <div class="card-accent accent-${escAttr(c.status)}"></div>
            <div class="card-inner">
                <div class="card-cat-icon">${icon}</div>
                <div class="card-body">
                    <div class="card-ref">${escHtml(c.reference_number)}</div>
                    <div class="card-title">${escHtml(c.category)} — ${escHtml(c.incident_area || 'Karachi')}</div>
                    <div class="card-sub">${escHtml(c.station_name || '')} &nbsp;·&nbsp; ${escHtml(c.subcategory || c.category)}</div>
                </div>
                <div class="card-right">
                    <span class="status-pill s-${escAttr(c.status)}">${escHtml(c.status)}</span>
                    <span class="card-date">${date}</span>
                    <svg class="card-chevron" viewBox="0 0 24 24"><polyline points="9,18 15,12 9,6"/></svg>
                </div>
            </div>`;

        list.appendChild(card);
    });

    // Show complaint count badge in sidebar
    const badge = document.getElementById('complaintBadge');
    if (badge) {
        badge.textContent = complaints.length;
        badge.classList.add('visible');
    }
}

// ── 5. Calculate and display stat card numbers
function setStats(complaints) {
    const total    = complaints.length;

    // Count by status group
    const review   = complaints.filter(c =>
        c.status === 'Submitted' || c.status === 'Under Review' || c.status === 'Accepted'
    ).length;

    const assigned = complaints.filter(c =>
        c.status === 'Officer Assigned' || c.status === 'Investigation Ongoing'
    ).length;

    const resolved = complaints.filter(c =>
        c.status === 'Resolved' || c.status === 'Closed'
    ).length;

    document.getElementById('statTotal').textContent    = total;
    document.getElementById('statReview').textContent   = review;
    document.getElementById('statAssigned').textContent = assigned;
    document.getElementById('statResolved').textContent = resolved;
}

// ── 6. Filter pills — show/hide cards by status
function filterCards(status, el) {
    // Remove active from all pills, set on clicked one
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    el.classList.add('active');

    // Show all or filter by matching data-status attribute
    document.querySelectorAll('.complaint-card').forEach(card => {
        card.style.display = (status === 'all' || card.dataset.status === status)
            ? 'flex'
            : 'none';
    });
}

// ── 7. Return the right SVG icon for each complaint category
function getCategoryIcon(category) {
    const icons = {
        'Theft / Robbery':
            `<svg viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"/><polygon points="16,8 20,8 23,11 23,16 16,16 16,8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
        'Harassment / Threats':
            `<svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
        'Fraud / Cybercrime':
            `<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
        'Missing Person':
            `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
        'Property Dispute':
            `<svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>`,
        'Domestic Violence':
            `<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
        'Traffic Incident':
            `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
        'Corruption / Misconduct':
            `<svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    };

    // Fallback to generic document icon for unknown categories
    return icons[category] ||
        `<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>`;
}

// ── 8. Format ISO timestamp to readable date e.g. "18 Mar 2026"
function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
}

// ── 9. Escape HTML to prevent XSS when inserting DB strings into innerHTML
function escHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ── 10. Escape for use inside HTML attribute values (class names, data attrs)
//     Replaces spaces with dashes so CSS class selectors work
function escAttr(str) {
    if (!str) return '';
    return str.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '');
}