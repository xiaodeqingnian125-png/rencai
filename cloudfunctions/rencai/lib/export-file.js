const XLSX = require("xlsx-js-style");
const { parseCsv } = require("./csv-parser");

const EXPORT_FILE_PREFIXES = {
  apartments: "人才公寓",
  room_types: "人才户型"
};

const MAX_EXPORT_BYTES = 1024 * 1024;

const HEADER_COLORS = {
  core: "E9723B",
  costs: "C46A2E",
  private: "3E8D9A",
  public: "4E9B70",
  nearby: "8066A8"
};

function allBorders(color) {
  return ["top", "bottom", "left", "right"].reduce((result, edge) => {
    result[edge] = { style: "thin", color: { rgb: color } };
    return result;
  }, {});
}

function headerColor(label) {
  if (/费（/.test(label)) return HEADER_COLORS.costs;
  if (String(label).indexOf("室内·") === 0) return HEADER_COLORS.private;
  if (String(label).indexOf("公共·") === 0) return HEADER_COLORS.public;
  if (String(label).indexOf("周边·") === 0) return HEADER_COLORS.nearby;
  return HEADER_COLORS.core;
}

function styleApartmentSheet(sheet, rows) {
  const headers = rows[0] || [];
  headers.forEach((label, index) => {
    const address = XLSX.utils.encode_cell({ r: 0, c: index });
    sheet[address].s = {
      fill: { fgColor: { rgb: headerColor(label) } },
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10 },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: allBorders(headerColor(label))
    };
  });
  for (let row = 1; row < rows.length; row += 1) {
    headers.forEach((label, column) => {
      const address = XLSX.utils.encode_cell({ r: row, c: column });
      if (!sheet[address]) return;
      sheet[address].s = {
        fill: { fgColor: { rgb: "FFFDF9" } },
        font: { color: { rgb: "3B3027" }, sz: 10 },
        alignment: { vertical: "top", wrapText: true },
        border: allBorders("EFE3D7")
      };
    });
  }
  sheet["!cols"] = headers.map((label) => {
    if (["地址", "平面图"].includes(label)) return { wch: 36 };
    if (["封面图路径", "位置摘要"].includes(label)) return { wch: 28 };
    if (/费（/.test(label)) return { wch: 15 };
    if (/^(室内|公共|周边)·/.test(label)) return { wch: 13 };
    if (["公寓名称", "展示标签"].includes(label)) return { wch: 18 };
    return { wch: 10 };
  });
  sheet["!rows"] = [{ hpt: 28 }].concat(rows.slice(1).map(() => ({ hpt: 32 })));
  sheet["!freeze"] = { xSplit: 5, ySplit: 1, topLeftCell: "F2", activePane: "bottomRight", state: "frozen" };
}

function addApartmentGuide(workbook) {
  const guideRows = [
    ["人才公寓批量导入 · 填写说明"],
    ["“公寓”必须保持为第一个工作表；导入时系统只读取第一个工作表。"],
    ["费用 6 列", "只填写金额，单位已写在表头。"],
    ["室内 / 公共 / 周边", "填写“有”或“无”；详情页会保留全部选项，无项显示灰色图标。"],
    ["地址", "区域与地址行政区必须一致，且应为腾讯地图可搜索的完整地址。"]
  ];
  const guide = XLSX.utils.aoa_to_sheet(guideRows);
  guide["!cols"] = [{ wch: 26 }, { wch: 72 }];
  guide.A1.s = {
    fill: { fgColor: { rgb: HEADER_COLORS.core } },
    font: { bold: true, color: { rgb: "FFFFFF" }, sz: 16 },
    alignment: { vertical: "center" },
    border: allBorders(HEADER_COLORS.core)
  };
  guide["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
  guide.A2.s = { fill: { fgColor: { rgb: "FFF1E8" } }, font: { bold: true, color: { rgb: "A94B24" } }, alignment: { wrapText: true } };
  guide["!merges"].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 1 } });
  guide["!rows"] = [{ hpt: 30 }, { hpt: 24 }, { hpt: 28 }, { hpt: 36 }, { hpt: 36 }];
  return guide;
}

function formatExportFileName(targetType, value) {
  const prefix = EXPORT_FILE_PREFIXES[targetType];
  if (!prefix) return "";

  const date = value instanceof Date ? value : new Date(Number(value));
  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(date).reduce((result, part) => {
    result[part.type] = part.value;
    return result;
  }, {});

  return `${prefix}-${parts.year}${parts.month}${parts.day}-${parts.hour}${parts.minute}${parts.second}.xlsx`;
}

async function createExportFile(cloudClient, targetType, csvContent, now = Date.now) {
  if (!EXPORT_FILE_PREFIXES[targetType]) {
    return { ok: false, code: "invalid_export_type", message: "不支持的导出类型" };
  }
  const fileName = formatExportFileName(targetType, now());
  if (!fileName) {
    return { ok: false, code: "invalid_export_time", message: "导出文件生成失败，请重试" };
  }

  const sourceContent = Buffer.from(String(csvContent || ""), "utf8");
  if (sourceContent.length > MAX_EXPORT_BYTES) {
    return { ok: false, code: "export_too_large", message: "导出数据过大，请缩小筛选范围" };
  }

  const rows = parseCsv(String(csvContent || ""));
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  const sheetName = targetType === "apartments" ? "公寓" : "户型";
  if (targetType === "apartments") styleApartmentSheet(worksheet, rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  if (targetType === "apartments") XLSX.utils.book_append_sheet(workbook, addApartmentGuide(workbook), "填写说明");
  const fileContent = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  try {
    const uploaded = await cloudClient.uploadFile({
      cloudPath: `exports/${fileName}`,
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

module.exports = { createExportFile, formatExportFileName };
