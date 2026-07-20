const test = require("node:test");
const assert = require("node:assert/strict");
const XLSX = require("../cloudfunctions/rencai/node_modules/xlsx");
const { createExportFile } = require("../cloudfunctions/rencai/lib/export-file");

test("creates a timestamped apartment XLSX file in cloud storage", async () => {
  let received;
  const result = await createExportFile({
    uploadFile(options) {
      received = options;
      return Promise.resolve({ fileID: "cloud://env/exports/apartments-123.xlsx" });
    }
  }, "apartments", "\ufeff编号,名称", () => 123);

  assert.equal(result.ok, true);
  assert.equal(result.fileName, "公寓导出.xlsx");
  assert.equal(result.fileID, "cloud://env/exports/apartments-123.xlsx");
  assert.equal(received.cloudPath, "exports/apartments-123.xlsx");
  assert.equal(received.fileContent.subarray(0, 2).toString("utf8"), "PK");
  const workbook = XLSX.read(received.fileContent, { type: "buffer" });
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
  assert.deepEqual(rows, [["编号", "名称"]]);
});

test("rejects non-export types and oversized CSV content", async () => {
  const cloudClient = { uploadFile() { throw new Error("should not upload"); } };

  assert.equal((await createExportFile(cloudClient, "users", "x", () => 1)).code, "invalid_export_type");
  assert.equal((await createExportFile(cloudClient, "apartments", "x".repeat(1024 * 1024 + 1), () => 1)).code, "export_too_large");
});
