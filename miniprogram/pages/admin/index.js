const configs = {
  apartments: {
    title: "公寓管理",
    search: "搜索公寓名称",
    addText: "+ 新增",
    requiredKey: "name",
    requiredLabel: "公寓名称",
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
      { id: 1, name: "郑东人才公寓", district: "郑东新区", address: "金水东路与东风南路交叉口", rent: "¥1200-1800/月", rooms: "1-2居", desc: "配套 15 项：健身房、快递柜、自习室、洗衣房等", status: "active" },
      { id: 2, name: "高新人才家园", district: "高新区", address: "科学大道与长椿路交叉口", rent: "¥800-1200/月", rooms: "开间/1居", desc: "配套 9 项：快递柜、自习室、洗衣房等", status: "active" },
      { id: 3, name: "经开青年公寓", district: "经开区", address: "航海东路与经开第八大街", rent: "¥900-1400/月", rooms: "1-2居", desc: "配套 12 项：健身房、充电桩、社区医院等", status: "active" }
    ]
  },
  rooms: {
    title: "户型管理",
    search: "搜索户型/公寓",
    addText: "+ 新增户型",
    requiredKey: "name",
    requiredLabel: "户型名称",
    filters: [
      { value: "all", label: "全部" },
      { value: "active", label: "启用" },
      { value: "hidden", label: "停用" }
    ],
    fields: [
      { key: "apartment", label: "所属公寓", placeholder: "如：郑东人才公寓" },
      { key: "name", label: "户型名称", placeholder: "如：精致一居室" },
      { key: "area", label: "面积", placeholder: "如：35㎡" },
      { key: "orient", label: "朝向", placeholder: "如：南向" },
      { key: "rent", label: "租金", placeholder: "如：¥1200/月起" }
    ],
    items: [
      { id: 1, apartment: "郑东人才公寓", name: "精致一居室", area: "35㎡", orient: "南向", rent: "¥1200/月起", desc: "1室1卫 · 3层/总8层", status: "active" },
      { id: 2, apartment: "郑东人才公寓", name: "舒适两居室", area: "55㎡", orient: "东南向", rent: "¥1500/月起", desc: "2室1厅1卫 · 5层/总8层", status: "active" },
      { id: 3, apartment: "二七人才公寓", name: "二七舒适两居", area: "56㎡", orient: "南向", rent: "¥1000/月起", desc: "2室1厅1卫 · 4层/总11层", status: "active" }
    ]
  },
  activities: {
    title: "活动管理",
    search: "搜索活动/地点",
    addText: "+ 新增",
    requiredKey: "name",
    requiredLabel: "活动名称",
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
      { key: "desc", label: "活动说明", placeholder: "报名条件、费用、注意事项", type: "textarea" }
    ],
    items: [
      { id: 1, name: "周末羽毛球搭子局", category: "运动", time: "周六 15:00", place: "郑东人才公寓活动室", desc: "自带球拍，社区提供场地。人数：12人 · 发起人：小李", status: "pending" },
      { id: 2, name: "青年租房避坑分享", category: "分享", time: "周三 19:30", place: "线上直播", desc: "围绕合同、押金和维修责任做经验分享。", status: "active" },
      { id: 3, name: "社区公益清洁日", category: "公益", time: "7月6日 09:00", place: "中原青年社区", desc: "报名后统一发放工具和手套。", status: "hidden" }
    ]
  },
  services: {
    title: "服务管理",
    search: "搜索服务/订单",
    addText: "+ 新增",
    requiredKey: "name",
    requiredLabel: "服务名称",
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
      { key: "desc", label: "需求说明", placeholder: "用户提交的服务需求", type: "textarea" }
    ],
    items: [
      { id: 1, name: "维修上门", orderNo: "SV20260701001", user: "陈同学", address: "郑东人才公寓 3-1202", desc: "今天 18:00 前 · 管家小周 · 水龙头漏水", status: "processing" },
      { id: 2, name: "搬家代办", orderNo: "SV20260701002", user: "林同学", address: "高新人才家园 2-803", desc: "明天 10:00 · 待分配 · 4 个纸箱和一张书桌", status: "processing" },
      { id: 3, name: "资料代取", orderNo: "SV20260630009", user: "张同学", address: "经开青年公寓", desc: "已完成资料代取并送达前台。", status: "active" }
    ]
  },
  items: {
    title: "物品管理",
    search: "搜索物品/发布人",
    addText: "+ 新增",
    requiredKey: "name",
    requiredLabel: "物品名称",
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
      { key: "desc", label: "物品说明", placeholder: "成色、配件、押金要求", type: "textarea" }
    ],
    items: [
      { id: 1, name: "冲击钻", category: "工具", owner: "王同学", location: "郑东人才公寓 5 栋", desc: "限 2 天内归还 · 含钻头套装，适合安装置物架。", status: "active" },
      { id: 2, name: "折叠梯", category: "工具", owner: "社区前台", location: "高新人才家园前台", desc: "当天归还 · 1.8 米折叠梯，需登记手机号。", status: "processing" },
      { id: 3, name: "电饭煲", category: "家电", owner: "李同学", location: "经开青年公寓 2 栋", desc: "限 3 天内归还 · 功能正常，内胆轻微使用痕迹。", status: "pending" }
    ]
  },
  comments: {
    title: "评论管理",
    search: "搜索评论/用户",
    addText: "+ 新增",
    requiredKey: "content",
    requiredLabel: "评论内容",
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
      { key: "content", label: "评论内容", placeholder: "用户评价正文", type: "textarea" }
    ],
    items: [
      { id: 1, target: "郑东人才公寓", user: "周同学", rating: "4.8", content: "离地铁站近，房间采光不错，维修反馈也比较及时。", desc: "交通方便、管家响应快", status: "active" },
      { id: 2, target: "精致一居室", user: "林同学", rating: "4.5", content: "一个人住刚好，收纳空间如果再多一点会更好。", desc: "户型紧凑、性价比高", status: "pending" },
      { id: 3, target: "高新人才家园", user: "匿名用户", rating: "3.2", content: "临街房间晚上略吵，建议看房时注意楼栋位置。", desc: "噪音反馈", status: "hidden" }
    ]
  },
  users: {
    title: "用户管理",
    search: "搜索姓名/公寓/手机号",
    addText: "+ 新增",
    requiredKey: "name",
    requiredLabel: "用户姓名",
    filters: [
      { value: "all", label: "全部" },
      { value: "pending", label: "待认证" },
      { value: "active", label: "正常" },
      { value: "disabled", label: "停用" }
    ],
    fields: [
      { key: "name", label: "用户姓名", placeholder: "如：陈同学" },
      { key: "phone", label: "手机号", placeholder: "如：138****2688" },
      { key: "apartment", label: "所在公寓", placeholder: "如：郑东人才公寓" },
      { key: "room", label: "房间号", placeholder: "如：3-1202" },
      { key: "note", label: "备注", placeholder: "认证材料、入住状态、风险备注", type: "textarea" }
    ],
    items: [
      { id: 1, name: "陈同学", phone: "138****2688", apartment: "郑东人才公寓", room: "3-1202", note: "已入住，认证材料完整。", desc: "住户", status: "active" },
      { id: 2, name: "林同学", phone: "156****9012", apartment: "高新人才家园", room: "2-803", note: "等待上传劳动合同或人才码。", desc: "住户", status: "pending" },
      { id: 3, name: "管家小周", phone: "177****3321", apartment: "中原青年社区", room: "服务中心", note: "负责服务订单和维修派单。", desc: "管家", status: "active" }
    ]
  }
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function statusInfo(status) {
  const map = {
    active: { label: "已上线", className: "status-on" },
    pending: { label: "待审核", className: "status-warn" },
    processing: { label: "处理中", className: "status-warn" },
    hidden: { label: "已隐藏", className: "status-off" },
    disabled: { label: "已停用", className: "status-off" }
  };
  return map[status] || { label: "待处理", className: "status-warn" };
}

function displayItem(item) {
  const status = statusInfo(item.status);
  const title = item.name || item.target;
  const meta = [
    item.district,
    item.apartment,
    item.category,
    item.orderNo,
    item.user,
    item.phone,
    item.address,
    item.location
  ].filter(Boolean).join(" · ");
  const desc = [
    item.rent,
    item.rooms,
    item.area,
    item.orient,
    item.place,
    item.time,
    item.desc,
    item.content,
    item.note
  ].filter(Boolean).join(" · ");
  return { ...item, title, meta, desc, statusLabel: status.label, statusClass: status.className };
}

Page({
  data: {
    type: "activities",
    config: {},
    items: [],
    visibleItems: [],
    keyword: "",
    activeFilter: "all",
    summary: { total: 0, pending: 0, active: 0 },
    formOpen: false,
    editingId: null,
    form: {},
    nextId: 100
  },

  onLoad(options) {
    const type = configs[options.type] ? options.type : "activities";
    const config = configs[type];
    this.setData({
      type,
      config,
      items: clone(config.items),
      activeFilter: "all",
      nextId: 100
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
      .filter((item) => activeFilter === "all" || item.status === activeFilter)
      .filter((item) => !keyword || Object.keys(item).some((key) => String(item[key] || "").toLowerCase().includes(keyword)))
      .map(displayItem);
    this.setData({
      visibleItems,
      summary: {
        total: this.data.items.length,
        pending: this.data.items.filter((item) => item.status === "pending" || item.status === "processing").length,
        active: this.data.items.filter((item) => item.status === "active").length
      }
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
    const type = this.data.type;
    if (type === "services") return "processing";
    if (type === "apartments" || type === "rooms") return "active";
    return "pending";
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
    let items;
    if (this.data.editingId) {
      items = this.data.items.map((item) => item.id === this.data.editingId ? { ...item, ...form } : item);
    } else {
      items = [{ id: this.data.nextId, ...form }, ...this.data.items];
      this.setData({ nextId: this.data.nextId + 1 });
    }
    this.setData({ items, formOpen: false, editingId: null, form: {} }, () => this.applyFilters());
    wx.showToast({ title: this.data.editingId ? "已保存修改" : "已新增", icon: "none" });
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
    this.setData({
      items: this.data.items.map((item) => item.id === id ? { ...item, status } : item)
    }, () => this.applyFilters());
    wx.showToast({ title: "状态已更新", icon: "none" });
  }
});
