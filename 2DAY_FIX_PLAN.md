# PICMS Database Fix - 2-Day Sprint Plan

**Timeline:** 2 days max | **Focus:** Critical fixes only | **Target:** 90%+ compliance

---

## 🎯 Day 1: Transaction Fixes (4 hours)

### Priority Order (Fastest First)
1. ✅ **Fix IO Module** - 20 minutes
2. ✅ **Fix SHO Module** - 20 minutes  
3. ✅ **Fix Superintendent Module** - 25 minutes
4. ✅ **Quick Test & Debug** - 1 hour
5. ✅ **Commit & Document** - 15 minutes

---

## 🚀 QUICK FIX #1: IO Case Update (ioCaseUpdate.php)

**Location:** `src/php/ioCaseUpdate.php`  
**Time:** 20 minutes

```php
<?php
require_once __DIR__ . '/../config/config.php';
session_start();
header('Content-Type: application/json');

// ... existing auth checks ...

$complaint_id = (int)($input['complaint_id'] ?? 0);
$new_status = trim($input['status'] ?? '');
$note = trim($input['note'] ?? '');
$officer_id = (int)$_SESSION['officer_id'];

// ============================================
// NEW: ATOMIC TRANSACTION
// ============================================
$conn->begin_transaction();

try {
    // 1. Update complaint status
    $stmt1 = $conn->prepare("
        UPDATE complaints 
        SET status = ? 
        WHERE complaint_id = ? AND station_id = ?
    ");
    if (!$stmt1) throw new Exception("Prepare failed: " . $conn->error);
    
    $station_id = (int)$_SESSION['station_id'];
    $stmt1->bind_param('sii', $new_status, $complaint_id, $station_id);
    
    if (!$stmt1->execute()) {
        throw new Exception("Failed to update complaint status");
    }
    $stmt1->close();
    
    // 2. Log the update
    $stmt2 = $conn->prepare("
        INSERT INTO case_updates (complaint_id, status, note, updated_by) 
        VALUES (?, ?, ?, ?)
    ");
    if (!$stmt2) throw new Exception("Prepare failed: " . $conn->error);
    
    $officer_name = $_SESSION['officer_name'] ?? 'System';
    $stmt2->bind_param('isss', $complaint_id, $new_status, $note, $officer_name);
    
    if (!$stmt2->execute()) {
        throw new Exception("Failed to log case update");
    }
    $stmt2->close();
    
    // 3. Commit both operations atomically
    $conn->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Case updated successfully'
    ]);
    
} catch (Exception $e) {
    // ROLLBACK if anything fails
    $conn->rollback();
    error_log('ioCaseUpdate error: ' . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'message' => 'Failed to update case. Please try again.',
        'error' => $e->getMessage()
    ]);
}
?>
```

**Why this works:**
- If status UPDATE fails → ROLLBACK entire transaction
- If case_updates INSERT fails → ROLLBACK status change
- Both operations succeed or both fail (no partial updates)

---

## 🚀 QUICK FIX #2: SHO Withdrawal Action (shoWithdrawalAction.php)

**Location:** `src/php/shoWithdrawalAction.php`  
**Time:** 20 minutes

```php
<?php
require_once __DIR__ . '/../config/config.php';
session_start();
header('Content-Type: application/json');

// ... existing auth checks ...

$request_id = (int)($input['request_id'] ?? 0);
$action = trim($input['action'] ?? ''); // 'Approved' or 'Rejected'
$rejection_note = trim($input['rejection_note'] ?? '');
$officer_id = (int)$_SESSION['officer_id'];

// Get withdrawal request details
$req = $conn->prepare("
    SELECT complaint_id, status FROM withdrawal_requests 
    WHERE request_id = ? LIMIT 1
");
$req->bind_param('i', $request_id);
$req->execute();
$request = $req->get_result()->fetch_assoc();
$req->close();

if (!$request) {
    echo json_encode(['success' => false, 'message' => 'Request not found']);
    exit;
}

$complaint_id = $request['complaint_id'];

// ============================================
// NEW: ATOMIC TRANSACTION
// ============================================
$conn->begin_transaction();

try {
    // 1. Update withdrawal request status
    $stmt1 = $conn->prepare("
        UPDATE withdrawal_requests 
        SET status = ?, actioned_by = ?, actioned_at = NOW(), rejection_note = ?
        WHERE request_id = ?
    ");
    if (!$stmt1) throw new Exception("Prepare failed");
    
    $stmt1->bind_param('sisi', $action, $officer_id, $rejection_note, $request_id);
    if (!$stmt1->execute()) {
        throw new Exception("Failed to update withdrawal request");
    }
    $stmt1->close();
    
    // 2. Update complaint status if APPROVED
    if ($action === 'Approved') {
        $stmt2 = $conn->prepare("
            UPDATE complaints 
            SET status = 'Withdrawn'
            WHERE complaint_id = ?
        ");
        if (!$stmt2) throw new Exception("Prepare failed");
        
        $stmt2->bind_param('i', $complaint_id);
        if (!$stmt2->execute()) {
            throw new Exception("Failed to update complaint status");
        }
        $stmt2->close();
        
        // Log the withdrawal
        $note = 'SHO approved withdrawal request';
        $log = $conn->prepare("
            INSERT INTO case_updates (complaint_id, status, note, updated_by) 
            VALUES (?, 'Withdrawn', ?, 'System')
        ");
        $log->bind_param('is', $complaint_id, $note);
        $log->execute();
        $log->close();
    } else {
        // Log rejection
        $note = "SHO rejected withdrawal: $rejection_note";
        $log = $conn->prepare("
            INSERT INTO case_updates (complaint_id, status, note, updated_by) 
            VALUES (?, 'Withdrawal Pending', ?, 'System')
        ");
        $log->bind_param('is', $complaint_id, $note);
        $log->execute();
        $log->close();
    }
    
    // 3. Commit all operations
    $conn->commit();
    
    echo json_encode([
        'success' => true,
        'message' => $action === 'Approved' ? 'Withdrawal approved' : 'Withdrawal rejected'
    ]);
    
} catch (Exception $e) {
    $conn->rollback();
    error_log('shoWithdrawalAction: ' . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'message' => 'Action failed. Please try again.'
    ]);
}
?>
```

---

## 🚀 QUICK FIX #3: Superintendent Save Detainee (superintendentSaveDetainee.php)

**Location:** `src/php/superintendentSaveDetainee.php`  
**Time:** 25 minutes

```php
<?php
require_once __DIR__ . '/../config/config.php';
session_start();
header('Content-Type: application/json');

// ... existing validation ...

$stationId = (int)($_SESSION['station_id'] ?? 0);
$officerId = (int)$_SESSION['officer_id'];
$input = json_decode(file_get_contents('php://input'), true) ?: [];

$detaineeId = (int)($input['detainee_id'] ?? 0);
$cnic = trim((string)($input['cnic'] ?? ''));
$fname = trim((string)($input['d_fname'] ?? ''));
$minit = trim((string)($input['d_minit'] ?? ''));
$lname = trim((string)($input['d_lname'] ?? ''));
$age = (int)($input['age'] ?? 0);
$gender = trim((string)($input['gender'] ?? ''));
$purpose = trim((string)($input['purpose_of_admission'] ?? ''));
$admissionDate = trim((string)($input['admission_date'] ?? ''));
$complaintId = !empty($input['complaint_id']) ? (int)$input['complaint_id'] : null;

if ($fname === '' || $lname === '' || $age < 1 || !in_array($gender, ['Male', 'Female'], true) || $admissionDate === '') {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

// ============================================
// NEW: ATOMIC TRANSACTION
// ============================================
$conn->begin_transaction();

try {
    if ($detaineeId > 0) {
        // UPDATE case
        $stmt = $conn->prepare("
            UPDATE detainees
            SET cnic = ?, d_fname = ?, d_minit = ?, d_lname = ?, age = ?, gender = ?,
                complaint_id = ?, purpose_of_admission = ?, admission_date = ?
            WHERE detainee_id = ? AND station_id = ?
        ");
        $stmt->bind_param(
            'ssssisissii',
            $cnic, $fname, $minit, $lname, $age, $gender,
            $complaintId, $purpose, $admissionDate,
            $detaineeId, $stationId
        );
    } else {
        // INSERT case
        $stmt = $conn->prepare("
            INSERT INTO detainees (
                cnic, d_fname, d_minit, d_lname, age, gender, station_id,
                complaint_id, purpose_of_admission, admission_date, admitted_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->bind_param(
            'ssssisiissi',
            $cnic, $fname, $minit, $lname, $age, $gender, $stationId,
            $complaintId, $purpose, $admissionDate, $officerId
        );
    }
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to save detainee: " . $stmt->error);
    }
    
    $lastId = $detaineeId > 0 ? $detaineeId : $conn->insert_id;
    
    // Log the action
    $action = $detaineeId > 0 ? 'UPDATE' : 'INSERT';
    $log = $conn->prepare("
        INSERT INTO case_updates (complaint_id, status, note, updated_by)
        VALUES (?, 'Detention', ?, 'System')
    ");
    $logNote = "$action detainee record: $fname $lname";
    $log->bind_param('is', $complaintId, $logNote);
    $log->execute();
    $log->close();
    
    $stmt->close();
    
    // Commit transaction
    $conn->commit();
    
    echo json_encode([
        'success' => true,
        'detainee_id' => $lastId,
        'message' => 'Detainee saved successfully'
    ]);
    
} catch (Exception $e) {
    $conn->rollback();
    error_log('superintendentSaveDetainee: ' . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'message' => 'Failed to save detainee'
    ]);
}
?>
```

---

## 🧪 Day 1: Testing (1 hour)

### Test Script - Run in browser console or test manually:

```javascript
// Test 1: IO Case Update
const testIO = async () => {
  const res = await fetch('/src/php/ioCaseUpdate.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      complaint_id: 1,
      status: 'Investigation Ongoing',
      note: 'Test update with transaction'
    })
  });
  console.log('IO Update:', await res.json());
};

// Test 2: SHO Withdrawal
const testSHO = async () => {
  const res = await fetch('/src/php/shoWithdrawalAction.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      request_id: 1,
      action: 'Approved'
    })
  });
  console.log('SHO Withdrawal:', await res.json());
};

// Test 3: Superintendent Save
const testSupt = async () => {
  const res = await fetch('/src/php/superintendentSaveDetainee.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      d_fname: 'Test',
      d_lname: 'Detainee',
      age: 25,
      gender: 'Male',
      admission_date: '2026-05-09'
    })
  });
  console.log('Superintendent Save:', await res.json());
};
```

---

## 📅 Day 2: Court Hearings Module (4 hours)

### NEW FILES TO CREATE:

#### 1. **courtHearingCreate.php** (50 lines)
**Location:** `src/php/courtHearingCreate.php`

```php
<?php
require_once __DIR__ . '/../config/config.php';
session_start();
header('Content-Type: application/json');

// Auth check for officers only
if (empty($_SESSION['officer_id']) || $_SESSION['role'] !== 'officer') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid method']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];

$detainee_id = (int)($input['detainee_id'] ?? 0);
$complaint_id = !empty($input['complaint_id']) ? (int)$input['complaint_id'] : null;
$court_name = trim($input['court_name'] ?? '');
$hearing_date = trim($input['hearing_date'] ?? '');
$hearing_type = trim($input['hearing_type'] ?? '');
$hearing_time = !empty($input['hearing_time']) ? trim($input['hearing_time']) : null;

if (!$detainee_id || !$hearing_date || !$hearing_type) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

// Validate hearing_type
$valid_types = ['Remand Extension', 'Bail Hearing', 'Trial', 'Verdict', 'Other'];
if (!in_array($hearing_type, $valid_types)) {
    echo json_encode(['success' => false, 'message' => 'Invalid hearing type']);
    exit;
}

$conn->begin_transaction();

try {
    // 1. Create hearing
    $stmt = $conn->prepare("
        INSERT INTO court_hearings 
        (detainee_id, complaint_id, court_name, hearing_date, hearing_time, hearing_type)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    if (!$stmt) throw new Exception("Prepare failed");
    
    $stmt->bind_param('iissis', $detainee_id, $complaint_id, $court_name, $hearing_date, $hearing_time, $hearing_type);
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to create hearing");
    }
    
    $hearing_id = $conn->insert_id;
    $stmt->close();
    
    // 2. Log the action
    $log = $conn->prepare("
        INSERT INTO case_updates (complaint_id, status, note, updated_by)
        VALUES (?, 'Court Hearing', ?, 'System')
    ");
    $note = "Court hearing scheduled: $hearing_type on $hearing_date";
    $log->bind_param('is', $complaint_id, $note);
    $log->execute();
    $log->close();
    
    $conn->commit();
    
    echo json_encode([
        'success' => true,
        'hearing_id' => $hearing_id,
        'message' => 'Hearing scheduled successfully'
    ]);
    
} catch (Exception $e) {
    $conn->rollback();
    error_log('courtHearingCreate: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to schedule hearing']);
}
?>
```

#### 2. **courtHearingUpdate.php** (60 lines)
**Location:** `src/php/courtHearingUpdate.php`

```php
<?php
require_once __DIR__ . '/../config/config.php';
session_start();
header('Content-Type: application/json');

if (empty($_SESSION['officer_id']) || $_SESSION['role'] !== 'officer') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];

$hearing_id = (int)($input['hearing_id'] ?? 0);
$result = trim($input['result'] ?? '');
$next_hearing_date = !empty($input['next_hearing_date']) ? trim($input['next_hearing_date']) : null;
$notes = trim($input['notes'] ?? '');

if (!$hearing_id) {
    echo json_encode(['success' => false, 'message' => 'Hearing ID required']);
    exit;
}

// Get current hearing
$check = $conn->prepare("SELECT detainee_id, complaint_id FROM court_hearings WHERE hearing_id = ?");
$check->bind_param('i', $hearing_id);
$check->execute();
$hearing = $check->get_result()->fetch_assoc();
$check->close();

if (!$hearing) {
    echo json_encode(['success' => false, 'message' => 'Hearing not found']);
    exit;
}

$conn->begin_transaction();

try {
    // 1. Update hearing
    $stmt = $conn->prepare("
        UPDATE court_hearings
        SET result = ?, next_hearing_date = ?, notes = ?
        WHERE hearing_id = ?
    ");
    $stmt->bind_param('sssi', $result, $next_hearing_date, $notes, $hearing_id);
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to update hearing");
    }
    $stmt->close();
    
    // 2. Log update
    $log = $conn->prepare("
        INSERT INTO case_updates (complaint_id, status, note, updated_by)
        VALUES (?, 'Court Result', ?, 'System')
    ");
    $note = "Hearing result: $result";
    $log->bind_param('is', $hearing['complaint_id'], $note);
    $log->execute();
    $log->close();
    
    // 3. If verdict, consider updating detainee status
    if (strpos(strtolower($result), 'acquitted') !== false || strpos(strtolower($result), 'guilty') !== false) {
        $release = $conn->prepare("UPDATE detainees SET release_date = NOW() WHERE detainee_id = ?");
        $release->bind_param('i', $hearing['detainee_id']);
        $release->execute();
        $release->close();
    }
    
    $conn->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Hearing updated successfully'
    ]);
    
} catch (Exception $e) {
    $conn->rollback();
    error_log('courtHearingUpdate: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to update hearing']);
}
?>
```

#### 3. **courtHearingList.php** (40 lines)
**Location:** `src/php/courtHearingList.php`

```php
<?php
require_once __DIR__ . '/../config/config.php';
session_start();
header('Content-Type: application/json');

if (empty($_SESSION['officer_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$station_id = (int)($_SESSION['station_id'] ?? 0);
$filter = trim($_GET['filter'] ?? 'upcoming'); // upcoming, completed, all

try {
    $query = "SELECT * FROM vw_hearing_calendar WHERE station_id = ?";
    
    if ($filter === 'upcoming') {
        $query .= " AND hearing_date >= CURDATE() ORDER BY hearing_date ASC";
    } elseif ($filter === 'completed') {
        $query .= " AND hearing_date < CURDATE() ORDER BY hearing_date DESC";
    } else {
        $query .= " ORDER BY hearing_date DESC";
    }
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $station_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $hearings = [];
    while ($row = $result->fetch_assoc()) {
        $hearings[] = $row;
    }
    
    echo json_encode([
        'success' => true,
        'hearings' => $hearings,
        'count' => count($hearings)
    ]);
    
} catch (Exception $e) {
    error_log('courtHearingList: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to fetch hearings']);
}
?>
```

---

## 🧪 Day 2: Testing Court Module

```php
// Test Court Hearing Create
$testCreate = curl_init('http://localhost/src/php/courtHearingCreate.php');
curl_setopt($testCreate, CURLOPT_POST, true);
curl_setopt($testCreate, CURLOPT_POSTFIELDS, json_encode([
    'detainee_id' => 1,
    'complaint_id' => 5,
    'court_name' => 'District Court Karachi',
    'hearing_date' => '2026-05-20',
    'hearing_type' => 'Bail Hearing'
]));
curl_setopt($testCreate, CURLOPT_RETURNTRANSFER, true);
curl_setopt($testCreate, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$response = curl_exec($testCreate);
echo $response;
```

---

## 📋 2-DAY EXECUTION CHECKLIST

### **Day 1 (2-3 hours)**
- [ ] Backup database
- [ ] Edit `ioCaseUpdate.php` - Add transaction wrapper
- [ ] Edit `shoWithdrawalAction.php` - Add transaction wrapper
- [ ] Edit `superintendentSaveDetainee.php` - Add transaction wrapper
- [ ] Manual testing of each endpoint
- [ ] Verify rollback works (trigger error mid-transaction)
- [ ] Commit changes to git

### **Day 2 (2-3 hours)**
- [ ] Create `courtHearingCreate.php`
- [ ] Create `courtHearingUpdate.php`
- [ ] Create `courtHearingList.php`
- [ ] Test each court module file
- [ ] Verify transaction atomicity
- [ ] Commit changes to git
- [ ] Create simple test report

---

## ⏰ Time Breakdown

| Task | Time | Status |
|------|------|--------|
| IO Transaction Fix | 20 min | 🟢 Quick |
| SHO Transaction Fix | 20 min | 🟢 Quick |
| Superintendent Transaction Fix | 25 min | 🟢 Quick |
| Day 1 Testing | 1 hour | 🟢 Testing |
| Day 1 Commit | 15 min | 🟢 Git |
| **Day 1 Total** | **~3 hours** | ✅ |
| Court Create Endpoint | 40 min | 🟢 New |
| Court Update Endpoint | 45 min | 🟢 New |
| Court List Endpoint | 30 min | 🟢 New |
| Day 2 Testing | 1.5 hours | 🟢 Testing |
| Day 2 Commit | 15 min | 🟢 Git |
| **Day 2 Total** | **~4 hours** | ✅ |

**TOTAL: ~7 hours for 90% compliance**

---

## 📊 Expected Results After 2 Days

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Compliance | 78% | **90%** | +12% |
| Transactions | 50% | **100%** | +50% |
| DELETE ops | 37% | **37%** | - |
| Court Hearings | 0% | **100%** | +100% |
| Audit Trail | 0% | 0% | - |

**What's NOT included (defer to Phase 2):**
- ❌ Audit trail table (~2 hours)
- ❌ DELETE operations (~2 hours)
- ❌ Bulk operations (~3 hours)
- ❌ Advanced analytics (~1.5 hours)

---

## 🚀 Implementation Steps (Copy-Paste Ready)

### Step 1: Backup
```bash
cd /c/xampp/htdocs/PICMS-PROJECT
git add -A
git commit -m "backup: before transaction fixes"
```

### Step 2: Edit files with provided code above

### Step 3: Test each one
```bash
# In MySQL
SELECT * FROM information_schema.INNODB_TRX; -- Check active transactions
```

### Step 4: Final commit
```bash
git add -A
git commit -m "feat: add transaction support to IO, SHO, Superintendent modules + court hearings CRUD"
git log --oneline | head -5
```

---

**Questions?** Ask for specific code clarifications or test scenarios!
