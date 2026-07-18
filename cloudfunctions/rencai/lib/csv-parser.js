/**
 * CSV 解析模块
 * 处理 BOM、分隔、类型转换
 */

/**
 * 去除 BOM 头
 */
function stripBOM(text) {
  if (typeof text !== "string") return "";
  return text.replace(/^\ufeff/, "");
}

/**
 * 解析 CSV 文本为行数组
 * 支持引号包裹、逗号分隔、换行
 */
function parseCsv(text) {
  const cleaned = stripBOM(text);
  const rows = [];
  let currentRow = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    const nextChar = cleaned[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentField);
        currentField = "";
      } else if (char === "\n") {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = "";
      } else if (char === "\r") {
        // 跳过 \r，配合 \r\n
      } else {
        currentField += char;
      }
    }
  }
  // 最后一行
  if (currentField !== "" || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }
  // 移除空行
  return rows.filter((row) => row.some((field) => field.trim() !== ""));
}

/**
 * 把行数组转为对象数组（第一行作为表头）
 */
function rowsToObjects(rows) {
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((row, index) => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = (row[i] || "").trim();
    });
    obj.__rowNum = index + 2; // 行号（从2开始，第1行是表头）
    return obj;
  });
}

/**
 * 数组字段转字符串（导出用）
 * 如 ["超市", "药店"] → "超市|药店"
 */
function arrayToCsvString(arr) {
  if (!Array.isArray(arr)) return "";
  return arr.join("|");
}

/**
 * 字符串转数组（导入用）
 * 支持 | 、｜ 分隔
 */
function csvStringToArray(str) {
  if (!str || typeof str !== "string") return [];
  return str.split(/[|｜]/).map((s) => s.trim()).filter((s) => s !== "");
}

/**
 * 安全转数字
 */
function toNumber(value, defaultValue = 0) {
  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * 安全转整数
 */
function toInt(value, defaultValue = 0) {
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
}

module.exports = {
  stripBOM,
  parseCsv,
  rowsToObjects,
  arrayToCsvString,
  csvStringToArray,
  toNumber,
  toInt
};
