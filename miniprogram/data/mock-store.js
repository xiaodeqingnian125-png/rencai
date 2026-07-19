const seedTables = require("./tables");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const state = clone(seedTables);

const heroClasses = ["hero-zd", "hero-gx", "hero-jk", "hero-gq", "hero-eq", "hero-zy"];
const apartmentImageClasses = ["apt-img-1", "apt-img-2", "apt-img-3", "apt-img-4", "apt-img-5", "apt-img-6"];
const apartmentImages = [
  "/assets/apartments/apt-1.jpg",
  "/assets/apartments/apt-2.jpg",
  "/assets/apartments/apt-3.jpg",
  "/assets/apartments/apt-4.jpg",
  "/assets/apartments/apt-5.jpg",
  "/assets/apartments/apt-6.jpg"
];
const roomImageClasses = ["ri-1", "ri-2", "ri-3"];
const roomImages = ["/assets/rooms/room-1.jpg", "/assets/rooms/room-2.jpg", "/assets/rooms/room-3.jpg"];

function getTables() {
  return state;
}

function nextId(rows) {
  return rows.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0) + 1;
}

function parseNumbers(text) {
  return String(text || "").match(/\d+/g) || [];
}

function parseRentRange(rentText, fallbackMin = 0, fallbackMax = fallbackMin) {
  const numbers = parseNumbers(rentText).map(Number);
  if (!numbers.length) {
    return { min: fallbackMin, max: fallbackMax || fallbackMin };
  }
  if (numbers.length === 1) {
    return { min: numbers[0], max: numbers[0] };
  }
  return { min: numbers[0], max: numbers[1] };
}

function parseRoomPrice(rentText, fallback = 0) {
  const numbers = parseNumbers(rentText).map(Number);
  return numbers.length ? numbers[0] : fallback;
}

function normalizeFloor(floorText) {
  return String(floorText || "待补充楼层").replace(/\s*\/\s*/g, " / ").trim();
}

function normalizeActiveHiddenStatus(status) {
  const value = String(status || "").trim();
  return ["hidden", "停用", "隐藏", "已隐藏", "下架", "已下架"].indexOf(value) >= 0 ? "hidden" : "active";
}

function getApartmentByName(name) {
  return state.apartments.find((apartment) => apartment.name === name) || null;
}

function getUserById(userId) {
  return state.users.find((user) => user.id === userId) || state.users[0];
}

function defaultApartmentAssets(indexSeed) {
  const index = Math.max(0, (Number(indexSeed) || 1) - 1);
  return {
    hero_class: heroClasses[index % heroClasses.length],
    image_class: apartmentImageClasses[index % apartmentImageClasses.length],
    image: apartmentImages[index % apartmentImages.length]
  };
}

function defaultRoomImage(indexSeed) {
  const index = Math.max(0, (Number(indexSeed) || 1) - 1);
  return roomImageClasses[index % roomImageClasses.length];
}

function defaultRoomImageAsset(indexSeed) {
  const index = Math.max(0, (Number(indexSeed) || 1) - 1);
  return roomImages[index % roomImages.length];
}

function defaultFacilityTemplate(existing) {
  const base = existing || state.apartments[0] || {};
  return {
    costs: clone(base.costs || []),
    private_facilities: clone(base.private_facilities || []),
    public_facilities: clone(base.public_facilities || []),
    nearby: clone(base.nearby || ["超市/便利店", "快餐小吃", "药店", "快递柜"])
  };
}

function normalizeApartmentAdminItem(item, existing) {
  const id = Number(item.id) || (existing ? existing.id : nextId(state.apartments));
  const rent = parseRentRange(item.rent, existing ? existing.price_min : 800, existing ? existing.price_max : 1200);
  const assets = defaultApartmentAssets(id);
  const facilities = defaultFacilityTemplate(existing);
  return {
    id,
    name: String(item.name || existing && existing.name || "未命名公寓").trim(),
    district: String(item.district || existing && existing.district || "郑州市").trim(),
    price_min: rent.min,
    price_max: rent.max,
    room_summary: String(item.rooms || existing && existing.room_summary || "1居").trim(),
    address: String(item.address || existing && existing.address || "待补充地址").trim(),
    latitude: Number(item.latitude || existing && existing.latitude) || 34.7466,
    longitude: Number(item.longitude || existing && existing.longitude) || 113.6254,
    location_meta: String(item.locationMeta || item.location_meta || existing && existing.location_meta || "管理员新增 · 静态模拟数据").trim(),
    hero_class: item.heroClass || item.hero_class || existing && existing.hero_class || assets.hero_class,
    image_class: item.imageClass || item.image_class || existing && existing.image_class || assets.image_class,
    image: item.image || existing && existing.image || assets.image,
    status: normalizeActiveHiddenStatus(item.status),
    tags: clone(item.tags || existing && existing.tags || [{ label: "新上", className: "tag-new" }]),
    costs: clone(item.costs || existing && existing.costs || facilities.costs),
    private_facilities: clone(item.privateFacilities || item.private_facilities || existing && existing.private_facilities || facilities.private_facilities),
    public_facilities: clone(item.publicFacilities || item.public_facilities || existing && existing.public_facilities || facilities.public_facilities),
    nearby: clone(item.nearby || existing && existing.nearby || facilities.nearby)
  };
}

function normalizeRoomAdminItem(item, existing) {
  const id = Number(item.id) || (existing ? existing.id : nextId(state.roomTypes));
  const apartment = getApartmentByName(item.apartment) ||
    state.apartments.find((row) => row.id === Number(item.apartment_id || item.aptId)) ||
    state.apartments[0];
  return {
    id,
    apartment_id: apartment ? apartment.id : 1,
    legacy_room_id: existing ? existing.legacy_room_id : id,
    name: String(item.name || existing && existing.name || "未命名户型").trim(),
    area: String(item.area || existing && existing.area || "30㎡").trim(),
    orient: String(item.orient || existing && existing.orient || "南向").trim(),
    layout: String(item.rooms || item.layout || existing && existing.layout || "1室1卫").trim(),
    floor: normalizeFloor(item.floor || existing && existing.floor),
    price: parseRoomPrice(item.rent || item.price, existing ? existing.price : 1000),
    image_class: item.imageClass || item.image_class || existing && existing.image_class || defaultRoomImage(id),
    image: item.image || existing && existing.image || defaultRoomImageAsset(id),
    desc: String(item.desc || existing && existing.desc || "管理员新增户型，详情待完善。").trim(),
    status: normalizeActiveHiddenStatus(item.status)
  };
}

function replaceById(rows, record) {
  const index = rows.findIndex((item) => Number(item.id) === Number(record.id));
  if (index >= 0) {
    rows.splice(index, 1, record);
    return "updated";
  }
  rows.unshift(record);
  return "created";
}

function saveAdminItem(type, item) {
  if (type === "apartments") {
    const existing = state.apartments.find((apartment) => Number(apartment.id) === Number(item.id));
    return replaceById(state.apartments, normalizeApartmentAdminItem(item, existing));
  }
  if (type === "rooms") {
    const existing = state.roomTypes.find((room) => Number(room.id) === Number(item.id));
    return replaceById(state.roomTypes, normalizeRoomAdminItem(item, existing));
  }
  if (type === "activities") {
    const existing = state.activities.find((row) => Number(row.id) === Number(item.id));
    return replaceById(state.activities, normalizeActivityAdminItem(item, existing));
  }
  if (type === "services") {
    const existing = state.serviceOrders.find((row) => Number(row.id) === Number(item.id));
    return replaceById(state.serviceOrders, normalizeServiceAdminItem(item, existing));
  }
  if (type === "items") {
    const existing = state.borrowItems.find((row) => Number(row.id) === Number(item.id));
    return replaceById(state.borrowItems, normalizeBorrowItemAdminItem(item, existing));
  }
  if (type === "comments") {
    const existing = state.comments.find((row) => Number(row.id) === Number(item.id));
    return replaceById(state.comments, normalizeCommentAdminItem(item, existing));
  }
  if (type === "users") {
    const existing = state.users.find((row) => row.id === item.id || row.id === String(item.id));
    return replaceById(state.users, normalizeUserAdminItem(item, existing));
  }
  return "ignored";
}

function deleteAdminItem(type, id) {
  const numericId = Number(id);
  if (type === "apartments") {
    const before = state.apartments.length;
    const roomIds = state.roomTypes
      .filter((room) => room.apartment_id === numericId)
      .map((room) => room.id);
    state.apartments.splice(0, state.apartments.length, ...state.apartments.filter((item) => item.id !== numericId));
    state.roomTypes.splice(0, state.roomTypes.length, ...state.roomTypes.filter((item) => item.apartment_id !== numericId));
    state.favorites.splice(0, state.favorites.length, ...state.favorites.filter((item) => !(
      item.target_type === "apartment" && item.target_id === numericId
    ) && !(
      item.target_type === "room_type" && roomIds.indexOf(item.target_id) >= 0
    )));
    return before !== state.apartments.length;
  }
  if (type === "rooms") {
    const before = state.roomTypes.length;
    state.roomTypes.splice(0, state.roomTypes.length, ...state.roomTypes.filter((item) => item.id !== numericId));
    state.favorites.splice(0, state.favorites.length, ...state.favorites.filter((item) => !(
      item.target_type === "room_type" && item.target_id === numericId
    )));
    return before !== state.roomTypes.length;
  }
  if (type === "activities") {
    const before = state.activities.length;
    state.activities.splice(0, state.activities.length, ...state.activities.filter((item) => item.id !== numericId));
    state.activityRegistrations.splice(0, state.activityRegistrations.length, ...state.activityRegistrations.filter((item) => item.activity_id !== numericId));
    return before !== state.activities.length;
  }
  if (type === "services") {
    const before = state.serviceOrders.length;
    state.serviceOrders.splice(0, state.serviceOrders.length, ...state.serviceOrders.filter((item) => item.id !== numericId));
    return before !== state.serviceOrders.length;
  }
  if (type === "items") {
    const before = state.borrowItems.length;
    state.borrowItems.splice(0, state.borrowItems.length, ...state.borrowItems.filter((item) => item.id !== numericId));
    state.borrowRequests.splice(0, state.borrowRequests.length, ...state.borrowRequests.filter((item) => item.item_id !== numericId));
    return before !== state.borrowItems.length;
  }
  if (type === "comments") {
    const before = state.comments.length;
    state.comments.splice(0, state.comments.length, ...state.comments.filter((item) => item.id !== numericId));
    state.commentLikes.splice(0, state.commentLikes.length, ...state.commentLikes.filter((item) => item.comment_id !== numericId));
    return before !== state.comments.length;
  }
  if (type === "users") {
    const before = state.users.length;
    state.users.splice(0, state.users.length, ...state.users.filter((item) => item.id !== id && item.id !== String(id)));
    return before !== state.users.length;
  }
  return false;
}

function updateAdminItemStatus(type, id, status) {
  if (type === "apartments") {
    const apartment = state.apartments.find((item) => Number(item.id) === Number(id));
    if (!apartment) return false;
    apartment.status = status === "hidden" ? "hidden" : "active";
    return true;
  }
  if (type === "rooms") {
    const room = state.roomTypes.find((item) => Number(item.id) === Number(id));
    if (!room) return false;
    room.status = status === "hidden" ? "hidden" : "active";
    return true;
  }
  if (type === "activities") {
    const activity = state.activities.find((item) => Number(item.id) === Number(id));
    if (!activity) return false;
    activity.status = status;
    return true;
  }
  if (type === "services") {
    const order = state.serviceOrders.find((item) => Number(item.id) === Number(id));
    if (!order) return false;
    order.status = serviceAdminStatusToInternal(status);
    return true;
  }
  if (type === "items") {
    const item = state.borrowItems.find((item) => Number(item.id) === Number(id));
    if (!item) return false;
    item.status = borrowItemAdminStatusToInternal(status);
    return true;
  }
  if (type === "comments") {
    const comment = state.comments.find((item) => Number(item.id) === Number(id));
    if (!comment) return false;
    comment.status = status;
    return true;
  }
  if (type === "users") {
    const user = state.users.find((item) => item.id === id || item.id === String(id));
    if (!user) return false;
    user.status = status === "active" ? "active" : status === "disabled" ? "disabled" : "pending";
    return true;
  }
  return false;
}

// ========== 管理员 CRUD 反向映射：活动/服务/物品/评论/用户 ==========

function serviceAdminStatusToInternal(status) {
  if (status === "active") return "completed";
  if (status === "hidden") return "closed";
  return "processing";
}

function borrowItemAdminStatusToInternal(status) {
  if (status === "active") return "available";
  if (status === "processing") return "borrowed";
  if (status === "hidden") return "hidden";
  return "pending";
}

function normalizeActivityAdminItem(item, existing) {
  const quotaText = String(item.quota || "");
  const maxParticipants = Number((quotaText.match(/\d+/) || [20])[0]) || 20;
  return {
    id: Number(item.id),
    title: String(item.name || "").trim(),
    category: String(item.category || (existing && existing.category) || "兴趣社交").trim(),
    date_label: String(item.time || (existing && existing.date_label) || "待定").trim(),
    short_date: String(item.time || (existing && existing.short_date) || "待定").trim(),
    location: String(item.place || (existing && existing.location) || "待定").trim(),
    max_participants: maxParticipants,
    current_count: existing ? existing.current_count : 0,
    organizer_name: String(item.owner || (existing && existing.organizer_name) || "管理员").trim(),
    intro: String(item.desc || (existing && existing.intro) || "活动详情待完善").trim(),
    notes: existing ? existing.notes : ["报名后现场出示昵称即可签到"],
    status: String(item.status || "pending").trim(),
    activity_type: existing ? existing.activity_type : "official",
    cover_class: existing ? existing.cover_class : "cover-grad-4",
    image: item.image || (existing && existing.image) || "",
    fee: existing ? existing.fee : "免费",
    mode: existing ? existing.mode : "线下"
  };
}

function normalizeServiceAdminItem(item, existing) {
  const serviceName = String(item.name || "").trim();
  let service = state.services.find((row) => row.name === serviceName);
  if (!service && existing) {
    service = state.services.find((row) => row.id === existing.service_id);
  }
  const serviceId = service ? service.id : (existing ? existing.service_id : 1);
  const userName = String(item.user || "").trim();
  let user = state.users.find((row) => row.nickname === userName);
  if (!user && existing) {
    user = state.users.find((row) => row.id === existing.user_id);
  }
  const userId = user ? user.id : (existing ? existing.user_id : "u_current");
  return {
    id: Number(item.id),
    service_id: serviceId,
    user_id: userId,
    order_no: String(item.orderNo || (existing && existing.order_no) || "").trim(),
    address: String(item.address || (existing && existing.address) || "").trim(),
    appointment_label: String(item.time || (existing && existing.appointment_label) || "待确认").trim(),
    assignee: String(item.assignee || (existing && existing.assignee) || "待分配").trim(),
    remark: String(item.desc || (existing && existing.remark) || "").trim(),
    image: item.image || (existing && existing.image) || "",
    status: serviceAdminStatusToInternal(item.status || "processing")
  };
}

function normalizeBorrowItemAdminItem(item, existing) {
  const categoryLabel = String(item.category || (existing && existing.category_label) || "工具").trim();
  const categoryKeyMap = { "工具": "tool", "户外": "outdoor", "小家电": "appliance", "其他": "other" };
  const categoryKey = categoryKeyMap[categoryLabel] || (existing && existing.category) || "tool";
  const ownerName = String(item.owner || "").trim();
  let owner = state.users.find((row) => row.nickname === ownerName);
  if (!owner && existing) {
    owner = state.users.find((row) => row.id === existing.owner_user_id);
  }
  const ownerId = owner ? owner.id : (existing ? existing.owner_user_id : "u_current");
  return {
    id: Number(item.id),
    name: String(item.name || "").trim(),
    category: categoryKey,
    category_label: categoryLabel,
    thumb_class: existing ? existing.thumb_class : "thumb-tool",
    desc: String(item.desc || (existing && existing.desc) || "物品详情待完善").trim(),
    detail: String(item.desc || (existing && existing.detail) || "物品详情待完善").trim(),
    rules: String(item.rule || (existing && existing.rules) || "请按时归还").trim(),
    return_tip: existing ? existing.return_tip : "请按规则按时归还。",
    location: String(item.location || (existing && existing.location) || "").trim(),
    pickup_location: String(item.location || (existing && existing.pickup_location) || "").trim(),
    owner_user_id: ownerId,
    status: borrowItemAdminStatusToInternal(item.status || "pending")
  };
}

function normalizeCommentAdminItem(item, existing) {
  const userName = String(item.user || "").trim();
  let user = state.users.find((row) => row.nickname === userName);
  if (!user && existing) {
    user = state.users.find((row) => row.id === existing.user_id);
  }
  const userId = user ? user.id : (existing ? existing.user_id : "u_current");
  const tagsText = String(item.tags || "").trim();
  const tags = tagsText ? tagsText.split(/[,，、\s]+/).filter(Boolean) : (existing ? existing.tags : []);
  return {
    id: Number(item.id),
    user_id: userId,
    target_type: existing ? existing.target_type : "apartment",
    target_id: existing ? existing.target_id : 0,
    rating: Number(item.rating) || (existing ? existing.rating : 4.5),
    tags,
    body: String(item.content || (existing && existing.body) || "").trim(),
    created_label: existing ? existing.created_label : "刚刚",
    like_count: existing ? existing.like_count : 0,
    status: String(item.status || "pending").trim()
  };
}

function normalizeUserAdminItem(item, existing) {
  const roleLabel = String(item.role || (existing && existing.role_label) || "住户").trim();
  const roleKey = roleLabel === "管理员" ? "admin" : roleLabel === "管家" ? "staff" : "tenant";
  const apartmentName = String(item.apartment || "").trim();
  let apartment = state.apartments.find((row) => row.name === apartmentName);
  if (!apartment && existing) {
    apartment = state.apartments.find((row) => row.id === existing.apartment_id);
  }
  const apartmentId = apartment ? apartment.id : (existing ? existing.apartment_id : 0);
  const userId = existing ? existing.id : nextId(state.users);
  return {
    id: userId,
    openid: existing ? existing.openid : "",
    nickname: String(item.name || "").trim(),
    avatar_text: String(item.name || "用").charAt(0),
    avatar_class: existing ? existing.avatar_class : "ca-1",
    phone: String(item.phone || (existing && existing.phone) || "").trim(),
    role: roleKey,
    role_label: roleLabel,
    apartment_id: apartmentId,
    room_label: String(item.room || (existing && existing.room_label) || "未入住").trim(),
    status: item.status === "active" ? "active" : item.status === "disabled" ? "disabled" : "pending",
    note: String(item.note || (existing && existing.note) || "").trim()
  };
}

function importAdminItems(type, rows) {
  const summary = { created: 0, updated: 0, ignored: 0 };
  rows.forEach((row) => {
    const result = saveAdminItem(type, row);
    if (result === "created") summary.created += 1;
    if (result === "updated") summary.updated += 1;
    if (result === "ignored") summary.ignored += 1;
  });
  return summary;
}

// ========== 用户登录与身份识别 ==========

// 注意：mock 模式不再判定管理员身份
// 管理员身份只由云端 users.role 字段决定（见 cloudfunctions/rencai/lib/auth.js）
// mock 模式下所有用户均为普通用户，如需测试管理员功能请在云模式下进行
function isAdminCredentials(nickname, phone) {
  return false;
}

function generateUserId() {
  return "u_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
}

function loginOrCreateUser(openid, nickname, phone) {
  // 先按 openid 查已有用户
  let user = state.users.find((row) => row.openid === openid);
  const isAdmin = isAdminCredentials(nickname, phone);
  if (user) {
    // 已有用户，更新昵称/手机号/角色
    user.nickname = nickname || user.nickname;
    user.phone = phone || user.phone;
    user.avatar_text = (nickname || user.nickname).charAt(0) || "用";
    user.role = isAdmin ? "admin" : "tenant";
    user.role_label = isAdmin ? "管理员" : "住户";
    return { ok: true, user: clone(user), isNew: false };
  }
  // 新用户
  const id = generateUserId();
  user = {
    id,
    openid,
    nickname: nickname || "新用户",
    avatar_text: nickname ? nickname.charAt(0) : "新",
    avatar_class: "ca-1",
    phone: phone || "",
    role: isAdmin ? "admin" : "tenant",
    role_label: isAdmin ? "管理员" : "住户",
    apartment_id: 0,
    room_label: "未入住",
    status: "active",
    note: isAdmin ? "管理员账号" : "新注册用户"
  };
  state.users.push(user);
  return { ok: true, user: clone(user), isNew: true };
}

function getUserByOpenid(openid) {
  const user = state.users.find((row) => row.openid === openid);
  return user ? clone(user) : null;
}

function isUserAdmin(userId) {
  const user = state.users.find((row) => row.id === userId);
  return Boolean(user && user.role === "admin");
}

// ========== 用户侧运行时写入 ==========

function todayLabel() {
  const now = new Date();
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
}

function timeAgoLabel() {
  return "刚刚";
}

function pushMessage(userId, messageType, title, preview, detail, statusText, entityType, entityId) {
  const id = nextId(state.messages);
  state.messages.unshift({
    id,
    user_id: userId,
    message_type: messageType,
    title,
    preview,
    detail,
    time_label: timeAgoLabel(),
    unread: true,
    status_text: statusText,
    entity_type: entityType,
    entity_id: entityId
  });
  return id;
}

function registerActivity(activityId, userId, name, phone) {
  const numericId = Number(activityId);
  const existing = state.activityRegistrations.find(
    (row) => row.activity_id === numericId && row.user_id === userId
  );
  if (existing) return { ok: false, reason: "duplicate" };
  const activity = state.activities.find((row) => row.id === numericId);
  if (!activity) return { ok: false, reason: "not_found" };
  if (activity.current_count >= activity.max_participants) return { ok: false, reason: "full" };
  const id = nextId(state.activityRegistrations);
  const now = new Date();
  const ymd = `${now.getFullYear().toString().slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const code = `HD-${ymd}-${String(id).padStart(3, "0")}`;
  state.activityRegistrations.push({
    id,
    activity_id: numericId,
    user_id: userId,
    status: "registered",
    code,
    created_label: todayLabel()
  });
  activity.current_count += 1;
  pushMessage(
    userId,
    "activity",
    "报名成功",
    `你已报名「${activity.title}」，活动时间 ${activity.date_label}`,
    `你已报名「${activity.title}」。时间：${activity.date_label}；地点：${activity.location}。报名码：${code}。活动前会在消息页提醒你。`,
    "已报名",
    "activity",
    numericId
  );
  return {
    ok: true,
    code,
    currentCount: activity.current_count,
    maxCount: activity.max_participants
  };
}

function isActivityRegistered(activityId, userId) {
  const numericId = Number(activityId);
  return state.activityRegistrations.some(
    (row) => row.activity_id === numericId && row.user_id === userId && row.status === "registered"
  );
}

function submitComment(targetType, targetId, userId, content, rating, tags) {
  const numericTargetId = Number(targetId);
  const id = nextId(state.comments);
  const user = getUserById(userId);
  const comment = {
    id,
    user_id: userId,
    target_type: targetType,
    target_id: numericTargetId,
    rating: rating || 4.5,
    tags: tags || [],
    body: String(content || "").trim(),
    created_label: todayLabel(),
    like_count: 0,
    status: "active"
  };
  state.comments.push(comment);
  return {
    id,
    avatar: user.avatar_text,
    avatarClass: user.avatar_class,
    name: user.nickname,
    time: timeAgoLabel(),
    body: comment.body,
    likes: 0,
    rating: String(comment.rating),
    tags: (comment.tags || []).join("、"),
    status: "active"
  };
}

function toggleFavoriteRecord(targetType, targetId, userId) {
  const numericTargetId = Number(targetId);
  const index = state.favorites.findIndex(
    (row) => row.user_id === userId && row.target_type === targetType && row.target_id === numericTargetId
  );
  if (index >= 0) {
    state.favorites.splice(index, 1);
    return { ok: true, favorite: false };
  }
  const id = nextId(state.favorites);
  state.favorites.push({
    id,
    user_id: userId,
    target_type: targetType,
    target_id: numericTargetId,
    created_label: todayLabel()
  });
  return { ok: true, favorite: true };
}

function toggleCommentLike(commentId, userId) {
  const numericId = Number(commentId);
  const existing = state.commentLikes.find(
    (row) => row.comment_id === numericId && row.user_id === userId
  );
  if (existing) {
    state.commentLikes.splice(state.commentLikes.indexOf(existing), 1);
    const comment = state.comments.find((row) => row.id === numericId);
    if (comment && comment.like_count > 0) comment.like_count -= 1;
    return { ok: true, liked: false, likes: comment ? comment.like_count : 0 };
  }
  const id = nextId(state.commentLikes);
  state.commentLikes.push({ id, comment_id: numericId, user_id: userId });
  const comment = state.comments.find((row) => row.id === numericId);
  if (comment) comment.like_count += 1;
  return { ok: true, liked: true, likes: comment ? comment.like_count : 0 };
}

function createBorrowRequest(itemId, borrowerId, startDate, endDate, message) {
  const numericId = Number(itemId);
  const item = state.borrowItems.find((row) => row.id === numericId);
  if (!item) return { ok: false, reason: "not_found" };
  const id = nextId(state.borrowRequests);
  const record = {
    id,
    item_id: numericId,
    borrower_user_id: borrowerId,
    owner_user_id: item.owner_user_id,
    start_label: String(startDate || "").trim(),
    end_label: String(endDate || "").trim(),
    pickup_label: item.pickup_location || "",
    message: String(message || "").trim(),
    status: "pending",
    created_label: todayLabel()
  };
  state.borrowRequests.push(record);
  pushMessage(
    item.owner_user_id,
    "borrow",
    "新的借用申请",
    `${getUserById(borrowerId).nickname} 想借用你的「${item.name}」`,
    `${getUserById(borrowerId).nickname} 申请借用「${item.name}」。借用时间：${record.start_label} 至 ${record.end_label}；留言：${record.message || "无"}。请在消息页确认或拒绝。`,
    "待确认",
    "borrow_request",
    id
  );
  return { ok: true, requestId: id };
}

function createBorrowItem(ownerId, payload) {
  const id = nextId(state.borrowItems);
  const category = String(payload.category || "tool").trim();
  const categoryLabelMap = { tool: "工具", outdoor: "户外", appliance: "小家电", other: "其他" };
  const thumbClassMap = { tool: "thumb-tool", outdoor: "thumb-outdoor", appliance: "thumb-appliance", other: "thumb-tool" };
  const item = {
    id,
    name: String(payload.name || "").trim(),
    category,
    category_label: categoryLabelMap[category] || "其他",
    thumb_class: thumbClassMap[category] || "thumb-tool",
    desc: String(payload.desc || "").trim(),
    rules: String(payload.rules || "").trim(),
    location: String(payload.location || "").trim(),
    pickup_location: String(payload.pickupLocation || payload.location || "").trim(),
    owner_user_id: ownerId,
    status: "available",
    detail: String(payload.desc || "").trim(),
    return_tip: "请按规则按时归还。"
  };
  state.borrowItems.unshift(item);
  return { ok: true, id };
}

function createRoommatePost(userId, payload) {
  const id = nextId(state.roommatePosts);
  const type = payload.type === "need_room" ? "need_room" : "has_room";
  const user = getUserById(userId);
  const post = {
    id,
    user_id: userId,
    type,
    badge: type === "has_room" ? "有房找室友" : "无房找合租",
    confirmed: type === "has_room" ? Boolean(payload.confirmed) : false,
    avatar: user.avatar_text,
    avatarClass: user.avatar_class,
    name: String(payload.name || user.nickname).trim(),
    meta: `${payload.age ? payload.age + "岁 · " : ""}${payload.gender || ""}`,
    apartment: String(payload.apartment || payload.district || "").trim(),
    rooms: String(payload.rooms || "").trim(),
    district: String(payload.district || "").trim(),
    budget: String(payload.budget || "").trim(),
    moveIn: String(payload.moveIn || "").trim(),
    desc: String(payload.desc || "").trim(),
    contact: String(payload.contact || "").trim(),
    status: "pending"
  };
  state.roommatePosts.unshift(post);
  return { ok: true, id };
}

function createServiceOrder(userId, serviceId, payload) {
  const numericServiceId = Number(serviceId);
  const service = state.services.find((row) => row.id === numericServiceId);
  if (!service) return { ok: false, reason: "not_found" };
  const id = nextId(state.serviceOrders);
  const now = new Date();
  const ymd = `${now.getFullYear().toString().slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const orderNo = `DD-${ymd}-${String(id).padStart(3, "0")}`;
  const order = {
    id,
    service_id: numericServiceId,
    user_id: userId,
    order_no: orderNo,
    address: String(payload.address || "").trim(),
    appointment_label: String(payload.appointment || payload.appointmentLabel || "待确认").trim(),
    assignee: "待分配",
    remark: String(payload.remark || "").trim(),
    status: "processing",
    created_label: todayLabel()
  };
  state.serviceOrders.unshift(order);
  pushMessage(
    userId,
    "service",
    "订单已提交",
    `你已提交「${service.name}」需求，客服将在1个工作日内联系你`,
    `你已提交「${service.name}」需求。订单号：${orderNo}。由于微信支付商户号未配置，当前订单不发起线上支付，客服会在1个工作日内联系你确认材料和线下费用。`,
    "处理中",
    "service_order",
    id
  );
  return { ok: true, id, orderNo };
}

function createActivity(userId, payload) {
  const id = nextId(state.activities);
  const activity = {
    id,
    title: String(payload.title || "").trim(),
    activity_type: "user",
    category: String(payload.category || "兴趣社交").trim(),
    date_label: String(payload.date || "").trim(),
    short_date: String(payload.date || "").trim(),
    location: String(payload.location || "").trim(),
    mode: payload.mode === "线上" ? "线上" : "线下",
    fee: payload.fee ? String(payload.fee) : "免费",
    current_count: 0,
    max_participants: Number(payload.maxParticipants) || 20,
    cover_class: "cover-grad-4",
    organizer_name: getUserById(userId).nickname,
    organizer_user_id: userId,
    intro: String(payload.intro || "").trim(),
    notes: clone(payload.notes || ["报名后现场出示昵称即可签到"]),
    status: "pending"
  };
  state.activities.unshift(activity);
  return { ok: true, id };
}

module.exports = {
  getTables,
  nextId,
  saveAdminItem,
  deleteAdminItem,
  updateAdminItemStatus,
  importAdminItems,
  registerActivity,
  isActivityRegistered,
  submitComment,
  toggleFavoriteRecord,
  toggleCommentLike,
  createBorrowRequest,
  createBorrowItem,
  createRoommatePost,
  createServiceOrder,
  createActivity,
  loginOrCreateUser,
  getUserByOpenid,
  isUserAdmin
};
