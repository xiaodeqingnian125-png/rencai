const path = require("node:path");
const fs = require("node:fs");
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadPage } = require("./helpers/load-miniprogram-module");
const adapter = require("../miniprogram/data/admin-adapter");
const floorPlans = require("../miniprogram/utils/floor-plans");

const PAGE_PATH = path.join(__dirname, "../miniprogram/pages/admin/index.js");

function setPath(target, key, value) {
  const parts = key.split(".");
  let cursor = target;
  parts.slice(0, -1).forEach((part) => {
    if (!cursor[part] || typeof cursor[part] !== "object") cursor[part] = {};
    cursor = cursor[part];
  });
  cursor[parts[parts.length - 1]] = value;
}

function createHarness() {
  const calls = {
    getAdminDataset: [],
    getNextAdminId: [],
    saveAdminItem: [],
    deleteAdminItem: [],
    updateAdminItemStatus: [],
    createExportFile: [],
    createImportTaskFromFile: [],
    previewImport: [],
    uploadFiles: [],
    navigation: [],
    downloadCloudCsv: [],
    openCloudSpreadsheet: [],
    openCloudCsv: [],
    shareCloudCsv: [],
    legacyReads: [],
    legacyWrites: [],
    toasts: []
  };
  const cloudItems = [{
    id: 1,
    apartment_code: "A001",
    name: "郑东青年公寓",
    price_min: 1200,
    price_max: 1800,
    room_summary: "1-2居",
    status: "active"
  }];
  const db = {
    async getAdminDataset(type) {
      calls.getAdminDataset.push(type);
      return cloudItems;
    },
    async getNextAdminId(type) {
      calls.getNextAdminId.push(type);
      return 2;
    },
    async saveAdminItem(type, item) {
      calls.saveAdminItem.push({ type, item });
      return "created";
    },
    async deleteAdminItem(type, id) {
      calls.deleteAdminItem.push({ type, id });
      return true;
    },
    async updateAdminItemStatus(type, id, status) {
      calls.updateAdminItemStatus.push({ type, id, status });
      return true;
    },
    async createExportFile(type, content) {
      calls.createExportFile.push({ type, content });
      return {
        ok: true,
        fileID: "cloud://env/exports/apartments-1.xlsx",
        fileName: "公寓导出.xlsx"
      };
    },
    async exportAdminItems() {
      return { ok: true, items: cloudItems };
    },
    async createImportTaskFromFile(type, fileName, fileID) {
      calls.createImportTaskFromFile.push({ type, fileName, fileID });
      return { ok: true, taskId: "IMP-XLSX-001" };
    },
    async previewImport(taskId) {
      calls.previewImport.push(taskId);
      return { ok: true };
    }
  };
  const queries = {
    getAdminDataset(type) {
      calls.legacyReads.push({ name: "getAdminDataset", type });
      return cloudItems;
    },
    getAdminRoomFilters() {
      return [{ value: "all", label: "全部" }];
    },
    getNextAdminId(type) {
      calls.legacyReads.push({ name: "getNextAdminId", type });
      return 2;
    },
    saveAdminRuntimeItem(...args) {
      calls.legacyWrites.push({ name: "save", args });
    },
    deleteAdminRuntimeItem(...args) {
      calls.legacyWrites.push({ name: "delete", args });
    },
    updateAdminRuntimeStatus(...args) {
      calls.legacyWrites.push({ name: "status", args });
    },
    importAdminRuntimeItems(...args) {
      calls.legacyWrites.push({ name: "import", args });
    }
  };
  const wxApi = {
    showToast(args) {
      calls.toasts.push(args);
    },
    setNavigationBarTitle() {},
    navigateBack() {},
    showLoading() {},
    hideLoading() {},
    navigateTo(args) {
      calls.navigation.push(args);
    },
    chooseMessageFile(options) {
      return options.success({ tempFiles: [{ path: "/tmp/apartments.xlsx", name: "公寓导出.xlsx" }] });
    },
    cloud: {
      uploadFile({ cloudPath, filePath, success }) {
        calls.uploadFiles.push({ cloudPath, filePath });
        return success({ fileID: "cloud://env/imports/apartments.xlsx" });
      }
    }
  };
  const definition = loadPage(PAGE_PATH, {
    "../../data/queries": queries,
    "../../data/db": db,
    "../../data/admin-adapter": adapter,
    "../../utils/floor-plans": floorPlans,
    "../../utils/csv-share": {
      writeAndShareCsv() {},
      downloadAndOpenCloudCsv() {},
      async downloadCloudCsv(options) {
        calls.downloadCloudCsv.push(options);
        return { ok: true, filePath: "/tmp/export.csv" };
      },
      async openCloudCsv(options) {
        calls.openCloudCsv.push(options);
        return { ok: true };
      },
      async openCloudSpreadsheet(options) {
        calls.openCloudSpreadsheet.push(options);
        return { ok: true };
      },
      async shareCloudCsv(options) {
        calls.shareCloudCsv.push(options);
        return { ok: true };
      }
    }
  }, {
    wx: wxApi,
    getApp: () => ({ globalData: { isAdmin: true } })
  });
  const page = {
    data: JSON.parse(JSON.stringify(definition.data)),
    setData(updates, callback) {
      Object.entries(updates).forEach(([key, value]) => setPath(this.data, key, value));
      if (callback) callback.call(this);
    }
  };
  Object.entries(definition).forEach(([key, value]) => {
    if (typeof value === "function") page[key] = value.bind(page);
  });
  return { page, calls };
}

test("apartments load from cloud and map to admin UI fields", async () => {
  const { page, calls } = createHarness();

  await page.onLoad({ type: "apartments" });

  assert.deepEqual(calls.getAdminDataset, ["apartments"]);
  assert.deepEqual(calls.getNextAdminId, ["apartments"]);
  assert.equal(calls.legacyReads.length, 0);
  assert.equal(page.data.items[0].rent, "¥1200-1800/月");
  assert.equal(page.data.loading, false);
});

test("unfinished admin types enter preview mode without reading a dataset", async () => {
  const { page, calls } = createHarness();

  await page.onLoad({ type: "activities" });

  assert.equal(page.data.previewOnly, true);
  assert.equal(page.data.items.length, 0);
  assert.equal(calls.getAdminDataset.length, 0);
  assert.equal(calls.legacyReads.length, 0);
});

test("saving an apartment writes canonical cloud fields without legacy writes", async () => {
  const { page, calls } = createHarness();
  await page.onLoad({ type: "apartments" });
  page.setData({
    formOpen: true,
    form: {
      name: "高新青年公寓",
      apartment_code: "A002",
      rent: "¥1200-1800/月",
      rooms: "1-2居",
      status: "active"
    }
  });

  await page.saveItem();

  assert.equal(calls.saveAdminItem.length, 1);
  assert.equal(calls.saveAdminItem[0].type, "apartments");
  assert.equal(calls.saveAdminItem[0].item.price_min, 1200);
  assert.equal(calls.saveAdminItem[0].item.price_max, 1800);
  assert.equal("rent" in calls.saveAdminItem[0].item, false);
  assert.equal(calls.legacyWrites.length, 0);
});

test("admin template exposes loading, retry and honest preview states", () => {
  const wxml = fs.readFileSync(path.join(__dirname, "../miniprogram/pages/admin/index.wxml"), "utf8");

  assert.match(wxml, /wx:if="\{\{loading\}\}"/);
  assert.match(wxml, /bindtap="retryLoad"/);
  assert.match(wxml, /功能预览 · 即将开放/);
  assert.match(wxml, /\{\{formOpen && !previewOnly\}\}/);
});

test("apartment export creates a cloud CSV file instead of copying text", async () => {
  const { page, calls } = createHarness();
  await page.onLoad({ type: "apartments" });

  await page.exportData();

  assert.equal(calls.createExportFile[0].type, "apartments");
  assert.match(calls.createExportFile[0].content, /公寓编号/);
});

test("XLSX export opens the native save menu after cloud download", async () => {
  const { page, calls } = createHarness();
  await page.onLoad({ type: "apartments" });

  await page.downloadCsv("apartments", "编号,名称");

  assert.equal(calls.downloadCloudCsv[0].fileID, "cloud://env/exports/apartments-1.xlsx");
  assert.equal(calls.openCloudSpreadsheet[0].filePath, "/tmp/export.csv");
  assert.equal(page.data.exportFileOpen, undefined);
});

test("admin template removes CSV transfer actions", () => {
  const wxml = fs.readFileSync(path.join(__dirname, "../miniprogram/pages/admin/index.wxml"), "utf8");

  assert.doesNotMatch(wxml, /打开并保存文件/);
  assert.doesNotMatch(wxml, /转发到微信/);
  assert.doesNotMatch(wxml, /exportFileOpen/);
});

test("XLSX import uploads the edited file and enters the existing preview", async () => {
  const { page, calls } = createHarness();

  await page.importCsvFile("apartments");

  assert.equal(calls.uploadFiles[0].filePath, "/tmp/apartments.xlsx");
  assert.match(calls.uploadFiles[0].cloudPath, /^imports\/.+\.xlsx$/);
  assert.equal(calls.createImportTaskFromFile[0].type, "apartments");
  assert.equal(calls.createImportTaskFromFile[0].fileName, "公寓导出.xlsx");
  assert.equal(calls.createImportTaskFromFile[0].fileID, "cloud://env/imports/apartments.xlsx");
  assert.deepEqual(calls.previewImport, ["IMP-XLSX-001"]);
  assert.equal(calls.navigation[0].url, "/pages/admin/import-preview/index?taskId=IMP-XLSX-001");
});

test("floor plan upload assigns a default name only when the name is blank", async () => {
  const { page } = createHarness();
  await page.onLoad({ type: "apartments" });
  page.setData({
    form: {
      floor_plans: [
        { name: "", image: "" },
        { name: "项目总平面图", image: "" }
      ]
    }
  });

  page.onFloorPlanImageChange({
    currentTarget: { dataset: { index: 0 } },
    detail: { value: "cloud://env/floor-1.jpg" }
  });
  page.onFloorPlanImageChange({
    currentTarget: { dataset: { index: 1 } },
    detail: { value: "cloud://env/floor-2.jpg" }
  });

  assert.equal(page.data.form.floor_plans[0].name, "平面图 1");
  assert.equal(page.data.form.floor_plans[1].name, "项目总平面图");
});

test("floor plan upload uses the index returned by the uploader component", async () => {
  const { page } = createHarness();
  await page.onLoad({ type: "apartments" });
  page.setData({
    form: { floor_plans: [{ name: "项目总平面图", image: "" }] }
  });

  page.onFloorPlanImageChange({
    currentTarget: { dataset: {} },
    detail: { index: 0, value: "cloud://env/floor-1.jpg" }
  });

  assert.equal(page.data.form.floor_plans[0].image, "cloud://env/floor-1.jpg");
});
