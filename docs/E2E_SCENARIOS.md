Functional requirements (complete list you can test)
Authentication, sessions, OTP, passwords
FR-01 The system shall allow a Citizen to register using CNIC, name, email, and password. (src/php/citizenRegister.php, database/schema.sql citizens)
FR-02 The system shall validate CNIC format (#####-#######-#), validate email, and enforce password length ≥ 8 during registration. (src/php/citizenRegister.php)
FR-03 The system shall require Citizen email verification (OTP) before allowing login. (src/php/citizenLogin.php, citizens.is_verified)
FR-04 The system shall generate OTPs, store them hashed with expiry + attempts/max_attempts, and email them for registration and forgot-password flows. (src/php/sendOTP.php, src/php/verifyOTP.php, otp_verifications)
FR-05 The system shall block OTP verification after max attempts until a new OTP is requested. (src/php/verifyOTP.php)
FR-06 The system shall support Citizen forgot-password via OTP, and only allow password reset when session indicates OTP was verified. (src/php/forgotPassword.php, src/php/changePassword.php)
FR-07 The system shall allow a logged-in Citizen to change password by verifying current password. (src/php/changePasswordAuth.php)
FR-08 The system shall allow Officer login and assign privileges based on officers.role_id. (src/php/officerLogin.php, officers, officer_roles)
FR-09 The system shall block Officer login if officers.is_active = 0. (src/php/officerLogin.php)
FR-10 The system shall allow Officers to change password by verifying current password and set password_changed=1. (src/php/officerChangePassword.php)
FR-11 The system shall allow Admin login and maintain an admin session distinct from officers. (src/php/adminLogin.php, admin)
FR-12 The system shall provide session-check endpoints per actor and enforce access control. (src/php/*CheckSession.php)
FR-13 The system shall allow each actor to log out and destroy their session. (src/php/*Logout.php)
Citizen portal (complaints, tracking, appointments, withdrawals, profile)
FR-20 The system shall allow a logged-in Citizen to submit a complaint with category, station, incident details, description, and optional witnesses. (src/php/submitComplaint.php, complaints, witnesses)
FR-21 The system shall validate complaint submission (required fields, description length ≥ 20, incident date not in future). (src/php/submitComplaint.php)
FR-22 The system shall generate a unique complaint reference number after submission. (src/php/submitComplaint.php, complaints.reference_number)
FR-23 The system shall show the Citizen dashboard listing complaints and basic stats. (src/php/getComplaints.php, src/js/citizenDashboard.js)
FR-24 The system shall show full case details: complaint data, station info, witnesses, timeline (case_updates), current assigned officer, latest appointment. (src/php/getCaseDetails.php)
FR-25 The system shall allow Citizen to view appointments for their cases and show pending counts. (src/php/citizenGetAppointments.php)
FR-26 The system shall allow a Citizen to accept only a Pending appointment, only before its scheduled time. (src/php/citizenAppointmentAction.php, vw_appointment_details)
FR-27 The system shall allow Citizen withdrawal:
direct withdraw (if no officer assigned), or
submit withdrawal request (if officer assigned) and set status to Withdrawal Pending. (src/php/citizenSubmitWithdrawal.php, withdrawal_requests)
FR-28 The system shall show Citizen withdrawal history/status and decisions/notes. (src/php/citizenGetWithdrawals.php)
FR-29 The system shall allow Citizen profile updates for name fields only (CNIC/email immutable via that endpoint). (src/php/updateProfile.php)
SHO portal (review, scheduling, assignments, withdrawals)
FR-40 The system shall allow SHO to view all station complaints with urgency/category and current officer. (src/php/shoGetCases.php)
FR-41 The system shall allow SHO to accept/reject Submitted complaints; rejection requires a reason; decision is logged. (src/php/shoReviewComplaint.php)
FR-42 The system shall allow SHO to schedule an appointment for an Accepted complaint by creating a schedule slot and a Pending appointment. (src/php/shoSetAppointment.php, sho_schedule, appointments)
FR-43 The system shall prevent overlapping schedule slots for the same SHO/date. (database/schema.sql trigger before_sho_schedule_insert, src/php/shoCheckSchedule.php)
FR-44 The system shall allow SHO to mark appointment outcome as Completed/Cancelled and apply “2 misses → case Closed” behavior. (src/php/shoMarkAppointment.php, appointmentLifecycle.php)
FR-45 The system shall automatically cancel expired Pending appointments and update complaint status (first miss: back to Accepted, second miss: Closed) and log it. (src/php/appointmentLifecycle.php)
FR-46 The system shall allow SHO to assign/reassign an IO only after at least one appointment is Completed. (src/php/shoAssignOfficer.php)
FR-47 The system shall restrict assignment to active IOs (role_id=1) in same station as complaint. (src/php/shoAssignOfficer.php, sp_assign_officer_to_case)
FR-48 The system shall keep assignment history and enforce only one current assignment. (case_assignments + trigger before_case_reassign)
FR-49 The system shall allow SHO to add/remove non-appointment schedule slots and prevent manual creation/deletion of Appointment-type slots. (src/php/shoSaveScheduleSlot.php, src/php/shoDeleteScheduleSlot.php)
FR-50 The system shall allow SHO to approve/reject withdrawal requests and update complaint status accordingly (including caseload adjustments). (src/php/shoWithdrawalAction.php, src/php/shoGetWithdrawals.php)
FR-51 The system shall allow SHO to view station-wide case updates. (src/php/shoGetCaseUpdates.php, src/js/shoDashboard.js)
Investigating Officer (IO) portal
FR-60 The system shall allow an IO to view only cases currently assigned to them (and station-scoped). (src/php/ioGetCases.php)
FR-61 The system shall allow IO to view case detail + update history only for assigned cases. (src/php/ioGetCaseDetail.php)
FR-62 The system shall allow IO to submit case updates with allowed status transitions and prevent updates to Resolved/Closed cases. (src/php/ioCaseUpdate.php)
Jail Superintendent portal (custody management)
FR-70 The system shall allow superintendent to create/edit detainees at their station and optionally link to a complaint. (src/php/superintendentSaveDetainee.php, detainees)
FR-71 The system shall allow superintendent to assign detainees to cells with station/gender/capacity validation. (src/php/superintendentAssignCell.php, sp_assign_detainee_cell)
FR-72 The system shall auto-clear detainee cell assignment when detainee is released. (database/schema.sql trigger after_detainee_release)
FR-73 The system shall show cell occupancy/availability for station. (src/php/superintendentGetCells.php, jail_cells)
FR-74 The system shall provide a hearings calendar per station. (src/php/superintendentGetHearings.php, vw_hearing_calendar)
FR-75 The system shall provide station open cases list for custody operations. (src/php/superintendentGetCases.php, sp_get_station_open_cases)
Admin console (oversight + appoint SHO/superintendent)
FR-80 The system shall allow Admin to view all officers with station + role. (src/php/adminGetOfficers.php)
FR-81 The system shall allow Admin to view stations with counts + current SHO/superintendent. (src/php/adminGetStations.php, assignment tables)
FR-82 The system shall allow Admin to appoint an officer as SHO and automatically retire the previous SHO assignment. (src/php/adminManageSho.php, trigger before_sho_appoint)
FR-83 The system shall allow Admin to remove SHO (demote to IO) or deactivate the account. (src/php/adminManageSho.php)
FR-84 The system shall allow Admin to appoint/remove superintendent similarly. (src/php/adminManageSuperintendent.php, trigger before_superintendent_appoint)
FR-85 The system shall allow Admin to view global complaint list + timeline. (src/php/adminGetComplaints.php)
FR-86 The system shall provide Admin dashboard stats (active officers, active complaints, resolved/month, urgent active). (src/php/adminGetStats.php)
Logging / reporting (shared)
FR-90 The system shall log complaint status changes in case_updates automatically. (database/schema.sql trigger after_status_update)
FR-91 The system shall provide reporting views for overview/dashboards (cases, appointments, officer workload, station stats, detainee overview). (database/schema.sql views like vw_case_overview, vw_appointment_details, vw_officer_workload, etc.)
Key business rules (testable)
Role-based access + station scoping + ownership scoping across endpoints.
Complaint lifecycle: Submitted → (Accept/Reject) → Appointment → Assignment → Investigation updates → Resolved/Closed/Withdrawn.
Appointment rules: future-only, no overlaps, citizen acceptance before scheduled time, auto-expire pending, “2 misses → Closed”.
Withdrawal rules: direct withdraw if no officer; otherwise request; only one pending request; SHO approves/rejects.
Custody rules: cell assignment requires same station, gender match, capacity; release clears cell.
Non-functional requirements (implied)
Security: password hashing, OTP hashing + expiry + attempt limits, session auth on all endpoints, least-privilege by role + station + citizen ownership.
Data integrity: transactional multi-step operations; DB triggers/procs enforce invariants (overlap prevention, one current assignment).
Auditability: lifecycle events recorded in case_updates.
Performance: reporting via DB views/procs; indexes on frequent filters (CNIC/status).
Resilience: deterministic “catch-up” logic (auto-expire appointments) so state remains consistent.
Noted inconsistencies / open questions (important for SRE + testing)
Complaint reference format mismatch: seeded data uses PICMS-2025-00001 while code generates KHI-YY-XXXXX. Decide the required production format.
Appointment cancellation semantics: cancellations appear to count as “miss/no-show”. Confirm if SHO-cancel for internal reasons should avoid counting as a miss.
Status state machine: confirm intended allowed transitions (some endpoints restore statuses differently).
Officer workload: there’s both officers.active_caseload (mutable) and vw_officer_workload (computed). Decide source of truth.