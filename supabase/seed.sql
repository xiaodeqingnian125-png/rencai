-- 晓得青年 static MVP seed draft
-- IDs and core names mirror miniprogram/data/tables.js.

insert into apartments
  (id, name, district, price_min, price_max, room_summary, address, latitude, longitude, location_meta, hero_class, image_class, tags, costs, private_facilities, public_facilities, nearby, status)
values
  (1, '郑东人才公寓', '郑东新区', 1200, 1800, '1-2居', '金水东路与东风南路交叉口', 34.7597, 113.7484, '地铁1/5号线 · 距郑州东站约1.5km', 'hero-zd', 'apt-img-1', '[{"label":"热门","className":"tag-hot"},{"label":"近地铁","className":"tag-subway"}]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '["超市/便利店","快餐小吃","药店","社区医院","快递柜"]'::jsonb, 'active'),
  (2, '高新人才家园', '高新区', 800, 1200, '开间/1居', '科学大道与长椿路交叉口', 34.8126, 113.5419, '高新区通勤圈 · 靠近地铁8号线规划站点', 'hero-gx', 'apt-img-2', '[{"label":"新上","className":"tag-new"}]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '["超市/便利店","快餐小吃","药店","快递柜"]'::jsonb, 'active'),
  (3, '经开青年公寓', '经开区', 900, 1400, '1-2居', '航海东路与经开第八大街', 34.7219, 113.7426, '经开产业园区 · 近公交主干线', 'hero-jk', 'apt-img-3', '[{"label":"近地铁","className":"tag-subway"}]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '["超市/便利店","快餐小吃","药店","社区医院"]'::jsonb, 'active'),
  (4, '港区人才社区', '航空港区', 700, 1000, '开间/1居', '华夏大道与迎宾路交叉口', 34.5344, 113.8424, '航空港就业圈 · 生活配套完善', 'hero-gq', 'apt-img-4', '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '["超市/便利店","快餐小吃","药店","快递柜"]'::jsonb, 'active'),
  (5, '二七人才公寓', '二七区', 1000, 1500, '2-3居', '大学路与航海路交叉口', 34.7221, 113.6398, '二七商圈 · 临近学校与社区商业', 'hero-eq', 'apt-img-5', '[{"label":"热门","className":"tag-hot"}]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '["超市/便利店","快餐小吃","药店","社区医院","快递柜"]'::jsonb, 'active'),
  (6, '中原青年社区', '中原区', 850, 1300, '1-2居', '建设路与秦岭路交叉口', 34.7537, 113.6066, '中原老城生活圈 · 交通成熟', 'hero-zy', 'apt-img-6', '[{"label":"新上","className":"tag-new"},{"label":"近地铁","className":"tag-subway"}]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '["超市/便利店","快餐小吃","药店","社区医院"]'::jsonb, 'active')
on conflict (id) do nothing;

insert into users
  (id, nickname, avatar_text, avatar_class, phone, role, role_label, apartment_id, room_label, status, note)
values
  ('u_current', '晓得青年', '晓', 'ca-1', '138****8888', 'admin', '管理员', 1, '3号楼', 'active', '已入住，具备管理员演示权限。'),
  ('u_xiaoling', '小玲', '小', 'ca-1', '138****2688', 'tenant', '住户', 1, '3-1202', 'active', '已入住，认证材料完整。'),
  ('u_dapeng', '大鹏', '大', 'ca-2', '156****9012', 'tenant', '住户', 2, '2-803', 'pending', '等待上传劳动合同或人才码。'),
  ('u_ajie', '阿杰', '阿', 'ca-3', '177****3321', 'housekeeper', '管家', 6, '服务中心', 'active', '负责服务订单和维修派单。'),
  ('u_lili', '小李', '李', 'male', '139****7123', 'tenant', '住户', 1, '3-502', 'active', '借物活跃用户。'),
  ('u_wang', '小王', '王', 'female', '158****0931', 'tenant', '住户', 5, '4-801', 'disabled', '账号已停用，需复核。'),
  ('u_zhao', '小赵', '赵', 'female', '150****1207', 'tenant', '住户', 3, '待入住', 'pending', '等待入住审核。')
on conflict (id) do nothing;

insert into room_types
  (id, apartment_id, legacy_room_id, name, area, orient, layout, floor, price, image_class, desc, status)
values
  (101, 1, 1, '精致一居室', '35㎡', '南向', '1室1卫', '3层 / 总8层', 1200, 'ri-1', '独立一居室户型，玄关入户，动静分区明确。', 'active'),
  (102, 1, 2, '舒适两居室', '55㎡', '东南向', '2室1厅1卫', '5层 / 总8层', 1500, 'ri-2', '两居室适合合租或小家庭入住。', 'active'),
  (103, 1, 3, '阳光大单间', '28㎡', '南向', '开间', '2层 / 总8层', 1000, 'ri-3', '开间户型紧凑高效。', 'active'),
  (201, 2, 1, '高新阳光单间', '29㎡', '南向', '开间', '4层 / 总10层', 800, 'ri-3', '面向高新区通勤人群的经济单间。', 'active'),
  (202, 2, 2, '高新舒适一居', '36㎡', '东南向', '1室1卫', '6层 / 总10层', 1000, 'ri-1', '独立一居室，卧室和生活区分区更清楚。', 'active'),
  (203, 2, 3, '青年独立一居', '42㎡', '南向', '1室1厅1卫', '8层 / 总10层', 1200, 'ri-2', '带独立客厅的一居室。', 'active'),
  (301, 3, 1, '经开标准一居', '32㎡', '南向', '1室1卫', '3层 / 总9层', 900, 'ri-1', '标准一居室，动线直接。', 'active'),
  (302, 3, 2, '经开舒适两居', '58㎡', '东南向', '2室1厅1卫', '6层 / 总9层', 1400, 'ri-2', '两居室面向合租场景。', 'active'),
  (401, 4, 1, '港区经济单间', '26㎡', '南向', '开间', '2层 / 总8层', 700, 'ri-3', '预算友好的紧凑单间。', 'active'),
  (402, 4, 2, '港区独立一居', '34㎡', '东向', '1室1卫', '5层 / 总8层', 1000, 'ri-1', '独立一居室，早间采光舒适。', 'active'),
  (501, 5, 1, '二七舒适两居', '56㎡', '南向', '2室1厅1卫', '4层 / 总11层', 1000, 'ri-2', '两居室总价友好，适合合租。', 'active'),
  (502, 5, 2, '二七通透三居', '78㎡', '南北通透', '3室1厅1卫', '7层 / 总11层', 1500, 'ri-1', '三居室适合多人合租。', 'active'),
  (601, 6, 1, '中原温馨一居', '31㎡', '南向', '1室1卫', '3层 / 总9层', 850, 'ri-1', '老城生活圈的一居室。', 'active'),
  (602, 6, 2, '中原合租两居', '54㎡', '东南向', '2室1厅1卫', '6层 / 总9层', 1300, 'ri-2', '两居室适合朋友合租。', 'active')
on conflict (id) do nothing;

insert into activities
  (id, title, activity_type, category, date_label, short_date, location, mode, fee, current_count, max_participants, cover_class, organizer_name, organizer_user_id, intro, notes, status)
values
  (1, '郑东公寓周末集市', 'official', '社区市集', '7月5日（周六）14:00', '7月5日', '郑东人才公寓·共享大厅', '线下', '免费', 18, 30, 'cover-grad-1', '晓得青年', 'u_current', '面向郑东人才公寓住户的周末轻市集。', '["报名后现场出示昵称即可签到","可携带 3 件以内闲置物品参与交换"]'::jsonb, 'active'),
  (2, '高新区桌游夜', 'user', '兴趣社交', '7月11日（周五）19:00', '7月11日', '高新人才家园·活动室', '线下', 'AA 15 元', 8, 12, 'cover-grad-2', '住户小林', 'u_dapeng', '下班后一起玩轻策略桌游，新手友好。', '["适合新手，不需要自带桌游","费用由主办人线下收取"]'::jsonb, 'active'),
  (3, '人才公寓篮球友谊赛', 'official', '运动', '7月19日（周六）16:00', '7月19日', '二七人才公寓·篮球场', '线下', '免费', 20, 20, 'cover-grad-3', '晓得青年', 'u_current', '人才公寓住户之间的 3V3 友谊赛。', '["请穿运动鞋并自备水杯","满员后不生成候补记录"]'::jsonb, 'active'),
  (4, '租房合同避坑分享', 'official', '政策攻略', '7月24日（周五）20:00', '7月24日', '线上腾讯会议', '线上', '免费', 26, 80, 'cover-grad-4', '晓得青年', 'u_current', '围绕押金、维修、退租等高频问题做集中分享。', '["会议链接将在活动前统一发送"]'::jsonb, 'pending')
on conflict (id) do nothing;

insert into registrations
  (id, activity_id, user_id, status, code, created_label)
values
  (1, 1, 'u_current', 'registered', 'HD-260705-001', '2026年7月1日'),
  (2, 2, 'u_current', 'registered', 'HD-260711-003', '2026年7月1日')
on conflict (id) do nothing;

insert into services
  (id, name, desc, price, unit, category, cover_class, duration, scope, detail, steps, status)
values
  (1, '代取快递', '帮你代取公寓周边快递柜包裹', 5, '元/次', '代办跑腿', 'service-cover-1', '30-60分钟', '支持公寓周边快递柜、驿站、小区门口临时寄存点。', '提交后由客服线下确认。', '["填写取件码和送达位置","客服确认服务时间","服务人员取件并送达","用户确认完成"]'::jsonb, 'active'),
  (2, '代办入住手续', '协助办理人才公寓入住登记全流程', 50, '元/次', '入住代办', 'service-cover-2', '1个工作日', '材料核对、物业登记、入住动线说明和现场陪同。', '提交需求后客服线下联系确认。', '["提交联系人和公寓信息","客服核对材料清单","预约办理时间","现场协助完成入住"]'::jsonb, 'active'),
  (3, '代排队取号', '住建局窗口排队取号，省去你的等待时间', 30, '元/次', '窗口代办', 'service-cover-3', '半天内', '适用于住建局窗口咨询、材料递交前取号和排队提醒。', '仅提供排队取号协助。', '["提交窗口事项","客服确认可代办范围","服务人员现场排队","通知用户到场办理"]'::jsonb, 'active'),
  (4, '搬家小件协助', '协助搬运行李箱、纸箱和小件家具', 39, '元/小时', '搬家协助', 'service-cover-4', '按预约', '限同公寓或 3 公里内小件搬运，不含大型家电。', '提交后客服评估人手和时间。', '["填写搬运起终点","客服确认人手和时间","服务人员到场协助","用户确认完成"]'::jsonb, 'active')
on conflict (id) do nothing;

insert into service_orders
  (id, service_id, user_id, order_no, address, appointment_label, assignee, remark, status, created_label)
values
  (1, 1, 'u_current', 'DD-260630-018', '郑东人才公寓 5号楼一层', '今天 18:00 前', '管家小周', '中通 3 件，送到临时寄存柜。', 'processing', '2026年6月30日'),
  (2, 2, 'u_current', 'DD-260629-006', '郑东人才公寓 3-1202', '昨天 16:20', '物业维修王师傅', '入住材料核对与水龙头维修预约。', 'completed', '2026年6月29日'),
  (3, 4, 'u_dapeng', 'SV20260701002', '高新人才家园 2-803', '明天 10:00', '待分配', '需要帮忙搬 4 个纸箱和一张书桌。', 'processing', '2026年7月1日')
on conflict (id) do nothing;

insert into roommate_posts
  (id, user_id, type, badge, confirmed, avatar, avatar_class, name, meta, apartment, rooms, district, budget, move_in, desc, contact, status)
values
  (1, 'u_lili', 'has_room', '有房找室友', true, '李', 'male', '小李', '25岁 · 男', '郑东人才公寓', '1居室', '郑东新区', '1200', '7月中旬', '主卧朝南有阳台，希望找作息稳定、爱干净的室友。', '微信 xiaoli-room', 'active'),
  (2, 'u_wang', 'need_room', '无房找合租', false, '王', 'female', '小王', '23岁 · 女', '期望二七区/中原区', '合租两居优先', '二七区/中原区', '800-1000', '7月上旬', '应届毕业生，安静爱干净，希望通勤地铁方便。', '微信 xiaowang-0720', 'active'),
  (3, 'u_current', 'has_room', '有房找室友', true, '晓', 'male', '晓得青年', '26岁 · 男', '郑东人才公寓', '主卧找室友', '郑东新区', '1200-1500', '7月中旬', '希望找作息稳定、爱干净的室友。', '微信 xiaode-room', 'active'),
  (4, 'u_zhao', 'need_room', '无房找合租', false, '赵', 'female', '小赵', '24岁 · 女', '经开区附近', '整租或合租均可', '经开区', '1000-1500', '8月', '在经开区上班，想找附近合租，可以一起看房。', '微信 zhao-rent', 'active'),
  (5, 'u_dapeng', 'has_room', '有房找室友', true, '大', 'male', '老张', '28岁 · 男', '高新人才家园', '2居室次卧', '高新区', '1000', '7月底', '高新人才家园次卧转租，等待审核后展示。', '微信 gaoxin-room', 'pending')
on conflict (id) do nothing;

insert into items
  (id, name, category, category_label, thumb_class, desc, rules, location, pickup_location, owner_user_id, status, expected_return, detail, return_tip)
values
  (1, '锤子', 'tool', '工具', 'thumb-tool', '家用手锤，木柄铁头，适合钉钉子、组装家具', '借用2天内归还 · 需自取', '郑东人才公寓·3号楼', '3号楼1楼大厅', 'u_lili', 'available', null, '锤头稳固，适合安装置物架、组装桌椅等轻量场景。', '建议当天或次日归还，归还前擦拭干净。'),
  (2, '螺丝刀套装', 'tool', '工具', 'thumb-tool', '多功能螺丝刀，一字+十字+六角，带磁吸头', '借用3天内归还', '高新人才家园·1号楼', '1号楼前台', 'u_dapeng', 'available', null, '包含常用批头，适合安装简易家具。', '归还时请确认批头数量完整。'),
  (3, '露营帐篷', 'outdoor', '户外', 'thumb-outdoor', '双人帐篷，防风防雨，适合周边郊游', '周五借下周一还 · 押金¥100', '郑东人才公寓·5号楼', '5号楼前台', 'u_wang', 'borrowed', '预计7月8日归还', '双人轻量帐篷，带地钉和收纳袋。', '归还前需晾干并清理泥沙。'),
  (4, '电钻', 'tool', '工具', 'thumb-tool', '冲击电钻，带6/8/10mm钻头，适合墙面打孔', '借用1天内归还 · 需自取', '经开青年公寓·2号楼', '2号楼物业前台', 'u_lili', 'available', null, '适合安装挂钩、置物架等简单墙面作业。', '归还时请检查电池、钻头和收纳盒。'),
  (5, '电磁炉', 'appliance', '小家电', 'thumb-appliance', '美的电磁炉，9档火力，适合火锅/炒菜', '借用1天内归还 · 需自取', '二七人才公寓·4号楼', '4号楼公共厨房', 'u_zhao', 'borrowed', '预计7月6日归还', '适合临时聚餐或厨房设备维修期间过渡使用。', '归还前请清洁面板油渍。'),
  (6, '折叠椅', 'outdoor', '户外', 'thumb-outdoor', '铝合金折叠椅2把，轻便好拿', '借用3天内归还', '中原青年社区·1号楼', '1号楼门厅', 'u_current', 'available', null, '适合露营、临时会客和社区活动使用。', '收纳时请折叠到位，避免夹手。')
on conflict (id) do nothing;

insert into borrow_requests
  (id, item_id, borrower_user_id, owner_user_id, start_label, end_label, pickup_label, message, status, created_label)
values
  (1, 4, 'u_current', 'u_lili', '今天 18:00', '明天 20:00', '3号楼502', '安装挂钩用一下', 'approved', '2026年7月1日'),
  (2, 3, 'u_current', 'u_wang', '7月5日 10:00', '7月8日 20:00', '5号楼前台', '周末露营', 'borrowed', '2026年7月1日'),
  (3, 6, 'u_xiaoling', 'u_current', '明天 10:00', '明天 11:30', '1号楼门厅', '社区活动临时加座', 'pending', '2026年7月1日')
on conflict (id) do nothing;

insert into comments
  (id, user_id, target_type, target_id, rating, tags, body, created_label, like_count, status)
values
  (1, 'u_xiaoling', 'apartment', 1, 4.8, '["交通方便","管家响应快"]'::jsonb, '住了快一年了，物业态度超好，楼下快递柜很方便。离地铁走路5分钟，通勤非常友好。', '2026年6月', 12, 'active'),
  (2, 'u_dapeng', 'apartment', 1, 4.6, '["健身房","隔音不错"]'::jsonb, '健身房是加分项！就是周末有时候人多要排队。隔音还不错。', '2026年5月', 8, 'active'),
  (3, 'u_ajie', 'apartment', 1, 4.7, '["房间宽敞","服务好"]'::jsonb, '刚搬进来，房间比想象中大！物业帮我搬行李上楼，感动。', '2026年4月', 5, 'active'),
  (4, 'u_current', 'apartment', 1, 4.9, '["交通方便","管家响应快"]'::jsonb, '住了快一年了，物业态度超好，楼下快递柜很方便。离地铁走路5分钟，通勤非常友好。', '2026年6月', 12, 'active'),
  (5, 'u_current', 'room_type', 101, 4.8, '["采光好","适合独居"]'::jsonb, '这个户型最大的优点是采光！朝南带阳台，冬天晒太阳超舒服。一个人住刚刚好。', '2026年5月', 8, 'active'),
  (6, 'u_current', 'apartment', 5, 4.6, '["交通便利","性价比高"]'::jsonb, '交通便利，楼下就是公交站。性价比很高，推荐给刚毕业的年轻人。', '2026年4月', 5, 'active'),
  (7, 'u_current', 'room_type', 102, 4.5, '["合租友好","物业响应快"]'::jsonb, '两居室空间很大，跟室友合租很划算。物业响应快，报修基本当天就处理。', '2026年3月', 3, 'pending'),
  (8, 'u_dapeng', 'room_type', 101, 4.5, '["户型紧凑","性价比高"]'::jsonb, '精装修交付的质量不错，没什么味道。厨房虽然不大但够用。', '2026年5月', 8, 'active'),
  (9, 'u_ajie', 'room_type', 101, 4.4, '["通风好"]'::jsonb, '卫生间有窗户通风，这点比很多老房子强。', '2026年4月', 5, 'active'),
  (10, 'u_wang', 'apartment', 2, 3.2, '["噪音反馈"]'::jsonb, '临街房间晚上略吵，建议看房时注意楼栋位置。', '2026年6月', 1, 'hidden')
on conflict (id) do nothing;

insert into comment_likes
  (id, comment_id, user_id)
values
  (1, 1, 'u_current'),
  (2, 5, 'u_xiaoling'),
  (3, 8, 'u_current')
on conflict (id) do nothing;

insert into favorites
  (id, user_id, target_type, target_id, created_label)
values
  (1, 'u_current', 'apartment', 1, '2026年7月1日'),
  (2, 'u_current', 'apartment', 2, '2026年7月1日'),
  (3, 'u_current', 'apartment', 5, '2026年7月1日'),
  (4, 'u_current', 'room_type', 101, '2026年7月1日'),
  (5, 'u_current', 'room_type', 102, '2026年7月1日'),
  (6, 'u_current', 'room_type', 501, '2026年7月1日')
on conflict (id) do nothing;

insert into messages
  (id, user_id, message_type, title, preview, detail, time_label, unread, status_text, entity_type, entity_id)
values
  (1, 'u_current', 'activity', '活动提醒', '你报名的「郑东公寓周末集市」将于明天14:00开始', '你报名的「郑东公寓周末集市」将于明天14:00在郑东人才公寓中心花园开始。', '10分钟前', true, '待开始', 'activity', 1),
  (2, 'u_current', 'borrow', '借用申请已确认', '小李已确认你借用「电钻」的申请，取件位置：3号楼502', '小李已确认你借用「电钻」的申请。取件位置：3号楼502。', '1小时前', true, '待取件', 'borrow_request', 1),
  (3, 'u_current', 'service', '订单已提交', '你已提交「代办入住手续」需求，客服将在1个工作日内联系你', '当前订单不发起线上支付，客服会线下联系确认。', '2小时前', false, '处理中', 'service_order', 2),
  (4, 'u_current', 'activity', '活动取消通知', '原定于7月20日的「人才公寓篮球友谊赛」因场地原因取消', '原定于7月20日的活动因场地维护取消。', '昨天', true, '已取消', 'activity', 3),
  (5, 'u_current', 'borrow', '借用即将到期', '你借用的「露营帐篷」还剩1天到期，请及时归还', '请在明日20:00前归还至2号楼前台。', '昨天', false, '待归还', 'borrow_request', 2),
  (6, 'u_current', 'service', '服务完成', '你的「代取快递」订单已完成，请确认收货', '快递已放置在5号楼一层临时寄存柜。', '7月1日', false, '待确认', 'service_order', 1),
  (7, 'u_current', 'comment', '评价收到回复', '郑东人才公寓管家回复了你的户型评价', '管家回复了你对「精致一居室」的评价。', '7月1日', false, '已回复', 'comment', 5),
  (8, 'u_current', 'system', '系统通知', '欢迎加入晓得青年！开始探索你的理想公寓吧', '你可以在首页查看人才公寓，在服务页报名活动和提交代办需求。', '7月1日', false, '已送达', 'system', 0)
on conflict (id) do nothing;
