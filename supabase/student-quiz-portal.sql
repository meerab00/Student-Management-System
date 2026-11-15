-- Student-facing quiz portal.
-- Public RPC wrappers expose only published quiz content; correct answers stay server-side.
alter table public.quiz_attempts add column if not exists student_id text not null default '';

create or replace function private.get_student_quiz(p_quiz_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_quiz public.quizzes%rowtype; v_questions jsonb;
begin
  select * into v_quiz from public.quizzes where id=p_quiz_id and is_published=true;
  if not found then raise exception 'This quiz is unavailable or has not been published.'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',q.id,'question_text',q.question_text,'choices',q.choices,
    'points',q.points,'sort_order',q.sort_order
  ) order by q.sort_order,q.created_at),'[]'::jsonb)
  into v_questions from public.quiz_questions q where q.quiz_id=v_quiz.id;
  return jsonb_build_object('id',v_quiz.id,'title',v_quiz.title,
    'description',v_quiz.description,'time_limit_minutes',v_quiz.time_limit_minutes,
    'questions',v_questions);
end;
$$;

create or replace function private.submit_student_quiz(
  p_quiz_id uuid,p_student_name text,p_student_id text,p_answers jsonb
)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_quiz public.quizzes%rowtype; v_question record; v_choice text;
  v_score numeric:=0; v_total numeric:=0; v_answered integer:=0;
  v_count integer:=0; v_attempt_id uuid;
begin
  if char_length(trim(coalesce(p_student_name,'')))<2 or char_length(trim(coalesce(p_student_name,'')))>120 then
    raise exception 'Enter a valid student name.';
  end if;
  if char_length(trim(coalesce(p_student_id,'')))<1 or char_length(trim(coalesce(p_student_id,'')))>40 then
    raise exception 'Enter a valid Student ID.';
  end if;
  if jsonb_typeof(coalesce(p_answers,'{}'::jsonb))<>'object' then raise exception 'Invalid answer data.'; end if;
  select * into v_quiz from public.quizzes where id=p_quiz_id and is_published=true;
  if not found then raise exception 'This quiz is unavailable or has not been published.'; end if;
  if not exists (
    select 1 from public.students s where s.user_id=v_quiz.user_id
      and lower(trim(s.student_number))=lower(trim(p_student_id))
      and lower(trim(s.full_name))=lower(trim(p_student_name)) and s.is_active=true
  ) then raise exception 'Student ID and name do not match an active student record.'; end if;
  for v_question in
    select q.id,q.correct_choice,q.points from public.quiz_questions q
    where q.quiz_id=v_quiz.id order by q.sort_order,q.created_at
  loop
    v_count:=v_count+1; v_total:=v_total+v_question.points;
    v_choice:=p_answers->>v_question.id::text;
    if v_choice is not null and v_choice~'^[0-3]$' then
      v_answered:=v_answered+1;
      if v_choice::integer=v_question.correct_choice then v_score:=v_score+v_question.points; end if;
    end if;
  end loop;
  if v_count=0 then raise exception 'This quiz has no questions yet.'; end if;
  insert into public.quiz_attempts(user_id,quiz_id,student_name,student_id,score,total_points)
  values(v_quiz.user_id,v_quiz.id,trim(p_student_name),trim(p_student_id),v_score,v_total)
  returning id into v_attempt_id;
  return jsonb_build_object('attempt_id',v_attempt_id,'quiz_title',v_quiz.title,
    'score',v_score,'total_points',v_total,'answered',v_answered,'question_count',v_count,
    'percentage',case when v_total>0 then round((v_score/v_total)*100,2) else 0 end);
end;
$$;

revoke all on function private.get_student_quiz(uuid) from public,anon,authenticated;
revoke all on function private.submit_student_quiz(uuid,text,text,jsonb) from public,anon,authenticated;
grant usage on schema private to anon,authenticated;
grant execute on function private.get_student_quiz(uuid) to anon,authenticated;
grant execute on function private.submit_student_quiz(uuid,text,text,jsonb) to anon,authenticated;

create or replace function public.get_student_quiz(p_quiz_id uuid)
returns jsonb language sql security invoker set search_path = ''
as $$ select private.get_student_quiz(p_quiz_id); $$;
create or replace function public.submit_student_quiz(
  p_quiz_id uuid,p_student_name text,p_student_id text,p_answers jsonb
)
returns jsonb language sql security invoker set search_path = ''
as $$ select private.submit_student_quiz(p_quiz_id,p_student_name,p_student_id,p_answers); $$;

revoke all on function public.get_student_quiz(uuid) from public;
revoke all on function public.submit_student_quiz(uuid,text,text,jsonb) from public;
grant execute on function public.get_student_quiz(uuid) to anon,authenticated;
grant execute on function public.submit_student_quiz(uuid,text,text,jsonb) to anon,authenticated;
