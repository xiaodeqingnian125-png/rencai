function positiveId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : 0;
}

function cleanCode(value) {
  return String(value || "").trim();
}

function validateApartmentIdentity(item, sameCodeRecords) {
  const id = positiveId(item && item.id);
  const apartmentCode = cleanCode(item && item.apartment_code);
  if (!id) return { ok: false, error: "公寓业务ID无效" };
  if (!apartmentCode) return { ok: false, error: "请填写公寓编号" };
  const conflict = (sameCodeRecords || []).some((record) => positiveId(record.id) !== id);
  if (conflict) return { ok: false, error: `公寓编号已存在：${apartmentCode}` };
  return { ok: true, item: { ...item, id, apartment_code: apartmentCode } };
}

function attachRoomApartment(item, apartments) {
  const id = positiveId(item && item.id);
  const apartmentCode = cleanCode(item && item.apartment_code);
  if (!id) return { ok: false, error: "户型业务ID无效" };
  if (!apartmentCode) return { ok: false, error: "请填写所属公寓编号" };
  const apartment = (apartments || []).find((record) => cleanCode(record.apartment_code) === apartmentCode);
  if (!apartment || !positiveId(apartment.id)) {
    return { ok: false, error: `所属公寓不存在：${apartmentCode}` };
  }
  return {
    ok: true,
    item: {
      ...item,
      id,
      apartment_code: apartmentCode,
      apartment_id: positiveId(apartment.id)
    }
  };
}

module.exports = {
  validateApartmentIdentity,
  attachRoomApartment
};
