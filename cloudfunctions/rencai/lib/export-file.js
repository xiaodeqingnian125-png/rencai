const XLSX = require("xlsx");
const { parseCsv } = require("./csv-parser");

const EXPORT_FILES = {
  apartments: "公寓导出.xlsx",
  room_types: "户型导出.xlsx"
};

const MAX_EXPORT_BYTES = 1024 * 1024;

async function createExportFile(cloudClient, targetType, csvContent, now = Date.now) {
  const fileName = EXPORT_FILES[targetType];
  if (!fileName) {
    return { ok: false, code: "invalid_export_type", message: "不支持的导出类型" };
  }

  const sourceContent = Buffer.from(String(csvContent || ""), "utf8");
  if (sourceContent.length > MAX_EXPORT_BYTES) {
    return { ok: false, code: "export_too_large", message: "导出数据过大，请缩小筛选范围" };
  }

  const worksheet = XLSX.utils.aoa_to_sheet(parseCsv(String(csvContent || "")));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, targetType === "apartments" ? "公寓" : "户型");
  const fileContent = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  try {
    const uploaded = await cloudClient.uploadFile({
      cloudPath: `exports/${targetType}-${Number(now())}.xlsx`,
      fileContent
    });
    if (!uploaded || !uploaded.fileID) {
      return { ok: false, code: "export_upload_failed", message: "导出文件生成失败，请重试" };
    }
    return { ok: true, fileID: uploaded.fileID, fileName };
  } catch (error) {
    return { ok: false, code: "export_upload_failed", message: "导出文件生成失败，请重试" };
  }
}

module.exports = { createExportFile };
