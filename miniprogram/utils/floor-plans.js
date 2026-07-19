function isStoredImagePath(value) {
  return /^cloud:\/\//.test(value) || /^https:\/\//.test(value);
}

function normalizeFloorPlans(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      name: String(item && item.name || "").trim(),
      image: String(item && item.image || "").trim()
    }))
    .filter((item) => item.name && isStoredImagePath(item.image));
}

function encodeFloorPlans(value) {
  return JSON.stringify(normalizeFloorPlans(value));
}

function decodeFloorPlans(value) {
  if (Array.isArray(value)) return normalizeFloorPlans(value);
  const source = String(value || "").trim();
  if (!source) return [];
  try {
    return normalizeFloorPlans(JSON.parse(source));
  } catch (error) {
    return [];
  }
}

module.exports = {
  isStoredImagePath,
  normalizeFloorPlans,
  encodeFloorPlans,
  decodeFloorPlans
};
