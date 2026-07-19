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
        fileID: "cloud://env/exports/apartments-1.csv",
        fileName: "公寓导出.csv"
      };
    },
    async exportAdminItems() {
      return { ok: true, items: cloudItems };
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
    hideLoading() {}
  };
  const definition = loadPage(PAGE_PATH, {
    "../../data/queries": queries,
    "../../data/db": db,
    "../../data/admin-adapter": adapter,
    "../../utils/floor-plans": floorPlans,
    "../../utils/csv-share": { writeAndShareCsv() {}, downloadAndOpenCloudCsv() {} }
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
