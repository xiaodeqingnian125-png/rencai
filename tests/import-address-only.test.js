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
      if (request === "./apartment-import-options") {
        return require("../cloudfunctions/rencai/lib/apartment-import-options");
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
    "最高租金": "1800",
    "水费（元/m³）": "", "电费（元/度）": "", "燃气费（元/m³）": "",
    "物业费（元/㎡/月）": "", "暖气费（元/㎡/天）": "", "停车费（元/月）": ""
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
    "最高租金": "1800",
    "水费（元/m³）": "", "电费（元/度）": "", "燃气费（元/m³）": "",
    "物业费（元/㎡/月）": "", "暖气费（元/㎡/天）": "", "停车费（元/月）": ""
  });

  assert.equal(result.error, undefined);
  assert.equal(result.data.longitude, 113.62);
  assert.equal(result.data.image, "cloud://env/cover.jpg");
  assert.deepEqual(JSON.parse(JSON.stringify(result.data.floor_plans)), floorPlans);
});

test("friendly apartment columns preserve supplied fee cell text and convert presence values into detail states", async () => {
  const { validateApartmentRow } = loadImportTask();
  const result = await validateApartmentRow({
    "公寓编号": "A001",
    "公寓名称": "郑东青年公寓",
    "地址": "测试路1号",
    "经度": "113.62",
    "纬度": "34.75",
    "水费（元/m³）": "2.5元/m³",
    "电费（元/度）": "0.56",
    "燃气费（元/m³）": "无",
    "物业费（元/㎡/月）": "已含",
    "暖气费（元/㎡/天）": "供暖",
    "停车费（元/月）": "385元",
    "室内·独立卫浴": "有",
    "室内·空调": "无",
    "公共·公共厨房": "有",
    "公共·充电桩": "无",
    "周边·地铁站": "有",
    "周边·银行": "无"
  });

  assert.equal(result.error, undefined);
  assert.deepEqual(JSON.parse(JSON.stringify(result.data.costs.find((item) => item.label === "水费"))), {
    label: "水费", value: "2.5元/m³", active: true
  });
  assert.deepEqual(JSON.parse(JSON.stringify(result.data.costs.find((item) => item.label === "电费"))), {
    label: "电费", value: "0.56", active: true
  });
  assert.deepEqual(JSON.parse(JSON.stringify(result.data.private_facilities.find((item) => item.label === "空调"))), {
    label: "空调", icon: "空", active: false
  });
  assert.deepEqual(JSON.parse(JSON.stringify(result.data.public_facilities.find((item) => item.label === "公共厨房"))), {
    label: "公共厨房", icon: "厨", active: true
  });
  assert.deepEqual(JSON.parse(JSON.stringify(result.data.nearby.find((item) => item.label === "银行"))), {
    label: "银行", icon: "银", active: false
  });
});

test("friendly columns preserve text and reject the retired net-fee header", async () => {
  const { validateApartmentRow } = loadImportTask();
  const base = {
    "公寓编号": "A001", "公寓名称": "郑东青年公寓", "地址": "测试路1号",
    "经度": "113.62", "纬度": "34.75", "水费（元/m³）": "2.5",
    "电费（元/度）": "0.56", "燃气费（元/m³）": "无",
    "暖气费（元/㎡/天）": "无", "物业费（元/㎡/月）": "已含", "停车费（元/月）": "385"
  };
  const result = await validateApartmentRow(base);
  assert.equal(result.error, undefined);
  assert.deepEqual(JSON.parse(JSON.stringify(result.data.costs.find((item) => item.label === "暖气费"))), {
    label: "暖气费", value: "无", active: true
  });
  assert.deepEqual(JSON.parse(JSON.stringify(result.data.costs.find((item) => item.label === "物业费"))), {
    label: "物业费", value: "已含", active: true
  });

  const oldResult = await validateApartmentRow({ ...base, "网费（元/月）": "50" });
  assert.match(oldResult.error, /新版.*Excel.*表头/);
});

test("partial current fee headers are rejected before blank costs can overwrite an apartment", async () => {
  const { validateApartmentRow } = loadImportTask();
  const result = await validateApartmentRow({
    "公寓编号": "A001", "公寓名称": "郑东青年公寓", "地址": "测试路1号",
    "经度": "113.62", "纬度": "34.75", "电费（元/度）": "0.56",
    "物业费（元/㎡/月）": "已含", "停车费（元/月）": "385"
  });

  assert.match(result.error, /Excel 表头不完整/);
  assert.match(result.error, /水费（元\/m³）/);
  assert.match(result.error, /燃气费（元\/m³）/);
  assert.match(result.error, /暖气费（元\/㎡\/天）/);
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
