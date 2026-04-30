# PICMS End-to-End (E2E) Scenario Suite

These scenarios are designed to validate end-to-end workflows across roles.
They are written so you can execute them manually now and automate later.

## Data conventions used in scenarios
- Citizen A: `CNIC_A`, `EMAIL_A`
- Citizen B: `CNIC_B`, `EMAIL_B` (for access-control tests)
- Station S1
- SHO_S1 (role_id=2, station_id=S1)
- IO_S1 (role_id=1, station_id=S1)
- Superintendent_S1 (role_id=3, station_id=S1)

---

## E2E-01 Citizen registration → OTP verify → login
- **Goal**: validate signup and verification gate.
- **Steps**
  - Register Citizen A via `src/citizen/citizenRegister.html`
  - Verify OTP
  - Login via `src/citizen/citizenLogin.html`
- **Expected**
  - Citizen redirected to `citizenDashboard.html`
  - `citizens.is_verified=1`
  - OTP record marked verified (or effectively invalidated)

---

## E2E-02 Citizen submits complaint → SHO reviews → appointment scheduled → citizen accepts
- **Goal**: validate early complaint lifecycle.
- **Steps**
  - Citizen A logs in → submits complaint via `complaintForm.html`
  - SHO_S1 logs in → opens the complaint → Accepts it
  - SHO_S1 schedules an appointment (future slot)
  - Citizen A opens appointments → Accepts appointment before scheduled time
- **Expected**
  - Complaint status progresses to Accepted/Under Review per rules
  - Appointment created in Pending then moves to Accepted upon citizen action
  - `case_updates` includes entries for acceptance and appointment acceptance

---

## E2E-03 Appointment completed → SHO assigns IO → IO updates case → resolves
- **Goal**: validate assignment gate and IO workflow.
- **Steps**
  - SHO marks appointment Completed
  - SHO assigns IO_S1 to the complaint
  - IO logs in → sees complaint in list → adds update “Investigation Ongoing”
  - IO adds final update “Resolved”
- **Expected**
  - Assignment exists with exactly one `is_current=1`
  - Complaint status becomes Officer Assigned / Investigation Ongoing / Resolved in sequence
  - Timeline (`case_updates`) contains IO notes and status changes

---

## E2E-04 Withdrawal flows (direct vs request)

### E2E-04A Direct withdrawal (before IO assignment)
- **Steps**
  - Citizen submits a complaint
  - Citizen requests withdrawal before any IO assignment exists
- **Expected**
  - Complaint status becomes Withdrawn
  - No pending withdrawal request required

### E2E-04B Withdrawal request + SHO approval
- **Steps**
  - Use a complaint with IO assigned
  - Citizen requests withdrawal
  - SHO reviews → Approves request
- **Expected**
  - Withdrawal request status Approved
  - Complaint status Withdrawn
  - Officer caseload updated consistently (if implemented)

---

## E2E-05 Appointment miss auto-expiry (system automation)
- **Goal**: validate the system cancels expired Pending appointments and enforces 2-miss closure.
- **Steps**
  - Create a Pending appointment for a scheduled time in the past (via test data or by advancing time).
  - Trigger lifecycle sync by opening a page that loads appointment/case details (citizen or SHO pages).
  - Repeat until miss_count reaches 2.
- **Expected**
  - Each expired Pending appointment becomes Cancelled automatically
  - First miss returns complaint to Accepted
  - Second miss closes the complaint
  - `case_updates` logs automation actions

---

## E2E-06 Superintendent custody workflow
- **Goal**: detainee + cell assignment validations.
- **Steps**
  - Superintendent creates a detainee linked to Station S1
  - Superintendent assigns detainee to an S1 cell matching gender with free capacity
  - Attempt to assign to wrong gender cell / full cell (negative)
  - Release detainee (set release_date) and verify cell cleared
- **Expected**
  - Assignment succeeds only when station/gender/capacity valid
  - Release clears `detainees.cell_id` (trigger-driven)

---

## E2E-07 Admin appoints SHO and Superintendent
- **Goal**: validate appointment + retirement of prior assignments.
- **Steps**
  - Admin appoints Officer X as SHO for Station S1
  - Admin appoints Officer Y as SHO for Station S1 (replacement)
  - Admin appoints Officer Z as Superintendent for Station S1
- **Expected**
  - For each station, previous assignment marked not-current; latest is_current=1
  - Officer role updates reflect new role where implemented

---

## E2E-08 Access control regression (multi-actor)
- **Goal**: verify role and ownership boundaries.
- **Steps**
  - Citizen B attempts to view Citizen A’s case details using reference number
  - IO attempts to call SHO-only endpoint (e.g., `shoReviewComplaint.php`)
  - SHO attempts to act on complaint from different station (if test data exists)
- **Expected**
  - All attempts rejected with `success=false` / HTTP error / redirect to login as appropriate

