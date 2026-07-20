const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");
const assert = require("node:assert/strict");
const XLSX = require("../cloudfunctions/rencai/node_modules/xlsx");

function loadImportTask() {
  const filePath = path.join(__dirname, "../cloudfunctions/rencai/lib/import-task.js");
  const source = fs.readFileSync(filePath, "utf8");
  const database = {
    command: {},
    collection() {
      return {
        where() {
          return { async get() { return { data: [] }; } };
        }
      };
    }
  };
  const cloud = {
    DYNAMIC_CURRENT_ENV: "test",
    init() {},
    database() {
      return database;
    }
  };
  const moduleValue = { exports: {} };
  vm.runInNewContext(source, {
    module: moduleValue,
    exports: moduleValue.exports,
    console,
    process,
    setTimeout,
    clearTimeout,
    require(request) {
      if (request === "wx-server-sdk") return cloud;
      if (request === "./csv-parser") {
        return require("../cloudfunctions/rencai/lib/csv-parser");
      }
      if (request === "./geocode") {
        return {
          async geocodeAddress() {
            return { lng: 0, lat: 0, source: "failed" };
          }
        };
      }
      if (request === "xlsx") return XLSX;
      throw new Error(`Unexpected require: ${request}`);
    }
  }, { filename: filePath });
  return moduleValue.exports;
}

test("up to ten address-only apartments can be previewed in one import", () => {
  const { MAX_GEOCODE_ROWS, validateGeocodeRowCount } = loadImportTask();

  assert.equal(MAX_GEOCODE_ROWS, 10);
  assert.equal(validateGeocodeRowCount(10), "");
  assert.match(validateGeocodeRowCount(11), /请分批导入/);
});

test("failed address geocoding rejects the row instead of returning zero coordinates", async () => {
  const { validateApartmentRow } = loadImportTask();
  const result = await validateApartmentRow({
    "公寓编号": "A001",
    "公寓名称": "郑东青年公寓",
    "地址": "测试路1号",
    "最低租金": "1200",
    "最高租金": "1800"
  });

  assert.match(result.error, /地址无法解析/);
  assert.equal(result.data, undefined);
});

test("exported coordinates, cover path and floor plans can be imported unchanged", async () => {
  const { validateApartmentRow } = loadImportTask();
  const floorPlans = [{ name: "项目总平面图", image: "cloud://env/plan.jpg" }];
  const result = await validateApartmentRow({
    "公寓编号": "A001",
    "公寓名称": "郑东青年公寓",
    "地址": "测试路1号",
    "经度": "113.62",
    "纬度": "34.75",
    "封面图路径": "cloud://env/cover.jpg",
    "平面图": JSON.stringify(floorPlans),
    "最低租金": "1200",
    "最高租金": "1800"
  });

  assert.equal(result.error, undefined);
  assert.equal(result.data.longitude, 113.62);
  assert.equal(result.data.image, "cloud://env/cover.jpg");
  assert.deepEqual(JSON.parse(JSON.stringify(result.data.floor_plans)), floorPlans);
});

test("an XLSX worksheet converts to the CSV text used by the import pipeline", () => {
  const { xlsxBufferToCsv } = loadImportTask();
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([["公寓编号", "公寓名称"], ["A001", "郑东青年公寓"]]),
    "公寓"
  );

  const result = xlsxBufferToCsv(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }));

  assert.equal(result.ok, true);
  assert.match(result.csvContent, /公寓编号,公寓名称/);
  assert.match(result.csvContent, /A001,郑东青年公寓/);
});
