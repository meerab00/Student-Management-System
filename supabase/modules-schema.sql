-- CampusDesk academic module schema
-- Run after supabase/schema.sql. Safe to re-run on an existing database.
-- All public tables are protected by per-account Row Level Security.

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  name text not null,
  code text not null,
  created_at timestamptz not null default now(),
  semester smallint,
  unique(user_id, code),
  check (semester is null or semester between 1 and 8)
);

create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null default '',
  phone text default '',
  specialization text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  enrolled_on date not null default current_date,
  status text not null default 'Active' check (status in ('Active','Completed','Withdrawn')),
  unique(student_id, course_id)
);

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null,
  exam_date date,
  total_marks numeric not null default 100 check (total_marks > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  exam_id uuid not null references public.exams(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  obtained_marks numeric not null check (obtained_marks >= 0),
  remarks text default '',
  created_at timestamptz not null default now(),
  unique(exam_id, student_id)
);

create table if not exists public.fee_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  fee_title text not null default 'Tuition Fee',
  amount numeric not null check (amount >= 0),
  due_date date,
  paid_amount numeric not null default 0 check (paid_amount >= 0 and paid_amount <= amount),
  paid_on date,
  status text not null default 'Pending' check (status in ('Pending','Partial','Paid')),
  notes text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.timetable (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  teacher_id uuid references public.teachers(id) on delete set null,
  weekday smallint not null check (weekday between 1 and 7),
  start_time time not null,
  end_time time not null,
  room text default '',
  check (end_time > start_time)
);

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text default '',
  role text not null default 'admin' check (role in ('admin','teacher','student')),
  linked_student_id uuid references public.students(id) on delete set null,
  linked_teacher_id uuid references public.teachers(id) on delete set null,
  created_at timestamptz not null default now()
);

do $
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'subjects_semester_range_check'
      and conrelid = 'public.subjects'::regclass
  ) then
    alter table public.subjects add constraint subjects_semester_range_check
      check (semester is null or semester between 1 and 8) not valid;
  end if;
end;
$;
alter table public.subjects validate constraint subjects_semester_range_check;

alter table public.subjects enable row level security;
alter table public.teachers enable row level security;
alter table public.enrollments enable row level security;
alter table public.exams enable row level security;
alter table public.results enable row level security;
alter table public.fee_records enable row level security;
alter table public.timetable enable row level security;
alter table public.user_profiles enable row level security;

drop policy if exists "Users manage own subjects" on public.subjects;
create policy "Users manage own subjects" on public.subjects for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists "Users manage own teachers" on public.teachers;
create policy "Users manage own teachers" on public.teachers for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists "Users manage own enrollments" on public.enrollments;
create policy "Users manage own enrollments" on public.enrollments for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists "Users manage own exams" on public.exams;
create policy "Users manage own exams" on public.exams for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists "Users manage own results" on public.results;
create policy "Users manage own results" on public.results for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists "Users manage own fee_records" on public.fee_records;
create policy "Users manage own fee_records" on public.fee_records for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists "Users manage own timetable" on public.timetable;
create policy "Users manage own timetable" on public.timetable for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

drop policy if exists "Users read own profile" on public.user_profiles;
create policy "Users read own profile" on public.user_profiles for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists "Users create student profile" on public.user_profiles;
create policy "Users create student profile" on public.user_profiles for insert to authenticated with check ((select auth.uid())=user_id and role='student');
drop policy if exists "Users update own profile display name" on public.user_profiles;
create policy "Users update own profile display name" on public.user_profiles for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id and role='student');

revoke all on table public.subjects, public.teachers, public.enrollments, public.exams, public.results, public.fee_records, public.timetable, public.user_profiles from anon;
grant select, insert, update, delete on table public.subjects, public.teachers, public.enrollments, public.exams, public.results, public.fee_records, public.timetable to authenticated;
grant select, insert, update on table public.user_profiles to authenticated;

create index if not exists enrollments_course_id_idx on public.enrollments(course_id);
create index if not exists exams_subject_id_idx on public.exams(subject_id);
create index if not exists timetable_subject_id_idx on public.timetable(subject_id);
create index if not exists timetable_teacher_id_idx on public.timetable(teacher_id);
create index if not exists user_profiles_linked_student_id_idx on public.user_profiles(linked_student_id);
create index if not exists user_profiles_linked_teacher_id_idx on public.user_profiles(linked_teacher_id);


-- Enforce that marks cannot exceed the selected exam's total and that the
-- student and exam belong to the same account and course.
create or replace function private.validate_result_record()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_total_marks numeric;
  v_exam_course uuid;
  v_student_course uuid;
begin
  select e.total_marks, e.course_id
    into v_total_marks, v_exam_course
    from public.exams e
   where e.id = new.exam_id and e.user_id = new.user_id;
  if not found then
    raise exception 'The selected exam does not belong to this account.';
  end if;
  select s.course_id into v_student_course
    from public.students s
   where s.id = new.student_id and s.user_id = new.user_id;
  if not found then
    raise exception 'The selected student does not belong to this account.';
  end if;
  if v_student_course is distinct from v_exam_course then
    raise exception 'The student must belong to the course selected for this exam.';
  end if;
  if new.obtained_marks < 0 or new.obtained_marks > v_total_marks then
    raise exception 'Obtained marks must be between 0 and the exam total marks (%).', v_total_marks;
  end if;
  return new;
end;
$$;
revoke all on function private.validate_result_record() from public, anon, authenticated;
drop trigger if exists results_validate_record on public.results;
create trigger results_validate_record before insert or update on public.results
for each row execute function private.validate_result_record();
