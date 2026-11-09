-- CampusDesk Student Management System
-- Run this script in Supabase SQL Editor.
-- Enable Row Level Security. The policies below allow authenticated users only.
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text not null unique,
  description text default '',
  duration text default '4 years',
  created_at timestamptz not null default now()
);
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  student_number text not null unique,
  full_name text not null,
  email text not null,
  phone text default '',
  course_id uuid references public.courses(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  attendance_date date not null default current_date,
  status text not null check (status in ('Present','Absent','Late')),
  created_at timestamptz not null default now(),
  unique(student_id, attendance_date)
);
alter table public.courses enable row level security;
alter table public.students enable row level security;
alter table public.attendance enable row level security;
drop policy if exists "Authenticated users manage courses" on public.courses;
create policy "Authenticated users manage courses" on public.courses for all to authenticated using (true) with check (true);
drop policy if exists "Authenticated users manage students" on public.students;
create policy "Authenticated users manage students" on public.students for all to authenticated using (true) with check (true);
drop policy if exists "Authenticated users manage attendance" on public.attendance;
create policy "Authenticated users manage attendance" on public.attendance for all to authenticated using (true) with check (true);
