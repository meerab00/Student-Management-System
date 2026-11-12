-- Public access is restricted to the department's academic directory and schedule.
-- The anon role receives SELECT on an explicit safe column allowlist only.
-- All public policies are row-scoped to the department's single administrator account.
-- No student, attendance, enrollment, result or fee tables are granted to anon.

drop function if exists public.campusdesk_public_view();

drop policy if exists "Public read institution name" on public.institution_profiles;
drop policy if exists "Public read academic sessions" on public.academic_sessions;
drop policy if exists "Public read courses" on public.courses;
drop policy if exists "Public read subjects" on public.subjects;
drop policy if exists "Public read teacher directory" on public.teachers;
drop policy if exists "Public read timetable" on public.timetable;
drop policy if exists "Public read academic calendar" on public.academic_calendar_events;

create policy "Public read institution name" on public.institution_profiles
for select to anon using (user_id = '16fb1e1a-a553-42d3-aac1-390cba3b6572'::uuid);
create policy "Public read academic sessions" on public.academic_sessions
for select to anon using (user_id = '16fb1e1a-a553-42d3-aac1-390cba3b6572'::uuid);
create policy "Public read courses" on public.courses
for select to anon using (user_id = '16fb1e1a-a553-42d3-aac1-390cba3b6572'::uuid);
create policy "Public read subjects" on public.subjects
for select to anon using (user_id = '16fb1e1a-a553-42d3-aac1-390cba3b6572'::uuid);
create policy "Public read teacher directory" on public.teachers
for select to anon using (user_id = '16fb1e1a-a553-42d3-aac1-390cba3b6572'::uuid);
create policy "Public read timetable" on public.timetable
for select to anon using (user_id = '16fb1e1a-a553-42d3-aac1-390cba3b6572'::uuid);
create policy "Public read academic calendar" on public.academic_calendar_events
for select to anon using (user_id = '16fb1e1a-a553-42d3-aac1-390cba3b6572'::uuid);

grant select (institution_name) on public.institution_profiles to anon;
grant select (id, session_type, academic_year, start_date, end_date, is_active) on public.academic_sessions to anon;
grant select (id, name, code, description, duration) on public.courses to anon;
grant select (id, course_id, name, code, semester) on public.subjects to anon;
grant select (id, full_name, specialization) on public.teachers to anon;
grant select (id, course_id, subject_id, teacher_id, weekday, start_time, end_time, room, session_id, semester, section) on public.timetable to anon;
grant select (id, session_id, event_type, title, start_date, end_date) on public.academic_calendar_events to anon;
