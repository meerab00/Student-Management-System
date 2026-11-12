
create or replace function public.campusdesk_public_view()
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_owner uuid;
  v_result jsonb;
begin
  select ip.user_id into v_owner
  from public.institution_profiles ip
  order by ip.updated_at desc nulls last
  limit 1;

  if v_owner is null then
    return jsonb_build_object('institution', 'BZU CASPAM Department',
      'sessions', '[]'::jsonb, 'courses', '[]'::jsonb,
      'subjects', '[]'::jsonb, 'teachers', '[]'::jsonb,
      'timetable', '[]'::jsonb, 'calendar', '[]'::jsonb);
  end if;

  select jsonb_build_object(
    'institution', (select ip.institution_name from public.institution_profiles ip where ip.user_id = v_owner limit 1),
    'sessions', coalesce((select jsonb_agg(jsonb_build_object(
      'id', s.id, 'session_type', s.session_type, 'academic_year', s.academic_year,
      'start_date', s.start_date, 'end_date', s.end_date, 'is_active', s.is_active
    ) order by s.academic_year desc, s.session_type)
      from public.academic_sessions s where s.user_id = v_owner), '[]'::jsonb),
    'courses', coalesce((select jsonb_agg(jsonb_build_object(
      'id', c.id, 'name', c.name, 'code', c.code, 'description', c.description, 'duration', c.duration
    ) order by c.name)
      from public.courses c where c.user_id = v_owner), '[]'::jsonb),
    'subjects', coalesce((select jsonb_agg(jsonb_build_object(
      'id', su.id, 'course_id', su.course_id, 'name', su.name, 'code', su.code, 'semester', su.semester
    ) order by su.semester, su.name)
      from public.subjects su where su.user_id = v_owner), '[]'::jsonb),
    'teachers', coalesce((select jsonb_agg(jsonb_build_object(
      'id', t.id, 'full_name', t.full_name, 'specialization', t.specialization
    ) order by t.full_name)
      from public.teachers t where t.user_id = v_owner), '[]'::jsonb),
    'timetable', coalesce((select jsonb_agg(jsonb_build_object(
      'id', tt.id, 'session_id', tt.session_id, 'course_id', tt.course_id,
      'subject_id', tt.subject_id, 'teacher_id', tt.teacher_id,
      'weekday', tt.weekday, 'start_time', tt.start_time, 'end_time', tt.end_time,
      'room', tt.room, 'semester', tt.semester, 'section', tt.section,
      'course_name', c.name, 'subject_name', su.name, 'teacher_name', t.full_name
    ) order by tt.semester, tt.weekday, tt.start_time)
      from public.timetable tt
      left join public.courses c on c.id = tt.course_id and c.user_id = v_owner
      left join public.subjects su on su.id = tt.subject_id and su.user_id = v_owner
      left join public.teachers t on t.id = tt.teacher_id and t.user_id = v_owner
      where tt.user_id = v_owner), '[]'::jsonb),
    'calendar', coalesce((select jsonb_agg(jsonb_build_object(
      'id', ev.id, 'session_id', ev.session_id, 'event_type', ev.event_type,
      'title', ev.title, 'start_date', ev.start_date, 'end_date', ev.end_date
    ) order by ev.start_date)
      from public.academic_calendar_events ev where ev.user_id = v_owner), '[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$function$;

revoke all on function public.campusdesk_public_view() from public, anon, authenticated;
grant execute on function public.campusdesk_public_view() to anon, authenticated;
