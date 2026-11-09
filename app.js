/* CampusDesk Student Management System
   Demo mode stores sample records in this browser.
   To use a shared online database, add Supabase URL and anon key below
   and run the SQL in supabase/schema.sql. Never put a service-role key here.
*/
const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";
const supabaseReady = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase);
const db = supabaseReady ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const seedStudents = [
 {id:"STU-1001",name:"Ayesha Khan",email:"ayesha@example.com",phone:"0300-1234567",course:"BS Mathematics",active:true},
 {id:"STU-1002",name:"Hamza Ali",email:"hamza@example.com",phone:"0301-2345678",course:"Computer Science",active:true},
 {id:"STU-1003",name:"Fatima Noor",email:"fatima@example.com",phone:"0302-3456789",course:"English Literature",active:true},
 {id:"STU-1004",name:"Ahmed Raza",email:"ahmed@example.com",phone:"0303-4567890",course:"BS Mathematics",active:true},
 {id:"STU-1005",name:"Zainab Iqbal",email:"zainab@example.com",phone:"0304-5678901",course:"Business Studies",active:false}
];
const seedCourses = [
 {name:"BS Mathematics",code:"MTH-101",description:"Mathematical sciences and analytical thinking",duration:"4 years"},
 {name:"Computer Science",code:"CS-101",description:"Computing, software and information technology",duration:"4 years"},
 {name:"English Literature",code:"ENG-101",description:"Language, literature and communication",duration:"4 years"},
 {name:"Business Studies",code:"BUS-101",description:"Business, management and entrepreneurship",duration:"4 years"}
];
const store = {
 read(key,fallback){try{return JSON.parse(localStorage.getItem("campusdesk_"+key)) ?? fallback}catch{return fallback}},
 write(key,value){localStorage.setItem("campusdesk_"+key,JSON.stringify(value))}
};
let students=store.read("students",seedStudents), courses=store.read("courses",seedCourses), attendance=store.read("attendance",{});
const $=id=>document.getElementById(id);
const today=()=>new Date().toISOString().slice(0,10);
function persist(){store.write("students",students);store.write("courses",courses);store.write("attendance",attendance)}
function initials(name){return name.split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase()}
function escapeHTML(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function toast(message){const el=$("toast");el.textContent=message;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2600)}
function courseName(name){return courses.some(c=>c.name===name)?name:"Not assigned"}
function showPage(page){document.querySelectorAll(".page-view").forEach(v=>v.classList.remove("active"));$(page+"Page").classList.add("active");document.querySelectorAll(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.page===page));$("pageCrumb").textContent=page[0].toUpperCase()+page.slice(1);$("sidebar").classList.remove("open");render()}
function studentMarkup(s,actions=false){return `<div class="student-cell"><span class="mini-avatar">${initials(s.name)}</span><span><b>${escapeHTML(s.name)}</b><small>${escapeHTML(s.email)}</small></span></div>`}
function renderDashboard(){
 $("statStudents").textContent=students.length;$("statCourses").textContent=courses.length;
 const records=attendance[$("attendanceDate").value||today()]||{};const present=Object.values(records).filter(v=>v==="Present").length;
 $("statPresent").textContent=present;$("statRate").textContent=students.length?Math.round(present/students.length*100)+"%":"0%";
 $("recentStudents").innerHTML=students.slice(-5).reverse().map(s=>`<tr><td>${studentMarkup(s)}</td><td>${escapeHTML(s.id)}</td><td>${escapeHTML(courseName(s.course))}</td><td><span class="pill ${s.active?"":"inactive"}">${s.active?"Active":"Inactive"}</span></td></tr>`).join("")||'<tr><td colspan="4" class="empty-state">No students yet.</td></tr>';
}
function renderStudents(){
 const q=($("studentSearch").value||"").toLowerCase();const filtered=students.filter(s=>[s.name,s.id,s.email,s.course].join(" ").toLowerCase().includes(q));
 $("studentCount").textContent=filtered.length+" student"+(filtered.length===1?"":"s");
 $("studentsTable").innerHTML=filtered.map(s=>`<tr><td>${studentMarkup(s)}</td><td>${escapeHTML(s.id)}</td><td>${escapeHTML(s.email)}</td><td>${escapeHTML(courseName(s.course))}</td><td><span class="pill ${s.active?"":"inactive"}">${s.active?"Active":"Inactive"}</span></td><td><button class="action-btn" data-edit="${escapeHTML(s.id)}">Edit</button><button class="action-btn delete" data-delete="${escapeHTML(s.id)}">Delete</button></td></tr>`).join("")||'<tr><td colspan="6" class="empty-state">No matching students found.</td></tr>';
}
function renderCourses(){
 $("courseGrid").innerHTML=courses.map((c,i)=>`<article class="course-card"><div class="course-symbol">${["∑","⌘","文","▥","✦"][i%5]}</div><h3>${escapeHTML(c.name)}</h3><p>${escapeHTML(c.description)}</p><div class="course-meta"><span>${escapeHTML(c.code)}</span><span>${students.filter(s=>s.course===c.name).length} students</span><span>${escapeHTML(c.duration)}</span></div></article>`).join("")||'<div class="empty-state">No courses added yet.</div>';
}
function renderAttendance(){
 const date=$("attendanceDate").value||today();const records=attendance[date]||{};
 $("attendanceTable").innerHTML=students.map(s=>`<tr><td>${studentMarkup(s)}</td><td>${escapeHTML(s.id)}</td><td>${escapeHTML(courseName(s.course))}</td><td><select class="attendance-select" data-attendance="${escapeHTML(s.id)}"><option ${(records[s.id]||"Present")==="Present"?"selected":""}>Present</option><option ${records[s.id]==="Absent"?"selected":""}>Absent</option><option ${records[s.id]==="Late"?"selected":""}>Late</option></select></td></tr>`).join("")||'<tr><td colspan="4" class="empty-state">Add students before taking attendance.</td></tr>';
}
function render(){renderDashboard();renderStudents();renderCourses();renderAttendance()}
function openStudentModal(student=null){
 $("studentForm").reset();$("editStudentId").value=student?.id||"";$("modalTitle").textContent=student?"Edit student":"Add student";
 $("studentId").disabled=Boolean(student);
 $("studentCourse").innerHTML=courses.map(c=>`<option value="${escapeHTML(c.name)}">${escapeHTML(c.name)}</option>`).join("");
 if(student){$("studentName").value=student.name;$("studentId").value=student.id;$("studentEmail").value=student.email;$("studentPhone").value=student.phone||"";$("studentCourse").value=student.course}
 $("modalBackdrop").classList.add("open");
}
function closeModal(){$("modalBackdrop").classList.remove("open");$("studentId").disabled=false}
document.addEventListener("click",e=>{
 const nav=e.target.closest("[data-page]");if(nav)showPage(nav.dataset.page);
 const go=e.target.closest("[data-go]");if(go)showPage(go.dataset.go);
 const action=e.target.closest("[data-action]");if(action?.dataset.action==="add-student")openStudentModal();if(action?.dataset.action==="add-course"){const name=prompt("Enter course name:");if(!name?.trim())return;if(courses.some(c=>c.name.toLowerCase()===name.trim().toLowerCase()))return toast("This course already exists.");const code=prompt("Enter course code:")||"NEW-001";courses.push({name:name.trim(),code:code.trim(),description:"Newly added course",duration:"4 years"});persist();render();toast("Course added successfully.");}
 const edit=e.target.closest("[data-edit]");if(edit){const s=students.find(x=>x.id===edit.dataset.edit);if(s)openStudentModal(s)}
 const del=e.target.closest("[data-delete]");if(del){const s=students.find(x=>x.id===del.dataset.delete);if(s&&confirm("Delete "+s.name+"? This cannot be undone.")){students=students.filter(x=>x.id!==s.id);Object.values(attendance).forEach(day=>delete day[s.id]);persist();render();toast("Student deleted.")}}
});
$("studentForm").addEventListener("submit",e=>{
 e.preventDefault();const oldId=$("editStudentId").value;const id=oldId||$("studentId").value.trim();
 if(!oldId&&students.some(s=>s.id.toLowerCase()===id.toLowerCase()))return toast("This student ID already exists.");
 const record={id,name:$("studentName").value.trim(),email:$("studentEmail").value.trim(),phone:$("studentPhone").value.trim(),course:$("studentCourse").value,active:true};
 if(oldId){students=students.map(s=>s.id===oldId?{...s,...record}:s)}else students.push(record);
 persist();closeModal();render();toast(oldId?"Student updated.":"Student added successfully.");
});
$("closeModal").addEventListener("click",closeModal);$("cancelModal").addEventListener("click",closeModal);$("modalBackdrop").addEventListener("click",e=>{if(e.target===$("modalBackdrop"))closeModal()});
$("studentSearch").addEventListener("input",renderStudents);
$("attendanceDate").addEventListener("change",renderAttendance);
$("saveAttendance").addEventListener("click",()=>{const date=$("attendanceDate").value||today();attendance[date]={};document.querySelectorAll("[data-attendance]").forEach(el=>attendance[date][el.dataset.attendance]=el.value);persist();renderDashboard();toast("Attendance saved for "+date+".")});
$("menuBtn").addEventListener("click",()=>$("sidebar").classList.toggle("open"));
$("logoutBtn").addEventListener("click",()=>toast("Demo mode: no login session is active."));
$("todayDate").textContent=new Intl.DateTimeFormat("en",{weekday:"short",month:"short",day:"numeric",year:"numeric"}).format(new Date());
$("attendanceDate").value=today();$("year").textContent=new Date().getFullYear();
$("connectionLabel").textContent=supabaseReady?"Supabase configured":"Demo mode";
render();
