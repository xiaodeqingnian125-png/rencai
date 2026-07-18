/**
 * 数据迁移模块
 * 把 seed/*.json 种子数据写入云数据库
 */

const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const apartmentsSeed = require("../seed/apartments.json");
const roomTypesSeed = require("../seed/room_types.json");

/**
 * 迁移公寓种子数据到云数据库
 */
async function migrateApartments() {
  const col = db.collection("apartments");
  const results = { total: apartmentsSeed.length, inserted: 0, skipped: 0, errors: [] };

  for (let i = 0; i < apartmentsSeed.length; i++) {
    const apt = apartmentsSeed[i];
    try {
      // 检查是否已存在（按 apartment_code）
      const exist = await col.where({ apartment_code: apt.apartment_code }).get();
      if (exist.data.length > 0) {
        results.skipped++;
        continue;
      }
      await col.add({
        data: {
          ...apt,
          create_time: db.serverDate(),
          update_time: db.serverDate()
        }
      });
      results.inserted++;
    } catch (err) {
      results.errors.push({ code: apt.apartment_code, error: err.message });
    }
  }
  return { ok: true, results };
}

/**
 * 迁移户型种子数据到云数据库
 */
async function migrateRoomTypes() {
  const col = db.collection("room_types");
  const results = { total: roomTypesSeed.length, inserted: 0, skipped: 0, errors: [] };

  for (let i = 0; i < roomTypesSeed.length; i++) {
    const room = roomTypesSeed[i];
    try {
      // 检查是否已存在（按 name + apartment_code）
      const exist = await col.where({ name: room.name, apartment_code: room.apartment_code }).get();
      if (exist.data.length > 0) {
        results.skipped++;
        continue;
      }
      await col.add({
        data: {
          ...room,
          create_time: db.serverDate(),
          update_time: db.serverDate()
        }
      });
      results.inserted++;
    } catch (err) {
      results.errors.push({ name: room.name, error: err.message });
    }
  }
  return { ok: true, results };
}

module.exports = { migrateApartments, migrateRoomTypes };
