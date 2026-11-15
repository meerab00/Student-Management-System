-- CampusDesk online quiz module. Run after the core and academic module schemas.
create table if not exists public.quizzes (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 title text not null,
 description text default '',
 time_limit_minutes integer not null default 20 check(time_limit_minutes between 1 and 240),
 is_published boolean not null default false,
 created_at timestamptz not null default now()
);
create table if not exists public.quiz_questions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 quiz_id uuid not null references public.quizzes(id) on delete cascade,
 question_text text not null,
 choices jsonb not null,
 correct_choice integer not null check(correct_choice between 0 and 3),
 points numeric not null default 1 check(points > 0),
 sort_order integer not null default 0,
 created_at timestamptz not null default now(),
 check(jsonb_typeof(choices)='array' and jsonb_array_length(choices)=4)
);
create table if not exists public.quiz_attempts (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 quiz_id uuid not null references public.quizzes(id) on delete cascade,
 student_name text not null,
 score numeric not null default 0,
 total_points numeric not null default 0,
 submitted_at timestamptz not null default now()
);
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
drop policy if exists "Users manage own quizzes" on public.quizzes;
create policy "Users manage own quizzes" on public.quizzes for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
drop policy if exists "Users manage own quiz questions" on public.quiz_questions;
create policy "Users manage own quiz questions" on public.quiz_questions for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
drop policy if exists "Users manage own quiz attempts" on public.quiz_attempts;
create policy "Users manage own quiz attempts" on public.quiz_attempts for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
grant select,insert,update,delete on public.quizzes,public.quiz_questions,public.quiz_attempts to authenticated;
