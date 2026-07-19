const test = require("node:test");
const assert = require("node:assert/strict");
const {
  validateApartmentIdentity,
  attachRoomApartment
} = require("../cloudfunctions/rencai/lib/admin-record");

test("manual apartment save rejects a duplicate apartment_code", () => {
  const result = validateApartmentIdentity(
    { id: 2, apartment_code: "A001" },
    [{ id: 1, apartment_code: "A001" }]
  );

  assert.equal(result.ok, false);
  assert.match(result.error, /公寓编号已存在/);
});

test("editing the same apartment may retain its apartment_code", () => {
  const result = validateApartmentIdentity(
    { id: 1, apartment_code: "A001" },
    [{ id: 1, apartment_code: "A001" }]
  );

  assert.equal(result.ok, true);
});

test("manual room save attaches the authoritative apartment id", () => {
  const result = attachRoomApartment(
    { id: 8, apartment_code: "A003", name: "一居室" },
    [{ id: 3, apartment_code: "A003", name: "经开人才公寓" }]
  );

  assert.equal(result.ok, true);
  assert.equal(result.item.apartment_id, 3);
});

test("manual room save rejects an unknown apartment_code", () => {
  const result = attachRoomApartment(
    { id: 8, apartment_code: "UNKNOWN", name: "一居室" },
    []
  );

  assert.equal(result.ok, false);
  assert.match(result.error, /所属公寓不存在/);
});
