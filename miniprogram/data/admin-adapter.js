function parseNumbers(value) {
  const matches = String(value || "").match(/\d+(?:\.\d+)?/g);
  return matches ? matches.map(Number) : [];
}

function numberOr(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function text(value, fallback = "") {
  if (value === undefined || value === null) return String(fallback || "").trim();
  return String(value).trim();
}

function toAdminItem(type, record, apartmentMap = {}) {
  const source = record || {};
  if (type === "apartments") {
    const priceMin = numberOr(source.price_min);
    const priceMax = numberOr(source.price_max, priceMin);
    return {
      ...source,
      rent: `¥${priceMin}-${priceMax}/月`,
      rooms: source.room_summary || "",
      floor_plans: normalizeFloorPlans(source.floor_plans)
    };
  }

  if (type === "rooms") {
    return {
      ...source,
      apartment: source.apartment_name || apartmentMap[source.apartment_code] || source.apartment_code || "",
      rent: `¥${numberOr(source.price)}/月起`,
      rooms: source.layout || ""
    };
  }

  return { ...source };
}

function toApartmentCloudItem(item, original) {
  const source = { ...(original || {}), ...(item || {}) };
  const prices = parseNumbers(source.rent);
  const originalMin = numberOr(source.price_min);
  const priceMin = prices.length ? prices[0] : originalMin;
  const priceMax = prices.length > 1
    ? prices[1]
    : numberOr(source.price_max, priceMin);

  return {
    id: numberOr(source.id),
    apartment_code: text(source.apartment_code),
    name: text(source.name),
    district: text(source.district),
    address: text(source.address),
    price_min: priceMin,
    price_max: priceMax,
    room_summary: text(source.rooms, source.room_summary),
    desc: text(source.desc),
    status: text(source.status, "active") || "active",
    image: text(source.image),
    latitude: numberOr(source.latitude),
    longitude: numberOr(source.longitude),
    floor_plans: normalizeFloorPlans(source.floor_plans)
  };
}

function toRoomCloudItem(item, original) {
  const source = { ...(original || {}), ...(item || {}) };
  const prices = parseNumbers(source.rent);
  const price = prices.length ? prices[0] : numberOr(source.price);

  return {
    id: numberOr(source.id),
    apartment_code: text(source.apartment_code),
    name: text(source.name),
    area: text(source.area),
    orient: text(source.orient),
    layout: text(source.rooms, source.layout),
    floor: text(source.floor),
    price,
    desc: text(source.desc),
    status: text(source.status, "active") || "active",
    image: text(source.image)
  };
}

function toCloudItem(type, item, original = {}) {
  if (type === "apartments") return toApartmentCloudItem(item, original);
  if (type === "rooms") return toRoomCloudItem(item, original);
  return { ...(original || {}), ...(item || {}) };
}

module.exports = {
  parseNumbers,
  toAdminItem,
  toCloudItem
};
const { normalizeFloorPlans } = require("../utils/floor-plans");
