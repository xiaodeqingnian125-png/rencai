const store = require("./mock-store");
const tables = store.getTables();

const CURRENT_USER_ID = "u_current";

const borrowCategories = [
  { label: "全部", value: "all" },
  { label: "工具", value: "tool" },
  { label: "户外", value: "outdoor" },
  { label: "小家电", value: "appliance" },
  { label: "其他", value: "other" }
];

const activityTypeMap = {
  official: { label: "官方活动", className: "official" },
  user: { label: "用户活动", className: "user" }
};

const borrowStatusMap = {
  available: { label: "可借用", className: "available" },
  borrowed: { label: "借用中", className: "borrowed" },
  pending: { label: "待审核", className: "borrowed" },
  hidden: { label: "已下架", className: "borrowed" }
};

const messageTypeMap = {
  activity: { label: "活动", icon: "/assets/icons/msg-activity.svg", toneClass: "tone-activity" },
  borrow: { label: "借用", icon: "/assets/icons/msg-borrow.svg", toneClass: "tone-borrow" },
  service: { label: "服务", icon: "/assets/icons/msg-service.svg", toneClass: "tone-service" },
  comment: { label: "评论", icon: "/assets/icons/msg-comment.svg", toneClass: "tone-comment" },
  system: { label: "系统", icon: "/assets/icons/msg-system.svg", toneClass: "tone-system" }
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function byNumericId(id) {
  return Number(id);
}

function getUserById(userId) {
  return tables.users.find((user) => user.id === userId) || tables.users[0];
}

function getApartmentRecordById(id) {
  const numericId = byNumericId(id);
  return tables.apartments.find((apartment) => apartment.id === numericId) || null;
}

function getRoomRecordById(id, apartmentId) {
  const numericId = byNumericId(id);
  const numericApartmentId = byNumericId(apartmentId);
  return tables.roomTypes.find((room) => {
    const matchApartment = !numericApartmentId || room.apartment_id === numericApartmentId;
    return matchApartment && (room.id === numericId || room.legacy_room_id === numericId);
  }) || null;
}

function getRoomsByApartmentId(apartmentId) {
  const numericApartmentId = byNumericId(apartmentId);
  return tables.roomTypes.filter((room) => room.apartment_id === numericApartmentId);
}

function priceText(apartment) {
  return `¥${apartment.price_min}-${apartment.price_max}`;
}

function isFavorited(targetType, targetId, userId = CURRENT_USER_ID) {
  const numericTargetId = byNumericId(targetId);
  return tables.favorites.some((favorite) => (
    favorite.user_id === userId &&
    favorite.target_type === targetType &&
    favorite.target_id === numericTargetId
  ));
}

function countFavorites(targetType, targetId) {
  const numericTargetId = byNumericId(targetId);
  return tables.favorites.filter((favorite) => (
    favorite.target_type === targetType &&
    favorite.target_id === numericTargetId
  )).length;
}

function countRoomFavoritesByApartment(apartmentId) {
  const numericApartmentId = byNumericId(apartmentId);
  const roomIds = tables.roomTypes
    .filter((room) => room.apartment_id === numericApartmentId)
    .map((room) => room.id);
  return tables.favorites.filter((favorite) => (
    favorite.target_type === "room_type" &&
    roomIds.includes(favorite.target_id)
  )).length;
}

function commentToPage(comment) {
  const user = getUserById(comment.user_id);
  return {
    id: comment.id,
    avatar: user.avatar_text,
    avatarClass: user.avatar_class,
    name: user.nickname,
    time: comment.created_label,
    body: comment.body,
    likes: comment.like_count,
    rating: String(comment.rating || ""),
    tags: (comment.tags || []).join("、"),
    status: comment.status
  };
}

function getTargetComments(targetType, targetId, includeInactive = false) {
  const numericTargetId = byNumericId(targetId);
  return tables.comments
    .filter((comment) => (
      comment.target_type === targetType &&
      comment.target_id === numericTargetId &&
      (includeInactive || comment.status === "active")
    ))
    .map(commentToPage);
}

function roomToPage(room) {
  return {
    id: room.id,
    apartment_code: room.apartment_code || "",
    legacyRoomId: room.legacy_room_id,
    aptId: room.apartment_id,
    name: room.name,
    area: room.area,
    orient: room.orient,
    layout: room.layout,
    floor: room.floor,
    price: `¥${room.price}`,
    priceValue: room.price,
    imageClass: room.image_class,
    image: room.image,
    desc: room.desc,
    favorite: isFavorited("room_type", room.id),
    status: room.status
  };
}

function apartmentToDetail(apartment) {
  const rooms = getRoomsByApartmentId(apartment.id).map(roomToPage);
  return {
    id: apartment.id,
    apartment_code: apartment.apartment_code || "",
    name: apartment.name,
    district: apartment.district,
    priceText: priceText(apartment),
    priceMin: apartment.price_min,
    priceMax: apartment.price_max,
    roomsText: apartment.room_summary,
    location: apartment.address,
    latitude: apartment.latitude,
    longitude: apartment.longitude,
    locationMeta: apartment.location_meta,
    heroClass: apartment.hero_class,
    imageClass: apartment.image_class,
    image: apartment.image,
    favorite: isFavorited("apartment", apartment.id),
    apartmentFavoriteCount: countFavorites("apartment", apartment.id),
    roomFavoriteCount: countRoomFavoritesByApartment(apartment.id),
    rooms,
    costs: clone(apartment.costs),
    privateFacilities: clone(apartment.private_facilities),
    publicFacilities: clone(apartment.public_facilities),
    nearby: clone(apartment.nearby),
    comments: getTargetComments("apartment", apartment.id)
  };
}

function getApartments() {
  return tables.apartments
    .filter((apartment) => apartment.status === "active")
    .map(apartmentToDetail);
}

function getApartmentById(id) {
  const apartment = getApartmentRecordById(id) || tables.apartments[0];
  return apartmentToDetail(apartment);
}

function getRoomById(apartmentId, roomId) {
  const apartment = getApartmentRecordById(apartmentId) || tables.apartments[0];
  const room = getRoomRecordById(roomId, apartment.id) || getRoomsByApartmentId(apartment.id)[0];
  return {
    apartment: apartmentToDetail(apartment),
    room: {
      ...roomToPage(room),
      costs: clone(apartment.costs),
      facilities: clone(apartment.private_facilities),
      comments: getTargetComments("room_type", room.id)
    }
  };
}

function getHomeApartmentCards() {
  return tables.apartments
    .filter((apartment) => apartment.status === "active")
    .map((apartment) => ({
      id: apartment.id,
      name: apartment.name,
      district: apartment.district,
      priceMin: apartment.price_min,
      priceMax: apartment.price_max,
      rooms: apartment.room_summary,
      location: apartment.address,
      tags: clone(apartment.tags),
      imageClass: apartment.image_class,
      image: apartment.image,
      favorite: isFavorited("apartment", apartment.id)
    }));
}

function getApartmentOptions() {
  return tables.apartments.map((apartment) => apartment.name);
}

function activityToPage(activity) {
  const typeInfo = activityTypeMap[activity.activity_type] || activityTypeMap.user;
  const full = activity.current_count >= activity.max_participants;
  return {
    id: activity.id,
    title: activity.title,
    type: activity.activity_type,
    typeLabel: typeInfo.label,
    typeClass: typeInfo.className,
    category: activity.category,
    date: activity.date_label,
    shortDate: activity.short_date,
    location: activity.location,
    mode: activity.mode,
    fee: activity.fee,
    currentCount: activity.current_count,
    maxCount: activity.max_participants,
    coverClass: activity.cover_class,
    image: activity.image,
    organizer: activity.organizer_name,
    intro: activity.intro,
    notes: clone(activity.notes),
    participants: `${activity.current_count}/${activity.max_participants}人`,
    statusText: `${full ? "已满员" : "报名中"} · ${activity.current_count}/${activity.max_participants}人`,
    statusClass: full ? "full" : "open",
    full,
    rawStatus: activity.status
  };
}

function getActivities() {
  return tables.activities.map(activityToPage);
}

function getActivityById(id) {
  const numericId = byNumericId(id);
  return activityToPage(tables.activities.find((activity) => activity.id === numericId) || tables.activities[0]);
}

function serviceToPage(service) {
  return {
    id: service.id,
    name: service.name,
    desc: service.desc,
    price: String(service.price),
    unit: service.unit,
    category: service.category,
    coverClass: service.cover_class,
    image: service.image,
    duration: service.duration,
    scope: service.scope,
    detail: service.detail,
    steps: clone(service.steps),
    status: service.status
  };
}

function getServices() {
  return tables.services.map(serviceToPage);
}

function getServiceById(id) {
  const numericId = byNumericId(id);
  return serviceToPage(tables.services.find((service) => service.id === numericId) || tables.services[0]);
}

function borrowItemToPage(item) {
  const owner = getUserById(item.owner_user_id);
  const statusInfo = borrowStatusMap[item.status] || borrowStatusMap.available;
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    categoryLabel: item.category_label,
    thumbClass: item.thumb_class,
    desc: item.desc,
    rules: item.rules,
    location: item.location,
    pickupLocation: item.pickup_location,
    owner: owner.nickname,
    ownerAvatar: owner.avatar_text,
    ownerId: owner.id,
    status: item.status,
    statusLabel: statusInfo.label,
    statusClass: statusInfo.className,
    expectedReturn: item.expected_return || "",
    detail: item.detail,
    returnTip: item.return_tip
  };
}

function getBorrowItems() {
  return tables.borrowItems.map(borrowItemToPage);
}

function getBorrowItemById(id) {
  const numericId = byNumericId(id);
  return borrowItemToPage(tables.borrowItems.find((item) => item.id === numericId) || tables.borrowItems[0]);
}

function messageToPage(message) {
  const typeInfo = messageTypeMap[message.message_type] || messageTypeMap.system;
  return {
    id: message.id,
    type: message.message_type,
    typeLabel: typeInfo.label,
    icon: typeInfo.icon,
    toneClass: typeInfo.toneClass,
    title: message.title,
    preview: message.preview,
    detail: message.detail,
    time: message.time_label,
    unread: message.unread,
    status: message.status_text,
    entityType: message.entity_type,
    entityId: message.entity_id
  };
}

function getMessages(userId = CURRENT_USER_ID) {
  return tables.messages
    .filter((message) => message.user_id === userId)
    .map(messageToPage);
}

function getFavoriteRecords(userId = CURRENT_USER_ID) {
  const favorites = tables.favorites.filter((favorite) => favorite.user_id === userId);
  const apartmentFavorites = favorites
    .filter((favorite) => favorite.target_type === "apartment")
    .map((favorite, index) => {
      const apartment = getApartmentRecordById(favorite.target_id);
      if (!apartment) return null;
      return {
        id: apartment.id,
        name: apartment.name,
        detail: apartment.address,
        price: `${priceText(apartment).split("-")[0]}起`,
        imageClass: index % 2 === 0 ? "ci-apart" : "ci-apart ci-apart-alt",
        image: apartment.image,
        typeLabel: "公寓",
        tags: [apartment.district, apartment.location_meta]
      };
    })
    .filter(Boolean);
  const roomFavorites = favorites
    .filter((favorite) => favorite.target_type === "room_type")
    .map((favorite, index) => {
      const room = getRoomRecordById(favorite.target_id);
      const apartment = room ? getApartmentRecordById(room.apartment_id) : null;
      if (!room || !apartment) return null;
      return {
        id: room.id,
        aptId: apartment.id,
        name: room.name,
        detail: `${apartment.name} · ${room.layout}`,
        price: `¥${room.price}/月`,
        imageClass: index % 2 === 0 ? "ci-room" : "ci-room ci-room-alt",
        image: room.image,
        typeLabel: "户型",
        tags: [room.area, room.orient, room.floor.split(" / ")[0]]
      };
    })
    .filter(Boolean);
  return {
    apartments: apartmentFavorites,
    rooms: roomFavorites,
    tabs: [
      { value: "apartment", label: "收藏的公寓", count: apartmentFavorites.length },
      { value: "room", label: "收藏的户型", count: roomFavorites.length }
    ]
  };
}

function getCommentTarget(comment) {
  if (comment.target_type === "apartment") {
    const apartment = getApartmentRecordById(comment.target_id);
    return apartment ? {
      target: apartment.name,
      targetType: "公寓",
      targetIcon: "公",
      targetTone: "apt",
      path: `/pages/apartment-detail/index?id=${apartment.id}`
    } : null;
  }
  const room = getRoomRecordById(comment.target_id);
  const apartment = room ? getApartmentRecordById(room.apartment_id) : null;
  return room && apartment ? {
    target: `${room.name}（${apartment.name}）`,
    targetType: "户型",
    targetIcon: "户",
    targetTone: "room",
    path: `/pages/room-detail/index?aptId=${apartment.id}&roomId=${room.id}`
  } : null;
}

function getMyComments(userId = CURRENT_USER_ID) {
  return tables.comments
    .filter((comment) => comment.user_id === userId)
    .map((comment) => {
      const user = getUserById(comment.user_id);
      const target = getCommentTarget(comment);
      if (!target) return null;
      return {
        id: comment.id,
        ...target,
        body: comment.body,
        time: comment.created_label,
        likes: comment.like_count,
        path: target.path,
        userName: user.nickname,
        userInitial: user.avatar_text
      };
    })
    .filter(Boolean);
}

function getRoommateData() {
  const posts = tables.roommatePosts
    .filter((post) => post.status === "active")
    .map((post) => clone(post));
  const reviewQueue = tables.roommatePosts
    .filter((post) => post.status === "pending")
    .map((post) => ({
      title: `${post.apartment} · ${post.rooms}`,
      desc: `${post.name}提交了${post.type === "has_room" ? "有房找室友" : "无房找合租"}帖子，等待管理员审核后公开展示。`
    }));
  return { posts, reviewQueue };
}

function toneForStatus(status) {
  if (status === "registered" || status === "active" || status === "completed" || status === "approved") {
    return "ok";
  }
  if (status === "pending" || status === "processing" || status === "borrowed") {
    return "warn";
  }
  return "muted";
}

function registrationRecord(registration) {
  const activity = getActivityById(registration.activity_id);
  return {
    title: activity.title,
    status: registration.status === "registered" ? "已报名" : "候补中",
    toneClass: toneForStatus(registration.status),
    meta: [`时间：${activity.date}`, `地点：${activity.location}`, `报名码：${registration.code}`],
    actions: [
      { label: "查看活动", action: "service", primary: true },
      { label: "取消报名", action: "cancelActivity", primary: false }
    ]
  };
}

function roommateRecord(post) {
  return {
    title: `${post.apartment} · ${post.rooms}`,
    status: post.status === "active" ? "展示中" : "审核中",
    toneClass: toneForStatus(post.status),
    meta: [`类型：${post.badge}`, `预算：${post.budget} 元/月`, `入住：${post.moveIn}`],
    actions: [
      { label: "查看帖子", action: "roommate", primary: true },
      { label: "下架帖子", action: "closePost", primary: false }
    ]
  };
}

function borrowRequestRecord(request, direction) {
  const item = tables.borrowItems.find((row) => row.id === request.item_id);
  const otherUser = getUserById(direction === "lend" ? request.borrower_user_id : request.owner_user_id);
  const statusMap = {
    pending: "待确认",
    approved: "待领取",
    borrowed: "待归还",
    completed: "已归还"
  };
  return {
    title: item ? item.name : "借用物品",
    status: statusMap[request.status] || "处理中",
    toneClass: toneForStatus(request.status),
    meta: direction === "lend"
      ? [`借用人：${otherUser.nickname}`, `借用时间：${request.start_label}-${request.end_label}`, `归还点：${request.pickup_label}`]
      : [`物主：${otherUser.nickname}`, `预约：${request.start_label}`, `领取点：${request.pickup_label}`],
    actions: direction === "lend"
      ? [
        { label: request.status === "pending" ? "同意借出" : "联系借用人", action: request.status === "pending" ? "approveLend" : "contact", primary: true },
        { label: request.status === "pending" ? "拒绝" : "确认归还", action: request.status === "pending" ? "reject" : "finishLend", primary: false }
      ]
      : [
        { label: "查看物品", action: "borrowPage", primary: true },
        { label: "联系物主", action: "contact", primary: false }
      ]
  };
}

function serviceOrderRecord(order) {
  const service = tables.services.find((item) => item.id === order.service_id);
  const statusMap = {
    processing: "处理中",
    completed: "已完成",
    cancelled: "已关闭"
  };
  return {
    title: `${service ? service.name : "代办服务"} · ${order.remark.split("，")[0]}`,
    status: statusMap[order.status] || "处理中",
    toneClass: toneForStatus(order.status),
    meta: [`订单号：${order.order_no}`, `地址：${order.address}`, `预约：${order.appointment_label}`],
    actions: [
      { label: order.status === "completed" ? "再次下单" : "查看订单", action: "service", primary: true },
      { label: order.status === "completed" ? "评价服务" : "联系客服", action: order.status === "completed" ? "comment" : "contact", primary: false }
    ]
  };
}

function getProfileRecords(userId = CURRENT_USER_ID) {
  const registrations = tables.activityRegistrations.filter((item) => item.user_id === userId);
  const posts = tables.roommatePosts.filter((item) => item.user_id === userId);
  const lendRequests = tables.borrowRequests.filter((item) => item.owner_user_id === userId);
  const borrowRequests = tables.borrowRequests.filter((item) => item.borrower_user_id === userId);
  const orders = tables.serviceOrders.filter((item) => item.user_id === userId);
  return {
    activities: {
      title: "我的活动",
      subtitle: "报名、发起和候补活动的最新进展",
      empty: "暂无活动记录，去服务页看看最近的青年活动。",
      items: registrations.map(registrationRecord)
    },
    posts: {
      title: "我的帖子",
      subtitle: "找室友发布记录和联系状态",
      empty: "还没有发布找室友帖子。",
      items: posts.map(roommateRecord)
    },
    lend: {
      title: "我借出的",
      subtitle: "别人向你借用的物品与归还状态",
      empty: "暂无借出记录。",
      items: lendRequests.map((request) => borrowRequestRecord(request, "lend"))
    },
    borrow: {
      title: "我借入的",
      subtitle: "你的借用申请、领取和归还记录",
      empty: "暂无借入记录，去借个锤子看看可借物品。",
      items: borrowRequests.map((request) => borrowRequestRecord(request, "borrow"))
    },
    orders: {
      title: "我的订单",
      subtitle: "代办服务订单和处理进度",
      empty: "暂无服务订单。",
      items: orders.map(serviceOrderRecord)
    }
  };
}

function badgeText(count) {
  return count > 0 ? String(count) : "";
}

function getProfileBadges(userId = CURRENT_USER_ID) {
  return {
    activities: badgeText(tables.activityRegistrations.filter((item) => item.user_id === userId).length),
    posts: badgeText(tables.roommatePosts.filter((item) => item.user_id === userId).length),
    lend: badgeText(tables.borrowRequests.filter((item) => item.owner_user_id === userId).length),
    borrow: badgeText(tables.borrowRequests.filter((item) => item.borrower_user_id === userId).length),
    orders: badgeText(tables.serviceOrders.filter((item) => item.user_id === userId).length),
    favorites: badgeText(tables.favorites.filter((item) => item.user_id === userId).length),
    comments: badgeText(tables.comments.filter((item) => item.user_id === userId).length)
  };
}

function adminStatusFromServiceOrder(status) {
  const map = { processing: "processing", completed: "active", cancelled: "hidden" };
  return map[status] || "processing";
}

function adminStatusFromBorrowItem(status) {
  const map = { available: "active", borrowed: "processing", pending: "pending", hidden: "hidden" };
  return map[status] || "pending";
}

function facilityCount(apartment) {
  return [...apartment.private_facilities, ...apartment.public_facilities]
    .filter((item) => item.active)
    .length + apartment.nearby.length;
}

function getAdminDataset(type) {
  if (type === "apartments") {
    return tables.apartments.map((apartment) => ({
      id: apartment.id,
      name: apartment.name,
      district: apartment.district,
      address: apartment.address,
      rent: `${priceText(apartment)}/月`,
      rooms: apartment.room_summary,
      facilityCount: facilityCount(apartment),
      desc: `配套 ${facilityCount(apartment)} 项：${apartment.public_facilities.filter((item) => item.active).map((item) => item.label).join("、")}`,
      status: apartment.status === "active" ? "active" : "hidden"
    }));
  }
  if (type === "rooms") {
    return tables.roomTypes.map((room) => {
      const apartment = getApartmentRecordById(room.apartment_id);
      return {
        id: room.id,
        apartment: apartment ? apartment.name : "",
        name: room.name,
        area: room.area,
        orient: room.orient,
        rooms: room.layout,
        rent: `¥${room.price}/月起`,
        floor: room.floor.replace(" / ", "/"),
        status: room.status === "active" ? "active" : "hidden"
      };
    });
  }
  if (type === "activities") {
    return tables.activities.map((activity) => ({
      id: activity.id,
      name: activity.title,
      category: activity.category,
      time: activity.date_label,
      place: activity.location,
      quota: `${activity.max_participants}人`,
      owner: activity.organizer_name,
      desc: activity.intro,
      status: activity.status
    }));
  }
  if (type === "services") {
    return tables.serviceOrders.map((order) => {
      const service = tables.services.find((item) => item.id === order.service_id);
      const user = getUserById(order.user_id);
      return {
        id: order.id,
        name: service ? service.name : "代办服务",
        orderNo: order.order_no,
        user: user.nickname,
        address: order.address,
        time: order.appointment_label,
        assignee: order.assignee,
        desc: order.remark,
        status: adminStatusFromServiceOrder(order.status)
      };
    });
  }
  if (type === "items") {
    return tables.borrowItems.map((item) => {
      const owner = getUserById(item.owner_user_id);
      return {
        id: item.id,
        name: item.name,
        category: item.category_label,
        owner: owner.nickname,
        location: item.location,
        rule: item.rules,
        desc: item.desc,
        status: adminStatusFromBorrowItem(item.status)
      };
    });
  }
  if (type === "comments") {
    return tables.comments.map((comment) => {
      const user = getUserById(comment.user_id);
      const target = getCommentTarget(comment);
      return {
        id: comment.id,
        target: target ? target.target : "未知对象",
        user: user.nickname,
        rating: String(comment.rating || ""),
        tags: (comment.tags || []).join("、"),
        content: comment.body,
        desc: `发表于 ${comment.created_label}`,
        status: comment.status
      };
    });
  }
  if (type === "users") {
    return tables.users.map((user, index) => {
      const apartment = getApartmentRecordById(user.apartment_id);
      return {
        id: index + 1,
        userId: user.id,
        name: user.nickname,
        phone: user.phone,
        role: user.role_label,
        apartment: apartment ? apartment.name : "未绑定公寓",
        room: user.room_label,
        note: user.note,
        status: user.status === "active" ? "active" : user.status === "disabled" ? "disabled" : "pending"
      };
    });
  }
  return [];
}

function getAdminRoomFilters() {
  return [
    { value: "all", label: "全部" },
    ...tables.apartments.map((apartment) => ({
      value: apartment.name,
      label: apartment.name
    }))
  ];
}

function getNextAdminId(type) {
  if (type === "apartments") {
    return store.nextId(tables.apartments);
  }
  if (type === "rooms") {
    return store.nextId(tables.roomTypes);
  }
  const items = getAdminDataset(type);
  return items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

function saveAdminRuntimeItem(type, item) {
  return store.saveAdminItem(type, item);
}

function deleteAdminRuntimeItem(type, id) {
  return store.deleteAdminItem(type, id);
}

function updateAdminRuntimeStatus(type, id, status) {
  return store.updateAdminItemStatus(type, id, status);
}

function importAdminRuntimeItems(type, rows) {
  return store.importAdminItems(type, rows);
}

function registerActivityForUser(activityId, userId, name, phone) {
  return store.registerActivity(activityId, userId, name, phone);
}

function isActivityRegisteredByUser(activityId, userId) {
  return store.isActivityRegistered(activityId, userId);
}

function submitUserComment(targetType, targetId, userId, content, rating, tags) {
  return store.submitComment(targetType, targetId, userId, content, rating, tags);
}

function toggleFavoriteForUser(targetType, targetId, userId) {
  return store.toggleFavoriteRecord(targetType, targetId, userId);
}

function toggleCommentLikeForUser(commentId, userId) {
  return store.toggleCommentLike(commentId, userId);
}

function createBorrowRequestForUser(itemId, borrowerId, startDate, endDate, message) {
  return store.createBorrowRequest(itemId, borrowerId, startDate, endDate, message);
}

function createBorrowItemForUser(ownerId, payload) {
  return store.createBorrowItem(ownerId, payload);
}

function createRoommatePostForUser(userId, payload) {
  return store.createRoommatePost(userId, payload);
}

function createServiceOrderForUser(userId, serviceId, payload) {
  return store.createServiceOrder(userId, serviceId, payload);
}

function createActivityForUser(userId, payload) {
  return store.createActivity(userId, payload);
}

function loginUser(openid, nickname, phone) {
  return store.loginOrCreateUser(openid, nickname, phone);
}

function getUserInfoByOpenid(openid) {
  return store.getUserByOpenid(openid);
}

function checkIsAdmin(userId) {
  return store.isUserAdmin(userId);
}

module.exports = {
  CURRENT_USER_ID,
  borrowCategories,
  getApartments,
  getApartmentById,
  getRoomById,
  getHomeApartmentCards,
  getApartmentOptions,
  getActivities,
  getActivityById,
  getServices,
  getServiceById,
  getBorrowItems,
  getBorrowItemById,
  getMessages,
  getFavoriteRecords,
  getMyComments,
  getRoommateData,
  getProfileRecords,
  getProfileBadges,
  getAdminDataset,
  getAdminRoomFilters,
  getNextAdminId,
  saveAdminRuntimeItem,
  deleteAdminRuntimeItem,
  updateAdminRuntimeStatus,
  importAdminRuntimeItems,
  registerActivityForUser,
  isActivityRegisteredByUser,
  submitUserComment,
  toggleFavoriteForUser,
  toggleCommentLikeForUser,
  createBorrowRequestForUser,
  createBorrowItemForUser,
  createRoommatePostForUser,
  createServiceOrderForUser,
  createActivityForUser,
  loginUser,
  getUserInfoByOpenid,
  checkIsAdmin
};
