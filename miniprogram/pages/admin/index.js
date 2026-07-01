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
    ],
    items: [
      { id: 1, name: "郑东人才公寓", district: "郑东新区", address: "金水东路与东风南路交叉口", rent: "¥1200-1800/月", rooms: "1-2居", facilityCount: 15, desc: "配套 15 项：健身房、快递柜、自习室、洗衣房等", status: "active" },
      { id: 2, name: "高新人才家园", district: "高新区", address: "科学大道与长椿路交叉口", rent: "¥800-1200/月", rooms: "开间/1居", facilityCount: 9, desc: "配套 9 项：快递柜、自习室、洗衣房等", status: "active" },
      { id: 3, name: "经开青年公寓", district: "经开区", address: "航海东路与经开第八大街", rent: "¥900-1400/月", rooms: "1-2居", facilityCount: 12, desc: "配套 12 项：健身房、充电桩、社区医院等", status: "active" },
      { id: 4, name: "港区人才社区", district: "航空港区", address: "华夏大道与迎宾路交叉口", rent: "¥700-1000/月", rooms: "开间/1居", facilityCount: 8, desc: "配套 8 项：快递柜、洗衣房、便利店等", status: "active" },
      { id: 5, name: "二七人才公寓", district: "二七区", address: "大学路与航海路交叉口", rent: "¥1000-1500/月", rooms: "2-3居", facilityCount: 11, desc: "配套 11 项：健身房、自习室、快递柜等", status: "active" },
      { id: 6, name: "中原青年社区", district: "中原区", address: "建设路与秦岭路交叉口", rent: "¥850-1300/月", rooms: "1-2居", facilityCount: 10, desc: "配套 10 项：洗衣房、快递柜、自习室等", status: "active" }
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
    filters: [
      { value: "all", label: "全部" },
      { value: "郑东人才公寓", label: "郑东人才公寓" },
      { value: "二七人才公寓", label: "二七人才公寓" },
      { value: "中原青年社区", label: "中原青年社区" }
    ],
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
    ],
    items: [
      { id: 1, apartment: "郑东人才公寓", name: "精致一居室", area: "35㎡", orient: "南向", rooms: "1室1厅1卫", rent: "¥1200/月起", floor: "3层/总8层", status: "active" },
      { id: 2, apartment: "郑东人才公寓", name: "舒适两居室", area: "55㎡", orient: "东南向", rooms: "2室1厅1卫", rent: "¥1500/月起", floor: "5层/总8层", status: "active" },
      { id: 3, apartment: "郑东人才公寓", name: "阳光大单间", area: "28㎡", orient: "南向", rooms: "开间", rent: "¥1000/月起", floor: "2层/总8层", status: "active" },
      { id: 4, apartment: "二七人才公寓", name: "温馨一居室", area: "32㎡", orient: "南向", rooms: "1室1卫", rent: "¥1000/月起", floor: "4层/总12层", status: "active" },
      { id: 5, apartment: "二七人才公寓", name: "宽敞两居室", area: "60㎡", orient: "西南向", rooms: "2室1厅1卫", rent: "¥1500/月起", floor: "8层/总12层", status: "active" },
      { id: 6, apartment: "中原青年社区", name: "舒适一居室", area: "38㎡", orient: "东南向", rooms: "1室1厅1卫", rent: "¥850/月起", floor: "6层/总10层", status: "active" }
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
    ],
    items: [
      { id: 1, name: "周末羽毛球搭子局", category: "运动", time: "周六 15:00", place: "郑东人才公寓活动室", quota: "12人", owner: "小李", desc: "自带球拍，社区提供场地。", status: "pending" },
      { id: 2, name: "青年租房避坑分享", category: "分享", time: "周三 19:30", place: "线上直播", quota: "不限", owner: "运营小晓", desc: "围绕合同、押金和维修责任做经验分享。", status: "active" },
      { id: 3, name: "社区公益清洁日", category: "公益", time: "7月6日 09:00", place: "中原青年社区", quota: "20人", owner: "社区管家", desc: "报名后统一发放工具和手套。", status: "hidden" }
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
    ],
    items: [
      { id: 1, name: "维修上门", orderNo: "SV20260701001", user: "陈同学", address: "郑东人才公寓 3-1202", time: "今天 18:00 前", assignee: "管家小周", desc: "卫生间水龙头漏水，需要上门维修。", status: "processing" },
      { id: 2, name: "搬家代办", orderNo: "SV20260701002", user: "林同学", address: "高新人才家园 2-803", time: "明天 10:00", assignee: "待分配", desc: "需要帮忙搬 4 个纸箱和一张书桌。", status: "processing" },
      { id: 3, name: "资料代取", orderNo: "SV20260630009", user: "张同学", address: "经开青年公寓", time: "昨天 16:00", assignee: "管家小李", desc: "已完成资料代取并送达前台。", status: "active" }
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
    ],
    items: [
      { id: 1, name: "冲击钻", category: "工具", owner: "王同学", location: "郑东人才公寓 5 栋", rule: "限 2 天内归还", desc: "含钻头套装，适合安装置物架。", status: "active" },
      { id: 2, name: "折叠梯", category: "工具", owner: "社区前台", location: "高新人才家园前台", rule: "当天归还", desc: "1.8 米折叠梯，需登记手机号。", status: "processing" },
      { id: 3, name: "电饭煲", category: "家电", owner: "李同学", location: "经开青年公寓 2 栋", rule: "限 3 天内归还", desc: "功能正常，内胆轻微使用痕迹。", status: "pending" }
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
    ],
    items: [
      { id: 1, target: "郑东人才公寓", user: "周同学", rating: "4.8", tags: "交通方便、管家响应快", content: "离地铁站近，房间采光不错，维修反馈也比较及时。", status: "active" },
      { id: 2, target: "精致一居室", user: "林同学", rating: "4.5", tags: "户型紧凑、性价比高", content: "一个人住刚好，收纳空间如果再多一点会更好。", status: "pending" },
      { id: 3, target: "高新人才家园", user: "匿名用户", rating: "3.2", tags: "噪音反馈", content: "临街房间晚上略吵，建议看房时注意楼栋位置。", status: "hidden" }
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
    ],
    items: [
      { id: 1, name: "陈同学", phone: "138****2688", role: "住户", apartment: "郑东人才公寓", room: "3-1202", note: "已入住，认证材料完整。", status: "active" },
      { id: 2, name: "林同学", phone: "156****9012", role: "住户", apartment: "高新人才家园", room: "2-803", note: "等待上传劳动合同或人才码。", status: "pending" },
      { id: 3, name: "管家小周", phone: "177****3321", role: "管家", apartment: "中原青年社区", room: "服务中心", note: "负责服务订单和维修派单。", status: "active" }
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
    editingId: null,
    form: {},
    nextId: 100
  },

  onLoad(options) {
    const type = configs[options.type] ? options.type : "activities";
    const config = clone(configs[type]);
    config.statusOptions = config.statusOptions || config.filters.filter((item) => item.value !== "all");
    this.setData({
      type,
      config,
      items: clone(config.items),
      isApartment: type === "apartments",
      isRoom: type === "rooms",
      activeFilter: "all",
      nextId: 100,
      summary: buildSummary(config.items, config)
    }, () => this.applyFilters());
    wx.setNavigationBarTitle({ title: config.title });
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
    this.setData({ formOpen: true, editingId: id, form });
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
    let items;
    if (isEditing) {
      items = this.data.items.map((item) => item.id === this.data.editingId ? { ...item, ...form } : item);
    } else {
      items = [{ id: this.data.nextId, ...form }, ...this.data.items];
      this.setData({ nextId: this.data.nextId + 1 });
    }
    this.setData({ items, formOpen: false, editingId: null, form: {} }, () => this.applyFilters());
    wx.showToast({ title: isEditing ? "已保存修改" : "已新增", icon: "none" });
  },

  deleteItem(e) {
    const id = Number(e.currentTarget.dataset.id || this.data.editingId);
    if (!id) return;
    this.setData({
      items: this.data.items.filter((item) => item.id !== id),
      formOpen: false,
      editingId: null,
      form: {}
    }, () => this.applyFilters());
    wx.showToast({ title: "已删除", icon: "none" });
  },

  updateStatus(e) {
    const id = Number(e.currentTarget.dataset.id);
    const status = e.currentTarget.dataset.status;
    const toast = e.currentTarget.dataset.toast || "状态已更新";
    this.setData({
      items: this.data.items.map((item) => item.id === id ? { ...item, status } : item)
    }, () => this.applyFilters());
    wx.showToast({ title: toast, icon: "none" });
  }
});
