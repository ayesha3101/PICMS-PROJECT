# PICMS Test Matrix (SRS → Test Cases)

This document converts system functionality into **testable requirements** and a **traceable test matrix**.

## How to use
- **ID format**
  - Requirements: `FR-xx`
  - Manual test cases: `TC-<MODULE>-###`
- **Test levels**
  - **API**: call PHP endpoints directly (e.g., Postman)
  - **UI**: execute via HTML/JS pages
- **Expected DB impact**
  - Where applicable, verify table changes in `database/schema.sql` entities.

## System actors
- **Citizen** (portal)
- **Officer**: Investigating Officer (IO), SHO, Superintendent (same `officers` table, role_id-driven)
- **Admin**
- **System automations** (triggers + appointment lifecycle)

## Environment assumptions (for test execution)
- Web server: XAMPP/Apache serving `/src/`
- PHP: 8.x
- DB: MySQL/MariaDB with schema from `database/schema.sql`
- Seed data may exist from schema; if not, prepare test accounts via DB inserts.

---

## 1) Authentication, sessions, OTP, password flows

### Endpoint inventory
- Citizen:
  - `src/php/citizenRegister.php` (register + send OTP)
  - `src/php/sendOTP.php` (resend OTP)
  - `src/php/verifyOTP.php` (verify OTP)
  - `src/php/citizenLogin.php` (login)
  - `src/php/checkSession.php` (session check)
  - `src/php/citizenLogout.php` (logout)
  - `src/php/forgotPassword.php` (forgot step)
  - `src/php/changePassword.php` (reset password)
  - `src/php/changePasswordAuth.php` (change password in-session)
- Officer:
  - `src/php/officerLogin.php`
  - `src/php/ioCheckSession.php`, `src/php/shoCheckSession.php`, `src/php/superintendentCheckSession.php`
  - `src/php/officerLogout.php`
  - `src/php/officerForgotPassword.php`, `src/php/officerVerifyOTP.php`, `src/php/officerResetPassword.php`
  - `src/php/officerChangePassword.php`
- Admin:
  - `src/php/adminLogin.php`
  - `src/php/adminCheckSession.php`
  - `src/php/adminLogout.php`
  - `src/php/adminForgotPassword.php`, `src/php/adminVerifyOTP.php`, `src/php/adminResetPassword.php`
  - `src/php/changeAdminPassword.php`

### UI entry points
- Citizen: `src/citizen/citizenRegister.html` + `src/js/citizenRegister.js`, `src/citizen/citizenLogin.html` + `src/js/citizenLogin.js`, `src/citizen/forgotPassword.html` + `src/js/forgotPassword.js`
- Officer: `src/officer/officerLogin.html`
- Admin: `src/admin/adminLogin.html` + `src/js/adminLogin.js`

### Requirements → test cases

#### FR-01 / FR-02 Citizen registration validation
- **TC-AUTH-001 (UI)** Valid registration sends OTP
  - **Pre**: CNIC + email not already used.
  - **Steps**: Open `citizenRegister.html` → fill first/last, CNIC, email, password meeting rules → submit.
  - **Expect**: Success message/OTP modal opens; server returns `success=true`.
  - **DB**: `citizens` row created with `is_verified=0` (or equivalent), OTP row created in `otp_verifications`.
- **TC-AUTH-002 (UI)** Invalid CNIC blocks registration
  - **Steps**: CNIC not matching `12345-1234567-1` → submit.
  - **Expect**: Client-side error, no request or server returns `success=false`.
- **TC-AUTH-003 (API)** Duplicate CNIC/email rejected
  - **Steps**: Call `citizenRegister.php` again with same CNIC/email.
  - **Expect**: `success=false` with message about existing account.

#### FR-03 / FR-04 / FR-05 OTP verification rules
- **TC-AUTH-010 (UI)** Verify correct OTP marks citizen verified
  - **Pre**: Citizen registration initiated; OTP available.
  - **Steps**: Enter OTP → verify.
  - **Expect**: `success=true`, redirect to login.
  - **DB**: `citizens.is_verified=1`; `otp_verifications.verified=1` (or record updated accordingly).
- **TC-AUTH-011 (API)** Wrong OTP increments attempts
  - **Steps**: POST `verifyOTP.php` with wrong OTP repeatedly.
  - **Expect**: `success=false` and attempts increase; after max, locked.
  - **DB**: `otp_verifications.attempts` increments; once max reached, further verifies fail.
- **TC-AUTH-012 (UI)** Resend OTP works (rate limit/limit if implemented)
  - **Steps**: Use “resend” in register modal.
  - **Expect**: New OTP delivered; old OTP invalid.

#### FR-06 Citizen forgot-password
- **TC-AUTH-020 (UI)** Citizen forgot password happy path
  - **Steps**: Open `forgotPassword.html` → request OTP → verify OTP → set new password.
  - **Expect**: Success + can login with new password.
  - **DB**: `citizens.password_hash` changed.
- **TC-AUTH-021 (API)** Reset blocked without OTP-gated session
  - **Steps**: Call `changePassword.php` directly without completing OTP flow.
  - **Expect**: `success=false`.

#### FR-08 / FR-09 Officer login and activation
- **TC-AUTH-030 (UI)** Officer login blocks inactive officers
  - **Pre**: set `officers.is_active=0` for test account.
  - **Steps**: login via `officerLogin.html`.
  - **Expect**: `success=false`, message indicates inactive/blocked.

#### FR-11 Admin login and first-login password change
- **TC-AUTH-040 (UI)** Admin first login forces password change
  - **Pre**: Admin with `password_changed=0`.
  - **Steps**: login → modal appears → set new password.
  - **Expect**: can access `adminDashboard.html`.
  - **DB**: `admin.password_hash` changes, `password_changed=1`.

#### FR-12 / FR-13 Session checks and logout
- **TC-AUTH-050 (API)** Session check denies unauthenticated
  - **Steps**: Call session-check endpoint without cookie/session.
  - **Expect**: `success=false` / `valid=false` and redirect behavior in UI.
- **TC-AUTH-051 (UI)** Logout invalidates session
  - **Steps**: login → logout → revisit dashboard.
  - **Expect**: redirected to login.

---

## 2) Citizen complaints and case tracking

### Endpoint inventory
- `src/php/submitComplaint.php`
- `src/php/getComplaints.php`
- `src/php/getCaseDetails.php`
- `src/php/citizenGetAppointments.php`
- `src/php/citizenAppointmentAction.php`
- `src/php/citizenSubmitWithdrawal.php`
- `src/php/citizenGetWithdrawals.php`
- `src/php/getProfile.php`, `src/php/updateProfile.php`

### UI entry points
- Complaint: `src/citizen/complaintForm.html` + `src/js/complaintForm.js`
- Dashboard: `src/citizen/citizenDashboard.html` + `src/js/citizenDashboard.js`
- Case detail: `src/citizen/caseDetail.html` + `src/js/caseDetail.js`
- Appointments: `src/citizen/citizenAppointments.html` + `src/js/citizenAppointments.js`
- Withdrawals: `src/citizen/citizenWithdrawals.html` + `src/js/citizenWithdrawals.js`
- Profile: `src/citizen/citizenProfile.html` + `src/js/citizenProfile.js`

### Requirements → test cases

#### FR-20 / FR-21 Submit complaint
- **TC-CIT-001 (UI)** Submit complaint happy path (no witnesses)
  - **Pre**: Citizen logged in.
  - **Steps**: open complaint form → fill required fields → submit.
  - **Expect**: success + reference number shown/available.
  - **DB**: `complaints` row inserted; `case_updates` initial entry may exist (if implemented).
- **TC-CIT-002 (UI)** Submit complaint with witnesses
  - **Steps**: add witness fields → submit.
  - **Expect**: success.
  - **DB**: rows in `witnesses` linked to `complaint_id`.
- **TC-CIT-003 (API)** Validation rejects future incident date
  - **Steps**: POST future date.
  - **Expect**: `success=false`.

#### FR-23 Dashboard list and stats
- **TC-CIT-010 (UI)** Dashboard lists only the logged-in citizen’s complaints
  - **Expect**: complaints belong to session CNIC only.

#### FR-24 Case details view
- **TC-CIT-020 (UI)** Case details show timeline, witnesses, station, assignment, appointment
  - **Expect**: renders consistent data; no leakage of other citizens’ data.
- **TC-CIT-021 (API)** Unauthorized case detail blocked
  - **Pre**: Citizen A tries to fetch Citizen B’s ref.
  - **Steps**: GET `getCaseDetails.php?ref=<B ref>`
  - **Expect**: `success=false` / access denied.

#### FR-25 / FR-26 Appointments
- **TC-CIT-030 (UI)** Citizen can accept a pending appointment before scheduled time
  - **Expect**: appointment status changes to Accepted.
  - **DB**: `appointments.status='Accepted'`; `case_updates` entry created.
- **TC-CIT-031 (API)** Cannot accept after scheduled time
  - **Expect**: `success=false`.

#### FR-27 / FR-28 Withdrawals
- **TC-CIT-040 (UI)** Direct withdraw before officer assignment
  - **Pre**: complaint with no current officer assignment.
  - **Expect**: complaint status becomes Withdrawn; no pending withdrawal request.
- **TC-CIT-041 (UI)** Withdrawal request after officer assignment
  - **Expect**: `withdrawal_requests` row created; complaint status becomes Withdrawal Pending.
- **TC-CIT-042 (API)** Prevent duplicate pending withdrawal request
  - **Steps**: submit twice.
  - **Expect**: second attempt rejected.

#### FR-29 Profile update
- **TC-CIT-050 (UI)** Update name fields only
  - **Expect**: name updated; CNIC/email unchanged.

---

## 3) SHO portal (review, appointments, assignment, schedule, withdrawals)

### Endpoint inventory (from `src/js/shoDashboard.js`)
- Cases: `src/php/shoGetCases.php`, `src/php/shoGetCaseDetail.php`, `src/php/shoReviewComplaint.php`
- Schedule/appointments: `src/php/shoCheckSchedule.php`, `src/php/shoSetAppointment.php`, `src/php/shoMarkAppointment.php`, `src/php/shoGetAppointments.php`
- Officer assignment: `src/php/shoGetOfficers.php`, `src/php/shoAssignOfficer.php`
- Personal schedule slots: `src/php/shoGetSchedule.php`, `src/php/shoSaveScheduleSlot.php`, `src/php/shoDeleteScheduleSlot.php`
- Updates: `src/php/shoGetCaseUpdates.php`
- Withdrawals: `src/php/shoGetWithdrawals.php`, `src/php/shoWithdrawalAction.php`

### UI entry points
- `src/officer/shoDashboard.html` + `src/js/shoDashboard.js`

### Requirements → test cases

#### FR-41 Review complaint
- **TC-SHO-001 (UI)** Accept a Submitted complaint
  - **Expect**: complaint status updates; timeline entry created.
- **TC-SHO-002 (UI)** Reject requires reason
  - **Steps**: reject without reason.
  - **Expect**: rejected by validation; no DB change.

#### FR-42 / FR-43 Schedule appointment + overlap prevention
- **TC-SHO-010 (UI)** Schedule appointment creates schedule slot + appointment
  - **Expect**: appointment in Pending; schedule slot created.
- **TC-SHO-011 (DB/API)** Prevent overlapping schedule slots
  - **Steps**: create slot overlapping another for same date/officer.
  - **Expect**: operation fails (trigger or endpoint validation).

#### FR-44 / FR-45 Appointment outcomes + auto-expiry
- **TC-SHO-020 (UI)** Mark appointment completed
  - **Expect**: appointment status becomes Completed; case may proceed to assignment gate.
- **TC-SHO-021 (System/API)** Expired pending auto-cancel changes complaint status
  - **Steps**: create pending appointment in past; trigger lifecycle (open a page that calls it).
  - **Expect**: appointment Cancelled; complaint status changes (Accepted/Closed per miss_count).

#### FR-46 / FR-47 IO assignment gating + station scoping
- **TC-SHO-030 (UI)** Cannot assign IO before completed appointment
  - **Expect**: blocked with message.
- **TC-SHO-031 (UI)** Assign IO succeeds after completed appointment
  - **Expect**: `case_assignments` row current; complaint status moves to Officer Assigned.
- **TC-SHO-032 (API)** Cannot assign IO from different station or wrong role
  - **Expect**: rejected.

#### FR-49 Personal schedule slot restrictions
- **TC-SHO-040 (UI)** Create Duty/Court/Leave slot succeeds
- **TC-SHO-041 (UI/API)** Attempt to create Appointment slot manually is blocked

#### FR-50 Withdrawals approval/rejection
- **TC-SHO-050 (UI)** Approve withdrawal request
  - **Expect**: complaint becomes Withdrawn; request Approved; caseload updated if applicable.
- **TC-SHO-051 (UI)** Reject withdrawal request
  - **Expect**: request Rejected; complaint restored to expected status.

---

## 4) IO portal (assigned cases and updates)

### Endpoint inventory (from `src/js/ioDashboard.js`)
- `src/php/ioCheckSession.php`
- `src/php/ioGetProfile.php`
- `src/php/ioGetStats.php`
- `src/php/ioGetCases.php`
- `src/php/ioGetCaseDetail.php`
- `src/php/ioCaseUpdate.php`
- Shared: `src/php/officerChangePassword.php`, `src/php/officerLogout.php`

### UI entry points
- `src/officer/officerDashboard.html` + `src/js/ioDashboard.js`

### Requirements → test cases
- **TC-IO-001 (UI)** IO sees only assigned cases
- **TC-IO-010 (UI)** IO adds update: Investigation Ongoing
  - **DB**: `case_updates` row created; `complaints.status` updates.
- **TC-IO-011 (UI/API)** IO cannot update Resolved/Closed case

---

## 5) Superintendent portal (detainees, cells, hearings)

### Endpoint inventory (from `src/js/superintendentDashboard.js`)
- `src/php/superintendentCheckSession.php`
- `src/php/superintendentGetStats.php`
- `src/php/superintendentGetProfile.php`
- `src/php/superintendentGetDetainees.php`
- `src/php/superintendentGetCells.php`
- `src/php/superintendentGetHearings.php`
- `src/php/superintendentGetCases.php`
- Mutations: `src/php/superintendentSaveDetainee.php`, `src/php/superintendentAssignCell.php`, `src/php/superintendentDeleteDetainee.php`
- Password/logout: `src/php/superintendentChangePassword.php`, `src/php/officerLogout.php`

### UI entry points
- `src/officer/superintendentDashboard.html` + `src/js/superintendentDashboard.js`

### Requirements → test cases
- **TC-SUP-001 (UI)** Create detainee (no complaint link)
- **TC-SUP-002 (UI)** Edit detainee
- **TC-SUP-010 (UI/API)** Assign cell validates station/gender/capacity
  - **DB**: `detainees.cell_id` updated on success; rejected otherwise.
- **TC-SUP-011 (DB)** Release detainee clears cell_id (trigger)

---

## 6) Admin console (oversight + appoint SHO/superintendent)

### Endpoint inventory (from `src/js/adminDashboard.js`, `src/js/adminDashboardPages.js`)
- `src/php/adminCheckSession.php`
- `src/php/adminGetStats.php`
- `src/php/adminGetOfficers.php`
- `src/php/adminGetStations.php`
- `src/php/adminGetComplaints.php`
- `src/php/adminManageSho.php`
- `src/php/adminManageSuperintendent.php`
- Password/logout: `src/php/changeAdminPassword.php`, `src/php/adminLogout.php`

**Note for testers (case sensitivity)**:
- The Admin UI currently calls `../php/adminManageSHO.php` in `src/js/adminDashboardPages.js`, but the repo file is `src/php/adminManageSho.php`.
- On Windows this usually works; on Linux hosting it may 404. Align your test environment accordingly.

### UI entry points
- `src/admin/adminDashboard.html` + `src/js/adminDashboard.js` + `src/js/adminDashboardPages.js`

### Requirements → test cases
- **TC-ADM-001 (UI)** Stations page shows current SHO/superintendent correctly
- **TC-ADM-010 (UI/API)** Appoint SHO retires prior assignment
  - **DB**: `station_sho_assignments` current toggled; officer role updated.
- **TC-ADM-011 (UI/API)** Remove SHO demotes to IO or deactivates (depending on action)
- **TC-ADM-020 (UI)** Global complaints list visible; details/timeline present

---

## 7) Cross-cutting security tests (high priority)

- **TC-SEC-001** Citizen cannot call any officer/admin endpoints (should fail auth).
- **TC-SEC-002** Officer cannot call admin endpoints unless admin session.
- **TC-SEC-003** IO cannot access SHO-only endpoints.
- **TC-SEC-004** Station scoping: SHO/Superintendent cannot mutate another station’s entities.
- **TC-SEC-005** Ownership scoping: Citizen cannot access other citizen’s complaints/appointments/withdrawals.

---

## 8) Data integrity and concurrency tests

- **TC-DATA-001** Two concurrent SHO schedule inserts that overlap → one must fail.
- **TC-DATA-002** Two concurrent IO assignment operations → only one current assignment remains (`is_current=1`).
- **TC-DATA-003** Withdrawal approval/rejection is atomic: complaint status + withdrawal request status + caseload changes consistent.

---

## Appendix A — DB entities to verify during tests

Core tables:
- `citizens`, `admin`, `officers`, `officer_roles`, `stations`
- `complaints`, `witnesses`, `case_updates`, `case_assignments`
- `sho_schedule`, `appointments`
- `withdrawal_requests`
- `otp_verifications`, `officer_otps`, `admin_otps`
- `jail_cells`, `detainees`, `court_hearings`

Useful views/procs:
- `vw_appointment_details`, `vw_case_overview`, `vw_station_case_stats`, `vw_officer_workload`
- `sp_assign_officer_to_case`, `sp_assign_detainee_cell`, `sp_get_station_open_cases`, `sp_get_station_dashboard_stats`

