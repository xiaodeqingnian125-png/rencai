const {
  getAdminDataset,
  getAdminRoomFilters,
  getNextAdminId,
  saveAdminRuntimeItem,
  deleteAdminRuntimeItem,
  updateAdminRuntimeStatus,
  importAdminRuntimeItems
} = require("../../data/queries");

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
    filters: getAdminRoomFilters(),
    statusOptions: [
      { value: "active", label: "启用" },
      { value: "hidden", label: "停用" }
    ],
    fields: [
      { key: "apartment", label: "所属公寓", placeholder: "如：郑东人才公寓" },
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

function csvCell(value) {
  const text = cleanTableCell(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toCsvText(items, config) {
  const columns = tableColumns(config);
  const header = columns.map((column) => csvCell(column.label)).join(",");
  const rows = items.map((item) => columns.map((column) => csvCell(tableCellValue(item, column, config))).join(","));
  return `\ufeff${[header, ...rows].join("\n")}`;
}

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
    nextId: 100
  },

  onLoad(options) {
    // 权限校验：仅管理员可访问
    const app = getApp();
    if (!app.globalData.isAdmin) {
      wx.showToast({ title: "仅管理员可访问", icon: "none" });
      setTimeout(() => wx.navigateBack(), 1200);
      return;
    }
    const type = configs[options.type] ? options.type : "activities";
    const config = clone(configs[type]);
    if (type === "rooms") {
      config.filters = getAdminRoomFilters();
    }
    const items = getAdminDataset(type);
    config.statusOptions = config.statusOptions || config.filters.filter((item) => item.value !== "all");
    this.setData({
      type,
      config,
      items,
      isApartment: type === "apartments",
      isRoom: type === "rooms",
      activeFilter: "all",
      nextId: getNextAdminId(type),
      summary: buildSummary(items, config)
    }, () => this.applyFilters());
    wx.setNavigationBarTitle({ title: config.title });
  },

  isRuntimeManagedType() {
    return true;
  },

  reloadAdminItems() {
    const type = this.data.type;
    const items = getAdminDataset(type);
    const updates = {
      items,
      nextId: getNextAdminId(type),
      summary: buildSummary(items, this.data.config)
    };
    if (type === "rooms") {
      updates["config.filters"] = getAdminRoomFilters();
    }
    this.setData(updates, () => this.applyFilters());
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
    const id = e && e.currentTarget.dataset.id ? Number(e.currentTarget.dataset.id) : null;
    const item = id ? this.data.items.find((row) => row.id === id) : null;
    const form = {};
    this.data.config.fields.forEach((field) => {
      form[field.key] = item ? item[field.key] || "" : "";
    });
    form.status = item ? item.status : this.defaultStatus();
    form.image = item ? item.image || "" : "";
    this.setData({ formOpen: true, editingId: id, form });
  },

  onImageChange(e) {
    this.setData({ "form.image": e.detail.value });
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

  saveItem() {
    const form = this.data.form;
    if (!String(form[this.data.config.requiredKey] || "").trim()) {
      wx.showToast({ title: `请填写${this.data.config.requiredLabel}`, icon: "none" });
      return;
    }
    const isEditing = Boolean(this.data.editingId);
    const nextItem = { id: isEditing ? this.data.editingId : this.data.nextId, ...form };
    if (this.isRuntimeManagedType()) {
      saveAdminRuntimeItem(this.data.type, nextItem);
      this.setData({ formOpen: false, editingId: null, form: {} }, () => this.reloadAdminItems());
      wx.showToast({ title: isEditing ? "已同步修改" : "已新增并同步", icon: "none" });
      return;
    }
    let items;
    if (isEditing) {
      items = this.data.items.map((item) => item.id === this.data.editingId ? { ...item, ...form } : item);
    } else {
      items = [nextItem, ...this.data.items];
      this.setData({ nextId: this.data.nextId + 1 });
    }
    this.setData({ items, formOpen: false, editingId: null, form: {} }, () => this.applyFilters());
    wx.showToast({ title: isEditing ? "已保存修改" : "已新增", icon: "none" });
  },

  deleteItem(e) {
    const id = Number(e.currentTarget.dataset.id || this.data.editingId);
    if (!id) return;
    const itemLabel = this.data.config.singularLabel || this.data.config.title || "记录";
    wx.showModal({
      title: "确认删除",
      content: `删除后不可恢复，确定删除该${itemLabel}吗？`,
      confirmColor: "#e04a3a",
      success: (res) => {
        if (!res.confirm) return;
        if (this.isRuntimeManagedType()) {
          deleteAdminRuntimeItem(this.data.type, id);
          this.setData({ formOpen: false, editingId: null, form: {} }, () => this.reloadAdminItems());
          wx.showToast({ title: "已删除并同步", icon: "none" });
          return;
        }
        this.setData({
          items: this.data.items.filter((item) => item.id !== id),
          formOpen: false,
          editingId: null,
          form: {}
        }, () => this.applyFilters());
        wx.showToast({ title: "已删除", icon: "none" });
      }
    });
  },

  updateStatus(e) {
    const id = Number(e.currentTarget.dataset.id);
    const status = e.currentTarget.dataset.status;
    const toast = e.currentTarget.dataset.toast || "状态已更新";
    if (this.isRuntimeManagedType()) {
      updateAdminRuntimeStatus(this.data.type, id, status);
      this.reloadAdminItems();
      wx.showToast({ title: toast, icon: "none" });
      return;
    }
    this.setData({
      items: this.data.items.map((item) => item.id === id ? { ...item, status } : item)
    }, () => this.applyFilters());
    wx.showToast({ title: toast, icon: "none" });
  },

  exportData() {
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

  importRowsFromText(text) {
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
    const summary = importAdminRuntimeItems(this.data.type, rows);
    this.setData({ importOpen: false, importDraft: "", importError: "", importHint: "" }, () => this.reloadAdminItems());
    wx.hideLoading();
    // 区分新增和更新数量的详细结果
    const parts = [];
    if (summary.created > 0) parts.push(`新增${summary.created}条`);
    if (summary.updated > 0) parts.push(`更新${summary.updated}条`);
    if (summary.ignored > 0) parts.push(`忽略${summary.ignored}条`);
    const resultText = parts.length > 0 ? parts.join("，") : "无变更";
    wx.showToast({
      title: resultText,
      icon: "none",
      duration: 2500
    });
  },

  confirmImport() {
    this.importRowsFromText(this.data.importDraft);
  }
});
