const test = require("node:test");
const assert = require("node:assert/strict");

const {
  RECOVERY_RECORD_COUNT,
  normalizeRecoveryRecords,
  assertRecoveryDuplicate
} = require("../cloudfunctions/rencai/lib/apartment-fee-recovery");

const labels = ["水费", "电费", "燃气费", "物业费", "暖气费", "停车费"];

function records(count = RECOVERY_RECORD_COUNT) {
  return Array.from({ length: count }, (_, index) => ({
    apartment_code: `A${String(index + 1).padStart(3, "0")}`,
    costs: labels.map((label, costIndex) => ({ label, value: String(index + costIndex), active: true }))
  }));
}

test("recovery accepts exactly 77 unique apartments with all six original fee values", () => {
  const result = normalizeRecoveryRecords(records());

  assert.equal(result.length, RECOVERY_RECORD_COUNT);
  assert.deepEqual(result[0].costs[0], { label: "水费", value: "0", active: true });
  assert.deepEqual(result[0].costs[5], { label: "停车费", value: "5", active: true });
});

test("recovery rejects a count other than 77 and duplicate apartment codes", () => {
  assert.throws(() => normalizeRecoveryRecords(records(76)), /必须恰好包含 77/);
  const duplicated = records();
  duplicated[1].apartment_code = duplicated[0].apartment_code;
  assert.throws(() => normalizeRecoveryRecords(duplicated), /公寓编号重复/);
});

test("recovery rejects missing fee labels and preserves blank fee cells", () => {
  const missing = records();
  missing[0].costs = missing[0].costs.slice(0, 5);
  assert.throws(() => normalizeRecoveryRecords(missing), /费用项不完整/);

  const blanks = records();
  blanks[0].costs[0] = { label: "水费", value: "", active: false };
  assert.deepEqual(normalizeRecoveryRecords(blanks)[0].costs[0], { label: "水费", value: "", active: false });
});

test("recovery only permits deleting the numeric-id A001 duplicate", () => {
  assert.doesNotThrow(() => assertRecoveryDuplicate({ _id: "duplicate", apartment_code: "A001", id: 1 }));
  assert.throws(() => assertRecoveryDuplicate({ _id: "wrong", apartment_code: "A002", id: 1 }), /重复记录不符合/);
  assert.throws(() => assertRecoveryDuplicate({ _id: "wrong", apartment_code: "A001", id: "1" }), /重复记录不符合/);
});
