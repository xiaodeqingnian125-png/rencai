// 任务 13 新增的异步接口（createImportTask / exportAdminItems 等）
// 云模式走云函数，mock 模式回退到 queries 本地数据
const db = require("../../data/db");
const { toAdminItem, toCloudItem } = require("../../data/admin-adapter");
const { encodeFloorPlans, decodeFloorPlans } = require("../../utils/floor-plans");

// CSV 文件生成与分享工具（模板下载、错误报告下载复用）
const { writeAndShareCsv, downloadAndOpenCloudCsv } = require("../../utils/csv-share");

const configs = {
  apartments: {
    title: "公寓管理",
    subtitle: "维护公寓项目、租金、配套和上下架状态",
    badge: "公寓",
    search: "搜索公寓名称",
    addText: "+ 新增",
    addTitle: "新增公寓",
    editTitle: "编辑公寓",
    requiredKey: "name",
    requiredLabel: "公寓名称",
    defaultStatus: "active",
    supportImage: true,
    cloudPath: "covers/apartments",
    summaryLabels: ["全部公寓", "待处理", "启用中"],
    primaryAction: { label: "启用", status: "active", toast: "公寓已启用" },
    secondaryAction: { label: "停用", status: "hidden", toast: "公寓已停用" },
    statusMap: {
      active: { label: "启用", className: "status-on" },
      hidden: { label: "停用", className: "status-off" }
    },
    metaKeys: ["district", "rent", "rooms"],
    detailRows: [
      { label: "地址", key: "address" },
      { label: "配套", key: "desc" }
    ],
    chipKeys: ["district", "rooms"],
    filters: [
      { value: "all", label: "全部" },
      { value: "active", label: "启用" },
      { value: "hidden", label: "停用" }
    ],
    fields: [
      { key: "apartment_code", label: "公寓编号", placeholder: "如：A001（唯一）" },
      { key: "name", label: "公寓名称", placeholder: "如：郑东人才公寓" },
      { key: "district", label: "区域", placeholder: "如：郑东新区" },
      { key: "address", label: "地址", placeholder: "详细地址" },
      { key: "rent", label: "租金范围", placeholder: "如：¥1200-1800/月" },
      { key: "rooms", label: "居室类型", placeholder: "如：1-2居" },
      { key: "desc", label: "配套摘要", placeholder: "配套设施、公共设施、周边服务", type: "textarea" }
    ]
  },
  rooms: {
    title: "户型管理",
    subtitle: "按公寓维护户型、面积、朝向和租金",
    badge: "户型",
    search: "搜索户型/公寓",
    addText: "+ 新增户型",
    addTitle: "新增户型",
    editTitle: "编辑户型",
    requiredKey: "name",
    requiredLabel: "户型名称",
    defaultStatus: "active",
    supportImage: true,
    cloudPath: "covers/rooms",
    summaryLabels: ["全部户型", "待处理", "启用中"],
    primaryAction: { label: "启用", status: "active", toast: "户型已启用" },
    secondaryAction: { label: "停用", status: "hidden", toast: "户型已停用" },
    statusMap: {
      active: { label: "启用", className: "status-on" },
      hidden: { label: "停用", className: "status-off" }
    },
    metaKeys: ["apartment", "area", "orient", "rent"],
    detailRows: [
      { label: "户型", key: "desc" }
    ],
    chipKeys: ["apartment", "area", "orient"],
    filters: [{ value: "all", label: "全部" }],
    statusOptions: [
      { value: "active", label: "启用" },
      { value: "hidden", label: "停用" }
    ],
    fields: [
      { key: "apartment_code", label: "所属公寓编号", placeholder: "如：A001" },
      { key: "name", label: "户型名称", placeholder: "如：精致一居室" },
      { key: "area", label: "面积", placeholder: "如：35㎡" },
      { key: "orient", label: "朝向", placeholder: "如：南向" },
      { key: "rooms", label: "居室", placeholder: "如：1室1厅1卫" },
      { key: "rent", label: "租金", placeholder: "如：¥1200/月起" },
      { key: "floor", label: "楼层", placeholder: "如：3层/总8层" }
    ]
  },
  activities: {
    title: "活动管理",
    subtitle: "审核用户活动，维护官方活动上下线",
    badge: "活动",
    search: "搜索活动/地点",
    addText: "+ 新增",
    requiredKey: "name",
    requiredLabel: "活动名称",
    defaultStatus: "pending",
    supportImage: true,
    cloudPath: "covers/activities",
    addTitle: "新增活动",
    editTitle: "编辑活动",
    summaryLabels: ["全部记录", "待处理", "已上线"],
    primaryAction: { label: "通过", status: "active", toast: "活动已上线" },
    secondaryAction: { label: "隐藏", status: "hidden", toast: "活动已隐藏" },
    metaKeys: ["category", "time", "place"],
    detailRows: [
      { label: "人数", key: "quota" },
      { label: "发起", key: "owner" },
      { label: "说明", key: "desc" }
    ],
    chipKeys: ["category", "place"],
    filters: [
      { value: "all", label: "全部" },
      { value: "pending", label: "待审核" },
      { value: "active", label: "已上线" },
      { value: "hidden", label: "隐藏" }
    ],
    fields: [
      { key: "name", label: "活动名称", placeholder: "如：周末羽毛球搭子局" },
      { key: "category", label: "活动类型", placeholder: "运动 / 公益 / 兴趣 / 分享" },
      { key: "time", label: "活动时间", placeholder: "如：本周六 15:00" },
      { key: "place", label: "地点", placeholder: "如：郑东人才公寓活动室" },
      { key: "quota", label: "人数限制", placeholder: "如：12人" },
      { key: "owner", label: "发起人", placeholder: "如：小李" },
      { key: "desc", label: "活动说明", placeholder: "报名条件、费用、注意事项", type: "textarea" }
    ]
  },
  services: {
    title: "服务管理",
    subtitle: "跟进代办需求、订单处理和服务关闭",
    badge: "服务",
    search: "搜索服务/订单",
    addText: "+ 新增",
    requiredKey: "name",
    requiredLabel: "服务名称",
    defaultStatus: "processing",
    supportImage: true,
    cloudPath: "covers/services",
    addTitle: "新增服务记录",
    editTitle: "编辑服务记录",
    summaryLabels: ["全部记录", "待处理", "已上线"],
    primaryAction: { label: "完成", status: "active", toast: "服务已完成" },
    secondaryAction: { label: "关闭", status: "hidden", toast: "服务已关闭" },
    statusMap: {
      processing: { label: "处理中", className: "status-warn" },
      active: { label: "已完成", className: "status-on" },
      hidden: { label: "已关闭", className: "status-off" }
    },
    metaKeys: ["orderNo", "user", "time"],
    detailRows: [
      { label: "地址", key: "address" },
      { label: "接单", key: "assignee" },
      { label: "需求", key: "desc" }
    ],
    chipKeys: ["user", "assignee"],
    filters: [
      { value: "all", label: "全部" },
      { value: "processing", label: "处理中" },
      { value: "active", label: "已完成" },
      { value: "hidden", label: "已关闭" }
    ],
    fields: [
      { key: "name", label: "服务名称", placeholder: "如：维修上门" },
      { key: "orderNo", label: "订单编号", placeholder: "如：SV20260701001" },
      { key: "user", label: "用户", placeholder: "如：陈同学" },
      { key: "address", label: "服务地址", placeholder: "如：郑东人才公寓 3-1202" },
      { key: "time", label: "预约时间", placeholder: "如：今天 18:00 前" },
      { key: "assignee", label: "接单人", placeholder: "如：管家小周" },
      { key: "desc", label: "需求说明", placeholder: "用户提交的服务需求", type: "textarea" }
    ]
  },
  items: {
    title: "物品管理",
    subtitle: "管理共享物品、借出状态和下架处理",
    badge: "物品",
    search: "搜索物品/发布人",
    addText: "+ 新增",
    requiredKey: "name",
    requiredLabel: "物品名称",
    defaultStatus: "pending",
    addTitle: "新增物品",
    editTitle: "编辑物品",
    summaryLabels: ["全部记录", "待处理", "已上线"],
    primaryAction: { label: "上架", status: "active", toast: "物品已上架" },
    secondaryAction: { label: "下架", status: "hidden", toast: "物品已下架" },
    statusMap: {
      pending: { label: "待审核", className: "status-warn" },
      active: { label: "可借", className: "status-on" },
      processing: { label: "借出中", className: "status-warn" },
      hidden: { label: "下架", className: "status-off" }
    },
    metaKeys: ["category", "owner", "location"],
    detailRows: [
      { label: "规则", key: "rule" },
      { label: "说明", key: "desc" }
    ],
    chipKeys: ["category", "owner"],
    filters: [
      { value: "all", label: "全部" },
      { value: "pending", label: "待审核" },
      { value: "active", label: "可借" },
      { value: "processing", label: "借出中" },
      { value: "hidden", label: "下架" }
    ],
    fields: [
      { key: "name", label: "物品名称", placeholder: "如：冲击钻" },
      { key: "category", label: "分类", placeholder: "工具 / 家电 / 生活用品" },
      { key: "owner", label: "发布人", placeholder: "如：王同学" },
      { key: "location", label: "所在位置", placeholder: "如：郑东人才公寓 5 栋" },
      { key: "rule", label: "借用规则", placeholder: "如：限 2 天内归还" },
      { key: "desc", label: "物品说明", placeholder: "成色、配件、押金要求", type: "textarea" }
    ]
  },
  comments: {
    title: "评论管理",
    subtitle: "处理公寓和户型评论的展示与隐藏",
    badge: "评论",
    search: "搜索评论/用户",
    addText: "+ 新增",
    requiredKey: "content",
    requiredLabel: "评论内容",
    defaultStatus: "pending",
    addTitle: "新增评论",
    editTitle: "编辑评论",
    summaryLabels: ["全部记录", "待处理", "已上线"],
    primaryAction: { label: "展示", status: "active", toast: "评论已展示" },
    secondaryAction: { label: "隐藏", status: "hidden", toast: "评论已隐藏" },
    statusMap: {
      pending: { label: "待审核", className: "status-warn" },
      active: { label: "已展示", className: "status-on" },
      hidden: { label: "已隐藏", className: "status-off" }
    },
    metaKeys: ["user", "rating", "tags"],
    detailRows: [
      { label: "内容", key: "content" },
      { label: "备注", key: "desc" }
    ],
    chipKeys: ["user", "target"],
    filters: [
      { value: "all", label: "全部" },
      { value: "pending", label: "待审核" },
      { value: "active", label: "已展示" },
      { value: "hidden", label: "已隐藏" }
    ],
    fields: [
      { key: "target", label: "评论对象", placeholder: "如：郑东人才公寓 / 精致一居室" },
      { key: "user", label: "用户", placeholder: "如：周同学" },
      { key: "rating", label: "评分", placeholder: "如：4.8" },
      { key: "tags", label: "标签", placeholder: "如：交通方便、管家响应快" },
      { key: "content", label: "评论内容", placeholder: "用户评价正文", type: "textarea" }
    ]
  },
  users: {
    title: "用户管理",
    subtitle: "维护住户认证、入住信息和账号状态",
    badge: "用户",
    search: "搜索姓名/公寓/手机号",
    addText: "+ 新增",
    requiredKey: "name",
    requiredLabel: "用户姓名",
    defaultStatus: "pending",
    addTitle: "新增用户",
    editTitle: "编辑用户",
    summaryLabels: ["全部记录", "待处理", "已上线"],
    primaryAction: { label: "认证通过", status: "active", toast: "用户已认证" },
    secondaryAction: { label: "停用", status: "disabled", toast: "用户已停用" },
    statusMap: {
      pending: { label: "待认证", className: "status-warn" },
      active: { label: "正常", className: "status-on" },
      disabled: { label: "停用", className: "status-off" }
    },
    metaKeys: ["phone", "apartment", "room"],
    detailRows: [
      { label: "身份", key: "role" },
      { label: "备注", key: "note" }
    ],
    chipKeys: ["role", "apartment"],
    filters: [
      { value: "all", label: "全部" },
      { value: "pending", label: "待认证" },
      { value: "active", label: "正常" },
      { value: "disabled", label: "停用" }
    ],
    fields: [
      { key: "name", label: "用户姓名", placeholder: "如：陈同学" },
      { key: "phone", label: "手机号", placeholder: "如：138****2688" },
      { key: "role", label: "身份", placeholder: "住户 / 管家 / 管理员" },
      { key: "apartment", label: "所在公寓", placeholder: "如：郑东人才公寓" },
      { key: "room", label: "房间号", placeholder: "如：3-1202" },
      { key: "note", label: "备注", placeholder: "认证材料、入住状态、风险备注", type: "textarea" }
    ]
  }
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isCoreAdminType(type) {
  return type === "apartments" || type === "rooms";
}

function isFailedResult(result) {
  return result === false || Boolean(result && typeof result === "object" && result.ok === false);
}

function resultMessage(result, fallback) {
  return result && (result.message || result.error) || fallback;
}

function roomFilters(items) {
  const seen = {};
  const filters = [{ value: "all", label: "全部" }];
  (items || []).forEach((item) => {
    const value = item.apartment || item.apartment_code;
    if (!value || seen[value]) return;
    seen[value] = true;
    filters.push({ value, label: value });
  });
  return filters;
}

function statusInfo(status, config) {
  const map = {
    active: { label: "已上线", className: "status-on" },
    pending: { label: "待审核", className: "status-warn" },
    processing: { label: "处理中", className: "status-warn" },
    hidden: { label: "已隐藏", className: "status-off" },
    disabled: { label: "已停用", className: "status-off" }
  };
  if (config && config.statusMap && config.statusMap[status]) {
    return config.statusMap[status];
  }
  return map[status] || { label: "待处理", className: "status-warn" };
}

function valuesFromKeys(item, keys) {
  return (keys || []).map((key) => item[key]).filter(Boolean);
}

function metaParts(item, config, type) {
  if (type === "comments") {
    return [
      item.user,
      item.rating ? `评分 ${item.rating}` : "",
      item.tags
    ].filter(Boolean);
  }
  return valuesFromKeys(item, config.metaKeys);
}

function descLines(item, type) {
  if (type === "rooms") {
    return [valuesFromKeys(item, ["area", "orient", "rooms", "rent", "floor"]).join(" · ")].filter(Boolean);
  }
  if (type === "activities") {
    return [
      item.desc,
      valuesFromKeys({ people: item.quota ? `人数：${item.quota}` : "", owner: item.owner ? `发起人：${item.owner}` : "" }, ["people", "owner"]).join(" · ")
    ].filter(Boolean);
  }
  if (type === "services") {
    return [
      item.address,
      valuesFromKeys({ time: item.time, assignee: item.assignee ? `接单人：${item.assignee}` : "" }, ["time", "assignee"]).join(" · "),
      item.desc
    ].filter(Boolean);
  }
  if (type === "items") {
    return [item.rule, item.desc].filter(Boolean);
  }
  if (type === "comments") {
    return [item.content].filter(Boolean);
  }
  if (type === "users") {
    return [
      valuesFromKeys(item, ["apartment", "room"]).join(" · "),
      item.note
    ].filter(Boolean);
  }
  return [];
}

function displayItem(item, config, type) {
  const status = statusInfo(item.status, config);
  const title = type === "comments" ? item.target : (item.name || item.target);
  const meta = metaParts(item, config, type).join(" · ");
  const apartmentFacility = item.facilityCount
    ? `配套 ${item.facilityCount} 项`
    : String(item.desc || "").split(/[：:]/)[0];
  const detailRows = (config.detailRows || []).map((row) => ({
    label: row.label,
    value: item[row.key] || ""
  })).filter((row) => row.value);
  const chips = valuesFromKeys(item, config.chipKeys).slice(0, 4);
  return {
    ...item,
    title,
    meta,
    apartmentAddress: valuesFromKeys(item, ["district", "address"]).join(" · "),
    apartmentRent: valuesFromKeys(item, ["rent", "rooms"]).join(" · "),
    apartmentFacility,
    roomApartment: item.apartment || "",
    roomMeta: valuesFromKeys(item, ["area", "orient", "rooms", "rent", "floor"]).join(" · "),
    descLines: descLines(item, type),
    detailRows,
    chips,
    statusLabel: status.label,
    statusClass: status.className,
    primaryAction: config.primaryAction,
    secondaryAction: config.secondaryAction
  };
}

function buildSummary(items, config) {
  const labels = config.summaryLabels || ["全部记录", "待处理", "已上线"];
  return {
    total: items.length,
    pending: items.filter((item) => item.status === "pending" || item.status === "processing").length,
    active: items.filter((item) => item.status === "active").length,
    totalLabel: labels[0],
    pendingLabel: labels[1],
    activeLabel: labels[2]
  };
}

function tableColumns(config) {
  const columns = [
    { key: "id", label: "ID" },
    ...(config.fields || []).map((field) => ({ key: field.key, label: field.label })),
    { key: "status", label: "状态" }
  ];
  const seen = {};
  return columns.filter((column) => {
    if (seen[column.key]) return false;
    seen[column.key] = true;
    return true;
  });
}

function cleanTableCell(value) {
  return String(value === undefined || value === null ? "" : value)
    .replace(/\t/g, " ")
    .replace(/\r?\n/g, " ")
    .trim();
}

function tableCellValue(item, column, config) {
  if (column.key === "status") {
    return statusInfo(item.status, config).label;
  }
  return item[column.key];
}

function toTableText(items, config) {
  const columns = tableColumns(config);
  const header = columns.map((column) => column.label).join("\t");
  const rows = items.map((item) => columns.map((column) => cleanTableCell(tableCellValue(item, column, config))).join("\t"));
  return [header, ...rows].join("\n");
}

// CSV 公式注入防护：以 = + - @ 开头的文本前置单引号转义
// 仅对字符串值生效，number/boolean 等非字符串原样返回（csvCell 会做类型判断）
function escapeFormulaInjection(text) {
  if (typeof text !== "string") return text;
  const s = text.trim();
  if (!s) return text;
  const head = s.charAt(0);
  if (head === "=" || head === "+" || head === "-" || head === "@") {
    return "'" + text;
  }
  return text;
}

function csvCell(value) {
  // number/boolean 等真实非字符串值不做公式注入防护，避免 -100 被改坏为 '-100
  const isNonStringPrimitive = typeof value === "number" || typeof value === "boolean";
  const text = cleanTableCell(value);
  // 公式注入防护：仅对字符串值执行（非字符串原值跳过）
  const safe = isNonStringPrimitive ? text : escapeFormulaInjection(text);
  if (/[",\r\n]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

function toCsvText(items, config) {
  const columns = tableColumns(config);
  const header = columns.map((column) => csvCell(column.label)).join(",");
  const rows = items.map((item) => columns.map((column) => csvCell(tableCellValue(item, column, config))).join(","));
  // 拼接 BOM 头，确保 Excel 打开不乱码
  return `\ufeff${[header, ...rows].join("\n")}`;
}

/**
 * 去除 BOM 头
 * UTF-8 BOM（\ufeff）常见于 Excel/WPS 导出的 CSV，导入时需先剥离再解析
 */
function stripBom(text) {
  return String(text || "").replace(/^\ufeff/, "");
}

function detectTableDelimiter(text) {
  const firstLine = stripBom(text).split(/\r?\n/).find((line) => line.trim()) || "";
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  if (tabCount >= commaCount && tabCount > 0) return "\t";
  return ",";
}

function parseDelimitedRows(text, delimiter) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  // 去除 BOM 头，避免首行首单元格多出不可见字符
  const source = stripBom(text);
  for (let i = 0; i < source.length; i += 1) {
    const char = source.charAt(i);
    const next = source.charAt(i + 1);
    if (char === '"') {
      if (quoted && next === '"') {
        cell += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (!quoted && char === delimiter) {
      row.push(cell.trim());
      cell = "";
      continue;
    }
    if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += char;
  }
  row.push(cell.trim());
  rows.push(row);
  return rows.filter((line) => line.some((value) => value));
}

function tableTextToRows(text, config) {
  const delimiter = detectTableDelimiter(text);
  const tableRows = parseDelimitedRows(text, delimiter);
  if (tableRows.length < 2) {
    throw new Error("请提供至少包含表头和一行数据的表格");
  }
  const columns = tableColumns(config);
  const labelToKey = columns.reduce((map, column) => {
    map[column.label] = column.key;
    map[column.key] = column.key;
    return map;
  }, {});
  const header = tableRows[0].map((cell) => labelToKey[cell] || cell);
  if (header.indexOf("name") < 0) {
    throw new Error("表格必须包含名称列");
  }
  return tableRows.slice(1).map((cells) => {
    return header.reduce((row, key, index) => {
      if (key) row[key] = cells[index] || "";
      return row;
    }, {});
  }).filter((row) => String(row.name || "").trim());
}

function exportFileName(config) {
  return `${config.title || "数据"}-批量导出.csv`;
}

function fileExt(name) {
  const matched = String(name || "").toLowerCase().match(/\.([a-z0-9]+)$/);
  return matched ? matched[1] : "";
}

// ========== 公寓专用 CSV 字段映射（任务 7） ==========
// 经纬度由后续地理编码模块自动生成，CSV 不再承载 longitude/latitude
// apartment_code 作为外键（关联户型），由管理员维护唯一性

// 公寓 CSV 表头（21 列完整字段，含业务 id、封面路径和平面图）
// 业务ID 对应 apartments.id，导出时输出数据库数字 id；导入时可留空由服务端生成
// 经纬度可选，为空时云函数自动地理编码；非空直接使用不调地图 API
// tags/costs/private_facilities/public_facilities/nearby 使用 JSON 字符串
const APARTMENT_CSV_HEADERS = [
  "业务ID", "公寓编号", "公寓名称", "区域", "地址", "经度", "纬度",
  "位置摘要", "最低租金", "最高租金", "居室类型",
  "状态", "封面图路径", "平面图", "渐变背景类", "备用图片类",
  "标签", "费用项", "私人设施", "公共设施", "周边配套"
];

// 公寓对象 → CSV 行
// JSON 字段统一 stringify，空数组输出空字符串
// id 输出为字符串以避免公式注入；空值输出空字符串
function apartmentToCsvRow(apt) {
  return [
    apt.id !== undefined && apt.id !== null ? String(apt.id) : "",
    apt.apartment_code || "",
    apt.name || "",
    apt.district || "",
    apt.address || "",
    apt.longitude || "",
    apt.latitude || "",
    apt.location_meta || "",
    apt.price_min || "",
    apt.price_max || "",
    apt.room_summary || "",
    apt.status || "",
    apt.image || "",
    encodeFloorPlans(apt.floor_plans),
    apt.hero_class || "",
    apt.image_class || "",
    safeStringify(apt.tags),
    safeStringify(apt.costs),
    safeStringify(apt.private_facilities),
    safeStringify(apt.public_facilities),
    safeStringify(apt.nearby)
  ];
}

// 安全 JSON 字符串化：空数组/空对象/null 输出空字符串，非空输出 JSON
function safeStringify(value) {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value) && value.length === 0) return "";
  if (typeof value === "object" && Object.keys(value).length === 0) return "";
  try {
    return JSON.stringify(value);
  } catch (err) {
    return "";
  }
}

// CSV 行 → 公寓对象（导入用，仅作前端展示，真正校验在云函数）
// 业务ID 留空时由服务端生成；非空时由云函数校验是否被其他公寓占用
function csvRowToApartment(row) {
  return {
    id: row["业务ID"] || "",
    apartment_code: row["公寓编号"] || "",
    name: row["公寓名称"] || "",
    district: row["区域"] || "",
    address: row["地址"] || "",
    longitude: row["经度"] || "",
    latitude: row["纬度"] || "",
    location_meta: row["位置摘要"] || "",
    price_min: parseInt(row["最低租金"]) || 0,
    price_max: parseInt(row["最高租金"]) || 0,
    room_summary: row["居室类型"] || "",
    status: row["状态"] || "active",
    image: row["封面图路径"] || row["封面图文件名"] || "",
    floor_plans: decodeFloorPlans(row["平面图"] || ""),
    hero_class: row["渐变背景类"] || "",
    image_class: row["备用图片类"] || "",
    tags: row["标签"] || "",
    costs: row["费用项"] || "",
    private_facilities: row["私人设施"] || "",
    public_facilities: row["公共设施"] || "",
    nearby: row["周边配套"] || ""
  };
}

// ========== 户型专用 CSV 字段映射 ==========
// apartment_code 作为外键关联公寓
// apartment_name 仅作人工阅读便利，导入时以 apartment_code 为准
// apartment_id 由云函数自动从所属公寓的数字 id 生成，不要求用户填写
// costs 和 facilities 不写入 room_types，由云函数从所属公寓继承

// 户型 CSV 表头（12列，包含业务 id 和 desc 描述字段）
// 房源ID 对应 room_types.id，导出时输出数据库数字 id；导入时可留空由服务端生成
const ROOM_CSV_HEADERS = [
  "房源ID", "户型名称", "公寓编号", "所属公寓名称", "面积", "朝向",
  "居室", "楼层", "租金", "状态", "封面图路径", "描述"
];

// 户型对象 → CSV 行
// id 输出为字符串以避免公式注入；空值输出空字符串
function roomToCsvRow(room, apartmentName) {
  return [
    room.id !== undefined && room.id !== null ? String(room.id) : "",
    room.name || "",
    room.apartment_code || "",
    apartmentName || "",
    room.area || "",
    room.orient || "",
    room.layout || "",
    room.floor || "",
    room.price || "",
    room.status || "",
    room.image || "",
    room.desc || ""
  ];
}

// CSV 行 → 户型对象（导入用，仅作前端展示，真正校验在云函数）
// 房源ID 留空时由服务端生成；非空时由云函数校验是否被其他户型占用
function csvRowToRoom(row) {
  return {
    id: row["房源ID"] || "",
    name: row["户型名称"] || "",
    apartment_code: row["公寓编号"] || "",
    apartment_name: row["所属公寓名称"] || "",
    area: row["面积"] || "",
    orient: row["朝向"] || "",
    layout: row["居室"] || "",
    floor: row["楼层"] || "",
    price: parseInt(row["租金"]) || 0,
    status: row["状态"] || "active",
    image: row["封面图路径"] || row["封面图文件名"] || "",
    desc: row["描述"] || ""
  };
}

// 由预构建的表头和行数组生成 CSV 文本
// 与 config 驱动的 toCsvText 互补，供专用映射函数（apartment/room）使用
function toCsvTextFromRows(headers, rows) {
  const header = headers.map((label) => csvCell(label)).join(",");
  const lines = rows.map((row) => row.map((cell) => csvCell(cell)).join(","));
  return `\ufeff${[header, ...lines].join("\n")}`;
}

// 导出户型 CSV：查询公寓列表以获取 apartment_name（便于人工阅读）
// apartment_code 为外键，apartment_name 仅作展示
// 调用方传入 rooms/apartments 原始数据（含 apartment_code 字段），接入见任务 18-19
function exportRoomCsv(rooms, apartments) {
  const apartmentMap = {};
  (apartments || []).forEach((apt) => {
    if (apt.apartment_code) {
      apartmentMap[apt.apartment_code] = apt.name || "";
    }
  });
  const rows = (rooms || []).map((room) =>
    roomToCsvRow(room, apartmentMap[room.apartment_code])
  );
  return toCsvTextFromRows(ROOM_CSV_HEADERS, rows);
}

Page({
  data: {
    type: "activities",
    config: {},
    items: [],
    visibleItems: [],
    isApartment: false,
    isRoom: false,
    keyword: "",
    activeFilter: "all",
    summary: { total: 0, pending: 0, active: 0, totalLabel: "全部记录", pendingLabel: "待处理", activeLabel: "已上线" },
    formOpen: false,
    importOpen: false,
    editingId: null,
    form: {},
    importDraft: "",
    importError: "",
    importHint: "",
    nextId: 100,
    loading: true,
    loadError: "",
    previewOnly: false,
    operationPending: false,
    // 任务 19：按条件导出筛选条件（picker 索引）
    exportDistrictIndex: 0,
    // picker 选项列表（索引 0 为"全部"，不参与筛选）
    districtOptions: ["全部区域", "郑东新区", "高新区", "经开区", "航空港区", "二七区", "中原区"],
    // 批量导出弹窗（按条件导出并入弹窗）
    exportPanelOpen: false
  },

  async onLoad(options) {
    // 权限校验：仅管理员可访问
    const app = getApp();
    if (!app.globalData.isAdmin) {
      wx.showToast({ title: "仅管理员可访问", icon: "none" });
      setTimeout(() => wx.navigateBack(), 1200);
      return;
    }
    const type = configs[options.type] ? options.type : "activities";
    const config = clone(configs[type]);
    config.statusOptions = config.statusOptions || config.filters.filter((item) => item.value !== "all");
    this.setData({
      type,
      config,
      isApartment: type === "apartments",
      isRoom: type === "rooms",
      activeFilter: "all",
      items: [],
      visibleItems: [],
      previewOnly: !isCoreAdminType(type),
      loading: isCoreAdminType(type),
      loadError: "",
      summary: buildSummary([], config)
    });
    wx.setNavigationBarTitle({ title: config.title });
    if (!isCoreAdminType(type)) return;
    await this.loadAdminItems();
  },

  async loadAdminItems() {
    if (!isCoreAdminType(this.data.type)) return false;
    this.setData({ loading: true, loadError: "" });
    try {
      const type = this.data.type;
      const requests = [db.getAdminDataset(type), db.getNextAdminId(type)];
      if (type === "rooms") requests.push(db.getAdminDataset("apartments"));
      const [datasetResult, nextIdResult, apartmentResult] = await Promise.all(requests);
      if (isFailedResult(datasetResult) || !Array.isArray(datasetResult)) {
        throw new Error(resultMessage(datasetResult, "数据格式不正确"));
      }
      if (isFailedResult(nextIdResult)) {
        throw new Error(resultMessage(nextIdResult, "无法生成下一条编号"));
      }
      const apartmentMap = {};
      if (type === "rooms") {
        if (isFailedResult(apartmentResult) || !Array.isArray(apartmentResult)) {
          throw new Error(resultMessage(apartmentResult, "无法读取所属公寓"));
        }
        apartmentResult.forEach((apartment) => {
          if (apartment.apartment_code) apartmentMap[apartment.apartment_code] = apartment.name || apartment.apartment_code;
        });
      }
      const items = datasetResult.map((record) => toAdminItem(type, record, apartmentMap));
      const updates = {
        items,
        nextId: Number(nextIdResult) || 1,
        loading: false,
        loadError: "",
        summary: buildSummary(items, this.data.config)
      };
      if (type === "rooms") updates["config.filters"] = roomFilters(items);
      this.setData(updates, () => this.applyFilters());
      return true;
    } catch (error) {
      this.setData({
        loading: false,
        loadError: error && error.message || "加载失败，请稍后重试"
      });
      return false;
    }
  },

  reloadAdminItems() {
    return this.loadAdminItems();
  },

  retryLoad() {
    return this.loadAdminItems();
  },

  handleSearch(e) {
    this.setData({ keyword: e.detail.value }, () => this.applyFilters());
  },

  setFilter(e) {
    this.setData({ activeFilter: e.currentTarget.dataset.value }, () => this.applyFilters());
  },

  applyFilters() {
    const keyword = this.data.keyword.trim().toLowerCase();
    const activeFilter = this.data.activeFilter;
    const visibleItems = this.data.items
      .filter((item) => {
        if (this.data.type === "rooms") {
          return activeFilter === "all" || item.apartment === activeFilter;
        }
        return activeFilter === "all" || item.status === activeFilter;
      })
      .filter((item) => !keyword || Object.keys(item).some((key) => String(item[key] || "").toLowerCase().includes(keyword)))
      .map((item) => displayItem(item, this.data.config, this.data.type));
    this.setData({
      visibleItems,
      summary: buildSummary(this.data.items, this.data.config)
    });
  },

  openForm(e) {
    if (this.data.previewOnly || this.data.loading || this.data.operationPending) return;
    const id = e && e.currentTarget.dataset.id ? Number(e.currentTarget.dataset.id) : null;
    const item = id ? this.data.items.find((row) => row.id === id) : null;
    const form = {};
    this.data.config.fields.forEach((field) => {
      form[field.key] = item ? item[field.key] || "" : "";
    });
    form.status = item ? item.status : this.defaultStatus();
    form.image = item ? item.image || "" : "";
    if (this.data.isApartment) {
      form.floor_plans = item && Array.isArray(item.floor_plans) ? clone(item.floor_plans) : [];
    }
    this.setData({ formOpen: true, editingId: id, form });
  },

  onImageChange(e) {
    this.setData({ "form.image": e.detail.value });
  },

  addFloorPlan() {
    const floorPlans = Array.isArray(this.data.form.floor_plans) ? clone(this.data.form.floor_plans) : [];
    if (floorPlans.length >= 20) {
      wx.showToast({ title: "每个公寓最多上传20张平面图", icon: "none" });
      return;
    }
    floorPlans.push({ name: "", image: "" });
    this.setData({ "form.floor_plans": floorPlans });
  },

  handleFloorPlanNameInput(e) {
    const index = Number(e.currentTarget.dataset.index);
    this.setData({ [`form.floor_plans.${index}.name`]: e.detail.value });
  },

  onFloorPlanImageChange(e) {
    const index = Number(e.currentTarget.dataset.index);
    const floorPlans = clone(this.data.form.floor_plans || []);
    const floorPlan = floorPlans[index];
    if (!floorPlan) return;
    floorPlan.image = e.detail.value || "";
    if (!String(floorPlan.name || "").trim() && floorPlan.image) {
      floorPlan.name = `平面图 ${index + 1}`;
    }
    this.setData({ "form.floor_plans": floorPlans });
  },

  moveFloorPlan(e) {
    const index = Number(e.currentTarget.dataset.index);
    const direction = Number(e.currentTarget.dataset.direction);
    const targetIndex = index + direction;
    const floorPlans = clone(this.data.form.floor_plans || []);
    if (targetIndex < 0 || targetIndex >= floorPlans.length) return;
    const current = floorPlans[index];
    floorPlans[index] = floorPlans[targetIndex];
    floorPlans[targetIndex] = current;
    this.setData({ "form.floor_plans": floorPlans });
  },

  removeFloorPlan(e) {
    const index = Number(e.currentTarget.dataset.index);
    const floorPlans = clone(this.data.form.floor_plans || []);
    floorPlans.splice(index, 1);
    this.setData({ "form.floor_plans": floorPlans });
  },

  defaultStatus() {
    return this.data.config.defaultStatus || "pending";
  },

  closeForm() {
    this.setData({ formOpen: false, editingId: null, form: {} });
  },

  handleFieldInput(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ [`form.${key}`]: e.detail.value });
  },

  setFormStatus(e) {
    this.setData({ "form.status": e.currentTarget.dataset.value });
  },

  async saveItem() {
    if (this.data.previewOnly || this.data.operationPending) return false;
    const form = this.data.form;
    if (!String(form[this.data.config.requiredKey] || "").trim()) {
      wx.showToast({ title: `请填写${this.data.config.requiredLabel}`, icon: "none" });
      return false;
    }
    if (!String(form.apartment_code || "").trim()) {
      wx.showToast({ title: this.data.isRoom ? "请填写所属公寓编号" : "请填写公寓编号", icon: "none" });
      return false;
    }
    const isEditing = Boolean(this.data.editingId);
    const original = isEditing
      ? this.data.items.find((item) => item.id === this.data.editingId) || {}
      : {};
    const nextItem = toCloudItem(this.data.type, {
      id: isEditing ? this.data.editingId : this.data.nextId,
      ...form
    }, original);
    this.setData({ operationPending: true });
    try {
      const result = await db.saveAdminItem(this.data.type, nextItem);
      if (isFailedResult(result)) {
        throw new Error(resultMessage(result, "保存失败"));
      }
      this.setData({ formOpen: false, editingId: null, form: {} });
      await this.loadAdminItems();
      wx.showToast({ title: isEditing ? "修改已保存" : "新增已保存", icon: "success" });
      return true;
    } catch (error) {
      wx.showToast({ title: error && error.message || "保存失败，请重试", icon: "none" });
      return false;
    } finally {
      this.setData({ operationPending: false });
    }
  },

  deleteItem(e) {
    if (this.data.previewOnly || this.data.operationPending) return;
    const id = Number(e.currentTarget.dataset.id || this.data.editingId);
    if (!id) return;
    const itemLabel = this.data.config.singularLabel || this.data.config.title || "记录";
    wx.showModal({
      title: "确认删除",
      content: `删除后不可恢复，确定删除该${itemLabel}吗？`,
      confirmColor: "#e04a3a",
      success: async (res) => {
        if (!res.confirm) return;
        this.setData({ operationPending: true });
        try {
          const result = await db.deleteAdminItem(this.data.type, id);
          if (isFailedResult(result)) {
            throw new Error(resultMessage(result, "删除失败"));
          }
          this.setData({ formOpen: false, editingId: null, form: {} });
          await this.loadAdminItems();
          wx.showToast({ title: "已删除", icon: "success" });
        } catch (error) {
          wx.showToast({ title: error && error.message || "删除失败，请重试", icon: "none" });
        } finally {
          this.setData({ operationPending: false });
        }
      }
    });
  },

  async updateStatus(e) {
    if (this.data.previewOnly || this.data.operationPending) return false;
    const id = Number(e.currentTarget.dataset.id);
    const status = e.currentTarget.dataset.status;
    const toast = e.currentTarget.dataset.toast || "状态已更新";
    this.setData({ operationPending: true });
    try {
      const result = await db.updateAdminItemStatus(this.data.type, id, status);
      if (isFailedResult(result)) {
        throw new Error(resultMessage(result, "状态更新失败"));
      }
      await this.loadAdminItems();
      wx.showToast({ title: toast, icon: "none" });
      return true;
    } catch (error) {
      wx.showToast({ title: error && error.message || "状态更新失败，请重试", icon: "none" });
      return false;
    } finally {
      this.setData({ operationPending: false });
    }
  },

  async exportData() {
    if (this.data.previewOnly) {
      wx.showToast({ title: "该管理模块暂未开放", icon: "none" });
      return;
    }
    // 公寓和户型使用专用 CSV 格式（含 apartment_code 列），
    // 与 exportFiltered 保持一致，保证"导出→编辑→导入"往返不因缺少 apartment_code 报错
    if (this.data.isApartment || this.data.isRoom) {
      const exportType = this.data.type === "rooms" ? "room_types" : this.data.type;
      wx.showLoading({ title: "导出中" });
      try {
        const res = await db.exportAdminItems(exportType, {});
        const items = Array.isArray(res) ? res : (res && res.ok ? res.items : []);
        if (items.length === 0 && res && !res.ok) {
          wx.showToast({ title: res.error || "导出失败", icon: "none" });
          return;
        }
        const csvText = this.generateCsvFromItems(this.data.type, items);
        await this.downloadCsv(this.data.type, csvText);
      } catch (err) {
        wx.showToast({ title: "导出失败", icon: "none" });
      } finally {
        wx.hideLoading();
      }
      return;
    }
    // 其他类型仍走原有 config 驱动的 CSV 路径
    const fileName = exportFileName(this.data.config);
    const tableText = toTableText(this.data.items, this.data.config);
    const csvText = toCsvText(this.data.items, this.data.config);
    const fs = wx.getFileSystemManager && wx.getFileSystemManager();
    if (!fs || !wx.env || !wx.env.USER_DATA_PATH) {
      wx.setClipboardData({
        data: tableText,
        success: () => wx.showToast({ title: "表格已复制", icon: "none" })
      });
      return;
    }
    const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`;
    fs.writeFile({
      filePath,
      data: csvText,
      encoding: "utf8",
      success: () => {
        if (wx.shareFileMessage) {
          wx.shareFileMessage({
            filePath,
            fileName,
            fail: () => {
              wx.setClipboardData({
                data: tableText,
                success: () => wx.showToast({ title: "已复制表格内容", icon: "none" })
              });
            }
          });
          return;
        }
        wx.setClipboardData({
          data: tableText,
          success: () => wx.showToast({ title: "CSV已生成，表格已复制", icon: "none" })
        });
      },
      fail: () => {
        wx.setClipboardData({
          data: tableText,
          success: () => wx.showToast({ title: "表格已复制", icon: "none" })
        });
      }
    });
  },

  openImport() {
    if (this.data.previewOnly) {
      wx.showToast({ title: "该管理模块暂未开放", icon: "none" });
      return;
    }
    // 公寓和户型接入任务制导入流程（任务 19）
    // admin 页内部 type 为 "apartments"/"rooms"，导入任务 targetType 对应 "apartments"/"room_types"
    if (this.data.isApartment || this.data.isRoom) {
      const taskType = this.data.type === "rooms" ? "room_types" : this.data.type;
      // 下载模板并入批量导入入口，通过 ActionSheet 选择
      wx.showActionSheet({
        itemList: ["下载导入模板", "选择 CSV 文件导入"],
        success: (res) => {
          if (res.tapIndex === 0) {
            this.downloadTemplate();
          } else if (res.tapIndex === 1) {
            this.importCsvFile(taskType);
          }
        },
        fail: () => {}
      });
      return;
    }
    const importHint = tableColumns(this.data.config).map((column) => column.label).join(" / ");
    if (!wx.chooseMessageFile) {
      this.openPasteImport(importHint);
      return;
    }
    wx.chooseMessageFile({
      count: 1,
      type: "file",
      extension: ["csv", "tsv", "txt", "xls", "xlsx"],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0];
        if (file) {
          this.importTableFile(file);
        }
      },
      fail: (error) => {
        if (error && String(error.errMsg || "").indexOf("cancel") >= 0) {
          return;
        }
        this.openPasteImport(importHint);
      }
    });
  },

  openPasteImport(importHint) {
    this.setData({ importOpen: true, importDraft: "", importError: "", importHint });
  },

  closeImport() {
    this.setData({ importOpen: false, importDraft: "", importError: "", importHint: "" });
  },

  handleImportInput(e) {
    this.setData({ importDraft: e.detail.value, importError: "" });
  },

  importTableFile(file) {
    const name = file.name || file.path || "";
    const ext = fileExt(name);
    if (ext === "xls" || ext === "xlsx") {
      wx.showModal({
        title: "请另存为 CSV",
        content: "当前原生静态版不引入 Excel 解析库，暂不能直接解析 .xls/.xlsx。请在 Excel/WPS 中另存为 CSV（UTF-8）后上传。",
        showCancel: false
      });
      return;
    }
    if (["csv", "tsv", "txt", ""].indexOf(ext) < 0) {
      wx.showToast({ title: "请上传 CSV/TSV 表格", icon: "none" });
      return;
    }
    if (file.size && file.size > 2 * 1024 * 1024) {
      wx.showToast({ title: "表格文件请控制在2MB内", icon: "none" });
      return;
    }
    const fs = wx.getFileSystemManager && wx.getFileSystemManager();
    if (!fs) {
      const importHint = tableColumns(this.data.config).map((column) => column.label).join(" / ");
      this.openPasteImport(importHint);
      return;
    }
    fs.readFile({
      filePath: file.path,
      encoding: "utf8",
      success: (res) => this.importRowsFromText(res.data),
      fail: () => wx.showToast({ title: "读取表格失败", icon: "none" })
    });
  },

  parseImportRows(text) {
    if (!String(text || "").trim().startsWith("{") && !String(text || "").trim().startsWith("[")) {
      return tableTextToRows(text, this.data.config);
    }
    const payload = JSON.parse(text);
    if (payload.type && payload.type !== this.data.type) {
      throw new Error(`当前页面是${this.data.config.title}，不能导入 ${payload.type}`);
    }
    const rows = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.items)
        ? payload.items
        : Array.isArray(payload.data)
          ? payload.data
          : [];
    return rows.filter((row) => row && String(row.name || "").trim());
  },

  async importRowsFromText(text) {
    if (this.data.previewOnly) {
      wx.showToast({ title: "该管理模块暂未开放", icon: "none" });
      return;
    }
    const source = String(text || "").trim();
    const importHint = tableColumns(this.data.config).map((column) => column.label).join(" / ");
    if (!source) {
      this.setData({ importOpen: true, importHint, importError: "请提供表格内容" });
      return;
    }
    let rows;
    try {
      rows = this.parseImportRows(source);
    } catch (error) {
      this.setData({ importOpen: true, importHint, importError: error.message || "表格格式不正确" });
      return;
    }
    if (!rows.length) {
      this.setData({ importOpen: true, importHint, importError: "没有可导入的数据，请检查名称列" });
      return;
    }
    // 显示导入中状态
    wx.showLoading({ title: "正在导入...", mask: true });
    try {
      const summary = await db.importAdminItems(this.data.type, rows);
      if (isFailedResult(summary)) {
        throw new Error(resultMessage(summary, "导入失败"));
      }
      this.setData({ importOpen: false, importDraft: "", importError: "", importHint: "" });
      await this.loadAdminItems();
      const parts = [];
      if (summary && summary.created > 0) parts.push(`新增${summary.created}条`);
      if (summary && summary.updated > 0) parts.push(`更新${summary.updated}条`);
      if (summary && summary.ignored > 0) parts.push(`忽略${summary.ignored}条`);
      wx.showToast({ title: parts.length ? parts.join("，") : "导入完成", icon: "none", duration: 2500 });
    } catch (error) {
      wx.showToast({ title: error && error.message || "导入失败，请重试", icon: "none" });
    } finally {
      wx.hideLoading();
    }
  },

  confirmImport() {
    this.importRowsFromText(this.data.importDraft);
  },

  // ========== 任务 19：导入流程接入 + 按条件导出 ==========

  // 跳转导入历史页（任务 18 WXML 中 apartments/rooms 均绑定此方法）
  // data-type 由 WXML 传入：apartments 或 room_types
  goImportHistory(e) {
    const type = e.currentTarget.dataset.type;
    wx.navigateTo({
      url: `/pages/admin/import-history/index?type=${type}`
    });
  },

  // 按条件导出（apartments 专属，rooms 暂不触发）
  // 批量导出入口：公寓打开条件筛选弹窗，户型直接导出全部
  openExportPanel() {
    if (this.data.isApartment) {
      this.setData({ exportPanelOpen: true });
      return;
    }
    // 户型管理无条件导出，直接导出全部
    this.exportData();
  },

  closeExportPanel() {
    this.setData({ exportPanelOpen: false });
  },

  // 调用 db.exportAdminItems 获取过滤后数据，再生成 CSV
  async exportFiltered(e) {
    this.setData({ exportPanelOpen: false });
    const type = e.currentTarget.dataset.type;
    const filters = {};
    if (this.data.exportDistrictIndex > 0) {
      filters.district = this.data.districtOptions[this.data.exportDistrictIndex];
    }

    wx.showLoading({ title: "导出中" });
    try {
      const res = await db.exportAdminItems(type, filters);
      // 兼容 mock 模式（返回数组）与云模式（返回 {ok, items}）
      const items = Array.isArray(res) ? res : (res && res.ok ? res.items : []);
      if (items.length === 0 && res && !res.ok) {
        wx.showToast({ title: res.error || "导出失败", icon: "none" });
        return;
      }
      const csvText = this.generateCsvFromItems(type, items);
      await this.downloadCsv(type, csvText);
    } catch (err) {
      wx.showToast({ title: "导出失败", icon: "none" });
    } finally {
      wx.hideLoading();
    }
  },

  // 根据类型生成 CSV 文本
  // apartments 使用 APARTMENT_CSV_HEADERS，rooms 使用 ROOM_CSV_HEADERS
  generateCsvFromItems(type, items) {
    if (type === "apartments") {
      const headers = APARTMENT_CSV_HEADERS;
      const rows = items.map((apt) => apartmentToCsvRow(apt));
      return toCsvTextFromRows(headers, rows);
    }
    // 户型需查公寓名称（云模式返回的 room 对象可能带 apartment_name）
    const apartmentMap = {};
    items.forEach((r) => {
      if (r.apartment_code && r.apartment_name) {
        apartmentMap[r.apartment_code] = r.apartment_name;
      }
    });
    const headers = ROOM_CSV_HEADERS;
    const rows = items.map((room) => roomToCsvRow(room, apartmentMap[room.apartment_code]));
    return toCsvTextFromRows(headers, rows);
  },

  async downloadCsv(type, csvText) {
    const exportType = type === "rooms" ? "room_types" : type;
    const created = await db.createExportFile(exportType, csvText);
    if (!created || !created.ok || !created.fileID) {
      wx.showToast({
        title: (created && created.message) || "导出文件生成失败，请重试",
        icon: "none"
      });
      return;
    }
    downloadAndOpenCloudCsv({ fileID: created.fileID, fileName: created.fileName });
  },

  // 下载标准 CSV 模板（仅表头，无示例数据，避免误导入）
  // 复用 APARTMENT_CSV_HEADERS / ROOM_CSV_HEADERS，不维护第三份字段清单
  downloadTemplate() {
    const isRoom = this.data.type === "rooms";
    const headers = isRoom ? ROOM_CSV_HEADERS : APARTMENT_CSV_HEADERS;
    const fileName = isRoom
      ? "room-import-template.csv"
      : "apartment-import-template.csv";
    // CSV 模板只包含表头行，使用 UTF-8 BOM
    const csvText = `\ufeff${headers.map((h) => csvCell(h)).join(",")}`;
    writeAndShareCsv({ fileName, content: csvText });
  },

  // picker 变更：区域
  onDistrictChange(e) {
    this.setData({ exportDistrictIndex: e.detail.value });
  },

  // 任务制导入：选择 CSV 文件 → 创建导入任务 → 跳转预览页
  // type 为导入任务的 targetType（apartments / room_types）
  async importCsvFile(type) {
    if (!wx.chooseMessageFile) {
      wx.showToast({ title: "当前版本不支持文件导入", icon: "none" });
      return;
    }
    wx.chooseMessageFile({
      count: 1,
      type: "file",
      extension: ["csv", "txt"],
      success: async (res) => {
        const file = res.tempFiles && res.tempFiles[0];
        if (!file) return;
        const filePath = file.path;
        const fileName = file.name || "";
        const fs = wx.getFileSystemManager && wx.getFileSystemManager();
        if (!fs) {
          wx.showToast({ title: "无法读取文件", icon: "none" });
          return;
        }
        let csvContent = "";
        try {
          csvContent = fs.readFileSync(filePath, "utf-8");
        } catch (err) {
          wx.showToast({ title: "读取文件失败", icon: "none" });
          return;
        }

        wx.showLoading({ title: "创建任务中" });
        try {
          const app = getApp();
          const operator = (app.globalData && app.globalData.userId) || "";
          const createRes = await db.createImportTask(type, fileName, csvContent, operator);
          if (!createRes || !createRes.ok) {
            wx.hideLoading();
            wx.showToast({ title: (createRes && createRes.error) || "创建失败", icon: "none" });
            return;
          }
          // 创建成功后立即触发预览（解析+校验+地理编码），
          // 否则任务停留在 pending，预览页确认按钮不显示
          wx.showLoading({ title: "解析预览中", mask: true });
          const previewRes = await db.previewImport(createRes.taskId);
          wx.hideLoading();
          if (!previewRes || !previewRes.ok) {
            wx.showToast({ title: (previewRes && previewRes.error) || "预览失败", icon: "none" });
            return;
          }
          wx.navigateTo({
            url: `/pages/admin/import-preview/index?taskId=${createRes.taskId}`
          });
        } catch (err) {
          wx.hideLoading();
          wx.showToast({ title: "创建失败", icon: "none" });
        }
      },
      fail: (error) => {
        if (error && String(error.errMsg || "").indexOf("cancel") >= 0) return;
        wx.showToast({ title: "选择文件失败", icon: "none" });
      }
    });
  }
});
