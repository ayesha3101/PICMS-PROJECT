# PICMS Database Usage Analysis Report

## Executive Summary
Comprehensive analysis of database objects, queries, and transactions used across the PICMS (Police Integrated Case Management System) project.

---

## 1. DATABASE OBJECTS

### 1.1 Triggers: **6**
Database-level triggers that automatically execute based on events:

| # | Trigger Name | Table | Event | Purpose |
|---|---|---|---|---|
| 1 | `after_status_update` | complaints | AFTER UPDATE | Auto-log complaint status changes to case_updates |
| 2 | `after_detainee_release` | detainees | BEFORE UPDATE | Automatically free jail cell when detainee is released |
| 3 | `before_sho_appoint` | station_sho_assignments | BEFORE INSERT | Retire old SHO when new one appointed for same station |
| 4 | `before_superintendent_appoint` | station_superintendent_assignments | BEFORE INSERT | Retire old Superintendent when new one appointed |
| 5 | `before_sho_schedule_insert` | sho_schedule | BEFORE INSERT | Block overlapping SHO schedule slots (conflict detection) |
| 6 | `before_case_reassign` | case_assignments | BEFORE INSERT | Retire old case assignment when new one inserted |

**Key Features:**
- All triggers use `FOR EACH ROW` scope
- Include validation logic with `SIGNAL SQLSTATE` for error handling
- Handle automatic timestamps and status transitions
- Prevent business logic conflicts (overlapping schedules, duplicate assignments)

---

### 1.2 Stored Procedures: **5**
Database functions that encapsulate complex business logic:

| # | Procedure Name | Parameters | Purpose |
|---|---|---|---|
| 1 | `sp_assign_officer_to_case` | complaint_id, officer_id, assigned_by | Safely assign investigating officer with station/role validation |
| 2 | `sp_get_station_dashboard_stats` | station_id | Generate dashboard statistics (7 metrics in one query) |
| 3 | `sp_submit_withdrawal_request` | complaint_id, requested_by, reason | Add withdrawal request with validation |
| 4 | `sp_assign_detainee_cell` | detainee_id, cell_id, officer_id | Assign detainee to jail cell with gender/capacity checks |
| 5 | `sp_get_station_open_cases` | station_id | Read-only list of open cases for a station |

**Key Features:**
- Include business logic validation (station matching, role checking, capacity verification)
- Use local variables for data retrieval and validation
- Use SIGNAL for error handling with user-friendly messages
- Support complex multi-step operations (validation + update)

---

### 1.3 Views: **6**
Predefined queries for standardized data retrieval:

| # | View Name | Purpose | Joins Used |
|---|---|---|---|
| 1 | `vw_appointment_details` | Appointment info with complaint, station, schedule details | 4 JOINs |
| 2 | `vw_case_overview` | Unified case listing for admin/SHO/IO reporting | 5 JOINs (1 LEFT) |
| 3 | `vw_detainee_overview` | Superintendent-focused detainee + case + cell snapshot | 3 JOINs (2 LEFT) |
| 4 | `vw_station_case_stats` | Station-level case statistics (open vs closed counts) | 1 LEFT JOIN |
| 5 | `vw_officer_workload` | Officer workload tracking with active case counts | 2 LEFT JOINs |
| 6 | `vw_hearing_calendar` | Court hearing calendar with detainee and complaint info | 3 JOINs (1 LEFT) |

**Total View Joins: 19**

---

## 2. QUERY STATISTICS (PHP Backend)

### 2.1 Query Types

| Query Type | Count | Files | Percentage |
|---|---|---|---|
| **SELECT (READ)** | 143 | 62 | 52% |
| **INSERT/UPDATE/DELETE (WRITE)** | 131 | 33 | 48% |
| **TOTAL QUERIES** | 274 | N/A | 100% |

### 2.2 Query Complexity Breakdown

| Category | Count | Files | Details |
|---|---|---|---|
| **Simple Queries (no JOIN)** | 85 | ~40 | Single-table SELECT or direct INSERT/UPDATE/DELETE |
| **Advanced Queries (with JOIN)** | 58 | 25 | Multi-table queries using JOIN operations |
| **Percentage with Joins** | 40.5% | N/A | More than 1/3 of queries use multi-table joins |

### 2.3 Top Files with JOIN Operations

| File | JOIN Count | Purpose |
|---|---|---|
| `shoGetCaseDetail.php` | 6 | Comprehensive case details view |
| `getCaseDetails.php` | 5 | Case details retrieval |
| `citizenGetWithdrawals.php` | 5 | Withdrawal request listing |
| `shoAssignOfficer.php` | 4 | Officer assignment with validation |
| `courtHearingList.php` | 4 | Court hearing calendar |
| `shoGetCases.php` | 4 | SHO case list |
| `getComplaints.php` | 6 | General complaint listing |
| `adminGetStations.php` | 7 | Station statistics dashboard |
| `adminGetStats.php` | 4 | Admin statistics |

**Total: 58 JOIN occurrences across 25 files**

---

## 3. TRANSACTION SUPPORT

### 3.1 Transaction Keywords Found: **111**
Keywords related to transaction management in PHP files:
- `transact` (general transaction references)
- `TRANSACTION` (explicit mentions)
- `beginTrans` / `startTrans` (transaction initiation)
- `commit` / `rollback` (transaction completion/rollback)

### 3.2 Transaction-Enabled Operations

The following PHP files implement transactions:
- **Authentication files**: Credential updates with rollback safety
- **Appointment lifecycle**: Complex multi-step operations
- **Court hearing CRUD**: Create/update with atomic operations
- **Superintendent module**: Detainee assignments with validation
- **Case assignments**: Officer assignment with status updates
- **Withdrawal requests**: Request submission with complaint status sync
- **OTP services**: Multi-table OTP operations
- **User management**: Account creation and updates

**Modules with explicit transaction support:**
1. Appointment lifecycle management
2. Case assignment operations
3. Court hearing management
4. OTP verification
5. Withdrawal request processing
6. Superintendent cell assignments
7. SHO schedule management
8. Password changes

---

## 4. SUMMARY STATISTICS

```
DATABASE OBJECTS:
  ├── Triggers ........................ 6
  ├── Stored Procedures .............. 5
  ├── Views ........................... 6
  └── Total Objects .................. 17

QUERIES (PHP Backend):
  ├── Total Queries .................. 274
  │   ├── SELECT Statements ........... 143 (52%)
  │   └── Write Operations (INSERT/UPDATE/DELETE) .. 131 (48%)
  ├── Query Complexity:
  │   ├── Simple Queries (no JOIN) .... 85 (31%)
  │   └── Advanced Queries (with JOIN) 58 (21%)
  └── Transaction Keywords ........... 111

PERFORMANCE PROFILE:
  ├── Multi-table JOIN ratio ......... 40.5% (58/143 SELECT)
  ├── Read vs Write balance .......... 52% read / 48% write
  ├── Queries with Joins ............. Present in 25 files
  └── Average JOINs per complex query  ~2.3 JOINs
```

---

## 5. ARCHITECTURAL INSIGHTS

### 5.1 Query Design Patterns
- **Heavy use of JOINs** (58 occurrences) indicates normalized database schema
- **Simple queries** (85) used for basic CRUD operations
- **Views** (6) provide abstraction layer for reporting queries
- **Procedures** (5) handle complex multi-step validations

### 5.2 Transaction Strategy
- **Implicit transactions** used extensively (111 keywords found)
- Focus on **atomic operations** for critical business logic
- **Validation before write** pattern to minimize rollbacks
- Used in: appointment lifecycle, case assignments, withdrawals

### 5.3 Data Integrity
- **Triggers** (6) maintain referential integrity
- **Procedures** (5) validate business constraints
- **Foreign keys** enforce relationship constraints
- **Composite checks** (station matching, role validation, capacity limits)

---

## 6. RECOMMENDATIONS

### 6.1 Database Optimization
1. **Index JOIN columns** - 58 JOIN occurrences benefit from proper indexing
2. **Monitor procedure performance** - 5 procedures handle critical operations
3. **View materialization** - Consider for frequently accessed views (especially dashboards)

### 6.2 Transaction Management
1. **Document transaction scope** - 111 keywords suggest extensive use
2. **Monitor deadlocks** - Validate transaction isolation levels
3. **Review rollback scenarios** - Ensure error handling completeness

### 6.3 Query Patterns
1. **40.5% JOIN ratio** indicates potential for optimization through:
   - Strategic denormalization (if read-heavy)
   - Query result caching
   - Batch operations for write-heavy scenarios

### 6.4 Code Maintainability
1. Standardize transaction error handling
2. Document trigger side-effects
3. Add indexes for JOIN performance

---

## Report Metadata
- **Generated Date**: 2026-05-12
- **Database**: PICMS (Police Integrated Case Management System)
- **Total Files Analyzed**: 74 PHP files + 1 schema file
- **Analysis Type**: Comprehensive database usage audit
