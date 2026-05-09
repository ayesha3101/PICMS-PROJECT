# PICMS 2-Day Fix - Step-by-Step Implementation Guide

**Start Time:** [Record your start time]  
**Target:** 90% database compliance in 48 hours

---

## ⚡ BEFORE YOU START

1. **Backup everything:**
```bash
cd /c/xampp/htdocs/PICMS-PROJECT
git status  # Check current state
git add -A
git commit -m "backup: current state before transaction fixes"
```

2. **Open these files side-by-side:**
   - Editor 1: `src/php/ioCaseUpdate.php`
   - Editor 2: `src/php/shoWithdrawalAction.php`
   - Editor 3: `src/php/superintendentSaveDetainee.php`

---

## 🟢 DAY 1: 3 HOUR SPRINT

### TASK 1: Fix ioCaseUpdate.php (20 min)

**File:** `src/php/ioCaseUpdate.php`

**What to do:**
1. Open the file
2. Find the section where it does `UPDATE complaints`
3. Replace EVERYTHING from the update logic onwards with code from **2DAY_FIX_PLAN.md** under "QUICK FIX #1"

**Quick Check:**
- Look for `$conn->begin_transaction();` ✅
- Look for `catch (Exception $e)` ✅  
- Look for `$conn->rollback();` ✅

**Save & move to Task 2**

---

### TASK 2: Fix shoWithdrawalAction.php (20 min)

**File:** `src/php/shoWithdrawalAction.php`

**What to do:**
1. Open the file
2. Find where it does `UPDATE withdrawal_requests`
3. Replace the logic section with code from **QUICK FIX #2** in plan
4. The transaction wraps: update + complaint status + logging

**Quick Check:**
- Line has `$conn->begin_transaction();` ✅
- Line has `$conn->commit();` ✅
- Has approval logic that updates complaints ✅

**Save & move to Task 3**

---

### TASK 3: Fix superintendentSaveDetainee.php (25 min)

**File:** `src/php/superintendentSaveDetainee.php`

**What to do:**
1. Open the file
2. Look for the `if ($detaineeId > 0)` section
3. Replace entire INSERT/UPDATE logic with **QUICK FIX #3** code
4. This adds transaction wrapping around INSERT/UPDATE

**Key Changes:**
- Add `$conn->begin_transaction();` before any INSERT/UPDATE
- Wrap in try-catch
- Call `$conn->commit();` at end
- Call `$conn->rollback();` in catch

**Save & move to Testing**

---

### TASK 4: Test All Three (1 hour)

**Option A: Quick Test (Manual)**
1. Go to your application frontend
2. Test each module manually:
   - **IO:** Update a case status → check if both status + log entry created
   - **SHO:** Approve a withdrawal → check if request AND complaint updated
   - **Superintendent:** Save a detainee → check if detainee record created

**Option B: Database Test (Advanced)**
```sql
-- Run in MySQL to watch transactions
SHOW ENGINE INNODB STATUS;

-- Check if transactions complete
SELECT * FROM information_schema.INNODB_TRX;
```

**Option C: Error Test (Best)**
1. In `ioCaseUpdate.php`, temporarily add this AFTER first UPDATE:
```php
if ($complaint_id == 99) throw new Exception("TEST ROLLBACK");
```
2. Try to update a non-existent complaint (id=99)
3. **Expected:** Error message + no case_updates log created (rollback worked!)
4. **Remove the test code** after verifying

**✅ If all tests pass → Commit**

```bash
git add src/php/ioCaseUpdate.php src/php/shoWithdrawalAction.php src/php/superintendentSaveDetainee.php
git commit -m "fix: add transaction support to IO, SHO, and Superintendent modules"
```

---

## 🟢 DAY 2: 4 HOUR SPRINT

### TASK 5: Create Court Hearing - Create (50 min)

**File:** `src/php/courtHearingCreate.php` (NEW FILE)

**What to do:**
1. Create new file: `src/php/courtHearingCreate.php`
2. Copy entire code from **2DAY_FIX_PLAN.md** → "courtHearingCreate.php"
3. Save

**Test it:**
```bash
curl -X POST http://localhost/src/php/courtHearingCreate.php \
  -H "Content-Type: application/json" \
  -d '{"detainee_id": 1, "hearing_date": "2026-05-20", "hearing_type": "Bail Hearing", "court_name": "District Court"}'
```

**Expected Response:**
```json
{"success": true, "hearing_id": 1, "message": "Hearing scheduled successfully"}
```

---

### TASK 6: Create Court Hearing - Update (45 min)

**File:** `src/php/courtHearingUpdate.php` (NEW FILE)

**What to do:**
1. Create new file: `src/php/courtHearingUpdate.php`
2. Copy entire code from plan → "courtHearingUpdate.php"
3. Save

**Test it:**
```bash
curl -X POST http://localhost/src/php/courtHearingUpdate.php \
  -H "Content-Type: application/json" \
  -d '{"hearing_id": 1, "result": "Bail Approved", "next_hearing_date": "2026-06-10"}'
```

**Expected Response:**
```json
{"success": true, "message": "Hearing updated successfully"}
```

---

### TASK 7: Create Court Hearing - List (30 min)

**File:** `src/php/courtHearingList.php` (NEW FILE)

**What to do:**
1. Create new file: `src/php/courtHearingList.php`
2. Copy entire code from plan → "courtHearingList.php"
3. Save

**Test it:**
```bash
curl -X GET "http://localhost/src/php/courtHearingList.php?filter=upcoming" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{"success": true, "hearings": [...], "count": 5}
```

---

### TASK 8: Verify All Court Operations (1 hour)

**Checklist:**
- [ ] Create hearing → returns hearing_id ✅
- [ ] Update hearing → updates result field ✅
- [ ] List hearings → filters by date correctly ✅
- [ ] All have transactions (begin_transaction → commit/rollback) ✅
- [ ] Error handling works ✅

**Verify Database:**
```sql
-- Check if hearings were created
SELECT * FROM court_hearings ORDER BY hearing_id DESC LIMIT 5;

-- Check if logs were created
SELECT * FROM case_updates WHERE status = 'Court Hearing' OR status = 'Court Result' LIMIT 5;
```

**✅ If all pass → Commit**

```bash
git add src/php/courtHearingCreate.php src/php/courtHearingUpdate.php src/php/courtHearingList.php
git commit -m "feat: add court hearings CRUD operations with transactions"
```

---

## 🎯 FINAL CHECKLIST

### Day 1 Status
- [x] ioCaseUpdate.php - Transaction wrapper added
- [x] shoWithdrawalAction.php - Transaction wrapper added
- [x] superintendentSaveDetainee.php - Transaction wrapper added
- [x] Manual testing passed
- [x] Committed to git

### Day 2 Status
- [x] courtHearingCreate.php - Created & tested
- [x] courtHearingUpdate.php - Created & tested
- [x] courtHearingList.php - Created & tested
- [x] All transactions working
- [x] Committed to git

---

## 📊 VERIFICATION COMMANDS

### Check Transactions Were Added
```bash
# Should find 6 instances of begin_transaction
grep -r "begin_transaction" src/php/ | wc -l

# Should find 6 instances of rollback
grep -r "rollback" src/php/ | wc -l
```

### Check New Files Created
```bash
ls -la src/php/courtHeating*.php

# Should list:
# - courtHearingCreate.php
# - courtHearingUpdate.php
# - courtHearingList.php
```

### View Git Commits
```bash
git log --oneline | head -5

# Should show your two commits
```

---

## 🐛 TROUBLESHOOTING

### Error: "Prepare failed"
**Fix:** Check syntax of SQL - look for missing commas in bind_param

### Error: "Transaction already in progress"
**Fix:** Make sure there's no `$conn->begin_transaction()` called twice

### Error: "Undefined variable"
**Fix:** Check all variables are initialized before use in bind_param

### Database showing duplicate data
**Fix:** Transaction committed twice - check for missing `exit;` after first commit

---

## 📝 QUICK REFERENCE: SQL Patterns

### Pattern 1: Simple Transaction
```php
$conn->begin_transaction();
try {
    // Do operation
    $stmt->execute();
    $conn->commit();
} catch (Exception $e) {
    $conn->rollback();
}
```

### Pattern 2: Multi-step Transaction
```php
$conn->begin_transaction();
try {
    // Step 1
    $stmt1->execute();
    
    // Step 2
    $stmt2->execute();
    
    // All succeed together
    $conn->commit();
} catch (Exception $e) {
    // All rollback together
    $conn->rollback();
}
```

### Pattern 3: Transaction with Logging
```php
$conn->begin_transaction();
try {
    // Main operation
    $stmt->execute();
    
    // Log it
    $log->execute();
    
    $conn->commit();
} catch (Exception $e) {
    $conn->rollback();
    error_log('Error: ' . $e->getMessage());
}
```

---

## 🚀 AFTER 2 DAYS: What You'll Have Achieved

✅ **Transaction Support:** All critical data-changing operations are now atomic  
✅ **Court Module:** Full CRUD operations available  
✅ **90% Compliance:** Database now meets 90% of required features  
✅ **Data Integrity:** Failed operations rollback instead of leaving partial data  
✅ **Scalability:** Added transactions mean system is ready for more transactions  

---

## ⏭️ PHASE 2: What's Left (Not Required for 2-Day Sprint)

- Audit trail table (tracks WHO changed WHAT)
- DELETE operations for all modules
- Bulk operations (batch updates)
- Advanced analytics (GROUP BY/HAVING)

**Estimated time if needed:** 8-10 hours

---

## 📞 QUICK HELP

### "How do I know if transaction is working?"
Test with invalid data - should get error AND no data created

### "What if something breaks?"
```bash
git rollback [commit-hash]  # Go back to previous commit
```

### "How do I check if files are correct?"
Open each file and search for:
- `begin_transaction` ✅
- `commit()` ✅
- `catch` block ✅
- `rollback()` ✅

---

## 📅 TIMELINE ACTUAL

| Task | Planned | Actual | Status |
|------|---------|--------|--------|
| ioCaseUpdate | 20 min | ___ min | ⬜ |
| shoWithdrawalAction | 20 min | ___ min | ⬜ |
| superintendentSaveDetainee | 25 min | ___ min | ⬜ |
| Testing Day 1 | 1 hr | ___ hr | ⬜ |
| Commit Day 1 | 15 min | ___ min | ⬜ |
| courtHearingCreate | 50 min | ___ min | ⬜ |
| courtHearingUpdate | 45 min | ___ min | ⬜ |
| courtHearingList | 30 min | ___ min | ⬜ |
| Testing Day 2 | 1 hr | ___ hr | ⬜ |
| Commit Day 2 | 15 min | ___ min | ⬜ |
| **TOTAL** | **7 hours** | **___ hours** | ⬜ |

**Fill in actual times as you go!**

---

## ✅ FINAL VERIFICATION

Run this after Day 2 to confirm everything:

```bash
# 1. Check all files exist
test -f src/php/ioCaseUpdate.php && echo "✅ IO" || echo "❌ IO"
test -f src/php/shoWithdrawalAction.php && echo "✅ SHO" || echo "❌ SHO"
test -f src/php/superintendentSaveDetainee.php && echo "✅ SUPER" || echo "❌ SUPER"
test -f src/php/courtHearingCreate.php && echo "✅ COURT CREATE" || echo "❌ COURT CREATE"
test -f src/php/courtHearingUpdate.php && echo "✅ COURT UPDATE" || echo "❌ COURT UPDATE"
test -f src/php/courtHearingList.php && echo "✅ COURT LIST" || echo "❌ COURT LIST"

# 2. Check for transactions in each
grep -l "begin_transaction" src/php/ioCaseUpdate.php src/php/shoWithdrawalAction.php src/php/superintendentSaveDetainee.php src/php/courtHeating*.php | wc -l
# Should show: 6

# 3. Git log
git log --oneline | head -2
# Should show both day 1 and day 2 commits
```

---

**YOU'VE GOT THIS! 💪 Start Day 1 in 5 minutes.**
