const PUBLIC_SUPABASE_URL="https://nmtgfdjxgjxxdxibiavv.supabase.co";
const PUBLIC_SUPABASE_KEY="sb_publishable_ZxDemHTHOicSps8_LYRoyA_q56R5k-z";
const publicDb=window.supabase.createClient(PUBLIC_SUPABASE_URL,PUBLIC_SUPABASE_KEY);
const $p=id=>document.getElementById(id);
const safe=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const days=["","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
let payload=null,selectedSession=null;
function currentSession(){return payload.sessions.find(s=>s.id===selectedSession)||payload.sessions.find(s=>s.is_active)||payload.sessions[0]}
function renderSessions(){const host=$p("sessionCards");host.innerHTML=payload.sessions.map(s=>`<button class="session-card ${s.id===selectedSession?"active":""}" data-session="${s.id}"><span class="session-icon">${safe(s.session_type.slice(0,1))}</span><span><b>${safe(s.session_type)} Session</b><small>${safe(s.academic_year)} · ${s.is_active?"Current session":"Academic session"}</small></span></button>`).join("")||'<div class="empty">No academic sessions have been added yet.</div>'}
function renderOverview(){const s=currentSession(),classes=payload.timetable.filter(t=>t.session_id===s?.id);$p("overviewStats").innerHTML=[["Programmes",payload.courses.length],["Subjects",payload.subjects.length],["Teachers",payload.teachers.length],["Scheduled classes",classes.length]].map(([label,n])=>`<article class="overview-card"><span>${label}</span><b>${n}</b></article>`).join("")}
function renderCourses(){const host=$p("courseGrid");host.innerHTML=payload.courses.map(c=>{const subjects=payload.subjects.filter(s=>s.course_id===c.id);return `<article class="pub-card"><span class="course-code">${safe(c.code)}</span><h3>${safe(c.name)}</h3><p>${safe(c.description||"Department academic programme")} · ${safe(c.duration||"")}</p><div class="subject-list"><b>Subjects (${subjects.length})</b><ul>${subjects.map(s=>`<li>${safe(s.name)} · Sem ${safe(s.semester??"—")}</li>`).join("")||"<li>Subjects not added yet</li>"}</ul></div></article>`}).join("")||'<div class="empty">No programmes have been published yet.</div>'}
function renderTeachers(){$p("teacherGrid").innerHTML=payload.teachers.map(t=>`<article class="pub-card"><div class="teacher-avatar">${safe(t.full_name.split(/\s+/).map(x=>x[0]).slice(0,2).join("").toUpperCase())}</div><h3>${safe(t.full_name)}</h3><small>${safe(t.specialization||"Faculty member")}</small></article>`).join("")||'<div class="empty">Teacher information has not been added yet.</div>'}
function renderSections(){const s=currentSession(),rows=payload.timetable.filter(t=>t.session_id===s?.id),sections=[...new Set(rows.map(t=>t.section).filter(Boolean))].sort();$p("sectionFilter").innerHTML='<option value="all">All sections</option>'+sections.map(x=>`<option value="${safe(x)}">${safe(x)}</option>`).join("")}
function renderTimetable(){const s=currentSession(),semester=$p("semesterFilter").value,section=$p("sectionFilter").value;let rows=payload.timetable.filter(t=>t.session_id===s?.id);if(semester!=="all")rows=rows.filter(t=>String(t.semester)===semester);if(section!=="all")rows=rows.filter(t=>t.section===section);$p("timetableGrid").innerHTML=Array.from({length:6},(_,i)=>{const day=i+1,items=rows.filter(t=>Number(t.weekday)===day).sort((a,b)=>String(a.start_time).localeCompare(String(b.start_time)));return `<article class="day-card"><h3>${days[day]}</h3>${items.map(t=>`<div class="class-item"><b>${safe(t.subject_name||"Subject")}</b><small class="class-time">${safe(String(t.start_time||"").slice(0,5))} – ${safe(String(t.end_time||"").slice(0,5))}</small><small>${safe(t.course_name||"Programme")} · Semester ${safe(t.semester??"—")} · Section ${safe(t.section||"—")}</small><small>${safe(t.teacher_name||"Teacher not assigned")} · ${safe(t.room||"Room not specified")}</small></div>`).join("")||'<div class="empty">No classes published</div>'}</article>`}).join("")}
function renderCalendar(){const s=currentSession(),events=payload.calendar.filter(e=>!e.session_id||e.session_id===s?.id);$p("calendarList").innerHTML=events.map(e=>`<article class="calendar-item"><div class="calendar-date">${safe(e.start_date||"Date TBA")}</div><div><b>${safe(e.title)}</b><small>${safe(e.event_type)}${e.end_date&&e.end_date!==e.start_date?" · Until "+safe(e.end_date):""}</small></div></article>`).join("")||'<div class="empty">No public calendar events have been added for this session yet.</div>'}
function renderAll(){renderSessions();renderOverview();renderSections();renderTimetable();renderCalendar()}
document.addEventListener("click",e=>{const b=e.target.closest("[data-session]");if(!b)return;selectedSession=b.dataset.session;renderAll()});
$p("semesterFilter").addEventListener("change",renderTimetable);$p("sectionFilter").addEventListener("change",renderTimetable);
$p("year").textContent=new Date().getFullYear();
(async()=>{try{
 const queries=await Promise.all([
  publicDb.from("institution_profiles").select("institution_name").maybeSingle(),
  publicDb.from("academic_sessions").select("id,session_type,academic_year,start_date,end_date,is_active").order("academic_year",{ascending:false}),
  publicDb.from("courses").select("id,name,code,description,duration").order("name"),
  publicDb.from("subjects").select("id,course_id,name,code,semester").order("semester"),
  publicDb.from("teachers").select("id,full_name,specialization").order("full_name"),
  publicDb.from("timetable").select("id,course_id,subject_id,teacher_id,weekday,start_time,end_time,room,session_id,semester,section").order("weekday"),
  publicDb.from("academic_calendar_events").select("id,session_id,event_type,title,start_date,end_date").order("start_date")
 ]);
 for(const q of queries)if(q.error)throw q.error;
 const [profile,sessions,courses,subjects,teachers,timetable,calendar]=queries.map(q=>q.data);
 payload={institution:profile?.institution_name||"CASPAM Department",sessions:sessions||[],courses:courses||[],subjects:subjects||[],teachers:teachers||[],timetable:timetable||[],calendar:calendar||[]};
 const courseById=Object.fromEntries(payload.courses.map(x=>[x.id,x.name]));
 const subjectById=Object.fromEntries(payload.subjects.map(x=>[x.id,x.name]));
 const teacherById=Object.fromEntries(payload.teachers.map(x=>[x.id,x.full_name]));
 payload.timetable=payload.timetable.map(t=>({...t,course_name:courseById[t.course_id],subject_name:subjectById[t.subject_id],teacher_name:teacherById[t.teacher_id]}));
 $p("institutionName").textContent=payload.institution;
 selectedSession=payload.sessions.find(s=>s.is_active)?.id||payload.sessions[0]?.id||null;
 renderAll();renderCourses();renderTeachers();
}catch(err){$p("publicError").hidden=false;$p("publicError").textContent="Public information could not be loaded. Please refresh or contact the administrator.";console.error(err)}})();