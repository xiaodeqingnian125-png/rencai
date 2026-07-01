const activityCovers = ["cover-grad-1", "cover-grad-2", "cover-grad-3", "cover-grad-4"];

const activities = [
  {
    id: 1,
    title: "郑东公寓周末集市",
    type: "official",
    typeLabel: "官方活动",
    typeClass: "official",
    category: "社区市集",
    date: "7月5日（周六）14:00",
    shortDate: "7月5日",
    location: "郑东人才公寓·共享大厅",
    mode: "线下",
    fee: "免费",
    currentCount: 18,
    maxCount: 30,
    coverClass: activityCovers[0],
    organizer: "晓得青年",
    intro: "面向郑东人才公寓住户的周末轻市集，设置二手交换、手作体验、咖啡试饮和新邻居破冰区。适合刚入住的青年快速认识邻居，也可以带上闲置小物来交换。",
    notes: ["报名后现场出示昵称即可签到", "可携带 3 件以内闲置物品参与交换", "如遇天气变化，活动转移至共享大厅"]
  },
  {
    id: 2,
    title: "高新区桌游夜",
    type: "user",
    typeLabel: "用户活动",
    typeClass: "user",
    category: "兴趣社交",
    date: "7月11日（周五）19:00",
    shortDate: "7月11日",
    location: "高新人才家园·活动室",
    mode: "线下",
    fee: "AA 15 元",
    currentCount: 8,
    maxCount: 12,
    coverClass: activityCovers[1],
    organizer: "住户小林",
    intro: "下班后一起玩轻策略桌游，新手友好，主办人会提前讲规则。费用用于零食饮料，现场线下 AA，不通过小程序收款。",
    notes: ["适合新手，不需要自带桌游", "请提前 10 分钟到场", "费用由主办人线下收取"]
  },
  {
    id: 3,
    title: "人才公寓篮球友谊赛",
    type: "official",
    typeLabel: "官方活动",
    typeClass: "official",
    category: "运动",
    date: "7月19日（周六）16:00",
    shortDate: "7月19日",
    location: "二七人才公寓·篮球场",
    mode: "线下",
    fee: "免费",
    currentCount: 20,
    maxCount: 20,
    coverClass: activityCovers[2],
    organizer: "晓得青年",
    intro: "人才公寓住户之间的 3V3 友谊赛，现场按人数临时组队。活动已满员，可继续关注服务页后续场次。",
    notes: ["请穿运动鞋并自备水杯", "满员后不生成候补记录", "如遇场地维护将通过消息页通知"]
  },
  {
    id: 4,
    title: "租房合同避坑分享",
    type: "official",
    typeLabel: "官方活动",
    typeClass: "official",
    category: "政策攻略",
    date: "7月24日（周五）20:00",
    shortDate: "7月24日",
    location: "线上腾讯会议",
    mode: "线上",
    fee: "免费",
    currentCount: 26,
    maxCount: 80,
    coverClass: activityCovers[3],
    organizer: "晓得青年",
    intro: "围绕押金、维修、退租、人才公寓申请材料等高频问题做集中分享。报名后会在活动前通过消息页提醒会议入口。",
    notes: ["报名成功后保留消息提醒", "会议链接将在活动前统一发送", "可提前准备合同问题"]
  }
];

const services = [
  {
    id: 1,
    name: "代取快递",
    desc: "帮你代取公寓周边快递柜包裹",
    price: "5",
    unit: "元/次",
    category: "代办跑腿",
    coverClass: "service-cover-1",
    duration: "30-60分钟",
    scope: "支持公寓周边快递柜、驿站、小区门口临时寄存点。",
    detail: "适合工作日不方便取件的住户。提交取件码、包裹数量和送达位置后，客服会确认可服务时间。当前微信支付未配置，提交后由客服线下确认。",
    steps: ["填写取件码和送达位置", "客服确认服务时间", "服务人员取件并送达", "用户确认完成"]
  },
  {
    id: 2,
    name: "代办入住手续",
    desc: "协助办理人才公寓入住登记全流程",
    price: "50",
    unit: "元/次",
    category: "入住代办",
    coverClass: "service-cover-2",
    duration: "1个工作日",
    scope: "材料核对、物业登记、入住动线说明和现场陪同。",
    detail: "适合第一次办理人才公寓入住、对流程不熟悉的用户。请提前准备身份证、合同或审批凭证。当前微信支付未配置，提交需求后客服线下联系确认。",
    steps: ["提交联系人和公寓信息", "客服核对材料清单", "预约办理时间", "现场协助完成入住"]
  },
  {
    id: 3,
    name: "代排队取号",
    desc: "住建局窗口排队取号，省去你的等待时间",
    price: "30",
    unit: "元/次",
    category: "窗口代办",
    coverClass: "service-cover-3",
    duration: "半天内",
    scope: "适用于住建局窗口咨询、材料递交前取号和排队提醒。",
    detail: "提交需求后客服会确认窗口事项和材料要求，仅提供排队取号协助，不代替用户签署或提交需本人确认的材料。",
    steps: ["提交窗口事项", "客服确认可代办范围", "服务人员现场排队", "通知用户到场办理"]
  },
  {
    id: 4,
    name: "搬家小件协助",
    desc: "协助搬运行李箱、纸箱和小件家具",
    price: "39",
    unit: "元/小时",
    category: "搬家协助",
    coverClass: "service-cover-4",
    duration: "按预约",
    scope: "限同公寓或 3 公里内小件搬运，不含大型家电。",
    detail: "适合刚入住或换房间的小件搬运。提交楼栋、时间和物品数量后，客服会评估是否需要加人或调整时间。",
    steps: ["填写搬运起终点", "客服确认人手和时间", "服务人员到场协助", "用户确认完成"]
  }
];

const borrowCategories = [
  { label: "全部", value: "all" },
  { label: "工具", value: "tool" },
  { label: "户外", value: "outdoor" },
  { label: "小家电", value: "appliance" },
  { label: "其他", value: "other" }
];

const borrowItems = [
  {
    id: 1,
    name: "锤子",
    category: "tool",
    categoryLabel: "工具",
    thumbClass: "thumb-tool",
    desc: "家用手锤，木柄铁头，适合钉钉子、组装家具",
    rules: "借用2天内归还 · 需自取",
    location: "郑东人才公寓·3号楼",
    pickupLocation: "3号楼1楼大厅",
    owner: "小李",
    ownerAvatar: "李",
    status: "available",
    statusLabel: "可借用",
    statusClass: "available",
    detail: "锤头稳固，适合安装置物架、组装桌椅等轻量场景。请勿用于敲击承重墙或危险施工。",
    returnTip: "建议当天或次日归还，归还前擦拭干净。"
  },
  {
    id: 2,
    name: "螺丝刀套装",
    category: "tool",
    categoryLabel: "工具",
    thumbClass: "thumb-tool",
    desc: "多功能螺丝刀，一字+十字+六角，带磁吸头",
    rules: "借用3天内归还",
    location: "高新人才家园·1号楼",
    pickupLocation: "1号楼前台",
    owner: "阿泽",
    ownerAvatar: "泽",
    status: "available",
    statusLabel: "可借用",
    statusClass: "available",
    detail: "包含常用批头，适合安装简易家具、换电池盖、维修小家电外壳。",
    returnTip: "归还时请确认批头数量完整。"
  },
  {
    id: 3,
    name: "露营帐篷",
    category: "outdoor",
    categoryLabel: "户外",
    thumbClass: "thumb-outdoor",
    desc: "双人帐篷，防风防雨，适合周边郊游",
    rules: "周五借下周一还 · 押金¥100",
    location: "郑东人才公寓·5号楼",
    pickupLocation: "5号楼前台",
    owner: "小王",
    ownerAvatar: "王",
    status: "borrowed",
    statusLabel: "借用中",
    statusClass: "borrowed",
    expectedReturn: "预计7月8日归还",
    detail: "双人轻量帐篷，带地钉和收纳袋。当前借出中，可提交预约借用意向。",
    returnTip: "归还前需晾干并清理泥沙。"
  },
  {
    id: 4,
    name: "电钻",
    category: "tool",
    categoryLabel: "工具",
    thumbClass: "thumb-tool",
    desc: "冲击电钻，带6/8/10mm钻头，适合墙面打孔",
    rules: "借用1天内归还 · 需自取",
    location: "经开青年公寓·2号楼",
    pickupLocation: "2号楼物业前台",
    owner: "林同学",
    ownerAvatar: "林",
    status: "available",
    statusLabel: "可借用",
    statusClass: "available",
    detail: "适合安装挂钩、置物架等简单墙面作业。请确认物业允许施工后再使用。",
    returnTip: "归还时请检查电池、钻头和收纳盒。"
  },
  {
    id: 5,
    name: "电磁炉",
    category: "appliance",
    categoryLabel: "小家电",
    thumbClass: "thumb-appliance",
    desc: "美的电磁炉，9档火力，适合火锅/炒菜",
    rules: "借用1天内归还 · 需自取",
    location: "二七人才公寓·4号楼",
    pickupLocation: "4号楼公共厨房",
    owner: "小赵",
    ownerAvatar: "赵",
    status: "borrowed",
    statusLabel: "借用中",
    statusClass: "borrowed",
    expectedReturn: "预计7月6日归还",
    detail: "适合临时聚餐或厨房设备维修期间过渡使用，需自备锅具。",
    returnTip: "归还前请清洁面板油渍。"
  },
  {
    id: 6,
    name: "折叠椅",
    category: "outdoor",
    categoryLabel: "户外",
    thumbClass: "thumb-outdoor",
    desc: "铝合金折叠椅2把，轻便好拿",
    rules: "借用3天内归还",
    location: "中原青年社区·1号楼",
    pickupLocation: "1号楼门厅",
    owner: "社区前台",
    ownerAvatar: "前",
    status: "available",
    statusLabel: "可借用",
    statusClass: "available",
    detail: "适合露营、临时会客和社区活动使用。两把为一组出借。",
    returnTip: "收纳时请折叠到位，避免夹手。"
  }
];

const messages = [
  {
    id: 1,
    type: "activity",
    typeLabel: "活动",
    icon: "/assets/icons/msg-activity.svg",
    toneClass: "tone-activity",
    title: "活动提醒",
    preview: "你报名的「郑东公寓周末集市」将于明天14:00开始",
    detail: "你报名的「郑东公寓周末集市」将于明天14:00在郑东人才公寓中心花园开始。建议提前10分钟到场，现场可领取摊位指引和活动贴纸。",
    time: "10分钟前",
    unread: true,
    status: "待开始"
  },
  {
    id: 2,
    type: "borrow",
    typeLabel: "借用",
    icon: "/assets/icons/msg-borrow.svg",
    toneClass: "tone-borrow",
    title: "借用申请已确认",
    preview: "小李已确认你借用「电钻」的申请，取件位置：3号楼502",
    detail: "小李已确认你借用「电钻」的申请。取件位置：3号楼502；建议今日19:00-21:00之间取件，归还前请确认电池和钻头配件齐全。",
    time: "1小时前",
    unread: true,
    status: "待取件"
  },
  {
    id: 3,
    type: "service",
    typeLabel: "服务",
    icon: "/assets/icons/msg-service.svg",
    toneClass: "tone-service",
    title: "订单已提交",
    preview: "你已提交「代办入住手续」需求，客服将在1个工作日内联系你",
    detail: "你已提交「代办入住手续」需求。由于微信支付商户号未配置，当前订单不发起线上支付，客服会在1个工作日内联系你确认材料清单和线下费用。",
    time: "2小时前",
    unread: false,
    status: "处理中"
  },
  {
    id: 4,
    type: "activity",
    typeLabel: "活动",
    icon: "/assets/icons/msg-activity.svg",
    toneClass: "tone-activity",
    title: "活动取消通知",
    preview: "原定于7月20日的「人才公寓篮球友谊赛」因场地原因取消",
    detail: "原定于7月20日的「人才公寓篮球友谊赛」因场地维护取消。报名名额会自动释放，后续重启时间将在活动页同步。",
    time: "昨天",
    unread: true,
    status: "已取消"
  },
  {
    id: 5,
    type: "borrow",
    typeLabel: "借用",
    icon: "/assets/icons/msg-borrow.svg",
    toneClass: "tone-borrow",
    title: "借用即将到期",
    preview: "你借用的「露营帐篷」还剩1天到期，请及时归还",
    detail: "你借用的「露营帐篷」还剩1天到期，请在明日20:00前归还至2号楼前台。若需要延长借用时间，请先联系物主确认。",
    time: "昨天",
    unread: false,
    status: "待归还"
  },
  {
    id: 6,
    type: "service",
    typeLabel: "服务",
    icon: "/assets/icons/msg-service.svg",
    toneClass: "tone-service",
    title: "服务完成",
    preview: "你的「代取快递」订单已完成，请确认收货",
    detail: "你的「代取快递」订单已完成，快递已放置在5号楼一层临时寄存柜。请确认收货，如有遗漏可联系服务人员补充处理。",
    time: "7月1日",
    unread: false,
    status: "待确认"
  },
  {
    id: 7,
    type: "comment",
    typeLabel: "评论",
    icon: "/assets/icons/msg-comment.svg",
    toneClass: "tone-comment",
    title: "评价收到回复",
    preview: "郑东人才公寓管家回复了你的户型评价",
    detail: "郑东人才公寓管家回复了你对「精致一居室」的评价：感谢反馈，厨房收纳架本周会补充安装，欢迎入住后继续提出建议。",
    time: "7月1日",
    unread: false,
    status: "已回复"
  },
  {
    id: 8,
    type: "system",
    typeLabel: "系统",
    icon: "/assets/icons/msg-system.svg",
    toneClass: "tone-system",
    title: "系统通知",
    preview: "欢迎加入晓得青年！开始探索你的理想公寓吧",
    detail: "欢迎加入晓得青年。你可以在首页查看人才公寓，在服务页报名活动和提交代办需求，也可以通过借个锤子共享闲置工具。",
    time: "7月1日",
    unread: false,
    status: "已送达"
  }
];

const profileRecords = {
  activities: {
    title: "我的活动",
    subtitle: "报名、发起和候补活动的最新进展",
    empty: "暂无活动记录，去服务页看看最近的青年活动。",
    items: [
      {
        title: "周末桌游局",
        status: "已报名",
        toneClass: "ok",
        meta: ["时间：周六 19:30", "地点：郑东人才公寓共享客厅", "报名码：HD-2606-02"],
        actions: [
          { label: "查看活动", action: "service", primary: true },
          { label: "取消报名", action: "cancelActivity", primary: false }
        ]
      },
      {
        title: "夏日夜跑搭子",
        status: "报名中",
        toneClass: "warn",
        meta: ["时间：周日 20:00", "集合：北门广场", "报名方式：线下集合"],
        actions: [
          { label: "查看活动", action: "service", primary: true },
          { label: "提醒我", action: "remind", primary: false }
        ]
      }
    ]
  },
  posts: {
    title: "我的帖子",
    subtitle: "找室友发布记录和联系状态",
    empty: "还没有发布找室友帖子。",
    items: [
      {
        title: "郑东人才公寓 · 主卧找室友",
        status: "展示中",
        toneClass: "ok",
        meta: ["类型：有房找室友", "预算：1200-1500 元/月", "最近联系：2 人咨询"],
        actions: [
          { label: "查看帖子", action: "roommate", primary: true },
          { label: "下架帖子", action: "closePost", primary: false }
        ]
      }
    ]
  },
  lend: {
    title: "我借出的",
    subtitle: "别人向你借用的物品与归还状态",
    empty: "暂无借出记录。",
    items: [
      {
        title: "电钻工具箱",
        status: "借出中",
        toneClass: "warn",
        meta: ["借用人：林同学", "借用时间：今天 18:00-20:00", "归还点：3 号楼大厅"],
        actions: [
          { label: "联系借用人", action: "contact", primary: true },
          { label: "确认归还", action: "finishLend", primary: false }
        ]
      },
      {
        title: "折叠梯",
        status: "待确认",
        toneClass: "muted",
        meta: ["申请人：陈同学", "申请时间：明天 10:00-11:30", "留言：装窗帘用一下"],
        actions: [
          { label: "同意借出", action: "approveLend", primary: true },
          { label: "拒绝", action: "reject", primary: false }
        ]
      }
    ]
  },
  borrow: {
    title: "我借入的",
    subtitle: "你的借用申请、领取和归还记录",
    empty: "暂无借入记录，去借个锤子看看可借物品。",
    items: [
      {
        title: "手持熨斗",
        status: "待领取",
        toneClass: "warn",
        meta: ["物主：阿泽", "预约：今天 21:00", "领取点：2 号楼前台"],
        actions: [
          { label: "查看物品", action: "borrowPage", primary: true },
          { label: "联系物主", action: "contact", primary: false }
        ]
      }
    ]
  },
  orders: {
    title: "我的订单",
    subtitle: "代办服务订单和处理进度",
    empty: "暂无服务订单。",
    items: [
      {
        title: "快递代取 · 中通 3 件",
        status: "处理中",
        toneClass: "warn",
        meta: ["订单号：DD-260630-018", "取件点：菜鸟驿站东门店", "预计送达：30 分钟内"],
        actions: [
          { label: "查看订单", action: "service", primary: true },
          { label: "联系客服", action: "contact", primary: false }
        ]
      },
      {
        title: "维修预约 · 水龙头漏水",
        status: "已完成",
        toneClass: "muted",
        meta: ["订单号：DD-260629-006", "处理人：物业维修王师傅", "完成时间：昨天 16:20"],
        actions: [
          { label: "再次下单", action: "service", primary: true },
          { label: "评价服务", action: "comment", primary: false }
        ]
      }
    ]
  }
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function withActivityStatus(activity) {
  const full = activity.currentCount >= activity.maxCount;
  return {
    ...activity,
    participants: `${activity.currentCount}/${activity.maxCount}人`,
    statusText: `${full ? "已满员" : "报名中"} · ${activity.currentCount}/${activity.maxCount}人`,
    statusClass: full ? "full" : "open",
    full
  };
}

function getActivities() {
  return activities.map(withActivityStatus);
}

function getActivityById(id) {
  const numericId = Number(id) || 1;
  return withActivityStatus(activities.find((activity) => activity.id === numericId) || activities[0]);
}

function getServices() {
  return clone(services);
}

function getServiceById(id) {
  const numericId = Number(id) || 1;
  return clone(services.find((service) => service.id === numericId) || services[0]);
}

function getBorrowItems() {
  return clone(borrowItems);
}

function getBorrowItemById(id) {
  const numericId = Number(id) || 1;
  return clone(borrowItems.find((item) => item.id === numericId) || borrowItems[0]);
}

module.exports = {
  borrowCategories,
  getActivities,
  getActivityById,
  getServices,
  getServiceById,
  getBorrowItems,
  getBorrowItemById,
  messages,
  profileRecords
};
