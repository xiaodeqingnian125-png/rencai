-- 晓得青年 Supabase schema draft
-- Static MVP migration asset only. This file is not executed by the mini program.

create table if not exists users (
  id text primary key,
  nickname text not null,
  avatar_text text,
  avatar_class text,
  phone text,
  role text not null check (role in ('tenant', 'housekeeper', 'admin')),
  role_label text not null,
  apartment_id integer,
  room_label text,
  status text not null default 'pending' check (status in ('pending', 'active', 'disabled')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists apartments (
  id integer primary key,
  name text not null,
  district text not null,
  price_min integer not null check (price_min >= 0),
  price_max integer not null check (price_max >= price_min),
  room_summary text not null,
  address text not null,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  location_meta text,
  hero_class text,
  image_class text,
  tags jsonb not null default '[]'::jsonb,
  costs jsonb not null default '[]'::jsonb,
  private_facilities jsonb not null default '[]'::jsonb,
  public_facilities jsonb not null default '[]'::jsonb,
  nearby jsonb not null default '[]'::jsonb,
  status text not null default 'active' check (status in ('active', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table users
  add constraint users_apartment_id_fkey
  foreign key (apartment_id) references apartments(id)
  on delete set null;

create table if not exists room_types (
  id integer primary key,
  apartment_id integer not null references apartments(id) on delete cascade,
  legacy_room_id integer,
  name text not null,
  area text not null,
  orient text not null,
  layout text not null,
  floor text,
  price integer not null check (price >= 0),
  image_class text,
  desc text,
  status text not null default 'active' check (status in ('active', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (apartment_id, legacy_room_id)
);

create table if not exists activities (
  id integer primary key,
  title text not null,
  activity_type text not null check (activity_type in ('official', 'user')),
  category text not null,
  date_label text not null,
  short_date text,
  location text not null,
  mode text not null check (mode in ('线上', '线下')),
  fee text not null,
  current_count integer not null default 0 check (current_count >= 0),
  max_participants integer not null check (max_participants > 0),
  cover_class text,
  organizer_name text not null,
  organizer_user_id text references users(id) on delete set null,
  intro text,
  notes jsonb not null default '[]'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'active', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists registrations (
  id integer primary key,
  activity_id integer not null references activities(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  status text not null default 'registered' check (status in ('registered', 'cancelled', 'waitlisted')),
  code text,
  created_label text,
  created_at timestamptz not null default now(),
  unique (activity_id, user_id)
);

create table if not exists roommate_posts (
  id integer primary key,
  user_id text references users(id) on delete set null,
  type text not null check (type in ('has_room', 'need_room')),
  badge text not null,
  confirmed boolean not null default false,
  avatar text,
  avatar_class text,
  name text not null,
  meta text,
  apartment text,
  rooms text,
  district text,
  budget text,
  move_in text,
  desc text,
  contact text,
  status text not null default 'pending' check (status in ('pending', 'active', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists items (
  id integer primary key,
  name text not null,
  category text not null,
  category_label text not null,
  thumb_class text,
  desc text,
  rules text,
  location text,
  pickup_location text,
  owner_user_id text references users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'available', 'borrowed', 'hidden')),
  expected_return text,
  detail text,
  return_tip text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists borrow_requests (
  id integer primary key,
  item_id integer not null references items(id) on delete cascade,
  borrower_user_id text references users(id) on delete set null,
  owner_user_id text references users(id) on delete set null,
  start_label text,
  end_label text,
  pickup_label text,
  message text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'borrowed', 'completed', 'rejected', 'cancelled')),
  created_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists comments (
  id integer primary key,
  user_id text references users(id) on delete set null,
  target_type text not null check (target_type in ('apartment', 'room_type')),
  target_id integer not null,
  rating numeric(2, 1) check (rating is null or (rating >= 0 and rating <= 5)),
  tags jsonb not null default '[]'::jsonb,
  body text not null,
  created_label text,
  like_count integer not null default 0 check (like_count >= 0),
  status text not null default 'pending' check (status in ('pending', 'active', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists comment_likes (
  id integer primary key,
  comment_id integer not null references comments(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (comment_id, user_id)
);

create table if not exists favorites (
  id integer primary key,
  user_id text not null references users(id) on delete cascade,
  target_type text not null check (target_type in ('apartment', 'room_type')),
  target_id integer not null,
  created_label text,
  created_at timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

create table if not exists messages (
  id integer primary key,
  user_id text not null references users(id) on delete cascade,
  message_type text not null check (message_type in ('activity', 'borrow', 'service', 'comment', 'system')),
  title text not null,
  preview text not null,
  detail text,
  time_label text,
  unread boolean not null default true,
  status_text text,
  entity_type text,
  entity_id integer,
  created_at timestamptz not null default now()
);

create table if not exists services (
  id integer primary key,
  name text not null,
  desc text,
  price integer not null default 0 check (price >= 0),
  unit text,
  category text,
  cover_class text,
  duration text,
  scope text,
  detail text,
  steps jsonb not null default '[]'::jsonb,
  status text not null default 'active' check (status in ('active', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists service_orders (
  id integer primary key,
  service_id integer not null references services(id) on delete cascade,
  user_id text references users(id) on delete set null,
  order_no text not null unique,
  address text,
  appointment_label text,
  assignee text,
  remark text,
  status text not null default 'processing' check (status in ('processing', 'completed', 'cancelled')),
  created_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_room_types_apartment_id on room_types(apartment_id);
create index if not exists idx_activities_status on activities(status);
create index if not exists idx_registrations_user_id on registrations(user_id);
create index if not exists idx_roommate_posts_status on roommate_posts(status);
create index if not exists idx_items_owner_user_id on items(owner_user_id);
create index if not exists idx_borrow_requests_borrower on borrow_requests(borrower_user_id);
create index if not exists idx_borrow_requests_owner on borrow_requests(owner_user_id);
create index if not exists idx_comments_target on comments(target_type, target_id);
create index if not exists idx_comments_user_id on comments(user_id);
create index if not exists idx_favorites_user_id on favorites(user_id);
create index if not exists idx_messages_user_unread on messages(user_id, unread);
create index if not exists idx_service_orders_user_id on service_orders(user_id);
