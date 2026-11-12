-- CASPAM academic sessions and calendar schema
-- Apply after schema.sql and modules-schema.sql.
-- Existing student profiles remain global; session membership is tracked in enrollments.
-- Existing records are preserved and assigned to the Spring session for the current year.

create table if not exists public.academic_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  session_type text not null check (session_type in ('Spring','Summer','Winter')),
  academic_year integer not null default extract(year from current_date)::integer,
  start_date date,
  end_date date,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  unique(user_id, session_type, academic_year),
  check (start_date is null or end_date is null or end_date >= start_date)
);

create table if not exists public.academic_calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  session_id uuid not null references public.academic_sessions(id) on delete cascade,
  event_type text not null check (event_type in ('Semester Start','Semester End','Midterm','Final Exam','Holiday','Vacation','Department Event','Other')),
  title text not null,
  start_date date not null,
  end_date date,
  description text not null default '',
  created_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);

alter table public.enrollments add column if not exists session_id uuid references public.academic_sessions(id) on delete cascade;
alter table public.attendance add column if not exists session_id uuid references public.academic_sessions(id) on delete cascade;
alter table public.exams add column if not exists session_id uuid references public.academic_sessions(id) on delete cascade;
alter table public.fee_records add column if not exists session_id uuid references public.academic_sessions(id) on delete cascade;
alter table public.timetable add column if not exists session_id uuid references public.academic_sessions(id) on delete cascade;

insert into public.academic_sessions (user_id, session_type, academic_year, is_active)
select owners.user_id, sessions.session_type, extract(year from current_date)::integer,
       sessions.session_type = 'Spring'
from (
  select user_id from public.students
  union select user_id from public.courses
  union select user_id from public.teachers
) owners
cross join (values ('Spring'),('Summer'),('Winter')) as sessions(session_type)
on conflict (user_id, session_type, academic_year) do nothing;

update public.enrollments e set session_id = s.id
from public.academic_sessions s
where e.session_id is null and s.user_id=e.user_id and s.session_type='Spring'
  and s.academic_year=extract(year from current_date)::integer;
update public.attendance a set session_id = s.id
from public.academic_sessions s
where a.session_id is null and s.user_id=a.user_id and s.session_type='Spring'
  and s.academic_year=extract(year from current_date)::integer;
update public.exams e set session_id = s.id
from public.academic_sessions s
where e.session_id is null and s.user_id=e.user_id and s.session_type='Spring'
  and s.academic_year=extract(year from current_date)::integer;
update public.fee_records f set session_id = s.id
from public.academic_sessions s
where f.session_id is null and s.user_id=f.user_id and s.session_type='Spring'
  and s.academic_year=extract(year from current_date)::integer;
update public.timetable t set session_id = s.id
from public.academic_sessions s
where t.session_id is null and s.user_id=t.user_id and s.session_type='Spring'
  and s.academic_year=extract(year from current_date)::integer;

insert into public.enrollments (user_id, student_id, course_id, enrolled_on, status, session_id)
select st.user_id, st.id, st.course_id, coalesce(st.admission_date, st.created_at::date, current_date), 'Active', s.id
from public.students st
join public.academic_sessions s on s.user_id=st.user_id and s.session_type='Spring'
  and s.academic_year=extract(year from current_date)::integer
where st.course_id is not null
  and not exists (select 1 from public.enrollments e where e.student_id=st.id and e.course_id=st.course_id and e.session_id=s.id);

alter table public.enrollments alter column session_id set not null;
alter table public.attendance alter column session_id set not null;
alter table public.exams alter column session_id set not null;
alter table public.fee_records alter column session_id set not null;
alter table public.timetable alter column session_id set not null;

alter table public.enrollments drop constraint if exists enrollments_student_id_course_id_key;
alter table public.enrollments drop constraint if exists enrollments_student_course_session_key;
alter table public.enrollments add constraint enrollments_student_course_session_key unique (student_id, course_id, session_id);
alter table public.attendance drop constraint if exists attendance_student_id_attendance_date_key;
alter table public.attendance drop constraint if exists attendance_student_date_session_key;
alter table public.attendance add constraint attendance_student_date_session_key unique (student_id, attendance_date, session_id);

alter table public.enrollments add column if not exists semester smallint;
alter table public.enrollments add column if not exists section text not null default '';
alter table public.enrollments drop constraint if exists enrollments_semester_range_check;
alter table public.enrollments add constraint enrollments_semester_range_check check (semester is null or semester between 1 and 8);

alter table public.timetable add column if not exists semester smallint;
alter table public.timetable add column if not exists section text not null default '';
alter table public.timetable drop constraint if exists timetable_semester_range_check;
alter table public.timetable add constraint timetable_semester_range_check check (semester is null or semester between 1 and 8);

alter table public.exams add column if not exists exam_type text not null default 'Other';
alter table public.exams add column if not exists semester smallint;
alter table public.exams add column if not exists section text not null default '';
alter table public.exams drop constraint if exists exams_exam_type_check;
alter table public.exams add constraint exams_exam_type_check check (exam_type in ('Midterm','Final','Quiz','Assignment','Other'));
alter table public.exams drop constraint if exists exams_semester_range_check;
alter table public.exams add constraint exams_semester_range_check check (semester is null or semester between 1 and 8);

create index if not exists academic_sessions_user_year_idx on public.academic_sessions(user_id, academic_year);
create index if not exists academic_calendar_events_session_date_idx on public.academic_calendar_events(session_id, start_date);
create index if not exists enrollments_session_id_idx on public.enrollments(session_id);
create index if not exists attendance_session_date_idx on public.attendance(session_id, attendance_date);
create index if not exists exams_session_id_idx on public.exams(session_id);
create index if not exists fee_records_session_id_idx on public.fee_records(session_id);
create index if not exists timetable_session_id_idx on public.timetable(session_id);
create index if not exists enrollments_session_class_idx on public.enrollments(session_id, course_id, semester, section);
create index if not exists timetable_session_class_idx on public.timetable(session_id, course_id, semester, section);
create index if not exists exams_session_class_idx on public.exams(session_id, course_id, semester, section);

alter table public.academic_sessions enable row level security;
alter table public.academic_calendar_events enable row level security;
drop policy if exists "Users manage own academic sessions" on public.academic_sessions;
create policy "Users manage own academic sessions" on public.academic_sessions
for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists "Users manage own academic calendar events" on public.academic_calendar_events;
create policy "Users manage own academic calendar events" on public.academic_calendar_events
for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

revoke all on table public.academic_sessions, public.academic_calendar_events from anon;
grant select, insert, update, delete on table public.academic_sessions, public.academic_calendar_events to authenticated;
grant select, insert, update, delete on table public.enrollments, public.attendance, public.exams, public.fee_records, public.timetable to authenticated;
