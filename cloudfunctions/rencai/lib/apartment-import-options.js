const COST_COLUMNS = [
  { header: "水费（元/m³）", label: "水费", unit: "元/m³" },
  { header: "电费（元/度）", label: "电费", unit: "元/度" },
  { header: "燃气费（元/m³）", label: "燃气费", unit: "元/m³" },
  { header: "物业费（元/㎡/月）", label: "物业费", unit: "元/㎡/月" },
  { header: "暖气费（元/㎡/天）", label: "暖气费", unit: "元/㎡/天" },
  { header: "停车费（元/月）", label: "停车费", unit: "元/月" }
];

const LEGACY_FRIENDLY_HEADERS = ["水费（元/立方）", "燃气费（元/立方）", "网费（元/月）"];

const PRIVATE_OPTIONS = [
  { label: "独立卫浴", icon: "卫" }, { label: "空调", icon: "空" }, { label: "热水器", icon: "热" },
  { label: "宽带", icon: "网" }, { label: "衣柜", icon: "柜" }, { label: "书桌", icon: "桌" }, { label: "凳子", icon: "凳" }
];
const PUBLIC_OPTIONS = [
  { label: "自助洗衣房", icon: "衣" }, { label: "公共厨房", icon: "厨" }, { label: "健身区", icon: "健" },
  { label: "快递柜", icon: "柜" }, { label: "休闲区", icon: "休" }, { label: "充电桩", icon: "电" }
];
const NEARBY_OPTIONS = [
  { label: "超市/便利店", icon: "店" }, { label: "快餐小吃", icon: "餐" }, { label: "药店", icon: "药" },
  { label: "公交站", icon: "交" }, { label: "地铁站", icon: "地" }, { label: "银行", icon: "银" }
];

function hasFriendlyApartmentColumns(row) {
  return COST_COLUMNS.every((item) => Object.prototype.hasOwnProperty.call(row || {}, item.header));
}

function missingFriendlyApartmentHeaders(row) {
  return COST_COLUMNS
    .filter((item) => !Object.prototype.hasOwnProperty.call(row || {}, item.header))
    .map((item) => item.header);
}

function hasLegacyFriendlyApartmentColumns(row) {
  return LEGACY_FRIENDLY_HEADERS.some((header) => Object.prototype.hasOwnProperty.call(row || {}, header));
}

function isPresent(value) {
  return ["有", "是", "√", "1", "true"].includes(String(value || "").trim().toLowerCase());
}

function trim(value) {
  return String(value === undefined || value === null ? "" : value).trim();
}

function buildCostsFromColumns(row) {
  return COST_COLUMNS.map((item) => {
    const amount = trim(row[item.header]);
    return { label: item.label, value: amount, active: Boolean(amount) };
  });
}

function buildOptionsFromColumns(row, options, prefix) {
  return options.map((option) => ({
    label: option.label,
    icon: option.icon,
    active: isPresent(row[`${prefix}·${option.label}`])
  }));
}

module.exports = {
  COST_COLUMNS,
  PRIVATE_OPTIONS,
  PUBLIC_OPTIONS,
  NEARBY_OPTIONS,
  hasLegacyFriendlyApartmentColumns,
  hasFriendlyApartmentColumns,
  missingFriendlyApartmentHeaders,
  buildCostsFromColumns,
  buildOptionsFromColumns
};
