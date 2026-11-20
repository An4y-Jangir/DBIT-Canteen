-- ============================================
-- BYTE CANTEEN — Supabase SQL Schema
-- Run this in your Supabase SQL editor
-- ============================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  college_id text,
  role text not null default 'student' check (role in ('student', 'faculty', 'kitchen_staff', 'admin')),
  campus_wallet_balance numeric(10, 2) not null default 0.00,
  rfid_tag text unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Kitchen staff can view all profiles" on public.profiles for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('kitchen_staff', 'admin'))
);

-- ============================================
-- CATEGORIES
-- ============================================
create table public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  icon text,
  sort_order int default 0,
  is_active boolean default true
);
alter table public.categories enable row level security;
create policy "Anyone can read categories" on public.categories for select using (true);
create policy "Only admins can modify categories" on public.categories for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ============================================
-- MENU ITEMS
-- ============================================
create table public.menu_items (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(8, 2) not null,
  mrp numeric(8, 2),
  image_url text,
  is_veg boolean default true,
  is_available boolean default true,
  stock_count int default 999,
  prep_time_minutes int default 10,
  tags text[] default '{}',
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.menu_items enable row level security;
create policy "Anyone can read available menu items" on public.menu_items for select using (true);
create policy "Kitchen staff can update availability/stock" on public.menu_items for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('kitchen_staff', 'admin'))
);
create policy "Admins can manage menu items" on public.menu_items for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ============================================
-- ORDERS
-- ============================================
create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete set null,
  token_number text not null,
  pickup_bay text default 'BAY #02',
  status text not null default 'pending' check (
    status in ('pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'cancelled')
  ),
  total_amount numeric(10, 2) not null,
  payment_method text check (payment_method in ('upi', 'campus_wallet', 'cash')),
  payment_status text default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  estimated_ready_at timestamptz,
  ready_at timestamptz,
  picked_up_at timestamptz,
  special_instructions text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.orders enable row level security;
create policy "Users can view own orders" on public.orders for select using (auth.uid() = user_id);
create policy "Users can create own orders" on public.orders for insert with check (auth.uid() = user_id);
create policy "Kitchen staff can view all orders" on public.orders for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('kitchen_staff', 'admin'))
);
create policy "Kitchen staff can update order status" on public.orders for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('kitchen_staff', 'admin'))
);

-- ============================================
-- ORDER ITEMS
-- ============================================
create table public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  name text not null,
  price numeric(8, 2) not null,
  quantity int not null check (quantity > 0),
  subtotal numeric(10, 2) generated always as (price * quantity) stored
);
alter table public.order_items enable row level security;
create policy "Users can view their order items" on public.order_items for select using (
  exists (select 1 from public.orders where id = order_id and user_id = auth.uid())
);
create policy "Kitchen staff can view all order items" on public.order_items for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('kitchen_staff', 'admin'))
);
create policy "Users can insert order items with their orders" on public.order_items for insert with check (
  exists (select 1 from public.orders where id = order_id and user_id = auth.uid())
);

-- ============================================
-- TOKEN SEQUENCE (auto-generate pickup tokens)
-- ============================================
create sequence if not exists token_seq start 1 maxvalue 999 cycle;
create or replace function generate_token()
returns text language plpgsql as $$
declare
  prefix text;
  num int;
begin
  num := nextval('token_seq');
  prefix := chr(ascii('A') + ((num - 1) / 100));
  return prefix || '-' || lpad((num % 100)::text, 2, '0');
end;
$$;

-- Auto-assign token on order insert
create or replace function assign_token()
returns trigger language plpgsql as $$
begin
  if new.token_number is null or new.token_number = '' then
    new.token_number := generate_token();
  end if;
  return new;
end;
$$;
create trigger assign_token_trigger
  before insert on public.orders
  for each row execute function assign_token();

-- ============================================
-- SEED DATA — Categories
-- ============================================
insert into public.categories (name, slug, icon, sort_order) values
  ('All', 'all', '🍽️', 0),
  ('Breakfast', 'breakfast', '🌅', 1),
  ('Mains', 'mains', '🍛', 2),
  ('Snacks', 'snacks', '🥪', 3),
  ('Beverages', 'beverages', '☕', 4),
  ('Desserts', 'desserts', '🍮', 5);

-- ============================================
-- SEED DATA — Menu Items
-- ============================================
insert into public.menu_items (category_id, name, description, price, mrp, is_veg, stock_count, prep_time_minutes, tags)
select c.id, m.name, m.description, m.price, m.mrp, m.is_veg, m.stock_count, m.prep_time, m.tags
from (values
  ('snacks', 'Crispy Paneer Byte Roll', 'Toasted sourdough wrap with spiced paneer, mint dip, and pickled onions', 85, 110, true, 18, 8, ARRAY['chef-special','bestseller']),
  ('snacks', 'Vada Pav', 'Mumbai-style spiced potato fritter in a soft bun with chutneys', 25, 30, true, 50, 5, ARRAY['popular','quick']),
  ('mains', 'Rajma Chawal', 'Slow-cooked kidney bean curry with steamed basmati rice', 65, 80, true, 30, 15, ARRAY['filling','homestyle']),
  ('mains', 'Chicken Biryani', 'Fragrant dum biryani with tender chicken, raita, and salan', 120, 150, false, 20, 20, ARRAY['premium','non-veg']),
  ('mains', 'Dal Tadka + Roti', 'Yellow lentil dal with ghee tadka, served with 3 rotis', 55, 65, true, 40, 12, ARRAY['homestyle']),
  ('snacks', 'Schezwan Paneer Frankie', 'Pan-grilled tortilla wrap with Schezwan paneer and veggies', 70, 90, true, 25, 10, ARRAY['spicy','popular']),
  ('beverages', 'Masala Chai', 'Fresh-brewed ginger cardamom tea with milk', 15, 20, true, 999, 3, ARRAY['hot','quick']),
  ('beverages', 'Cold Coffee', 'Blended iced coffee with milk, sugar, and cream', 40, 50, true, 999, 5, ARRAY['cold','popular']),
  ('breakfast', 'Poha', 'Flattened rice with turmeric, peanuts, and curry leaves', 30, 35, true, 35, 7, ARRAY['light','morning']),
  ('breakfast', 'Idli Sambar (3 pcs)', '3 steamed idlis with spiced sambar and coconut chutney', 40, 50, true, 25, 8, ARRAY['south-indian','healthy']),
  ('desserts', 'Gulab Jamun (2 pcs)', 'Soft khoya dumplings soaked in rose sugar syrup', 30, 40, true, 20, 2, ARRAY['sweet','popular'])
) as m(cat_slug, name, description, price, mrp, is_veg, stock_count, prep_time, tags)
join public.categories c on c.slug = m.cat_slug;

-- ============================================
-- REALTIME — enable for orders (kitchen dashboard live updates)
-- ============================================
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_items;
alter publication supabase_realtime add table public.menu_items;
