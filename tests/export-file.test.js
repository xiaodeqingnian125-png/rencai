const test = require("node:test");
const assert = require("node:assert/strict");
const XLSX = require("../cloudfunctions/rencai/node_modules/xlsx");
const StyledXLSX = require("../cloudfunctions/rencai/node_modules/xlsx-js-style");
const { createExportFile } = require("../cloudfunctions/rencai/lib/export-file");

test("creates a dated apartment XLSX file with a human-readable cloud path", async () => {
  let received;
  const result = await createExportFile({
    uploadFile(options) {
      received = options;
      return Promise.resolve({ fileID: "cloud://env/exports/人才公寓-20260720-153045.xlsx" });
    }
  }, "apartments", "\ufeff编号,名称", () => new Date("2026-07-20T07:30:45.000Z"));

  assert.equal(result.ok, true);
  assert.equal(result.fileName, "人才公寓-20260720-153045.xlsx");
  assert.equal(result.fileID, "cloud://env/exports/人才公寓-20260720-153045.xlsx");
  assert.equal(received.cloudPath, "exports/人才公寓-20260720-153045.xlsx");
  assert.equal(received.fileContent.subarray(0, 2).toString("utf8"), "PK");
  const workbook = XLSX.read(received.fileContent, { type: "buffer" });
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
  assert.deepEqual(rows, [["编号", "名称"]]);
});

test("apartment XLSX applies the approved header styles and adds an import guide", async () => {
  let received;
  await createExportFile({
    uploadFile(options) {
      received = options;
      return Promise.resolve({ fileID: "cloud://env/exports/人才公寓-20260720-153045.xlsx" });
    }
  }, "apartments", "业务ID,公寓编号,水费（元/立方）,室内·空调\n1,A001,2.5,有", () => new Date("2026-07-20T07:30:45.000Z"));

  const workbook = StyledXLSX.read(received.fileContent, { type: "buffer", cellStyles: true });
  assert.deepEqual(workbook.SheetNames, ["公寓", "填写说明"]);
  assert.equal(workbook.Sheets.公寓.A1.s.fgColor.rgb, "E9723B");
  assert.equal(workbook.Sheets.公寓.C1.s.fgColor.rgb, "C46A2E");
  assert.equal(workbook.Sheets.公寓["!cols"][0].wch, 10);
  assert.match(workbook.Sheets.填写说明.A1.v, /批量导入/);
});

test("rejects non-export types and oversized CSV content", async () => {
  const cloudClient = { uploadFile() { throw new Error("should not upload"); } };

  assert.equal((await createExportFile(cloudClient, "users", "x", () => 1)).code, "invalid_export_type");
  assert.equal((await createExportFile(cloudClient, "apartments", "x".repeat(1024 * 1024 + 1), () => 1)).code, "export_too_large");
});
