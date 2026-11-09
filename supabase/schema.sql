-- CampusDesk Student Management System — Supabase setup
-- Safe to re-run. Creates the tables and applies per-account access rules.
-- Each signed-in account can access only its own records.

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  code text not null,
  description text default '',
  duration text default '4 years',
  created_at timestamptz not null default now(),
  unique(user_id, name),
  unique(user_id, code)
);
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  student_number text not null,
  full_name text not null,
  email text not null,
  phone text default '',
  course_id uuid references public.courses(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(user_id, student_number)
);
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  attendance_date date not null default current_date,
  status text not null check (status in ('Present','Absent','Late')),
  created_at timestamptz not null default now(),
  unique(student_id, attendance_date)
);

-- Add ownership columns safely if the tables already existed from the earlier schema.
alter table public.courses add column if not exists user_id uuid default auth.uid() references auth.users(id) on delete cascade;
alter table public.students add column if not exists user_id uuid default auth.uid() references auth.users(id) on delete cascade;
alter table public.attendance add column if not exists user_id uuid default auth.uid() references auth.users(id) on delete cascade;

-- Remove older global uniqueness rules so separate administrator accounts can use
-- the same course names, course codes, and student numbers safely.
alter table public.courses drop constraint if exists courses_name_key;
alter table public.courses drop constraint if exists courses_code_key;
alter table public.students drop constraint if exists students_student_number_key;
-- Remove duplicate indexes left by earlier versions; table constraints already enforce these rules.
drop index if exists public.courses_user_name_unique;
drop index if exists public.courses_user_code_unique;
drop index if exists public.students_user_number_unique;
create index if not exists students_course_id_idx on public.students(course_id);

alter table public.courses enable row level security;
alter table public.students enable row level security;
alter table public.attendance enable row level security;

drop policy if exists "Authenticated users manage courses" on public.courses;
drop policy if exists "Users manage own courses" on public.courses;
create policy "Users manage own courses" on public.courses for all to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "Authenticated users manage students" on public.students;
drop policy if exists "Users manage own students" on public.students;
create policy "Users manage own students" on public.students for all to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "Authenticated users manage attendance" on public.attendance;
drop policy if exists "Users manage own attendance" on public.attendance;
create policy "Users manage own attendance" on public.attendance for all to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create index if not exists students_user_id_idx on public.students(user_id);
create index if not exists attendance_user_date_idx on public.attendance(user_id, attendance_date);


-- The browser app uses the authenticated role only. Keep unauthenticated access closed.
revoke all on table public.courses, public.students, public.attendance from anon;
grant select, insert, update, delete on table public.courses, public.students, public.attendance to authenticated;
