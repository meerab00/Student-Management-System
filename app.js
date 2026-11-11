/* CampusDesk Student Management System — Supabase-backed version */
const SUPABASE_URL = "https://nmtgfdjxgjxxdxibiavv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ZxDemHTHOicSps8_LYRoyA_q56R5k-z";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let currentUser = null;
let institutionName = "Your institution";
let students = [], courses = [], attendance = {};
const $ = id => document.getElementById(id);
const today = () => { const d=new Date(); const local=new Date(d.getTime()-d.getTimezoneOffset()*60000); return local.toISOString().slice(0,10); };
function escapeHTML(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function toast(message){const el=$("toast");el.textContent=message;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2600)}
function initials(name){return String(name||"?").split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase()}
function courseName(id){return courses.find(c=>c.id===id)?.name||"Not assigned"}
function showAuth(message=""){ $("authScreen").hidden=false;$("appShell").hidden=true;if(message) $("authMessage").textContent=message; }
function showApp(){ $("authScreen").hidden=true;$("appShell").hidden=false;$("connectionLabel").textContent="Supabase connected";$("profileEmail").textContent=currentUser?.email||"Administrator"; }
function setInstitutionName(name){institutionName=String(name||"Your institution").trim()||"Your institution";$("institutionNameLabel").textContent=institutionName;$("institutionNameInput").value=institutionName;}
async function loadData(){
 const [c,s,a]=await Promise.all([
  db.from("courses").select("*").eq("user_id",currentUser.id).order("name"),
  db.from("students").select("*").eq("user_id",currentUser.id).order("created_at",{ascending:false}),
  db.from("attendance").select("*").eq("user_id",currentUser.id).order("attendance_date",{ascending:false})
 ]);
 for(const r of [c,s,a]) if(r.error) throw r.error;
 const profile=await db.from("institution_profiles").select("institution_name").eq("user_id",currentUser.id).maybeSingle();if(profile.error)throw profile.error;if(!profile.data){const created=await db.from("institution_profiles").insert({institution_name:"Your institution"});if(created.error)throw created.error;setInstitutionName("Your institution");}else setInstitutionName(profile.data.institution_name);
 courses=c.data||[]; students=(s.data||[]).map(x=>({...x,id:x.id,studentNumber:x.student_number,name:x.full_name,email:x.email,phone:x.phone,courseId:x.course_id,active:x.is_active}));
 attendance={};(a.data||[]).forEach(x=>{attendance[x.attendance_date] ||= {};attendance[x.attendance_date][x.student_id]=x.status});
 if(!courses.length){
  const defaults=[
   {name:"BS Mathematics",code:"MTH-101",description:"Mathematical sciences and analytical thinking",duration:"4 years"},
   {name:"Computer Science",code:"CS-101",description:"Computing, software and information technology",duration:"4 years"},
   {name:"English Literature",code:"ENG-101",description:"Language, literature and communication",duration:"4 years"},
   {name:"Business Studies",code:"BUS-101",description:"Business, management and entrepreneurship",duration:"4 years"}
  ];
  const result=await db.from("courses").insert(defaults);if(result.error)throw result.error;
  const refreshed=await db.from("courses").select("*").eq("user_id",currentUser.id).order("name");if(refreshed.error)throw refreshed.error;courses=refreshed.data||[];
 }
 render();
}
function studentMarkup(s){return `<div class="student-cell"><span class="mini-avatar">${initials(s.name)}</span><span><b>${escapeHTML(s.name)}</b><small>${escapeHTML(s.email)}</small></span></div>`}
function renderDashboard(){
 $("statStudents").textContent=students.length;$("statCourses").textContent=courses.length;
 const records=attendance[$("attendanceDate").value||today()]||{};const marked=Object.values(records).filter(v=>["Present","Absent","Late"].includes(v)).length;const present=Object.values(records).filter(v=>v==="Present").length;
 $("statPresent").textContent=present;$("statRate").textContent=marked?Math.round(present/marked*100)+"%":"0%";
 $("recentStudents").innerHTML=students.slice(0,5).map(s=>`<tr><td>${studentMarkup(s)}</td><td>${escapeHTML(s.studentNumber)}</td><td>${escapeHTML(courseName(s.courseId))}</td><td><span class="pill ${s.active?"":"inactive"}">${s.active?"Active":"Inactive"}</span></td></tr>`).join("")||'<tr><td colspan="4" class="empty-state">No students yet.</td></tr>';
}
function populateCourseFilters(){
 for(const id of ["studentCourseFilter","attendanceCourseFilter"]){const el=$(id),selected=el.value||"all";el.innerHTML='<option value="all">All courses</option>'+courses.map(c=>`<option value="${c.id}">${escapeHTML(c.name)}</option>`).join("");el.value=courses.some(c=>c.id===selected)?selected:"all";}
}
function renderStudents(){
 const q=($("studentSearch").value||"").toLowerCase();const courseFilter=$("studentCourseFilter").value||"all";const filtered=students.filter(s=>(courseFilter==="all"||s.courseId===courseFilter)&&[s.name,s.studentNumber,s.email,courseName(s.courseId)].join(" ").toLowerCase().includes(q));
 $("studentCount").textContent=filtered.length+" student"+(filtered.length===1?"":"s");
 $("studentsTable").innerHTML=filtered.map(s=>`<tr><td>${studentMarkup(s)}</td><td>${escapeHTML(s.studentNumber)}</td><td>${escapeHTML(s.email)}</td><td>${escapeHTML(courseName(s.courseId))}</td><td><span class="pill ${s.active?"":"inactive"}">${s.active?"Active":"Inactive"}</span></td><td><button class="action-btn" data-edit="${s.id}">Edit</button><button class="action-btn delete" data-delete="${s.id}">Delete</button></td></tr>`).join("")||'<tr><td colspan="6" class="empty-state">No matching students found.</td></tr>';
}
function renderCourses(){
 $("courseGrid").innerHTML=courses.map((c,i)=>'<article class="course-card"><div class="course-symbol">'+["∑","⌘","文","▥","✦"][i%5]+'</div><h3>'+escapeHTML(c.name)+'</h3><p>'+escapeHTML(c.description||"No description added")+'</p><div class="course-meta"><span>'+escapeHTML(c.code)+'</span><span>'+students.filter(s=>s.courseId===c.id).length+' students</span><span>'+escapeHTML(c.duration||"—")+'</span></div><div class="course-actions"><button class="action-btn" data-edit-course="'+c.id+'">Edit</button><button class="action-btn delete" data-delete-course="'+c.id+'">Delete</button></div></article>').join("")||'<div class="empty-state">No courses added yet.</div>';
}
function openCourseModal(course=null){
 $("courseForm").reset();$("editCourseId").value=course?course.id:"";
 $("courseModalTitle").textContent=course?"Edit course":"Add course";
 $("courseName").value=course?course.name:"";$("courseCode").value=course?course.code:"";
 $("courseDescription").value=course?(course.description||""):"";$("courseDuration").value=course?(course.duration||"4 years"):"4 years";
 $("courseModalBackdrop").classList.add("open");$("courseName").focus();
}
function closeCourseModal(){$("courseModalBackdrop").classList.remove("open")}
function renderAttendance(){
 const date=$("attendanceDate").value||today();const records=attendance[date]||{};const courseFilter=$("attendanceCourseFilter").value||"all";
 $("attendanceTable").innerHTML=students.filter(s=>s.active&&(courseFilter==="all"||s.courseId===courseFilter)).map(s=>'<tr><td>'+studentMarkup(s)+'</td><td>'+escapeHTML(s.studentNumber)+'</td><td>'+escapeHTML(courseName(s.courseId))+'</td><td><select class="attendance-select" data-attendance="'+s.id+'"><option value="" '+(!records[s.id]?"selected":"") +'>Select status</option><option value="Present" '+(records[s.id]==="Present"?"selected":"") +'>Present</option><option value="Absent" '+(records[s.id]==="Absent"?"selected":"") +'>Absent</option><option value="Late" '+(records[s.id]==="Late"?"selected":"") +'>Late</option></select></td></tr>').join("")||'<tr><td colspan="4" class="empty-state">Add active students before taking attendance.</td></tr>';
}
function render(){populateCourseFilters();renderDashboard();renderStudents();renderCourses();renderAttendance()}
function csvCell(value){return '"'+String(value??"").replace(/"/g,'""')+'"'}
function downloadCSV(filename,headers,rows){
 const content=[headers,...rows].map(row=>row.map(csvCell).join(",")).join("\r\n");
 const blob=new Blob([String.fromCharCode(0xFEFF),content],{type:"text/csv;charset=utf-8;"});
 const url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);
}
function exportStudents(){
 const courseFilter=$("studentCourseFilter").value||"all";const list=students.filter(s=>courseFilter==="all"||s.courseId===courseFilter);
 downloadCSV("campusdesk-students-"+today()+".csv",["Student ID","Full name","Email","Phone","Course","Status"],list.map(s=>[s.studentNumber,s.name,s.email,s.phone,courseName(s.courseId),s.active?"Active":"Inactive"]));
 toast("Student list exported.");
}
function exportAttendance(){
 const date=$("attendanceDate").value||today(),records=attendance[date]||{};
 const courseFilter=$("attendanceCourseFilter").value||"all";const rows=students.filter(s=>s.active&&(courseFilter==="all"||s.courseId===courseFilter)).map(s=>[s.studentNumber,s.name,courseName(s.courseId),records[s.id]||"Not marked"]);
 downloadCSV("campusdesk-attendance-"+date+".csv",["Student ID","Full name","Course","Attendance"],rows);toast("Attendance report exported.");
}
function showPage(page){document.querySelectorAll(".page-view").forEach(v=>v.classList.remove("active"));$(page+"Page").classList.add("active");document.querySelectorAll(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.page===page));$("pageCrumb").textContent=page[0].toUpperCase()+page.slice(1);$("sidebar").classList.remove("open");render()}
function openStudentModal(student=null){
 $("studentForm").reset();$("editStudentId").value=student?.id||"";$("modalTitle").textContent=student?"Edit student":"Add student";$("studentId").disabled=false;
 $("studentCourse").innerHTML=courses.map(c=>`<option value="${c.id}">${escapeHTML(c.name)}</option>`).join("");
 if(student){$("studentName").value=student.name;$("studentId").value=student.studentNumber;$("studentEmail").value=student.email;$("studentPhone").value=student.phone||"";$("studentCourse").value=student.courseId||""}
 $("modalBackdrop").classList.add("open");
}
function closeModal(){$("modalBackdrop").classList.remove("open");$("studentId").disabled=false}
async function handleAuth(e){
 e.preventDefault();const email=$("authEmail").value.trim(),password=$("authPassword").value;
 $("authSubmit").disabled=true;$("authMessage").textContent="Please wait…";
 try{
  const result=await db.auth.signInWithPassword({email,password});
  if(result.error)throw result.error;
  currentUser=result.data.user;showApp();await loadData();
 }catch(err){await db.auth.signOut();currentUser=null;showAuth(err.message||"Unable to sign in.")}
 finally{$("authSubmit").disabled=false}
}
$("authForm").addEventListener("submit",handleAuth);
function closeInstitutionModal(){$("institutionModalBackdrop").classList.remove("open")}
$("institutionSettingsBtn").addEventListener("click",()=>{$("institutionNameInput").value=institutionName;$("institutionModalBackdrop").classList.add("open")});
$("closeInstitutionModal").addEventListener("click",closeInstitutionModal);$("cancelInstitutionModal").addEventListener("click",closeInstitutionModal);$("institutionModalBackdrop").addEventListener("click",e=>{if(e.target===$("institutionModalBackdrop"))closeInstitutionModal()});
$("institutionForm").addEventListener("submit",async e=>{e.preventDefault();const name=$("institutionNameInput").value.trim();if(!name)return toast("Please enter your institution name.");$("saveInstitutionBtn").disabled=true;const {error}=await db.from("institution_profiles").upsert({user_id:currentUser.id,institution_name:name,updated_at:new Date().toISOString()},{onConflict:"user_id"});$("saveInstitutionBtn").disabled=false;if(error)return toast(error.message);setInstitutionName(name);closeInstitutionModal();toast("Institution profile saved.");});
document.addEventListener("click",async e=>{
 const nav=e.target.closest("[data-page]");if(nav)showPage(nav.dataset.page);
 const go=e.target.closest("[data-go]");if(go)showPage(go.dataset.go);
 const action=e.target.closest("[data-action]");
 if(action?.dataset.action==="add-student")openStudentModal();
 if(action?.dataset.action==="add-course"){
  openCourseModal();
 }
 const edit=e.target.closest("[data-edit]");if(edit){const s=students.find(x=>x.id===edit.dataset.edit);if(s)openStudentModal(s)}
 const editCourse=e.target.closest("[data-edit-course]");if(editCourse){const course=courses.find(x=>x.id===editCourse.dataset.editCourse);if(course)openCourseModal(course)}
 const deleteCourse=e.target.closest("[data-delete-course]");if(deleteCourse){const course=courses.find(x=>x.id===deleteCourse.dataset.deleteCourse);if(course&&confirm("Delete "+course.name+"? Existing students will remain, but their course assignment will be cleared.")){const result=await db.from("courses").delete().eq("id",course.id);if(result.error)return toast(result.error.message);await loadData();toast("Course deleted.")}}
 const del=e.target.closest("[data-delete]");if(del){const s=students.find(x=>x.id===del.dataset.delete);if(s&&confirm("Delete "+s.name+"? This cannot be undone.")){const {error}=await db.from("students").delete().eq("id",s.id);if(error)return toast(error.message);await loadData();toast("Student deleted.")}}
});
$("studentForm").addEventListener("submit",async e=>{
 e.preventDefault();const oldId=$("editStudentId").value;
 const existing=oldId?students.find(s=>s.id===oldId):null;
 const record={student_number:$("studentId").value.trim(),full_name:$("studentName").value.trim(),email:$("studentEmail").value.trim(),phone:$("studentPhone").value.trim(),course_id:$("studentCourse").value||null,is_active:existing?existing.active:true};
 const result=oldId?await db.from("students").update(record).eq("id",oldId):await db.from("students").insert(record);
 if(result.error)return toast(result.error.message);
 closeModal();await loadData();toast(oldId?"Student updated.":"Student added successfully.");
});
$("closeModal").addEventListener("click",closeModal);$("cancelModal").addEventListener("click",closeModal);$("modalBackdrop").addEventListener("click",e=>{if(e.target===$("modalBackdrop"))closeModal()});
$("courseForm").addEventListener("submit",async e=>{e.preventDefault();const id=$("editCourseId").value;const record={name:$("courseName").value.trim(),code:$("courseCode").value.trim().toUpperCase(),description:$("courseDescription").value.trim(),duration:$("courseDuration").value.trim()};if(!record.name||!record.code)return toast("Course name and code are required.");const result=id?await db.from("courses").update(record).eq("id",id):await db.from("courses").insert(record);if(result.error)return toast(result.error.code==="23505"?"A course with this name or code already exists.":result.error.message);closeCourseModal();await loadData();toast(id?"Course updated.":"Course added successfully.");});
$("closeCourseModal").addEventListener("click",closeCourseModal);$("cancelCourseModal").addEventListener("click",closeCourseModal);$("courseModalBackdrop").addEventListener("click",e=>{if(e.target===$("courseModalBackdrop"))closeCourseModal()});
$("studentSearch").addEventListener("input",renderStudents);$("studentCourseFilter").addEventListener("change",renderStudents);$("attendanceCourseFilter").addEventListener("change",renderAttendance);$("attendanceDate").addEventListener("change",renderAttendance);$("exportStudents").addEventListener("click",exportStudents);$("exportAttendance").addEventListener("click",exportAttendance);
$("saveAttendance").addEventListener("click",async()=>{
 const date=$("attendanceDate").value||today();const controls=[...document.querySelectorAll("[data-attendance]")];
 if(!controls.length)return toast("There are no active students to mark.");
 if(controls.some(el=>!el.value))return toast("Please select an attendance status for every active student.");
 const rows=controls.map(el=>({student_id:el.dataset.attendance,attendance_date:date,status:el.value}));
 const {error}=await db.from("attendance").upsert(rows,{onConflict:"student_id,attendance_date"});if(error)return toast(error.message);
 await loadData();toast("Attendance saved for "+date+".");
});
$("menuBtn").addEventListener("click",()=>$("sidebar").classList.toggle("open"));
$("logoutBtn").addEventListener("click",async()=>{await db.auth.signOut();currentUser=null;showAuth("You have signed out.")});
$("todayDate").textContent=new Intl.DateTimeFormat("en",{weekday:"short",month:"short",day:"numeric",year:"numeric"}).format(new Date());
$("attendanceDate").value=today();$("year").textContent=new Date().getFullYear();
db.auth.getSession().then(async({data,error})=>{if(error)return showAuth(error.message);if(data.session){currentUser=data.session.user;showApp();try{await loadData()}catch(err){await db.auth.signOut();currentUser=null;showAuth("Could not load records: "+err.message)}}else showAuth()});
db.auth.onAuthStateChange((_event,session)=>{if(!session){currentUser=null;showAuth()}});
