/* CampusDesk Student Management System — Supabase-backed version */
const SUPABASE_URL = "https://nmtgfdjxgjxxdxibiavv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ZxDemHTHOicSps8_LYRoyA_q56R5k-z";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let currentUser = null;
let institutionName = "Student Management System";
let academicSessions = [];
let activeAcademicSession = null;
let students = [], courses = [], attendance = {};
const $ = id => document.getElementById(id);
const today = () => { const d=new Date(); const local=new Date(d.getTime()-d.getTimezoneOffset()*60000); return local.toISOString().slice(0,10); };
function escapeHTML(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function toast(message){const el=$("toast");el.textContent=message;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2600)}
function initials(name){return String(name||"?").split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase()}
function courseName(id){return courses.find(c=>c.id===id)?.name||"Not assigned"}
function visibleStudents(){return typeof window.getSessionStudents==="function"?window.getSessionStudents():students;}
async function loadAcademicSessions(){
 const {data,error}=await db.from("academic_sessions").select("*").eq("user_id",currentUser.id).order("academic_year",{ascending:false}).order("session_type");
 if(error)throw error;
 academicSessions=data||[];
 if(!academicSessions.length){
  const year=new Date().getFullYear(),rows=["Spring","Summer","Fall"].map(type=>({user_id:currentUser.id,session_type:type,academic_year:year,is_active:type==="Spring"}));
  const created=await db.from("academic_sessions").insert(rows).select("*");if(created.error)throw created.error;academicSessions=created.data||[];
 }
 if(!academicSessions.length)throw new Error("No academic sessions are configured for this account.");
 if(!activeAcademicSession||!academicSessions.some(s=>s.id===activeAcademicSession.id))activeAcademicSession=academicSessions.find(s=>s.is_active)||academicSessions[0];
 renderSessionSelector();
}
function renderSessionSelector(){
 const host=$("sessionCards");if(!host)return;
 $("activeSessionLabel").textContent=activeAcademicSession?activeAcademicSession.session_type+" "+activeAcademicSession.academic_year:"Select a session";
 host.innerHTML=academicSessions.map(s=>`<button type="button" class="session-card ${activeAcademicSession?.id===s.id?"active":""}" data-academic-session="${s.id}" aria-pressed="${activeAcademicSession?.id===s.id}"><i class="session-dot"></i><b>${escapeHTML(s.session_type)}</b><span>${escapeHTML(s.academic_year)}</span></button>`).join("");
}
async function selectAcademicSession(id){
 const next=academicSessions.find(s=>s.id===id);if(!next||next.id===activeAcademicSession?.id)return;
 try{
  const clear=await db.from("academic_sessions").update({is_active:false}).eq("user_id",currentUser.id);if(clear.error)throw clear.error;
  const chosen=await db.from("academic_sessions").update({is_active:true}).eq("id",id).eq("user_id",currentUser.id);if(chosen.error)throw chosen.error;
  academicSessions=academicSessions.map(s=>({...s,is_active:s.id===id}));activeAcademicSession=next;renderSessionSelector();await loadData();toast(next.session_type+" "+next.academic_year+" session opened.");
 }catch(err){toast("Could not switch session: "+err.message);}
}
function showAuth(message=""){ $("authScreen").hidden=false;$("appShell").hidden=true;if(message) $("authMessage").textContent=message; }
function showApp(){ $("authScreen").hidden=true;$("appShell").hidden=false;$("connectionLabel").textContent="Supabase connected";$("profileEmail").textContent=currentUser?.email||"Administrator"; }
function setInstitutionName(name){institutionName=String(name||"Student Management System").trim()||"Student Management System";$("institutionNameLabel").textContent=institutionName;$("institutionNameInput").value=institutionName;}
async function loadData(){
 await loadAcademicSessions();
 const [c,s,a]=await Promise.all([
  db.from("courses").select("*").eq("user_id",currentUser.id).order("name"),
  db.from("students").select("*").eq("user_id",currentUser.id).order("created_at",{ascending:false}),
  db.from("attendance").select("*").eq("user_id",currentUser.id).eq("session_id",activeAcademicSession.id).order("attendance_date",{ascending:false})
 ]);
 for(const r of [c,s,a]) if(r.error) throw r.error;
 const profile=await db.from("institution_profiles").select("institution_name").eq("user_id",currentUser.id).maybeSingle();if(profile.error)throw profile.error;
 if(!profile.data){const created=await db.from("institution_profiles").insert({user_id:currentUser.id,institution_name:institutionName});if(created.error)throw created.error;setInstitutionName(institutionName);}
 else setInstitutionName(profile.data.institution_name);
 courses=c.data||[]; students=(s.data||[]).map(x=>({...x,id:x.id,studentNumber:x.student_number,name:x.full_name,email:x.email,phone:x.phone,courseId:x.course_id,active:x.is_active,fatherName:x.father_name||"",fatherCnic:x.father_cnic||"",motherName:x.mother_name||"",motherCnic:x.mother_cnic||"",guardianPhone:x.guardian_phone||"",dateOfBirth:x.date_of_birth||"",gender:x.gender||"",address:x.address||"",admissionDate:x.admission_date||""}));
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
 if(typeof window.loadAcademicModules==="function") await window.loadAcademicModules();
 renderSessionSelector();render();
}
function studentMarkup(s){return `<div class="student-cell"><span class="mini-avatar">${initials(s.name)}</span><span><b>${escapeHTML(s.name)}</b><small>${escapeHTML(s.email)}</small></span></div>`}
function renderDashboard(){
 const currentStudents=visibleStudents();
 const active=currentStudents.filter(s=>s.active).length,inactive=currentStudents.length-active;
 const records=attendance[today()]||{};const values=Object.values(records);
 const present=values.filter(v=>v==="Present").length,absent=values.filter(v=>v==="Absent").length,late=values.filter(v=>v==="Late").length;
 const marked=present+absent+late,unmarked=Math.max(0,active-marked),rate=marked?Math.round(present/marked*100):0;
 $("statStudents").textContent=currentStudents.length;$("statActive").textContent=active;$("statInactiveNote").textContent=inactive+" inactive";
 $("statCourses").textContent=courses.length;$("statPresent").textContent=present;$("statRate").textContent=rate+"%";
 $("statAttendanceNote").textContent=marked+" of "+active+" marked today";
 $("dashPresent").textContent=present;$("dashAbsent").textContent=absent;$("dashLate").textContent=late;$("dashUnmarked").textContent=unmarked;
 $("attendanceRing").style.background="conic-gradient(#239b72 0 "+(active?present/active*100:0)+"%,#e9edf5 "+(active?present/active*100:0)+"% 100%)";
 $("recentStudents").innerHTML=currentStudents.slice(0,5).map(s=>`<tr><td>${studentMarkup(s)}</td><td>${escapeHTML(s.studentNumber)}</td><td>${escapeHTML(courseName(s.courseId))}</td><td><span class="pill ${s.active?"":"inactive"}">${s.active?"Active":"Inactive"}</span></td></tr>`).join("")||'<tr><td colspan="4" class="empty-state">No students enrolled in this session yet.</td></tr>';
 $("courseDistribution").innerHTML=courses.map(c=>{const count=currentStudents.filter(s=>s.courseId===c.id).length;const width=currentStudents.length?Math.round(count/currentStudents.length*100):0;return `<div class="course-bar-row"><div class="course-bar-label"><span>${escapeHTML(c.name)}</span><b>${count}</b></div><div class="course-bar-track"><i style="width:${width}%"></i></div></div>`}).join("")||'<p class="empty-state">Add courses to see enrolment distribution.</p>';
}
function populateCourseFilters(){
 for(const id of ["studentCourseFilter","attendanceCourseFilter","timetableCourseFilter"]){const el=$(id),selected=el.value||"all";el.innerHTML='<option value="all">All courses</option>'+courses.map(c=>`<option value="${c.id}">${escapeHTML(c.name)}</option>`).join("");el.value=courses.some(c=>c.id===selected)?selected:"all";}
}
function renderStudents(){
 const currentStudents=visibleStudents(),q=($("studentSearch").value||"").toLowerCase(),courseFilter=$("studentCourseFilter").value||"all";
 const filtered=currentStudents.filter(s=>(courseFilter==="all"||s.courseId===courseFilter)&&[s.name,s.studentNumber,s.email,courseName(s.courseId)].join(" ").toLowerCase().includes(q));
 $("studentCount").textContent=filtered.length+" student"+(filtered.length===1?"":"s");
 $("studentsTable").innerHTML=filtered.map(s=>`<tr><td>${studentMarkup(s)}</td><td>${escapeHTML(s.studentNumber)}</td><td>${escapeHTML(s.email)}</td><td>${escapeHTML(courseName(s.courseId))}</td><td>${s.semester?"Semester "+escapeHTML(s.semester):"—"}</td><td>${escapeHTML(s.section||"—")}</td><td><span class="pill ${s.active?"":"inactive"}">${s.active?"Active":"Inactive"}</span></td><td><button class="action-btn" data-view-student="${s.id}">View</button><button class="action-btn" data-student-pdf="${s.id}">PDF</button><button class="action-btn" data-edit="${s.id}">Edit</button><button class="action-btn delete" data-delete="${s.id}">Delete</button></td></tr>`).join("")||'<tr><td colspan="8" class="empty-state">No students enrolled in this session.</td></tr>';
}
function renderCourses(){
 $("courseGrid").innerHTML=courses.map((c,i)=>'<article class="course-card"><div class="course-symbol">'+["∑","⌘","文","▥","✦"][i%5]+'</div><h3>'+escapeHTML(c.name)+'</h3><p>'+escapeHTML(c.description||"No description added")+'</p><div class="course-meta"><span>'+escapeHTML(c.code)+'</span><span>'+visibleStudents().filter(s=>s.courseId===c.id).length+' students</span><span>'+(window.getCourseSubjectCount?window.getCourseSubjectCount(c.id):0)+' subjects</span><span>'+escapeHTML(c.duration||"—")+'</span></div><div class="course-actions"><button class="action-btn" data-edit-course="'+c.id+'">Edit</button><button class="action-btn delete" data-delete-course="'+c.id+'">Delete</button></div></article>').join("")||'<div class="empty-state">No courses added yet.</div>';
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
 const date=$("attendanceDate").value||today(),records=attendance[date]||{},courseFilter=$("attendanceCourseFilter").value||"all",semesterFilter=$("attendanceSemesterFilter").value||"all",sectionFilter=($("attendanceSectionFilter").value||"").trim().toLowerCase();
 const group=visibleStudents().filter(s=>s.active&&(courseFilter==="all"||s.courseId===courseFilter)&&(semesterFilter==="all"||String(s.semester||"")===semesterFilter)&&(!sectionFilter||String(s.section||"").toLowerCase().includes(sectionFilter)));
 $("attendanceTable").innerHTML=group.map(s=>'<tr><td>'+studentMarkup(s)+'</td><td>'+escapeHTML(s.studentNumber)+'</td><td>'+escapeHTML(courseName(s.courseId))+'</td><td>'+(s.semester?"Semester "+escapeHTML(s.semester):"—")+'</td><td>'+escapeHTML(s.section||"—")+'</td><td><select class="attendance-select" data-attendance="'+s.id+'"><option value="" '+(!records[s.id]?"selected":"") +'>Select status</option><option value="Present" '+(records[s.id]==="Present"?"selected":"") +'>Present</option><option value="Absent" '+(records[s.id]==="Absent"?"selected":"") +'>Absent</option><option value="Late" '+(records[s.id]==="Late"?"selected":"") +'>Late</option></select></td></tr>').join("")||'<tr><td colspan="6" class="empty-state">No active students in this class for the selected session.</td></tr>';
}
function render(){populateCourseFilters();renderDashboard();renderStudents();renderCourses();renderAttendance()}
function csvCell(value){return '"'+String(value??"").replace(/"/g,'""')+'"'}
function downloadCSV(filename,headers,rows){
 const content=[headers,...rows].map(row=>row.map(csvCell).join(",")).join("\r\n");
 const blob=new Blob([String.fromCharCode(0xFEFF),content],{type:"text/csv;charset=utf-8;"});
 const url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);
}
function exportStudents(){
 const courseFilter=$("studentCourseFilter").value||"all",list=visibleStudents().filter(s=>courseFilter==="all"||s.courseId===courseFilter);
 downloadCSV("campusdesk-"+activeAcademicSession.session_type.toLowerCase()+"-students-"+today()+".csv",["Student ID","Full name","Semester","Section","Date of birth","Gender","Email","Student phone","Father name","Father CNIC","Mother name","Mother CNIC","Guardian phone","Address","Course","Admission date","Status"],list.map(s=>[s.studentNumber,s.name,s.semester,s.section,s.dateOfBirth,s.gender,s.email,s.phone,s.fatherName,s.fatherCnic,s.motherName,s.motherCnic,s.guardianPhone,s.address,courseName(s.courseId),s.admissionDate,s.active?"Active":"Inactive"]));
 toast("Student list exported.");
}
function exportAttendance(){
 const date=$("attendanceDate").value||today(),records=attendance[date]||{},courseFilter=$("attendanceCourseFilter").value||"all",semesterFilter=$("attendanceSemesterFilter").value||"all",sectionFilter=($("attendanceSectionFilter").value||"").trim().toLowerCase();
 const rows=visibleStudents().filter(s=>s.active&&(courseFilter==="all"||s.courseId===courseFilter)&&(semesterFilter==="all"||String(s.semester||"")===semesterFilter)&&(!sectionFilter||String(s.section||"").toLowerCase().includes(sectionFilter))).map(s=>[s.studentNumber,s.name,courseName(s.courseId),s.semester?"Semester "+s.semester:"",s.section||"",records[s.id]||"Not marked"]);
 downloadCSV("campusdesk-"+activeAcademicSession.session_type.toLowerCase()+"-attendance-"+date+".csv",["Student ID","Full name","Course","Semester","Section","Attendance"],rows);toast("Student attendance exported.");
}
function printCampusDeskReport(title, headers, rows, subtitle=""){
 const win=window.open("","_blank");
 if(!win){toast("Please allow pop-ups to print or save this report as PDF.");return;}
 const head=headers.map(h=>"<th>"+escapeHTML(h)+"</th>").join("");
 const body=rows.length?rows.map(row=>"<tr>"+row.map(v=>"<td>"+escapeHTML(v??"—")+"</td>").join("")+"</tr>").join(""):'<tr><td colspan="'+headers.length+'" class="empty">No records found.</td></tr>';
 win.document.open();
 win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHTML(title)} - CampusDesk</title><style>
 *{box-sizing:border-box}body{font:13px Arial,sans-serif;color:#172033;padding:28px}h1{font-size:22px;margin:0 0 4px}h2{font-size:16px;margin:18px 0 8px}.muted{color:#667085;margin:0 0 18px}.meta{font-size:11px;color:#667085;margin-bottom:16px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #d8deea;padding:8px;text-align:left;vertical-align:top}th{background:#f1f4f9;font-size:10px;letter-spacing:.04em}.empty{text-align:center;color:#667085;padding:22px}@media print{body{padding:0}thead{display:table-header-group}tr{page-break-inside:avoid}}
 </style></head><body><h1>${escapeHTML(institutionName)}</h1><h2>${escapeHTML(title)}</h2><p class="muted">${escapeHTML(subtitle)}</p><div class="meta">Generated by CampusDesk · ${escapeHTML(new Date().toLocaleString())}</div><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`);
 win.document.close();setTimeout(()=>{win.focus();win.print();},250);
}
function exportStudentsPDF(){
 const filter=$("studentCourseFilter").value||"all",q=($("studentSearch").value||"").toLowerCase();
 const rows=visibleStudents().filter(s=>(filter==="all"||s.courseId===filter)&&[s.name,s.studentNumber,s.email,courseName(s.courseId)].join(" ").toLowerCase().includes(q))
 .map(s=>[s.studentNumber,s.name,s.email,courseName(s.courseId),s.semester?"Semester "+s.semester:"",s.section||"",s.phone,s.active?"Active":"Inactive"]);
 printCampusDeskReport("Student Records",["Student ID","Student Name","Email","Course","Semester","Section","Phone","Status"],rows,"Session: "+activeAcademicSession.session_type+" "+activeAcademicSession.academic_year+". Student records matching the current search and course filter.");
}
function exportStudentPDF(studentId){
 const s=visibleStudents().find(x=>x.id===studentId);
 if(!s)return toast("Student record not found.");
 const fields=[["Student name",s.name],["Student ID",s.studentNumber],["Academic session",activeAcademicSession.session_type+" "+activeAcademicSession.academic_year],["Semester",s.semester?"Semester "+s.semester:""],["Section",s.section],["Date of birth",s.dateOfBirth],["Gender",s.gender],["Course",courseName(s.courseId)],["Email",s.email],["Phone number",s.phone],["Father name",s.fatherName],["Father CNIC",s.fatherCnic],["Mother name",s.motherName],["Mother CNIC",s.motherCnic],["Parent / guardian phone",s.guardianPhone],["Address",s.address],["Admission date",s.admissionDate],["Status",s.active?"Active":"Inactive"]];
 printCampusDeskReport("Student Profile — "+s.name,["Information","Details"],fields,"Individual student profile. Keep this document confidential because it may contain personal information.");
}
function exportAttendancePDF(){
 const date=$("attendanceDate").value||today(),records=attendance[date]||{},filter=$("attendanceCourseFilter").value||"all",semesterFilter=$("attendanceSemesterFilter").value||"all",sectionFilter=($("attendanceSectionFilter").value||"").trim().toLowerCase();
 const rows=visibleStudents().filter(s=>s.active&&(filter==="all"||s.courseId===filter)&&(semesterFilter==="all"||String(s.semester||"")===semesterFilter)&&(!sectionFilter||String(s.section||"").toLowerCase().includes(sectionFilter))).map(s=>[s.studentNumber,s.name,courseName(s.courseId),s.semester?"Semester "+s.semester:"",s.section||"",records[s.id]||"Not marked"]);
 printCampusDeskReport("Attendance Report",["Student ID","Student Name","Course","Semester","Section","Status"],rows,"Session: "+activeAcademicSession.session_type+" "+activeAcademicSession.academic_year+" · Attendance date: "+date);
}
function showPage(page){document.querySelectorAll(".page-view").forEach(v=>v.classList.remove("active"));$(page+"Page").classList.add("active");document.querySelectorAll(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.page===page));$("pageCrumb").textContent=page[0].toUpperCase()+page.slice(1);$("sidebar").classList.remove("open");render()}
function openStudentModal(student=null){
 $("studentForm").reset();$("editStudentId").value=student?.id||"";$("modalTitle").textContent=student?"Edit student":"Add student";$("studentId").value=student?student.studentNumber:"";$("studentId").placeholder=student?"Student ID is permanent":"Generated automatically when saved";$("studentId").readOnly=true;
 $("studentCourse").innerHTML=courses.map(c=>`<option value="${c.id}">${escapeHTML(c.name)}</option>`).join("");
 if(student){$("studentName").value=student.name;$("studentId").value=student.studentNumber;$("studentEmail").value=student.email;$("studentPhone").value=student.phone||"";$("studentCourse").value=student.courseId||"";$("studentSemester").value=student.semester||"";$("studentSection").value=student.section||"";$("fatherName").value=student.fatherName||"";$("fatherCnic").value=student.fatherCnic||"";$("motherName").value=student.motherName||"";$("motherCnic").value=student.motherCnic||"";$("guardianPhone").value=student.guardianPhone||"";$("dateOfBirth").value=student.dateOfBirth||"";$("gender").value=student.gender||"";$("studentAddress").value=student.address||"";$("admissionDate").value=student.admissionDate||"";}
 $("modalBackdrop").classList.add("open");
}
function closeModal(){$("modalBackdrop").classList.remove("open");$("studentId").readOnly=true}
function showStudentDetails(student){
 const fields=[["Student name",student.name],["Student ID",student.studentNumber],["Programme semester",student.semester?"Semester "+student.semester:""],["Section",student.section],["Date of birth",student.dateOfBirth],["Gender",student.gender],["Subject / Course",courseName(student.courseId)],["Phone number",student.phone],["Gmail address",student.email],["Father name",student.fatherName],["Father CNIC",student.fatherCnic],["Mother name",student.motherName],["Mother CNIC",student.motherCnic],["Parent / guardian phone",student.guardianPhone],["Address",student.address],["Admission date",student.admissionDate]];
 $("studentDetailsTitle").textContent=student.name+" — Student details";
 $("studentDetailsContent").innerHTML=fields.map(([label,value])=>'<div class="detail-item"><small>'+escapeHTML(label)+'</small><strong>'+escapeHTML(value||"Not provided")+'</strong></div>').join("");
 $("studentDetailsBackdrop").classList.add("open");
}
function closeStudentDetails(){$("studentDetailsBackdrop").classList.remove("open")}
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
 const session=e.target.closest("[data-academic-session]");if(session){await selectAcademicSession(session.dataset.academicSession);return;}
 const nav=e.target.closest("[data-page]");if(nav)showPage(nav.dataset.page);
 const go=e.target.closest("[data-go]");if(go)showPage(go.dataset.go);
 const action=e.target.closest("[data-action]");
 if(action?.dataset.action==="add-student")openStudentModal();
 if(action?.dataset.action==="add-course"){
  openCourseModal();
 }
 if(action?.dataset.action==="view-course-subjects"){showPage("subjects");}
 const edit=e.target.closest("[data-edit]");if(edit){const s=visibleStudents().find(x=>x.id===edit.dataset.edit);if(s)openStudentModal(s)}
 const viewStudent=e.target.closest("[data-view-student]");if(viewStudent){const s=visibleStudents().find(x=>x.id===viewStudent.dataset.viewStudent);if(s)showStudentDetails(s)}
 const studentPdf=e.target.closest("[data-student-pdf]");if(studentPdf)exportStudentPDF(studentPdf.dataset.studentPdf);
 const editCourse=e.target.closest("[data-edit-course]");if(editCourse){const course=courses.find(x=>x.id===editCourse.dataset.editCourse);if(course)openCourseModal(course)}
 const deleteCourse=e.target.closest("[data-delete-course]");if(deleteCourse){const course=courses.find(x=>x.id===deleteCourse.dataset.deleteCourse);if(course&&confirm("Delete "+course.name+"? Existing students will remain, but their course assignment will be cleared.")){const result=await db.from("courses").delete().eq("id",course.id);if(result.error)return toast(result.error.message);await loadData();toast("Course deleted.")}}
 const del=e.target.closest("[data-delete]");if(del){const s=students.find(x=>x.id===del.dataset.delete);if(s&&confirm("Delete "+s.name+"? This cannot be undone.")){const {error}=await db.from("students").delete().eq("id",s.id);if(error)return toast(error.message);await loadData();toast("Student deleted.")}}
});
$("studentForm").addEventListener("submit",async e=>{
 e.preventDefault();
 const oldId=$("editStudentId").value,existing=oldId?students.find(s=>s.id===oldId):null;
 const saveButton=$("saveStudentBtn");saveButton.disabled=true;saveButton.textContent="Saving…";
 const record={user_id:currentUser.id,full_name:$("studentName").value.trim(),email:$("studentEmail").value.trim(),phone:$("studentPhone").value.trim(),course_id:$("studentCourse").value||null,father_name:$("fatherName").value.trim(),father_cnic:$("fatherCnic").value.trim(),mother_name:$("motherName").value.trim(),mother_cnic:$("motherCnic").value.trim(),guardian_phone:$("guardianPhone").value.trim(),date_of_birth:$("dateOfBirth").value||null,gender:$("gender").value||null,address:$("studentAddress").value.trim(),admission_date:$("admissionDate").value||null,is_active:existing?existing.active:true};
 try{
  let studentId=oldId;
  if(oldId){const result=await db.from("students").update(record).eq("id",oldId).eq("user_id",currentUser.id);if(result.error)throw result.error;}
  else{const result=await db.from("students").insert(record).select("id").single();if(result.error)throw result.error;studentId=result.data.id;}
  const {data:existingEnrollment,error:enrollmentLookupError}=await db.from("enrollments").select("id").eq("student_id",studentId).eq("session_id",activeAcademicSession.id).maybeSingle();
  if(enrollmentLookupError)throw enrollmentLookupError;
  const enrollment={user_id:currentUser.id,student_id:studentId,course_id:record.course_id,semester:$("studentSemester").value?Number($("studentSemester").value):null,section:$("studentSection").value.trim(),enrolled_on:record.admission_date||today(),status:"Active",session_id:activeAcademicSession.id};
  const enrollmentResult=existingEnrollment?await db.from("enrollments").update(enrollment).eq("id",existingEnrollment.id):await db.from("enrollments").insert(enrollment);
  if(enrollmentResult.error)throw enrollmentResult.error;
  closeModal();await loadData();toast(oldId?"Student updated.":"Student added to "+activeAcademicSession.session_type+" session.");
 }catch(err){toast("Could not save student: "+(err.message||"Please try again."));}
 finally{saveButton.disabled=false;saveButton.textContent="Save student";}
});
$("closeStudentDetails").addEventListener("click",closeStudentDetails);$("closeStudentDetailsBtn").addEventListener("click",closeStudentDetails);$("studentDetailsBackdrop").addEventListener("click",e=>{if(e.target===$("studentDetailsBackdrop"))closeStudentDetails()});
$("closeModal").addEventListener("click",closeModal);$("cancelModal").addEventListener("click",closeModal);$("modalBackdrop").addEventListener("click",e=>{if(e.target===$("modalBackdrop"))closeModal()});
$("courseForm").addEventListener("submit",async e=>{e.preventDefault();const id=$("editCourseId").value;const record={name:$("courseName").value.trim(),code:$("courseCode").value.trim().toUpperCase(),description:$("courseDescription").value.trim(),duration:$("courseDuration").value.trim()};if(!record.name||!record.code)return toast("Course name and code are required.");const result=id?await db.from("courses").update(record).eq("id",id):await db.from("courses").insert(record);if(result.error)return toast(result.error.code==="23505"?"A course with this name or code already exists.":result.error.message);closeCourseModal();await loadData();toast(id?"Course updated.":"Course added successfully.");});
$("closeCourseModal").addEventListener("click",closeCourseModal);$("cancelCourseModal").addEventListener("click",closeCourseModal);$("courseModalBackdrop").addEventListener("click",e=>{if(e.target===$("courseModalBackdrop"))closeCourseModal()});
$("studentSearch").addEventListener("input",renderStudents);$("studentCourseFilter").addEventListener("change",renderStudents);$("attendanceCourseFilter").addEventListener("change",renderAttendance);$("attendanceSemesterFilter").addEventListener("change",renderAttendance);$("attendanceSectionFilter").addEventListener("input",renderAttendance);$("attendanceDate").addEventListener("change",renderAttendance);$("exportStudents").addEventListener("click",exportStudents);$("exportAttendance").addEventListener("click",exportAttendance);$("exportStudentsPdf").addEventListener("click",exportStudentsPDF);$("exportAttendancePdf").addEventListener("click",exportAttendancePDF);
$("saveAttendance").addEventListener("click",async()=>{
 const date=$("attendanceDate").value||today(),controls=[...document.querySelectorAll("[data-attendance]")];
 if(!controls.length)return toast("There are no active students to mark.");
 if(controls.some(el=>!el.value))return toast("Please select an attendance status for every active student.");
 const rows=controls.map(el=>({user_id:currentUser.id,student_id:el.dataset.attendance,attendance_date:date,status:el.value,session_id:activeAcademicSession.id}));
 const {error}=await db.from("attendance").upsert(rows,{onConflict:"student_id,attendance_date,session_id"});if(error)return toast(error.message);
 await loadData();toast("Attendance saved for "+date+".");
});
$("menuBtn").addEventListener("click",()=>$("sidebar").classList.toggle("open"));
$("logoutBtn").addEventListener("click",async()=>{await db.auth.signOut();currentUser=null;showAuth("You have signed out.")});
$("todayDate").textContent=new Intl.DateTimeFormat("en",{weekday:"short",month:"short",day:"numeric",year:"numeric"}).format(new Date());
$("attendanceDate").value=today();$("year").textContent=new Date().getFullYear();
(async()=>{try{await db.auth.signOut();}catch(error){console.error("Could not clear previous admin session:",error);}currentUser=null;showAuth();})();
db.auth.onAuthStateChange((_event,session)=>{if(!session){currentUser=null;showAuth()}});
