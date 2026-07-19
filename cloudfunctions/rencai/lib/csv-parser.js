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

/**
 * 安全转浮点
 */
function toFloat(value, defaultValue = 0) {
  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * 安全解析 JSON 字符串为数组
 * - 空字符串、纯空白、null 返回空数组
 * - 解析失败抛错（由调用方决定如何处理）
 * - 解析结果必须是数组，否则抛错
 * @returns {Array}
 * @throws {Error} 当 JSON 格式错误或结果非数组时
 */
function parseJsonArray(value) {
  if (value === null || value === undefined) return [];
  const s = String(value).trim();
  if (s === "") return [];
  let parsed;
  try {
    parsed = JSON.parse(s);
  } catch (err) {
    throw new Error("JSON 格式错误，无法解析");
  }
  if (!Array.isArray(parsed)) {
    throw new Error("JSON 解析结果不是数组");
  }
  return parsed;
}

function isStoredImagePath(value) {
  const source = String(value || "").trim();
  return !source || /^cloud:\/\//.test(source) || /^https:\/\//.test(source);
}

function normalizeFloorPlans(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      name: String(item && item.name || "").trim(),
      image: String(item && item.image || "").trim()
    }))
    .filter((item) => item.name && item.image && isStoredImagePath(item.image));
}

function parseFloorPlans(value) {
  return normalizeFloorPlans(parseJsonArray(value));
}

/**
 * 判断字符串是否以 CSV 公式注入危险字符开头
 * 危险字符：= + - @ \t \r \n
 */
function isFormulaInjection(text) {
  if (typeof text !== "string") return false;
  const s = text.trim();
  if (s === "") return false;
  const head = s.charAt(0);
  return head === "=" || head === "+" || head === "-" || head === "@" || head === "\t" || head === "\r" || head === "\n";
}

/**
 * 防止 CSV 公式注入
 * 普通文本如果以 = + - @ 开头，在导出时前置单引号转义
 * 非字符串（number/boolean/null）原样返回，绝不添加单引号
 */
function escapeFormula(text) {
  if (text === null || text === undefined) return "";
  if (typeof text !== "string") return text;
  if (isFormulaInjection(text)) {
    return "'" + text;
  }
  return text;
}

/**
 * 安全还原公式注入保护用的单引号前缀
 * 仅移除"单引号后紧跟 =、+、-、@"这种由 escapeFormula 生成的保护前缀
 * 普通合法单引号（如 'S、'说、'OK）不被误删
 *
 * 规则：
 *   '=SUM(1,1) → =SUM(1,1)
 *   '+8613800000000 → +8613800000000
 *   '-测试 → -测试
 *   '@测试 → @测试
 *   '说 → '说       （保留，因为单引号后不是 = + - @）
 *   O'Brien → O'Brien （保留，单引号不在首位）
 *
 * @param {string} text - CSV 解析后的单元格文本
 * @returns {string} 还原后的原始文本
 */
function stripFormulaEscape(text) {
  if (text === null || text === undefined) return "";
  if (typeof text !== "string") return text;
  if (text.length < 2) return text;
  // 仅当文本以 ' 后紧跟 = + - @ 开头时才移除第一个单引号
  if (text.charAt(0) === "'" && "=+-@".indexOf(text.charAt(1)) !== -1) {
    return text.slice(1);
  }
  return text;
}

module.exports = {
  stripBOM,
  parseCsv,
  rowsToObjects,
  arrayToCsvString,
  csvStringToArray,
  toNumber,
  toInt,
  toFloat,
  parseJsonArray,
  isStoredImagePath,
  normalizeFloorPlans,
  parseFloorPlans,
  isFormulaInjection,
  escapeFormula,
  stripFormulaEscape
};
