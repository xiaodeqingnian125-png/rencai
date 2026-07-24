const PRIVATE_OPTIONS = [
  { label: "独立卫浴", icon: "卫" },
  { label: "空调", icon: "空" },
  { label: "热水器", icon: "热" },
  { label: "宽带", icon: "网" },
  { label: "衣柜", icon: "柜" },
  { label: "书桌", icon: "桌" },
  { label: "凳子", icon: "凳" }
];

const PUBLIC_OPTIONS = [
  { label: "自助洗衣房", icon: "衣" },
  { label: "公共厨房", icon: "厨" },
  { label: "健身区", icon: "健" },
  { label: "快递柜", icon: "柜" },
  { label: "休闲区", icon: "休" },
  { label: "充电桩", icon: "电" }
];

const NEARBY_OPTIONS = [
  { label: "超市/便利店", icon: "店" },
  { label: "快餐小吃", icon: "餐" },
  { label: "药店", icon: "药" },
  { label: "公交站", icon: "交" },
  { label: "地铁站", icon: "地" },
  { label: "银行", icon: "银" }
];

const COST_OPTIONS = [
  { label: "水费", displayLabel: "水费（m³）" },
  { label: "电费", displayLabel: "电费（度）" },
  { label: "燃气费", displayLabel: "燃气费（m³）" },
  { label: "物业费", displayLabel: "物业费（㎡/月）" },
  { label: "暖气费", displayLabel: "暖气费（㎡/天）", legacyLabel: "网费" },
  { label: "停车费", displayLabel: "停车费（月）" }
];

function formatCostValue(value) {
  const text = String(value === undefined || value === null ? "" : value).trim();
  if (!text) return "";
  return text.replace(/\s*元\/(?:m³|立方|度|㎡\/月|㎡\/天|月)\s*$/, "").trim();
}

function buildApartmentCostDisplay(input) {
  const source = Array.isArray(input) ? input : [];
  return COST_OPTIONS.map((option) => {
    const item = source.find((cost) => {
      const label = String(cost && cost.label || "").trim();
      return label === option.label || label === option.legacyLabel;
    });
    return {
      label: option.displayLabel,
      value: formatCostValue(item && item.value),
      active: Boolean(item) && item.active !== false
    };
  });
}

function buildOptionState(input, options) {
  const states = {};
  (Array.isArray(input) ? input : []).forEach((item) => {
    const label = typeof item === "string" ? item.trim() : String(item && item.label || "").trim();
    if (!label) return;
    states[label] = typeof item === "object" && item.active === false ? false : true;
  });
  return options.map((option) => ({
    ...option,
    active: states[option.label] === true
  }));
}

function buildApartmentDisplayOptions(apartment) {
  const source = apartment || {};
  return {
    costs: buildApartmentCostDisplay(source.costs),
    privateFacilities: buildOptionState(source.private_facilities || source.privateFacilities, PRIVATE_OPTIONS),
    publicFacilities: buildOptionState(source.public_facilities || source.publicFacilities, PUBLIC_OPTIONS),
    nearby: buildOptionState(source.nearby, NEARBY_OPTIONS)
  };
}

module.exports = {
  PRIVATE_OPTIONS,
  PUBLIC_OPTIONS,
  NEARBY_OPTIONS,
  COST_OPTIONS,
  formatCostValue,
  buildApartmentCostDisplay,
  buildApartmentDisplayOptions
};
