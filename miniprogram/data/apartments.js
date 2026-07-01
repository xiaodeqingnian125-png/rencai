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

const comments = [
  {
    avatar: "小",
    avatarClass: "ca-1",
    name: "小玲",
    time: "2026年6月",
    body: "住了快一年了，物业态度超好，楼下快递柜很方便。离地铁走路5分钟，通勤非常友好。",
    likes: 12
  },
  {
    avatar: "大",
    avatarClass: "ca-2",
    name: "大鹏",
    time: "2026年5月",
    body: "健身房是加分项！就是周末有时候人多要排队。隔音还不错，比之前租的老小区好多了。",
    likes: 8
  },
  {
    avatar: "阿",
    avatarClass: "ca-3",
    name: "阿杰",
    time: "2026年4月",
    body: "刚搬进来，房间比想象中大！物业帮我搬行李上楼，感动。唯一小建议：洗衣机是公用的，希望以后能装独立。",
    likes: 5
  }
];

const roomComments = [
  {
    avatar: "小",
    avatarClass: "ca-1",
    name: "小玲",
    time: "2026年6月",
    body: "这个户型最大的优点是采光！朝南带阳台，冬天晒太阳超舒服。一个人住刚刚好，不会太空旷。",
    likes: 12
  },
  {
    avatar: "大",
    avatarClass: "ca-2",
    name: "大鹏",
    time: "2026年5月",
    body: "精装修交付的质量不错，没什么味道。厨房虽然不大但够用，推荐给刚到郑州的年轻人。",
    likes: 8
  },
  {
    avatar: "阿",
    avatarClass: "ca-3",
    name: "阿杰",
    time: "2026年4月",
    body: "卫生间有窗户通风，这点比很多老房子强。唯一的建议是窗帘如果能配遮光帘就更好了。",
    likes: 5
  }
];

const apartments = [
  {
    id: 1,
    name: "郑东人才公寓",
    district: "郑东新区",
    priceText: "¥1200-1800",
    location: "金水东路与东风南路交叉口",
    latitude: 34.7597,
    longitude: 113.7484,
    locationMeta: "地铁1/5号线 · 距郑州东站约1.5km",
    heroClass: "hero-zd",
    favorite: false,
    rooms: [
      { id: 1, name: "精致一居室", area: "35㎡", orient: "南向", layout: "1室1卫", floor: "3层 / 总8层", price: "¥1200", imageClass: "ri-1", desc: "独立一居室户型，玄关入户，动静分区明确。客厅连接景观阳台，通风采光俱佳。卧室带飘窗，可俯瞰社区花园。精装修交付，拎包即可入住。" },
      { id: 2, name: "舒适两居室", area: "55㎡", orient: "东南向", layout: "2室1厅1卫", floor: "5层 / 总8层", price: "¥1500", imageClass: "ri-2", desc: "两居室适合合租或小家庭入住，客餐厅连通，主卧采光稳定，次卧可作为书房或室友房。厨房独立，日常做饭和收纳都更从容。" },
      { id: 3, name: "阳光大单间", area: "28㎡", orient: "南向", layout: "开间", floor: "2层 / 总8层", price: "¥1000", imageClass: "ri-3", desc: "开间户型紧凑高效，睡眠区、书桌区和简餐区集中布置。适合预算敏感、通勤优先的年轻住户，南向窗保证基础采光。" }
    ]
  },
  {
    id: 2,
    name: "高新人才家园",
    district: "高新区",
    priceText: "¥800-1200",
    location: "科学大道与长椿路交叉口",
    latitude: 34.8126,
    longitude: 113.5419,
    locationMeta: "高新区通勤圈 · 靠近地铁8号线规划站点",
    heroClass: "hero-gx",
    favorite: true,
    rooms: [
      { id: 1, name: "高新阳光单间", area: "29㎡", orient: "南向", layout: "开间", floor: "4层 / 总10层", price: "¥800", imageClass: "ri-3", desc: "面向高新区通勤人群的经济单间，空间紧凑但采光直接。床、书桌、衣柜沿墙排布，适合刚入职或短通勤独居。" },
      { id: 2, name: "高新舒适一居", area: "36㎡", orient: "东南向", layout: "1室1卫", floor: "6层 / 总10层", price: "¥1000", imageClass: "ri-1", desc: "独立一居室，卧室和生活区分区更清楚。东南向采光温和，适合需要长期稳定居住和居家办公的年轻住户。" },
      { id: 3, name: "青年独立一居", area: "42㎡", orient: "南向", layout: "1室1厅1卫", floor: "8层 / 总10层", price: "¥1200", imageClass: "ri-2", desc: "带独立客厅的一居室，适合希望保留会客、运动或学习空间的住户。南向主采光面，家具布置余量更大。" }
    ]
  },
  {
    id: 3,
    name: "经开青年公寓",
    district: "经开区",
    priceText: "¥900-1400",
    location: "航海东路与经开第八大街",
    latitude: 34.7219,
    longitude: 113.7426,
    locationMeta: "经开产业园区 · 近公交主干线",
    heroClass: "hero-jk",
    favorite: false,
    rooms: [
      { id: 1, name: "经开标准一居", area: "32㎡", orient: "南向", layout: "1室1卫", floor: "3层 / 总9层", price: "¥900", imageClass: "ri-1", desc: "标准一居室，动线直接，适合经开区产业园通勤。独立卫浴和基础厨房设备齐全，入住门槛低。" },
      { id: 2, name: "经开舒适两居", area: "58㎡", orient: "东南向", layout: "2室1厅1卫", floor: "6层 / 总9层", price: "¥1400", imageClass: "ri-2", desc: "两居室面向合租场景，客厅和双卧分隔明确。东南向公共区采光更好，适合两位同事或朋友合租。" }
    ]
  },
  {
    id: 4,
    name: "港区人才社区",
    district: "航空港区",
    priceText: "¥700-1000",
    location: "华夏大道与迎宾路交叉口",
    latitude: 34.5344,
    longitude: 113.8424,
    locationMeta: "航空港就业圈 · 生活配套完善",
    heroClass: "hero-gq",
    favorite: false,
    rooms: [
      { id: 1, name: "港区经济单间", area: "26㎡", orient: "南向", layout: "开间", floor: "2层 / 总8层", price: "¥700", imageClass: "ri-3", desc: "预算友好的紧凑单间，生活设施集中布置，适合航空港就业圈短通勤独居。" },
      { id: 2, name: "港区独立一居", area: "34㎡", orient: "东向", layout: "1室1卫", floor: "5层 / 总8层", price: "¥1000", imageClass: "ri-1", desc: "独立一居室，早间采光舒适，卧室与洗浴区互不干扰，适合稳定工作节奏的住户。" }
    ]
  },
  {
    id: 5,
    name: "二七人才公寓",
    district: "二七区",
    priceText: "¥1000-1500",
    location: "大学路与航海路交叉口",
    latitude: 34.7221,
    longitude: 113.6398,
    locationMeta: "二七商圈 · 临近学校与社区商业",
    heroClass: "hero-eq",
    favorite: false,
    rooms: [
      { id: 1, name: "二七舒适两居", area: "56㎡", orient: "南向", layout: "2室1厅1卫", floor: "4层 / 总11层", price: "¥1000", imageClass: "ri-2", desc: "两居室总价友好，适合合租。南向卧室采光稳定，公共区尺度适中，兼顾生活成本和居住舒适度。" },
      { id: 2, name: "二七通透三居", area: "78㎡", orient: "南北通透", layout: "3室1厅1卫", floor: "7层 / 总11层", price: "¥1500", imageClass: "ri-1", desc: "三居室适合多人合租，南北通透，公共客厅可承载聚餐、学习和共享收纳需求。" }
    ]
  },
  {
    id: 6,
    name: "中原青年社区",
    district: "中原区",
    priceText: "¥850-1300",
    location: "建设路与秦岭路交叉口",
    latitude: 34.7537,
    longitude: 113.6066,
    locationMeta: "中原老城生活圈 · 交通成熟",
    heroClass: "hero-zy",
    favorite: false,
    rooms: [
      { id: 1, name: "中原温馨一居", area: "31㎡", orient: "南向", layout: "1室1卫", floor: "3层 / 总9层", price: "¥850", imageClass: "ri-1", desc: "老城生活圈的一居室，周边配套成熟，适合重视生活便利和通勤稳定的住户。" },
      { id: 2, name: "中原合租两居", area: "54㎡", orient: "东南向", layout: "2室1厅1卫", floor: "6层 / 总9层", price: "¥1300", imageClass: "ri-2", desc: "两居室适合朋友合租，卧室尺度接近，公共区域紧凑实用。东南向采光适合日常居家。" }
    ]
  }
].map((apartment) => ({
  ...apartment,
  costs: sharedCosts,
  privateFacilities,
  publicFacilities,
  nearby: ["超市/便利店", "快餐小吃", "药店", "社区医院", "快递柜"],
  comments: comments.map((comment) => ({ ...comment }))
}));

function getApartmentById(id) {
  const numericId = Number(id) || 1;
  return apartments.find((apartment) => apartment.id === numericId) || apartments[0];
}

function getRoomById(aptId, roomId) {
  const apartment = getApartmentById(aptId);
  const numericRoomId = Number(roomId) || 1;
  const room = apartment.rooms.find((item) => item.id === numericRoomId) || apartment.rooms[0];
  return {
    apartment,
    room: {
      ...room,
      costs: sharedCosts,
      facilities: privateFacilities,
      comments: roomComments.map((comment) => ({ ...comment }))
    }
  };
}

module.exports = {
  apartments,
  getApartmentById,
  getRoomById
};
