const sharedCosts = [
  { label: "水费", value: "¥4.5/t", active: true },
  { label: "电费", value: "¥0.56/度", active: true },
  { label: "燃气费", value: "¥2.5/m³", active: true },
  { label: "物业费", value: "¥2.5/㎡", active: true },
  { label: "暖气费", value: "¥22/㎡", active: true },
  { label: "停车费", value: "暂无", active: false }
];

const privateFacilities = [
  { label: "洗衣机", icon: "洗", active: true },
  { label: "冰箱", icon: "冰", active: true },
  { label: "油烟机", icon: "烟", active: true },
  { label: "暖气", icon: "暖", active: true },
  { label: "空调", icon: "空", active: true },
  { label: "热水器", icon: "热", active: true },
  { label: "燃气灶", icon: "灶", active: false }
];

const publicFacilities = [
  { label: "健身房", icon: "健", active: true },
  { label: "快递柜", icon: "柜", active: true },
  { label: "充电桩", icon: "电", active: false },
  { label: "自习室", icon: "习", active: true },
  { label: "洗衣房", icon: "衣", active: true },
  { label: "乒乓球", icon: "球", active: false }
];

const users = [
  { id: "u_current", nickname: "晓得青年", avatar_text: "晓", avatar_class: "ca-1", phone: "138****8888", role: "admin", role_label: "管理员", apartment_id: 1, room_label: "3号楼", status: "active", note: "已入住，具备管理员演示权限。" },
  { id: "u_xiaoling", nickname: "小玲", avatar_text: "小", avatar_class: "ca-1", phone: "138****2688", role: "tenant", role_label: "住户", apartment_id: 1, room_label: "3-1202", status: "active", note: "已入住，认证材料完整。" },
  { id: "u_dapeng", nickname: "大鹏", avatar_text: "大", avatar_class: "ca-2", phone: "156****9012", role: "tenant", role_label: "住户", apartment_id: 2, room_label: "2-803", status: "pending", note: "等待上传劳动合同或人才码。" },
  { id: "u_ajie", nickname: "阿杰", avatar_text: "阿", avatar_class: "ca-3", phone: "177****3321", role: "housekeeper", role_label: "管家", apartment_id: 6, room_label: "服务中心", status: "active", note: "负责服务订单和维修派单。" },
  { id: "u_lili", nickname: "小李", avatar_text: "李", avatar_class: "male", phone: "139****7123", role: "tenant", role_label: "住户", apartment_id: 1, room_label: "3-502", status: "active", note: "借物活跃用户。" },
  { id: "u_wang", nickname: "小王", avatar_text: "王", avatar_class: "female", phone: "158****0931", role: "tenant", role_label: "住户", apartment_id: 5, room_label: "4-801", status: "disabled", note: "账号已停用，需复核。" },
  { id: "u_zhao", nickname: "小赵", avatar_text: "赵", avatar_class: "female", phone: "150****1207", role: "tenant", role_label: "住户", apartment_id: 3, room_label: "待入住", status: "pending", note: "等待入住审核。" }
];

const apartments = [
  {
    id: 1,
    name: "郑东人才公寓",
    district: "郑东新区",
    price_min: 1200,
    price_max: 1800,
    room_summary: "1-2居",
    address: "金水东路与东风南路交叉口",
    latitude: 34.7597,
    longitude: 113.7484,
    location_meta: "地铁1/5号线 · 距郑州东站约1.5km",
    hero_class: "hero-zd",
    image_class: "apt-img-1",
    image: "/assets/apartments/apt-1.jpg",
    status: "active",
    tags: [{ label: "热门", className: "tag-hot" }, { label: "近地铁", className: "tag-subway" }],
    costs: sharedCosts,
    private_facilities: privateFacilities,
    public_facilities: publicFacilities,
    nearby: ["超市/便利店", "快餐小吃", "药店", "社区医院", "快递柜"]
  },
  {
    id: 2,
    name: "高新人才家园",
    district: "高新区",
    price_min: 800,
    price_max: 1200,
    room_summary: "开间/1居",
    address: "科学大道与长椿路交叉口",
    latitude: 34.8126,
    longitude: 113.5419,
    location_meta: "高新区通勤圈 · 靠近地铁8号线规划站点",
    hero_class: "hero-gx",
    image_class: "apt-img-2",
    image: "/assets/apartments/apt-2.jpg",
    status: "active",
    tags: [{ label: "新上", className: "tag-new" }],
    costs: sharedCosts,
    private_facilities: privateFacilities,
    public_facilities: publicFacilities.filter((item) => item.label !== "健身房"),
    nearby: ["超市/便利店", "快餐小吃", "药店", "快递柜"]
  },
  {
    id: 3,
    name: "经开青年公寓",
    district: "经开区",
    price_min: 900,
    price_max: 1400,
    room_summary: "1-2居",
    address: "航海东路与经开第八大街",
    latitude: 34.7219,
    longitude: 113.7426,
    location_meta: "经开产业园区 · 近公交主干线",
    hero_class: "hero-jk",
    image_class: "apt-img-3",
    image: "/assets/apartments/apt-3.jpg",
    status: "active",
    tags: [{ label: "近地铁", className: "tag-subway" }],
    costs: sharedCosts,
    private_facilities: privateFacilities,
    public_facilities: publicFacilities.map((item) => item.label === "充电桩" ? { ...item, active: true } : item),
    nearby: ["超市/便利店", "快餐小吃", "药店", "社区医院"]
  },
  {
    id: 4,
    name: "港区人才社区",
    district: "航空港区",
    price_min: 700,
    price_max: 1000,
    room_summary: "开间/1居",
    address: "华夏大道与迎宾路交叉口",
    latitude: 34.5344,
    longitude: 113.8424,
    location_meta: "航空港就业圈 · 生活配套完善",
    hero_class: "hero-gq",
    image_class: "apt-img-4",
    image: "/assets/apartments/apt-4.jpg",
    status: "active",
    tags: [],
    costs: sharedCosts,
    private_facilities: privateFacilities,
    public_facilities: publicFacilities.filter((item) => item.label !== "乒乓球"),
    nearby: ["超市/便利店", "快餐小吃", "药店", "快递柜"]
  },
  {
    id: 5,
    name: "二七人才公寓",
    district: "二七区",
    price_min: 1000,
    price_max: 1500,
    room_summary: "2-3居",
    address: "大学路与航海路交叉口",
    latitude: 34.7221,
    longitude: 113.6398,
    location_meta: "二七商圈 · 临近学校与社区商业",
    hero_class: "hero-eq",
    image_class: "apt-img-5",
    image: "/assets/apartments/apt-5.jpg",
    status: "active",
    tags: [{ label: "热门", className: "tag-hot" }],
    costs: sharedCosts,
    private_facilities: privateFacilities,
    public_facilities: publicFacilities,
    nearby: ["超市/便利店", "快餐小吃", "药店", "社区医院", "快递柜"]
  },
  {
    id: 6,
    name: "中原青年社区",
    district: "中原区",
    price_min: 850,
    price_max: 1300,
    room_summary: "1-2居",
    address: "建设路与秦岭路交叉口",
    latitude: 34.7537,
    longitude: 113.6066,
    location_meta: "中原老城生活圈 · 交通成熟",
    hero_class: "hero-zy",
    image_class: "apt-img-6",
    image: "/assets/apartments/apt-6.jpg",
    status: "active",
    tags: [{ label: "新上", className: "tag-new" }, { label: "近地铁", className: "tag-subway" }],
    costs: sharedCosts,
    private_facilities: privateFacilities,
    public_facilities: publicFacilities,
    nearby: ["超市/便利店", "快餐小吃", "药店", "社区医院"]
  }
];

const roomImageMap = {
  "ri-1": "/assets/rooms/room-1.jpg",
  "ri-2": "/assets/rooms/room-2.jpg",
  "ri-3": "/assets/rooms/room-3.jpg"
};

const roomTypes = [
  { id: 101, apartment_id: 1, legacy_room_id: 1, name: "精致一居室", area: "35㎡", orient: "南向", layout: "1室1卫", floor: "3层 / 总8层", price: 1200, image_class: "ri-1", image: roomImageMap["ri-1"], status: "active", desc: "独立一居室户型，玄关入户，动静分区明确。客厅连接景观阳台，通风采光俱佳。卧室带飘窗，可俯瞰社区花园。精装修交付，拎包即可入住。" },
  { id: 102, apartment_id: 1, legacy_room_id: 2, name: "舒适两居室", area: "55㎡", orient: "东南向", layout: "2室1厅1卫", floor: "5层 / 总8层", price: 1500, image_class: "ri-2", image: roomImageMap["ri-2"], status: "active", desc: "两居室适合合租或小家庭入住，客餐厅连通，主卧采光稳定，次卧可作为书房或室友房。厨房独立，日常做饭和收纳都更从容。" },
  { id: 103, apartment_id: 1, legacy_room_id: 3, name: "阳光大单间", area: "28㎡", orient: "南向", layout: "开间", floor: "2层 / 总8层", price: 1000, image_class: "ri-3", image: roomImageMap["ri-3"], status: "active", desc: "开间户型紧凑高效，睡眠区、书桌区和简餐区集中布置。适合预算敏感、通勤优先的年轻住户，南向窗保证基础采光。" },
  { id: 201, apartment_id: 2, legacy_room_id: 1, name: "高新阳光单间", area: "29㎡", orient: "南向", layout: "开间", floor: "4层 / 总10层", price: 800, image_class: "ri-3", image: roomImageMap["ri-3"], status: "active", desc: "面向高新区通勤人群的经济单间，空间紧凑但采光直接。床、书桌、衣柜沿墙排布，适合刚入职或短通勤独居。" },
  { id: 202, apartment_id: 2, legacy_room_id: 2, name: "高新舒适一居", area: "36㎡", orient: "东南向", layout: "1室1卫", floor: "6层 / 总10层", price: 1000, image_class: "ri-1", image: roomImageMap["ri-1"], status: "active", desc: "独立一居室，卧室和生活区分区更清楚。东南向采光温和，适合需要长期稳定居住和居家办公的年轻住户。" },
  { id: 203, apartment_id: 2, legacy_room_id: 3, name: "青年独立一居", area: "42㎡", orient: "南向", layout: "1室1厅1卫", floor: "8层 / 总10层", price: 1200, image_class: "ri-2", image: roomImageMap["ri-2"], status: "active", desc: "带独立客厅的一居室，适合希望保留会客、运动或学习空间的住户。南向主采光面，家具布置余量更大。" },
  { id: 301, apartment_id: 3, legacy_room_id: 1, name: "经开标准一居", area: "32㎡", orient: "南向", layout: "1室1卫", floor: "3层 / 总9层", price: 900, image_class: "ri-1", image: roomImageMap["ri-1"], status: "active", desc: "标准一居室，动线直接，适合经开区产业园通勤。独立卫浴和基础厨房设备齐全，入住门槛低。" },
  { id: 302, apartment_id: 3, legacy_room_id: 2, name: "经开舒适两居", area: "58㎡", orient: "东南向", layout: "2室1厅1卫", floor: "6层 / 总9层", price: 1400, image_class: "ri-2", image: roomImageMap["ri-2"], status: "active", desc: "两居室面向合租场景，客厅和双卧分隔明确。东南向公共区采光更好，适合两位同事或朋友合租。" },
  { id: 401, apartment_id: 4, legacy_room_id: 1, name: "港区经济单间", area: "26㎡", orient: "南向", layout: "开间", floor: "2层 / 总8层", price: 700, image_class: "ri-3", image: roomImageMap["ri-3"], status: "active", desc: "预算友好的紧凑单间，生活设施集中布置，适合航空港就业圈短通勤独居。" },
  { id: 402, apartment_id: 4, legacy_room_id: 2, name: "港区独立一居", area: "34㎡", orient: "东向", layout: "1室1卫", floor: "5层 / 总8层", price: 1000, image_class: "ri-1", image: roomImageMap["ri-1"], status: "active", desc: "独立一居室，早间采光舒适，卧室与洗浴区互不干扰，适合稳定工作节奏的住户。" },
  { id: 501, apartment_id: 5, legacy_room_id: 1, name: "二七舒适两居", area: "56㎡", orient: "南向", layout: "2室1厅1卫", floor: "4层 / 总11层", price: 1000, image_class: "ri-2", image: roomImageMap["ri-2"], status: "active", desc: "两居室总价友好，适合合租。南向卧室采光稳定，公共区尺度适中，兼顾生活成本和居住舒适度。" },
  { id: 502, apartment_id: 5, legacy_room_id: 2, name: "二七通透三居", area: "78㎡", orient: "南北通透", layout: "3室1厅1卫", floor: "7层 / 总11层", price: 1500, image_class: "ri-1", image: roomImageMap["ri-1"], status: "active", desc: "三居室适合多人合租，南北通透，公共客厅可承载聚餐、学习和共享收纳需求。" },
  { id: 601, apartment_id: 6, legacy_room_id: 1, name: "中原温馨一居", area: "31㎡", orient: "南向", layout: "1室1卫", floor: "3层 / 总9层", price: 850, image_class: "ri-1", image: roomImageMap["ri-1"], status: "active", desc: "老城生活圈的一居室，周边配套成熟，适合重视生活便利和通勤稳定的住户。" },
  { id: 602, apartment_id: 6, legacy_room_id: 2, name: "中原合租两居", area: "54㎡", orient: "东南向", layout: "2室1厅1卫", floor: "6层 / 总9层", price: 1300, image_class: "ri-2", image: roomImageMap["ri-2"], status: "active", desc: "两居室适合朋友合租，卧室尺度接近，公共区域紧凑实用。东南向采光适合日常居家。" }
];

const activities = [
  { id: 1, title: "郑东公寓周末集市", activity_type: "official", category: "社区市集", date_label: "7月5日（周六）14:00", short_date: "7月5日", location: "郑东人才公寓·共享大厅", mode: "线下", fee: "免费", current_count: 18, max_participants: 30, cover_class: "cover-grad-1", image: "/assets/activities/act-1.jpg", organizer_name: "晓得青年", organizer_user_id: "u_current", intro: "面向郑东人才公寓住户的周末轻市集，设置二手交换、手作体验、咖啡试饮和新邻居破冰区。适合刚入住的青年快速认识邻居，也可以带上闲置小物来交换。", notes: ["报名后现场出示昵称即可签到", "可携带 3 件以内闲置物品参与交换", "如遇天气变化，活动转移至共享大厅"], status: "active" },
  { id: 2, title: "高新区桌游夜", activity_type: "user", category: "兴趣社交", date_label: "7月11日（周五）19:00", short_date: "7月11日", location: "高新人才家园·活动室", mode: "线下", fee: "AA 15 元", current_count: 8, max_participants: 12, cover_class: "cover-grad-2", image: "/assets/activities/act-2.jpg", organizer_name: "住户小林", organizer_user_id: "u_dapeng", intro: "下班后一起玩轻策略桌游，新手友好，主办人会提前讲规则。费用用于零食饮料，现场线下 AA，不通过小程序收款。", notes: ["适合新手，不需要自带桌游", "请提前 10 分钟到场", "费用由主办人线下收取"], status: "active" },
  { id: 3, title: "人才公寓篮球友谊赛", activity_type: "official", category: "运动", date_label: "7月19日（周六）16:00", short_date: "7月19日", location: "二七人才公寓·篮球场", mode: "线下", fee: "免费", current_count: 20, max_participants: 20, cover_class: "cover-grad-3", image: "/assets/activities/act-3.jpg", organizer_name: "晓得青年", organizer_user_id: "u_current", intro: "人才公寓住户之间的 3V3 友谊赛，现场按人数临时组队。活动已满员，可继续关注服务页后续场次。", notes: ["请穿运动鞋并自备水杯", "满员后不生成候补记录", "如遇场地维护将通过消息页通知"], status: "active" },
  { id: 4, title: "租房合同避坑分享", activity_type: "official", category: "政策攻略", date_label: "7月24日（周五）20:00", short_date: "7月24日", location: "线上腾讯会议", mode: "线上", fee: "免费", current_count: 26, max_participants: 80, cover_class: "cover-grad-4", image: "/assets/activities/act-4.jpg", organizer_name: "晓得青年", organizer_user_id: "u_current", intro: "围绕押金、维修、退租、人才公寓申请材料等高频问题做集中分享。报名后会在活动前通过消息页提醒会议入口。", notes: ["报名成功后保留消息提醒", "会议链接将在活动前统一发送", "可提前准备合同问题"], status: "pending" }
];

const activityRegistrations = [
  { id: 1, activity_id: 1, user_id: "u_current", status: "registered", code: "HD-260705-001", created_label: "2026年7月1日" },
  { id: 2, activity_id: 2, user_id: "u_current", status: "registered", code: "HD-260711-003", created_label: "2026年7月1日" }
];

const services = [
  { id: 1, name: "代取快递", desc: "帮你代取公寓周边快递柜包裹", price: 5, unit: "元/次", category: "代办跑腿", cover_class: "service-cover-1", image: "/assets/services/svc-1.jpg", duration: "30-60分钟", scope: "支持公寓周边快递柜、驿站、小区门口临时寄存点。", detail: "适合工作日不方便取件的住户。提交取件码、包裹数量和送达位置后，客服会确认可服务时间。当前微信支付未配置，提交后由客服线下确认。", steps: ["填写取件码和送达位置", "客服确认服务时间", "服务人员取件并送达", "用户确认完成"], status: "active" },
  { id: 2, name: "代办入住手续", desc: "协助办理人才公寓入住登记全流程", price: 50, unit: "元/次", category: "入住代办", cover_class: "service-cover-2", image: "/assets/services/svc-2.jpg", duration: "1个工作日", scope: "材料核对、物业登记、入住动线说明和现场陪同。", detail: "适合第一次办理人才公寓入住、对流程不熟悉的用户。请提前准备身份证、合同或审批凭证。当前微信支付未配置，提交需求后客服线下联系确认。", steps: ["提交联系人和公寓信息", "客服核对材料清单", "预约办理时间", "现场协助完成入住"], status: "active" },
  { id: 3, name: "代排队取号", desc: "住建局窗口排队取号，省去你的等待时间", price: 30, unit: "元/次", category: "窗口代办", cover_class: "service-cover-3", image: "/assets/services/svc-3.jpg", duration: "半天内", scope: "适用于住建局窗口咨询、材料递交前取号和排队提醒。", detail: "提交需求后客服会确认窗口事项和材料要求，仅提供排队取号协助，不代替用户签署或提交需本人确认的材料。", steps: ["提交窗口事项", "客服确认可代办范围", "服务人员现场排队", "通知用户到场办理"], status: "active" },
  { id: 4, name: "搬家小件协助", desc: "协助搬运行李箱、纸箱和小件家具", price: 39, unit: "元/小时", category: "搬家协助", cover_class: "service-cover-4", image: "/assets/services/svc-4.jpg", duration: "按预约", scope: "限同公寓或 3 公里内小件搬运，不含大型家电。", detail: "适合刚入住或换房间的小件搬运。提交楼栋、时间和物品数量后，客服会评估是否需要加人或调整时间。", steps: ["填写搬运起终点", "客服确认人手和时间", "服务人员到场协助", "用户确认完成"], status: "active" }
];

const serviceOrders = [
  { id: 1, service_id: 1, user_id: "u_current", order_no: "DD-260630-018", address: "郑东人才公寓 5号楼一层", appointment_label: "今天 18:00 前", assignee: "管家小周", remark: "中通 3 件，送到临时寄存柜。", status: "processing", created_label: "2026年6月30日" },
  { id: 2, service_id: 2, user_id: "u_current", order_no: "DD-260629-006", address: "郑东人才公寓 3-1202", appointment_label: "昨天 16:20", assignee: "物业维修王师傅", remark: "入住材料核对与水龙头维修预约。", status: "completed", created_label: "2026年6月29日" },
  { id: 3, service_id: 4, user_id: "u_dapeng", order_no: "SV20260701002", address: "高新人才家园 2-803", appointment_label: "明天 10:00", assignee: "待分配", remark: "需要帮忙搬 4 个纸箱和一张书桌。", status: "processing", created_label: "2026年7月1日" }
];

const roommatePosts = [
  { id: 1, user_id: "u_lili", type: "has_room", badge: "有房找室友", confirmed: true, avatar: "李", avatarClass: "male", name: "小李", meta: "25岁 · 男", apartment: "郑东人才公寓", rooms: "1居室", district: "郑东新区", budget: "1200", moveIn: "7月中旬", desc: "主卧朝南有阳台，希望找作息稳定、爱干净的室友。", contact: "微信 xiaoli-room", status: "active" },
  { id: 2, user_id: "u_wang", type: "need_room", badge: "无房找合租", confirmed: false, avatar: "王", avatarClass: "female", name: "小王", meta: "23岁 · 女", apartment: "期望二七区/中原区", rooms: "合租两居优先", district: "二七区/中原区", budget: "800-1000", moveIn: "7月上旬", desc: "应届毕业生，安静爱干净，希望通勤地铁方便。", contact: "微信 xiaowang-0720", status: "active" },
  { id: 3, user_id: "u_current", type: "has_room", badge: "有房找室友", confirmed: true, avatar: "晓", avatarClass: "male", name: "晓得青年", meta: "26岁 · 男", apartment: "郑东人才公寓", rooms: "主卧找室友", district: "郑东新区", budget: "1200-1500", moveIn: "7月中旬", desc: "希望找作息稳定、爱干净的室友，公共区域一起维护。", contact: "微信 xiaode-room", status: "active" },
  { id: 4, user_id: "u_zhao", type: "need_room", badge: "无房找合租", confirmed: false, avatar: "赵", avatarClass: "female", name: "小赵", meta: "24岁 · 女", apartment: "经开区附近", rooms: "整租或合租均可", district: "经开区", budget: "1000-1500", moveIn: "8月", desc: "在经开区上班，想找附近合租，可以一起看房。", contact: "微信 zhao-rent", status: "active" },
  { id: 5, user_id: "u_dapeng", type: "has_room", badge: "有房找室友", confirmed: true, avatar: "大", avatarClass: "male", name: "老张", meta: "28岁 · 男", apartment: "高新人才家园", rooms: "2居室次卧", district: "高新区", budget: "1000", moveIn: "7月底", desc: "高新人才家园次卧转租，等待审核后展示。", contact: "微信 gaoxin-room", status: "pending" }
];

const borrowItems = [
  { id: 1, name: "锤子", category: "tool", category_label: "工具", thumb_class: "thumb-tool", desc: "家用手锤，木柄铁头，适合钉钉子、组装家具", rules: "借用2天内归还 · 需自取", location: "郑东人才公寓·3号楼", pickup_location: "3号楼1楼大厅", owner_user_id: "u_lili", status: "available", detail: "锤头稳固，适合安装置物架、组装桌椅等轻量场景。请勿用于敲击承重墙或危险施工。", return_tip: "建议当天或次日归还，归还前擦拭干净。" },
  { id: 2, name: "螺丝刀套装", category: "tool", category_label: "工具", thumb_class: "thumb-tool", desc: "多功能螺丝刀，一字+十字+六角，带磁吸头", rules: "借用3天内归还", location: "高新人才家园·1号楼", pickup_location: "1号楼前台", owner_user_id: "u_dapeng", status: "available", detail: "包含常用批头，适合安装简易家具、换电池盖、维修小家电外壳。", return_tip: "归还时请确认批头数量完整。" },
  { id: 3, name: "露营帐篷", category: "outdoor", category_label: "户外", thumb_class: "thumb-outdoor", desc: "双人帐篷，防风防雨，适合周边郊游", rules: "周五借下周一还 · 押金¥100", location: "郑东人才公寓·5号楼", pickup_location: "5号楼前台", owner_user_id: "u_wang", status: "borrowed", expected_return: "预计7月8日归还", detail: "双人轻量帐篷，带地钉和收纳袋。当前借出中，可提交预约借用意向。", return_tip: "归还前需晾干并清理泥沙。" },
  { id: 4, name: "电钻", category: "tool", category_label: "工具", thumb_class: "thumb-tool", desc: "冲击电钻，带6/8/10mm钻头，适合墙面打孔", rules: "借用1天内归还 · 需自取", location: "经开青年公寓·2号楼", pickup_location: "2号楼物业前台", owner_user_id: "u_lili", status: "available", detail: "适合安装挂钩、置物架等简单墙面作业。请确认物业允许施工后再使用。", return_tip: "归还时请检查电池、钻头和收纳盒。" },
  { id: 5, name: "电磁炉", category: "appliance", category_label: "小家电", thumb_class: "thumb-appliance", desc: "美的电磁炉，9档火力，适合火锅/炒菜", rules: "借用1天内归还 · 需自取", location: "二七人才公寓·4号楼", pickup_location: "4号楼公共厨房", owner_user_id: "u_zhao", status: "borrowed", expected_return: "预计7月6日归还", detail: "适合临时聚餐或厨房设备维修期间过渡使用，需自备锅具。", return_tip: "归还前请清洁面板油渍。" },
  { id: 6, name: "折叠椅", category: "outdoor", category_label: "户外", thumb_class: "thumb-outdoor", desc: "铝合金折叠椅2把，轻便好拿", rules: "借用3天内归还", location: "中原青年社区·1号楼", pickup_location: "1号楼门厅", owner_user_id: "u_current", status: "available", detail: "适合露营、临时会客和社区活动使用。两把为一组出借。", return_tip: "收纳时请折叠到位，避免夹手。" }
];

const borrowRequests = [
  { id: 1, item_id: 4, borrower_user_id: "u_current", owner_user_id: "u_lili", start_label: "今天 18:00", end_label: "明天 20:00", pickup_label: "3号楼502", message: "安装挂钩用一下", status: "approved", created_label: "2026年7月1日" },
  { id: 2, item_id: 3, borrower_user_id: "u_current", owner_user_id: "u_wang", start_label: "7月5日 10:00", end_label: "7月8日 20:00", pickup_label: "5号楼前台", message: "周末露营", status: "borrowed", created_label: "2026年7月1日" },
  { id: 3, item_id: 6, borrower_user_id: "u_xiaoling", owner_user_id: "u_current", start_label: "明天 10:00", end_label: "明天 11:30", pickup_label: "1号楼门厅", message: "社区活动临时加座", status: "pending", created_label: "2026年7月1日" }
];

const comments = [
  { id: 1, user_id: "u_xiaoling", target_type: "apartment", target_id: 1, rating: 4.8, tags: ["交通方便", "管家响应快"], body: "住了快一年了，物业态度超好，楼下快递柜很方便。离地铁走路5分钟，通勤非常友好。", created_label: "2026年6月", like_count: 12, status: "active" },
  { id: 2, user_id: "u_dapeng", target_type: "apartment", target_id: 1, rating: 4.6, tags: ["健身房", "隔音不错"], body: "健身房是加分项！就是周末有时候人多要排队。隔音还不错，比之前租的老小区好多了。", created_label: "2026年5月", like_count: 8, status: "active" },
  { id: 3, user_id: "u_ajie", target_type: "apartment", target_id: 1, rating: 4.7, tags: ["房间宽敞", "服务好"], body: "刚搬进来，房间比想象中大！物业帮我搬行李上楼，感动。唯一小建议：洗衣机是公用的，希望以后能装独立。", created_label: "2026年4月", like_count: 5, status: "active" },
  { id: 4, user_id: "u_current", target_type: "apartment", target_id: 1, rating: 4.9, tags: ["交通方便", "管家响应快"], body: "住了快一年了，物业态度超好，楼下快递柜很方便。离地铁走路5分钟，通勤非常友好。", created_label: "2026年6月", like_count: 12, status: "active" },
  { id: 5, user_id: "u_current", target_type: "room_type", target_id: 101, rating: 4.8, tags: ["采光好", "适合独居"], body: "这个户型最大的优点是采光！朝南带阳台，冬天晒太阳超舒服。一个人住刚刚好。", created_label: "2026年5月", like_count: 8, status: "active" },
  { id: 6, user_id: "u_current", target_type: "apartment", target_id: 5, rating: 4.6, tags: ["交通便利", "性价比高"], body: "交通便利，楼下就是公交站。性价比很高，推荐给刚毕业的年轻人。", created_label: "2026年4月", like_count: 5, status: "active" },
  { id: 7, user_id: "u_current", target_type: "room_type", target_id: 102, rating: 4.5, tags: ["合租友好", "物业响应快"], body: "两居室空间很大，跟室友合租很划算。物业响应快，报修基本当天就处理。", created_label: "2026年3月", like_count: 3, status: "pending" },
  { id: 8, user_id: "u_dapeng", target_type: "room_type", target_id: 101, rating: 4.5, tags: ["户型紧凑", "性价比高"], body: "精装修交付的质量不错，没什么味道。厨房虽然不大但够用，推荐给刚到郑州的年轻人。", created_label: "2026年5月", like_count: 8, status: "active" },
  { id: 9, user_id: "u_ajie", target_type: "room_type", target_id: 101, rating: 4.4, tags: ["通风好"], body: "卫生间有窗户通风，这点比很多老房子强。唯一的建议是窗帘如果能配遮光帘就更好了。", created_label: "2026年4月", like_count: 5, status: "active" },
  { id: 10, user_id: "u_wang", target_type: "apartment", target_id: 2, rating: 3.2, tags: ["噪音反馈"], body: "临街房间晚上略吵，建议看房时注意楼栋位置。", created_label: "2026年6月", like_count: 1, status: "hidden" }
];

const commentLikes = [
  { id: 1, comment_id: 1, user_id: "u_current" },
  { id: 2, comment_id: 5, user_id: "u_xiaoling" },
  { id: 3, comment_id: 8, user_id: "u_current" }
];

const favorites = [
  { id: 1, user_id: "u_current", target_type: "apartment", target_id: 1, created_label: "2026年7月1日" },
  { id: 2, user_id: "u_current", target_type: "apartment", target_id: 2, created_label: "2026年7月1日" },
  { id: 3, user_id: "u_current", target_type: "apartment", target_id: 5, created_label: "2026年7月1日" },
  { id: 4, user_id: "u_current", target_type: "room_type", target_id: 101, created_label: "2026年7月1日" },
  { id: 5, user_id: "u_current", target_type: "room_type", target_id: 102, created_label: "2026年7月1日" },
  { id: 6, user_id: "u_current", target_type: "room_type", target_id: 501, created_label: "2026年7月1日" }
];

const messages = [
  { id: 1, user_id: "u_current", message_type: "activity", title: "活动提醒", preview: "你报名的「郑东公寓周末集市」将于明天14:00开始", detail: "你报名的「郑东公寓周末集市」将于明天14:00在郑东人才公寓中心花园开始。建议提前10分钟到场，现场可领取摊位指引和活动贴纸。", time_label: "10分钟前", unread: true, status_text: "待开始", entity_type: "activity", entity_id: 1 },
  { id: 2, user_id: "u_current", message_type: "borrow", title: "借用申请已确认", preview: "小李已确认你借用「电钻」的申请，取件位置：3号楼502", detail: "小李已确认你借用「电钻」的申请。取件位置：3号楼502；建议今日19:00-21:00之间取件，归还前请确认电池和钻头配件齐全。", time_label: "1小时前", unread: true, status_text: "待取件", entity_type: "borrow_request", entity_id: 1 },
  { id: 3, user_id: "u_current", message_type: "service", title: "订单已提交", preview: "你已提交「代办入住手续」需求，客服将在1个工作日内联系你", detail: "你已提交「代办入住手续」需求。由于微信支付商户号未配置，当前订单不发起线上支付，客服会在1个工作日内联系你确认材料清单和线下费用。", time_label: "2小时前", unread: false, status_text: "处理中", entity_type: "service_order", entity_id: 2 },
  { id: 4, user_id: "u_current", message_type: "activity", title: "活动取消通知", preview: "原定于7月20日的「人才公寓篮球友谊赛」因场地原因取消", detail: "原定于7月20日的「人才公寓篮球友谊赛」因场地维护取消。报名名额会自动释放，后续重启时间将在活动页同步。", time_label: "昨天", unread: true, status_text: "已取消", entity_type: "activity", entity_id: 3 },
  { id: 5, user_id: "u_current", message_type: "borrow", title: "借用即将到期", preview: "你借用的「露营帐篷」还剩1天到期，请及时归还", detail: "你借用的「露营帐篷」还剩1天到期，请在明日20:00前归还至2号楼前台。若需要延长借用时间，请先联系物主确认。", time_label: "昨天", unread: false, status_text: "待归还", entity_type: "borrow_request", entity_id: 2 },
  { id: 6, user_id: "u_current", message_type: "service", title: "服务完成", preview: "你的「代取快递」订单已完成，请确认收货", detail: "你的「代取快递」订单已完成，快递已放置在5号楼一层临时寄存柜。请确认收货，如有遗漏可联系服务人员补充处理。", time_label: "7月1日", unread: false, status_text: "待确认", entity_type: "service_order", entity_id: 1 },
  { id: 7, user_id: "u_current", message_type: "comment", title: "评价收到回复", preview: "郑东人才公寓管家回复了你的户型评价", detail: "郑东人才公寓管家回复了你对「精致一居室」的评价：感谢反馈，厨房收纳架本周会补充安装，欢迎入住后继续提出建议。", time_label: "7月1日", unread: false, status_text: "已回复", entity_type: "comment", entity_id: 5 },
  { id: 8, user_id: "u_current", message_type: "system", title: "系统通知", preview: "欢迎加入晓得青年！开始探索你的理想公寓吧", detail: "欢迎加入晓得青年。你可以在首页查看人才公寓，在服务页报名活动和提交代办需求，也可以通过借个锤子共享闲置工具。", time_label: "7月1日", unread: false, status_text: "已送达", entity_type: "system", entity_id: 0 }
];

module.exports = {
  users,
  apartments,
  roomTypes,
  activities,
  activityRegistrations,
  roommatePosts,
  borrowItems,
  borrowRequests,
  comments,
  commentLikes,
  favorites,
  messages,
  services,
  serviceOrders
};
