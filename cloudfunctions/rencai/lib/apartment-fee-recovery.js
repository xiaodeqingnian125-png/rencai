const RECOVERY_RECORD_COUNT = 77;
const RECOVERY_FEE_LABELS = ["水费", "电费", "燃气费", "物业费", "暖气费", "停车费"];

function normalizeRecoveryRecords(input) {
  if (!Array.isArray(input) || input.length !== RECOVERY_RECORD_COUNT) {
    throw new Error(`恢复数据必须恰好包含 ${RECOVERY_RECORD_COUNT} 套公寓`);
  }

  const codes = new Set();
  return input.map((record) => {
    const apartmentCode = String(record && record.apartment_code || "").trim();
    if (!apartmentCode) throw new Error("恢复数据包含空公寓编号");
    if (codes.has(apartmentCode)) throw new Error(`恢复数据中的公寓编号重复：${apartmentCode}`);
    codes.add(apartmentCode);

    const sourceCosts = Array.isArray(record && record.costs) ? record.costs : [];
    const values = new Map();
    sourceCosts.forEach((item) => {
      const label = String(item && item.label || "").trim();
      if (!RECOVERY_FEE_LABELS.includes(label) || values.has(label)) return;
      const rawValue = item && item.value;
      values.set(label, rawValue === undefined || rawValue === null ? "" : String(rawValue));
    });
    const missing = RECOVERY_FEE_LABELS.filter((label) => !values.has(label));
    if (missing.length > 0) throw new Error(`公寓 ${apartmentCode} 的费用项不完整：${missing.join("、")}`);

    return {
      apartment_code: apartmentCode,
      costs: RECOVERY_FEE_LABELS.map((label) => {
        const value = values.get(label);
        return { label, value, active: value !== "" };
      })
    };
  });
}

function assertRecoveryDuplicate(record) {
  if (!record || record.apartment_code !== "A001" || !Number.isInteger(record.id) || record.id !== 1) {
    throw new Error("重复记录不符合已确认的 A001 数字业务ID条件，已停止删除");
  }
}

module.exports = {
  RECOVERY_RECORD_COUNT,
  RECOVERY_FEE_LABELS,
  normalizeRecoveryRecords,
  assertRecoveryDuplicate
};
