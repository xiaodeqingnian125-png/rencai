# Apartment Fee Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the six fee fields from the approved 77-row Excel file, remove the confirmed duplicate A001 record, and prevent an out-of-sync template from silently clearing fees again.

**Architecture:** The current Excel headers become the single import contract. Both import and export preserve each fee cell's original text. A narrowly scoped administrator recovery action validates all 77 records by apartment code, updates only `costs`, and deletes only the confirmed duplicate document ID.

**Tech Stack:** WeChat Cloud Function, native JavaScript, Node.js built-in test runner, xlsx.

## Global Constraints

- Use native WeChat Mini Program and Cloud Function code only; add no dependencies.
- The database recovery modifies only the six fee values and the one approved duplicate A001 document.
- Back up the live `apartments` collection before any database mutation.
- Current Excel headings must be complete; retired headings and partial headings must be rejected.
- Record this task in `logs/` and verify in the iPhone simulator where possible.

---

### Task 1: Lock the import/export contract with tests

**Files:**
- Modify: `tests/import-address-only.test.js`
- Modify: `tests/admin-cloud-crud.test.js`

- [ ] Add a test showing that all six current fee headers preserve their supplied cell text exactly.
- [ ] Add a test showing an Excel row with only part of the six headers is rejected before it can create blank fee records.
- [ ] Change the export test to expect the stored fee text, including any unit text, unchanged.
- [ ] Run: `node --test tests/import-address-only.test.js tests/admin-cloud-crud.test.js`
- [ ] Confirm the new assertions fail against the current implementation.

### Task 2: Repair the import/export contract

**Files:**
- Modify: `cloudfunctions/rencai/lib/apartment-import-options.js`
- Modify: `cloudfunctions/rencai/lib/import-task.js`
- Modify: `miniprogram/pages/admin/index.js`

- [ ] Require all six current cost headers for apartment spreadsheet imports and return the missing header names when incomplete.
- [ ] Keep each fee cell as supplied instead of adding or removing a unit.
- [ ] Export each stored fee value without transformation.
- [ ] Run the Task 1 tests and the related full test suite.

### Task 3: Make the approved recovery narrowly auditable

**Files:**
- Modify: `cloudfunctions/rencai/index.js`
- Modify: `tests/admin-cloud-crud.test.js`

- [ ] Add an admin-only recovery action that accepts exactly 77 unique apartment codes and six fee values per code.
- [ ] Verify every code resolves to exactly one retained apartment record; update only `costs` by document ID.
- [ ] Delete only the supplied duplicate document after validating it is the numeric-id A001 duplicate and that the retained A001 remains.
- [ ] Return the changed document IDs and preflight counts for audit.
- [ ] Test rejection for invalid record counts, duplicate codes, incomplete fees, and an unexpected duplicate ID.

### Task 4: Back up, deploy, recover, and verify

**Files:**
- Create: `outputs/db-backups/apartments-before-fee-recovery-<timestamp>.json`
- Create: `logs/2026-07-24-apartment-fee-recovery.md`

- [ ] Read the current live `apartments` collection and save a backup outside version control.
- [ ] Deploy the updated `rencai` cloud function.
- [ ] Call the recovery action with values extracted from `人才公寓-20260724-182343.xlsx` and the confirmed duplicate A001 document ID.
- [ ] Read back the live collection: assert 77 documents, unique codes, only six fee fields changed, and all six values match the approved workbook.
- [ ] Export a verification workbook and compare its six fee cells against the approved workbook.
- [ ] Run the complete relevant automated tests and document exact results.
