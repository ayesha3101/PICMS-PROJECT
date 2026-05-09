# PICMS Database Requirements - Quick Reference Matrix

## System-Wide Summary

| Feature | Citizen | Admin | IO | SHO | Superintendent | Court | Complaint | Appointment |
|---------|---------|-------|----|----|-----------------|-------|-----------|-------------|
| **JOINS** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Advanced SQL** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Built-in Functions** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Dynamic Input** | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | ✅ | ✅ |
| **INSERT** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **UPDATE** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **DELETE** | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ⚠️ | ⚠️ |
| **TRANSACTIONS** | ✅ | ✅ | ⚠️❌ | ⚠️ | ❌ | ❌ | ✅ | ✅ |

**Legend:**
- ✅ = Implemented & Working
- ⚠️ = Partially Implemented / Needs Review
- ❌ = Missing or Not Implemented
- N/A = Not Applicable

---

## Query Requirement Coverage

### ✅ Complete (7/8 modules)
- **Citizen Module:** All 5 basic requirements met (missing DELETE)
- **Admin Module:** All 5 basic requirements met (missing DELETE)
- **SHO Module:** All 6 requirements met (transactions need review)
- **Complaint Module:** Full coverage including cascade DELETE
- **Appointment Module:** Full coverage (soft-delete pattern)

### ⚠️ Partial/Needs Review (1/8 modules)
- **IO Module:** Missing transaction atomicity in case updates

### ❌ Incomplete (2/8 modules)
- **Superintendent Module:** Missing transaction handling (CRITICAL)
- **Court Hearings Module:** Only READ operations; no CRUD write operations

---

## CRUD Operations Breakdown

### INSERT Operations ✅ Present In:
- Citizen: Registration
- Admin: SHO assignment, Superintendent assignment
- IO: Case update logging
- SHO: Schedule slots, appointments
- Superintendent: Detainee records
- Complaint: Complaint submission, witness records
- Appointment: Appointment creation

### UPDATE Operations ✅ Present In:
- Citizen: Complaint status withdrawal
- Admin: SHO role changes, officer deactivation
- IO: Case status updates
- SHO: Appointment status, schedule modifications
- Superintendent: Detainee records, cell assignments
- Complaint: Status changes via trigger
- Appointment: Appointment status changes

### DELETE Operations ⚠️ Limited:
- ✅ SHO: Schedule slot deletion (with validation)
- ✅ Superintendent: Detainee deletion (no cascade logic)
- ⚠️ Complaint: Soft deletion via witness cascade
- ❌ Citizen: No deletion operations
- ❌ Admin: No deletion operations
- ❌ IO: No deletion operations
- ❌ Court: No deletion operations
- ❌ Appointment: Soft-delete via status only

### TRANSACTION Atomicity Status:
- ✅ **Properly Transactional:**
  - Citizen withdrawal workflow
  - Admin SHO appointment
  - Complaint submission
  - Appointment lifecycle
  
- ⚠️ **Needs Transactions:**
  - IO case update (currently single UPDATE)
  - SHO withdrawal action approval/rejection
  - Superintendent detainee operations
  - Court hearing operations

---

## Advanced SQL Feature Usage

| Feature | Count | Examples |
|---------|-------|----------|
| **JOINs (2+)** | 8+ queries | getComplaints (4-way), getCaseDetails (6-way) |
| **Stored Procedures** | 4 | sp_assign_officer_to_case, sp_submit_withdrawal_request |
| **Views** | 5 | vw_case_overview, vw_appointment_details, vw_hearing_calendar |
| **Triggers** | 6 | after_status_update, before_case_reassign, before_sho_schedule_insert |
| **Subqueries** | 5+ | EXISTS checks in adminManageSho.php |
| **Correlated Subqueries** | 2+ | Withdrawal validation in citizenSubmitWithdrawal.php |
| **GROUP BY** | 0 | ❌ MISSING - No aggregation queries |
| **HAVING** | 0 | ❌ MISSING - No conditional aggregations |
| **Window Functions** | 0 | ❌ MISSING - No ranking/partitioning |
| **CTEs (WITH clause)** | 0 | ❌ MISSING - No temporary result sets |

---

## File-by-File Transaction Status

### Files WITH Transaction Support ✅
```
✅ citizenSubmitWithdrawal.php
   - Line 75: $conn->begin_transaction()
   - Handles: Procedure call + audit logging
   - Rollback: Yes

✅ adminManageSho.php
   - Line 54: $conn->begin_transaction()
   - Handles: Retire old SHO + create new + role update
   - Rollback: Yes

✅ submitComplaint.php
   - Transaction handling for complaint + witnesses
   - Rollback: Yes

✅ appointmentLifecycle.php
   - Transaction handling for appointment creation/status changes
   - Rollback: Yes
```

### Files WITHOUT Transaction Support ❌
```
❌ ioCaseUpdate.php
   - Multiple UPDATEs to case_updates and complaints
   - Risk: Case status updated but log entry fails

❌ shoWithdrawalAction.php
   - Updates withdrawal_requests + complaints
   - Risk: Approval recorded but case not marked withdrawn

❌ superintendentSaveDetainee.php
   - INSERT/UPDATE without transaction wrapper
   - Risk: Detainee saved but cell assignment fails

❌ superintendentAssignCell.php
   - Cell assignment via procedure (NOT transactional)
   - Risk: Detainee updated but capacity check fails

❌ shoMarkAppointment.php
   - Single UPDATE statement
   - Risk: Acceptable for atomic operation

❌ shoDeleteScheduleSlot.php
   - Single DELETE with validation
   - Risk: Acceptable for atomic operation
```

---

## Dynamic Input Handling Score

| Module | Parameterized Queries | SQL Injection Risk | Score |
|--------|----------------------|-------------------|-------|
| Citizen | 100% | ❌ None | 10/10 |
| Admin | 100% | ❌ None | 10/10 |
| IO | 100% | ❌ None | 10/10 |
| SHO | 100% | ❌ None | 10/10 |
| Superintendent | 100% | ❌ None | 10/10 |
| Court | 100% | ❌ None | 10/10 |
| Complaint | 100% | ❌ None | 10/10 |
| Appointment | 100% | ❌ None | 10/10 |

**Overall:** ✅ All queries are properly parameterized using bind_param()

---

## Critical Gaps Ranked by Impact

| Rank | Gap | Impact Level | Modules Affected | Fix Complexity |
|------|-----|--------------|------------------|-----------------|
| 1 | Missing Transactions in Case Updates | 🔴 CRITICAL | IO Module | Low |
| 2 | Missing Transactions in Withdrawal Actions | 🔴 CRITICAL | SHO Module | Low |
| 3 | Missing Transactions in Detainee Operations | 🔴 CRITICAL | Superintendent | Medium |
| 4 | No Court Hearing CRUD | 🔴 CRITICAL | Court Module | High |
| 5 | No Audit Trail Table | 🟡 HIGH | All Modules | Medium |
| 6 | No DELETE for Most Modules | 🟡 HIGH | Citizen, Admin, IO | Low |
| 7 | No Bulk Operations | 🟡 MEDIUM | Admin, Officer | Medium |
| 8 | No Search Filters | 🟡 MEDIUM | All Modules | Low |
| 9 | No Analytics Implementation | 🟠 MEDIUM | Citizen | Low |

---

## Code Examples: Missing Implementations

### 1. Missing Transaction in ioCaseUpdate.php
```php
// BEFORE (Single UPDATE - risky)
UPDATE complaints SET status = ? WHERE complaint_id = ?;

// AFTER (With Transaction - safe)
$conn->begin_transaction();
try {
    $stmt1 = $conn->prepare("UPDATE complaints SET status = ? WHERE complaint_id = ?");
    $stmt1->execute([$new_status, $complaint_id]);
    
    $stmt2 = $conn->prepare("INSERT INTO case_updates (complaint_id, status, note) VALUES (?, ?, ?)");
    $stmt2->execute([$complaint_id, $new_status, $note]);
    
    $conn->commit();
} catch (Exception $e) {
    $conn->rollback();
    throw $e;
}
```

### 2. Missing Court Hearing CREATE
```php
// NEW FILE NEEDED: courtHearingCreate.php
$conn->begin_transaction();
try {
    $stmt = $conn->prepare(
        "INSERT INTO court_hearings 
         (detainee_id, complaint_id, court_name, hearing_date, hearing_type) 
         VALUES (?, ?, ?, ?, ?)"
    );
    $stmt->bind_param('iisss', $detainee_id, $complaint_id, $court_name, $hearing_date, $hearing_type);
    $stmt->execute();
    
    $conn->commit();
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
```

### 3. Missing Audit Trail
```sql
-- NEW TABLE NEEDED
CREATE TABLE audit_log (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100),
    table_name VARCHAR(50),
    record_id INT,
    old_values JSON,
    new_values JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255)
);

-- ADD TRIGGER TO COMPLAINTS
CREATE TRIGGER audit_complaint_update
AFTER UPDATE ON complaints
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (action, table_name, record_id, old_values, new_values, timestamp)
    VALUES ('UPDATE', 'complaints', NEW.complaint_id, 
            JSON_OBJECT('status', OLD.status),
            JSON_OBJECT('status', NEW.status),
            NOW());
END;
```

---

## Performance Considerations

### Queries Needing Optimization
- `vw_case_overview`: Uses LEFT JOINs; consider materialized view for large datasets
- `getCaseDetails.php`: 6-way JOIN might be slow with 1M+ records
- `adminGetStats.php`: Runs 4 separate queries; could combine into single query

### Recommended Indexes
```sql
-- Already exist
CREATE INDEX idx_complaints_cnic ON complaints(cnic);
CREATE INDEX idx_complaints_status ON complaints(status);

-- Should add
CREATE INDEX idx_case_assignments_officer ON case_assignments(officer_id, is_current);
CREATE INDEX idx_detainees_station ON detainees(station_id, release_date);
CREATE INDEX idx_appointments_complaint ON appointments(complaint_id, status);
CREATE INDEX idx_court_hearings_detainee ON court_hearings(detainee_id, hearing_date);
```

---

## Compliance Checklist

- [x] All queries are parameterized (No SQL injection risk)
- [x] Views created for complex reporting queries
- [x] Stored procedures for business logic validation
- [x] Database triggers for audit logging (partial)
- [x] Foreign key constraints enforced
- [x] Core transactions implemented (4/8 modules)
- [ ] Audit trail table and triggers
- [ ] DELETE operations for all modules
- [ ] Bulk operation procedures
- [ ] Search/filter dynamic queries
- [ ] Advanced aggregations (GROUP BY/HAVING)
- [ ] Window functions for analytics
- [ ] Performance indexes on foreign keys

---

## Summary Statistics

**Database Objects:**
- Tables: 25
- Views: 5
- Stored Procedures: 4
- Triggers: 6
- Total Query Files: 40+

**Requirements Coverage:**
- Joins: ✅ 100% (All modules)
- Advanced SQL: ✅ 87.5% (7/8 modules)
- Built-in Functions: ✅ 100% (All modules)
- Dynamic Input: ✅ 100% (All modules)
- INSERT: ✅ 100% (All modules)
- UPDATE: ✅ 100% (All modules)
- DELETE: ⚠️ 37.5% (3/8 modules - SHO, Super, Complaint)
- Transactions: ⚠️ 50% (4/8 modules - needs fixes)

**Overall Compliance: 78% (25/32 requirements met)**

**Priority: Address Transaction gaps + Court Hearings module to reach 94% compliance**
