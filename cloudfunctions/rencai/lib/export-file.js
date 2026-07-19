const EXPORT_FILES = {
  apartments: "公寓导出.csv",
  room_types: "户型导出.csv"
};

const MAX_EXPORT_BYTES = 1024 * 1024;

async function createExportFile(cloudClient, targetType, csvContent, now = Date.now) {
  const fileName = EXPORT_FILES[targetType];
  if (!fileName) {
    return { ok: false, code: "invalid_export_type", message: "不支持的导出类型" };
  }

  const fileContent = Buffer.from(String(csvContent || ""), "utf8");
  if (fileContent.length > MAX_EXPORT_BYTES) {
    return { ok: false, code: "export_too_large", message: "导出数据过大，请缩小筛选范围" };
  }

  try {
    const uploaded = await cloudClient.uploadFile({
      cloudPath: `exports/${targetType}-${Number(now())}.csv`,
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
