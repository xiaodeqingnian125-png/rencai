/**
 * 地理编码模块
 * 地址 → 经纬度，腾讯+高德二级策略
 */

const axios = require("axios");

// 郑州经纬度范围（用于校验）
const ZHENGZHOU_BOUNDS = {
  lngMin: 112.7,
  lngMax: 114.0,
  latMin: 34.25,
  latMax: 34.95
};

/**
 * 校验经纬度是否在郑州范围
 */
function isInRange(lng, lat) {
  return (
    lng >= ZHENGZHOU_BOUNDS.lngMin &&
    lng <= ZHENGZHOU_BOUNDS.lngMax &&
    lat >= ZHENGZHOU_BOUNDS.latMin &&
    lat <= ZHENGZHOU_BOUNDS.latMax &&
    lng !== 0 &&
    lat !== 0
  );
}

/**
 * 调用腾讯地图 Geocoder
 */
async function geocodeByTencent(address) {
  const key = process.env.TENCENT_MAP_KEY;
  if (!key) return null;

  try {
    const fullAddress = "郑州" + address;
    const url = `https://apis.map.qq.com/ws/geocoder/v1/?address=${encodeURIComponent(fullAddress)}&key=${key}`;
    const res = await axios.get(url, { timeout: 5000 });

    if (res.data && res.data.status === 0 && res.data.result) {
      const { lng, lat } = res.data.result.location;
      if (isInRange(lng, lat)) {
        return { lng, lat, source: "tencent" };
      }
    }
    return null;
  } catch (err) {
    console.warn("腾讯地图地理编码失败:", err.message);
    return null;
  }
}

/**
 * 调用高德地图 Geocoder
 */
async function geocodeByAmap(address) {
  const key = process.env.AMAP_KEY;
  if (!key) return null;

  try {
    const fullAddress = "郑州" + address;
    const url = `https://restapi.amap.com/v3/geocode/geo?address=${encodeURIComponent(fullAddress)}&key=${key}`;
    const res = await axios.get(url, { timeout: 5000 });

    if (res.data && res.data.status === "1" && res.data.geocodes && res.data.geocodes.length > 0) {
      const location = res.data.geocodes[0].location; // "lng,lat"
      const [lngStr, latStr] = location.split(",");
      const lng = parseFloat(lngStr);
      const lat = parseFloat(latStr);
      if (isInRange(lng, lat)) {
        return { lng, lat, source: "amap" };
      }
    }
    return null;
  } catch (err) {
    console.warn("高德地图地理编码失败:", err.message);
    return null;
  }
}

/**
 * 二级策略：腾讯 → 高德 → 0,0
 */
async function geocodeAddress(address) {
  if (!address || address.trim() === "") {
    return { lng: 0, lat: 0, source: "empty" };
  }

  // 先尝试腾讯
  const tencentResult = await geocodeByTencent(address);
  if (tencentResult) return tencentResult;

  // 腾讯失败，尝试高德
  const amapResult = await geocodeByAmap(address);
  if (amapResult) return amapResult;

  // 都失败，返回 0,0
  return { lng: 0, lat: 0, source: "failed" };
}

module.exports = { geocodeAddress, isInRange };
