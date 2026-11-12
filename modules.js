/* CampusDesk academic modules: subjects, teachers, exams, results, fees and timetable */
(() => {
  const $m = id => document.getElementById(id);
  const state = { subjects:[], enrollments:[], teachers:[], exams:[], results:[], fees:[], timetable:[], calendar:[] };
  const configs = {
    subjects:{title:"Subject",table:"subjects",fields:[
      {key:"name",label:"Subject name",required:true},{key:"code",label:"Subject code",required:true},
      {key:"course_id",label:"Course",type:"select",source:"courses",required:true},
      {key:"semester",label:"Semester",type:"select",options:[["1","Semester 1"],["2","Semester 2"],["3","Semester 3"],["4","Semester 4"],["5","Semester 5"],["6","Semester 6"],["7","Semester 7"],["8","Semester 8"]]}]},
    enrollments:{title:"Enrollment",table:"enrollments",fields:[
      {key:"student_id",label:"Student",type:"select",source:"students",required:true},
      {key:"course_id",label:"Course",type:"select",source:"courses",required:true},
      {key:"semester",label:"Semester",type:"select",options:[["1","Semester 1"],["2","Semester 2"],["3","Semester 3"],["4","Semester 4"],["5","Semester 5"],["6","Semester 6"],["7","Semester 7"],["8","Semester 8"]]},
      {key:"section",label:"Section"},{key:"enrolled_on",label:"Enrollment date",type:"date",default:new Date().toISOString().slice(0,10)},
      {key:"status",label:"Status",type:"select",options:[["Active","Active"],["Completed","Completed"],["Withdrawn","Withdrawn"]],default:"Active",required:true}]},
    teachers:{title:"Teacher",table:"teachers",fields:[
      {key:"full_name",label:"Full name",required:true},{key:"email",label:"Email",type:"email"},
      {key:"phone",label:"Phone"},{key:"specialization",label:"Specialization"}]},
    exams:{title:"Exam",table:"exams",fields:[
      {key:"title",label:"Exam title",required:true},{key:"exam_type",label:"Exam type",type:"select",options:[["Midterm","Midterm"],["Final","Final"],["Quiz","Quiz"],["Assignment","Assignment"],["Other","Other"]],required:true,default:"Other"},{key:"course_id",label:"Course",type:"select",source:"courses",required:true},
      {key:"semester",label:"Semester",type:"select",options:[["1","Semester 1"],["2","Semester 2"],["3","Semester 3"],["4","Semester 4"],["5","Semester 5"],["6","Semester 6"],["7","Semester 7"],["8","Semester 8"]]},{key:"section",label:"Section"},{key:"subject_id",label:"Subject",type:"select",source:"subjects"},{key:"exam_date",label:"Exam date",type:"date"},
      {key:"total_marks",label:"Total marks",type:"number",required:true,default:"100"}]},
    results:{title:"Result",table:"results",fields:[
      {key:"exam_id",label:"Exam",type:"select",source:"exams",required:true},
      {key:"student_id",label:"Student",type:"select",source:"students",required:true},
      {key:"obtained_marks",label:"Obtained marks",type:"number",required:true},
      {key:"remarks",label:"Remarks",type:"text"}]},
    fees:{title:"Fee record",table:"fee_records",fields:[
      {key:"student_id",label:"Student",type:"select",source:"students",required:true},
      {key:"fee_title",label:"Fee title",required:true,default:"Tuition Fee"},
      {key:"amount",label:"Total amount (PKR)",type:"number",required:true},
      {key:"paid_amount",label:"Amount paid (PKR)",type:"number",default:"0"},
      {key:"due_date",label:"Due date",type:"date"},{key:"notes",label:"Notes"}]},
    calendar:{title:"Calendar event",table:"academic_calendar_events",fields:[
      {key:"event_type",label:"Event type",type:"select",options:[["Semester Start","Semester Start"],["Semester End","Semester End"],["Midterm","Midterm"],["Final Exam","Final Exam"],["Holiday","Holiday"],["Vacation","Vacation"],["Department Event","Department Event"],["Other","Other"]],required:true},
      {key:"title",label:"Event title",required:true},{key:"start_date",label:"Start date",type:"date",required:true},{key:"end_date",label:"End date",type:"date"},{key:"description",label:"Description"}]},
    timetable:{title:"Timetable class",table:"timetable",fields:[
      {key:"course_id",label:"Course",type:"select",source:"courses",required:true},
      {key:"semester",label:"Semester",type:"select",options:[["1","Semester 1"],["2","Semester 2"],["3","Semester 3"],["4","Semester 4"],["5","Semester 5"],["6","Semester 6"],["7","Semester 7"],["8","Semester 8"]],required:true},{key:"section",label:"Section",required:true},
      {key:"subject_id",label:"Subject",type:"select",source:"subjects",required:true},
      {key:"teacher_id",label:"Teacher",type:"select",source:"teachers",required:true},
      {key:"weekday",label:"Day",type:"select",options:[["1","Monday"],["2","Tuesday"],["3","Wednesday"],["4","Thursday"],["5","Friday"],["6","Saturday"]],required:true},
      {key:"start_time",label:"Start time",type:"time",required:true},{key:"end_time",label:"End time",type:"time",required:true},
      {key:"room",label:"Room / Lab"}]}
  };
  let activeType = "";
  let editingId = "";
  const escape = value => String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const courseLabel = id => courses.find(x=>x.id===id)?.name || "—";
  const studentLabel = id => students.find(x=>x.id===id)?.name || "—";
  const subjectLabel = id => state.subjects.find(x=>x.id===id)?.name || "—";
  const teacherLabel = id => state.teachers.find(x=>x.id===id)?.full_name || "—";
  const examLabel = id => state.exams.find(x=>x.id===id)?.title || "—";
  const money = value => "Rs " + Number(value||0).toLocaleString("en-PK");
  async function loadAcademicModules(){
    const tables = ["subjects","enrollments","teachers","exams","results","fee_records","timetable","academic_calendar_events"];
    const sessionTables = new Set(["enrollments","exams","fee_records","timetable","academic_calendar_events"]);
    const responses = await Promise.all(tables.map(table=>{
      let query=db.from(table).select("*").eq("user_id",currentUser.id);
      if(sessionTables.has(table))query=query.eq("session_id",activeAcademicSession.id);
      return query;
    }));
    responses.forEach(r=>{if(r.error)throw r.error;});
    state.subjects=responses[0].data||[];
    state.enrollments=responses[1].data||[];
    state.teachers=responses[2].data||[];
    state.exams=responses[3].data||[];
    state.results=(responses[4].data||[]).filter(x=>state.exams.some(exam=>exam.id===x.exam_id));
    state.fees=responses[5].data||[];
    state.timetable=responses[6].data||[];
    state.calendar=responses[7].data||[];
    window.getSessionStudents=()=>students.filter(student=>state.enrollments.some(enrollment=>enrollment.student_id===student.id&&enrollment.status!=="Withdrawn")).map(student=>{const enrollment=state.enrollments.find(x=>x.student_id===student.id);return {...student,semester:enrollment?.semester??"",section:enrollment?.section??""};});
    window.getSessionEnrollment=studentId=>state.enrollments.find(enrollment=>enrollment.student_id===studentId)||null;
    renderModules();
  }
  function renderModules(){
    window.getCourseSubjectCount = courseId => state.subjects.filter(x=>x.course_id===courseId).length;
    const mathCourse = courses.find(x=>x.code==="MTH-101");
    const mathCount = mathCourse ? state.subjects.filter(x=>x.course_id===mathCourse.id).length : 0;
    if($m("subjectSummary"))$m("subjectSummary").textContent = mathCourse ? `BS Mathematics curriculum: ${mathCount} subjects across 8 semesters (sample plan)` : "Manage subjects offered under each course.";
    if(typeof renderCourses==="function")renderCourses();
    const subjectFilter=$m("subjectCourseFilter");
    if(subjectFilter){
      const selected=subjectFilter.value||"all";
      subjectFilter.innerHTML='<option value="all">All courses</option>'+courses.map(c=>'<option value="'+escape(c.id)+'">'+escape(c.name)+'</option>').join("");
      subjectFilter.value=courses.some(c=>c.id===selected)?selected:"all";
    }
    const selectedCourse=$m("subjectCourseFilter")?.value||"all";
    $m("subjectsTable").innerHTML = state.subjects.filter(x=>selectedCourse==="all"||x.course_id===selectedCourse).slice().sort((a,b)=>(a.semester||99)-(b.semester||99)||a.name.localeCompare(b.name)).map(x=>`<tr><td>${escape(x.name)}</td><td>${escape(x.code)}</td><td>${x.semester?`Semester ${escape(x.semester)}`:"—"}</td><td>${escape(courseLabel(x.course_id))}</td><td><button class="action-btn" data-module-edit="subjects" data-id="${x.id}">Edit</button><button class="action-btn delete" data-module-delete="subjects" data-id="${x.id}">Delete</button></td></tr>`).join("") || '<tr><td colspan="4" class="empty-state">No subjects yet.</td></tr>';
    $m("enrollmentsTable").innerHTML = state.enrollments.map(x=>{const student=students.find(s=>s.id===x.student_id);return "<tr><td>"+escape(student?.name||"—")+"</td><td>"+escape(student?.studentNumber||"—")+"</td><td>"+escape(courseLabel(x.course_id))+"</td><td>"+escape(x.semester?"Semester "+x.semester:"—")+"</td><td>"+escape(x.section||"—")+"</td><td>"+escape(x.enrolled_on||"—")+"</td><td>"+escape(x.status)+"</td><td><button class=\"action-btn\" data-module-edit=\"enrollments\" data-id=\""+x.id+"\">Edit</button><button class=\"action-btn delete\" data-module-delete=\"enrollments\" data-id=\""+x.id+"\">Delete</button></td></tr>"}).join("") || "<tr><td colspan=\"8\" class=\"empty-state\">No enrollments yet.</td></tr>";
    $m("teachersTable").innerHTML = state.teachers.map(x=>`<tr><td><b>${escape(x.full_name)}</b></td><td>${escape(x.email)}</td><td>${escape(x.phone)}</td><td>${escape(x.specialization)}</td><td><button class="action-btn" data-module-edit="teachers" data-id="${x.id}">Edit</button><button class="action-btn delete" data-module-delete="teachers" data-id="${x.id}">Delete</button></td></tr>`).join("") || '<tr><td colspan="5" class="empty-state">No teachers yet.</td></tr>';
    $m("examsTable").innerHTML = state.exams.map(x=>`<tr><td>${escape(x.title)}</td><td>${escape(x.exam_type||"Other")}</td><td>${escape(courseLabel(x.course_id))}</td><td>${escape(x.semester?"Semester "+x.semester:"—")}</td><td>${escape(x.section||"—")}</td><td>${escape(subjectLabel(x.subject_id))}</td><td>${escape(x.exam_date||"—")}</td><td>${escape(x.total_marks)}</td><td><button class="action-btn" data-module-edit="exams" data-id="${x.id}">Edit</button><button class="action-btn delete" data-module-delete="exams" data-id="${x.id}">Delete</button></td></tr>`).join("") || '<tr><td colspan="9" class="empty-state">No exams scheduled yet.</td></tr>';
    $m("resultsTable").innerHTML = state.results.map(x=>{const exam=state.exams.find(e=>e.id===x.exam_id);const pct=exam?Math.round(Number(x.obtained_marks)/Number(exam.total_marks)*100):0;const grade=pct>=80?"A":pct>=70?"B":pct>=60?"C":pct>=50?"D":"F";return `<tr><td>${escape(studentLabel(x.student_id))}</td><td>${escape(examLabel(x.exam_id))}</td><td>${escape(x.obtained_marks)} / ${escape(exam?.total_marks||"—")}</td><td>${pct}%</td><td><span class="pill ${grade==="F"?"inactive":""}">${grade}</span></td><td><button class="action-btn" data-module-edit="results" data-id="${x.id}">Edit</button><button class="action-btn delete" data-module-delete="results" data-id="${x.id}">Delete</button></td></tr>`}).join("") || '<tr><td colspan="6" class="empty-state">No results recorded yet.</td></tr>';
    const billed=state.fees.reduce((n,x)=>n+Number(x.amount||0),0),collected=state.fees.reduce((n,x)=>n+Number(x.paid_amount||0),0),due=billed-collected;
    $m("feeBilled").textContent=money(billed);$m("feeCollected").textContent=money(collected);$m("feeOutstanding").textContent=money(due);
    $m("feesTable").innerHTML = state.fees.map(x=>`<tr><td>${escape(studentLabel(x.student_id))}</td><td>${escape(x.fee_title)}</td><td>${money(x.amount)}</td><td>${money(x.paid_amount)}</td><td><b>${money(Number(x.amount)-Number(x.paid_amount))}</b></td><td>${escape(x.due_date||"—")}</td><td><span class="pill ${x.status==="Pending"?"inactive":""}">${escape(x.status)}</span></td></tr>`).join("") || '<tr><td colspan="7" class="empty-state">No fee records yet.</td></tr>';
    const days=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
    const timetableCourse=$m("timetableCourseFilter")?.value||"all",timetableSemester=$m("timetableSemesterFilter")?.value||"all",timetableSection=($m("timetableSectionFilter")?.value||"").trim().toLowerCase();
    $m("timetableTable").innerHTML = state.timetable.filter(x=>(timetableCourse==="all"||x.course_id===timetableCourse)&&(timetableSemester==="all"||String(x.semester||"")===timetableSemester)&&(!timetableSection||String(x.section||"").toLowerCase().includes(timetableSection))).slice().sort((a,b)=>a.weekday-b.weekday||a.start_time.localeCompare(b.start_time)).map(x=>`<tr><td>${days[x.weekday-1]||"—"}</td><td>${escape(String(x.start_time).slice(0,5))}–${escape(String(x.end_time).slice(0,5))}</td><td>${escape(courseLabel(x.course_id))}</td><td>${escape(x.semester?"Semester "+x.semester:"—")}</td><td>${escape(x.section||"—")}</td><td>${escape(subjectLabel(x.subject_id))}</td><td>${escape(teacherLabel(x.teacher_id))}</td><td>${escape(x.room||"—")}</td></tr>`).join("") || '<tr><td colspan="8" class="empty-state">No classes scheduled yet.</td></tr>';
    const pending = state.fees.reduce((n,x)=>n+Math.max(0,Number(x.amount)-Number(x.paid_amount)),0);
    const upcoming = state.exams.filter(x=>!x.exam_date||x.exam_date>=new Date().toISOString().slice(0,10)).length;
    if($m("statTeachers"))$m("statTeachers").textContent=state.teachers.length;
    if($m("statSubjects"))$m("statSubjects").textContent=state.subjects.length;
    if($m("statPendingFees"))$m("statPendingFees").textContent=money(pending);
    if($m("statExams"))$m("statExams").textContent=upcoming;
    if($m("academicSnapshot"))$m("academicSnapshot").innerHTML=`<div><span>Teachers</span><b>${state.teachers.length}</b></div><div><span>Subjects</span><b>${state.subjects.length}</b></div><div><span>Exams scheduled</span><b>${upcoming}</b></div><div><span>Outstanding fees</span><b>${money(pending)}</b></div><div><span>Results recorded</span><b>${state.results.length}</b></div><div><span>Course enrollments</span><b>${state.enrollments.length}</b></div>`;
    if($m("calendarTable"))$m("calendarTable").innerHTML=state.calendar.slice().sort((a,b)=>a.start_date.localeCompare(b.start_date)).map(x=>`<tr><td><b>${escape(x.title)}</b></td><td>${escape(x.event_type)}</td><td>${escape(x.start_date)}</td><td>${escape(x.end_date||"—")}</td><td>${escape(x.description||"—")}</td><td><button class="action-btn" data-module-edit="calendar" data-id="${x.id}">Edit</button><button class="action-btn delete" data-module-delete="calendar" data-id="${x.id}">Delete</button></td></tr>`).join("")||'<tr><td colspan="6" class="empty-state">No calendar events added for this session.</td></tr>';
  }
  function sourceOptions(field){
    let rows = field.source==="courses" ? courses : field.source==="students" ? (["results","fees"].includes(activeType)&&window.getSessionStudents?window.getSessionStudents():students) : field.source==="subjects" ? state.subjects : field.source==="teachers" ? state.teachers : state.exams;
    return (field.options||rows.map(x=>[x.id,field.source==="courses"?x.name:field.source==="students"?x.name:field.source==="subjects"?x.name+" ("+x.code+")":field.source==="teachers"?x.full_name:x.title])).map(x=>`<option value="${escape(x[0])}">${escape(x[1])}</option>`).join("");
  }
  function openModuleForm(type,row=null){
    activeType=type;editingId=row?.id||"";const config=configs[type];
    $m("moduleModalTitle").textContent=(row?"Edit ":"Add ")+config.title.toLowerCase();
    $m("moduleFormFields").innerHTML=config.fields.map(field=>{
      const value=row?.[field.key]??field.default??"";
      if(field.type==="select")return `<label>${field.label}<select name="${field.key}" ${field.required?"required":""}><option value="">Choose ${field.label.toLowerCase()}</option>${sourceOptions(field)}</select></label>`;
      return `<label>${field.label}<input name="${field.key}" type="${field.type||"text"}" value="${escape(value)}" ${field.required?"required":""} ${field.type==="number"?'min="0" step="0.01"':""}></label>`;
    }).join("");
    config.fields.forEach(field=>{const el=$m("moduleForm").elements[field.key];if(el&&row&&field.type==="select")el.value=row[field.key]||"";});
    $m("moduleModalBackdrop").classList.add("open");
  }
  function closeModuleForm(){$m("moduleModalBackdrop").classList.remove("open");$m("moduleForm").reset();activeType="";editingId="";}
  document.addEventListener("click",async e=>{
    const add=e.target.closest("[data-module-add]");if(add){openModuleForm(add.dataset.moduleAdd);return;}
    const edit=e.target.closest("[data-module-edit]");if(edit){const type=edit.dataset.moduleEdit;const row=state[type].find(x=>x.id===edit.dataset.id);if(row)openModuleForm(type,row);return;}
    const del=e.target.closest("[data-module-delete]");if(del){const type=del.dataset.moduleDelete,row=state[type].find(x=>x.id===del.dataset.id);if(!row||!confirm("Delete this "+configs[type].title.toLowerCase()+" record?"))return;const {error}=await db.from(configs[type].table).delete().eq("id",row.id).eq("user_id",currentUser.id);if(error)return toast(error.message);await loadAcademicModules();toast("Record deleted.");}
  });
  $m("subjectCourseFilter").addEventListener("change",renderModules);
  $m("timetableCourseFilter").addEventListener("change",renderModules);
  $m("timetableSemesterFilter").addEventListener("change",renderModules);
  $m("timetableSectionFilter").addEventListener("input",renderModules);
  $m("moduleForm").addEventListener("submit",async e=>{
    e.preventDefault();if(!activeType)return;const type=activeType,config=configs[type],form=new FormData(e.currentTarget),record={user_id:currentUser.id};
    config.fields.forEach(f=>{const v=form.get(f.key);record[f.key]=v===""?null:v;});
    if(type==="exams")record.total_marks=Number(record.total_marks||100);
    if(type==="results"){record.obtained_marks=Number(record.obtained_marks);const exam=state.exams.find(x=>x.id===record.exam_id);if(!exam)return toast("Please select a valid exam.");if(record.obtained_marks<0||record.obtained_marks>Number(exam.total_marks))return toast("Obtained marks must be between 0 and "+exam.total_marks+".");const student=students.find(x=>x.id===record.student_id);if(student&&student.courseId&&student.courseId!==exam.course_id)return toast("Select a student enrolled in the exam course.");}
    if(type==="fees"){record.amount=Number(record.amount);record.paid_amount=Number(record.paid_amount||0);if(record.paid_amount>record.amount)return toast("Paid amount cannot exceed total fee.");record.status=record.paid_amount===0?"Pending":record.paid_amount>=record.amount?"Paid":"Partial";record.paid_on=record.paid_amount>0?new Date().toISOString().slice(0,10):null;}
    if(type==="timetable"&&record.end_time<=record.start_time)return toast("End time must be after start time.");
    if((type==="exams"||type==="timetable")&&record.subject_id){const subject=state.subjects.find(x=>x.id===record.subject_id);if(!subject||subject.course_id!==record.course_id)return toast("Choose a subject that belongs to the selected course.");}
    if(["enrollments","exams","fees","timetable","calendar"].includes(type))record.session_id=activeAcademicSession.id;
    const query=editingId?db.from(config.table).update(record).eq("id",editingId).eq("user_id",currentUser.id):db.from(config.table).insert(record);
    const {error}=await query;if(error)return toast(error.message);
    closeModuleForm();await loadAcademicModules();toast(config.title+" saved successfully.");
  });
  $m("closeModuleModal").addEventListener("click",closeModuleForm);
  $m("cancelModuleModal").addEventListener("click",closeModuleForm);
  $m("moduleModalBackdrop").addEventListener("click",e=>{if(e.target===$m("moduleModalBackdrop"))closeModuleForm();});
  window.getCampusDeskChatContext=()=>{
 const currentStudents=window.getSessionStudents?window.getSessionStudents():students;
 const active=currentStudents.filter(s=>s.active).length;
 const records=attendance[today()]||{};
 const values=Object.values(records);
 const billed=state.fees.reduce((n,x)=>n+Number(x.amount||0),0);
 const collected=state.fees.reduce((n,x)=>n+Number(x.paid_amount||0),0);
 const upcoming=state.exams.filter(x=>!x.exam_date||x.exam_date>=today()).length;
 return {
  asOf:today(),institution:institutionName,
  totals:{students:currentStudents.length,activeStudents:active,inactiveStudents:currentStudents.length-active,courses:courses.length,subjects:state.subjects.length,teachers:state.teachers.length,enrollments:state.enrollments.length,exams:state.exams.length,upcomingExams:upcoming,results:state.results.length,timetableClasses:state.timetable.length},
  attendanceToday:{present:values.filter(v=>v==="Present").length,absent:values.filter(v=>v==="Absent").length,late:values.filter(v=>v==="Late").length,notMarked:Math.max(0,active-values.length)},
  fees:{billed,paid:collected,outstanding:Math.max(0,billed-collected),records:state.fees.length},
  courseBreakdown:courses.map(c=>({course:c.name,students:currentStudents.filter(s=>s.courseId===c.id).length,subjects:state.subjects.filter(s=>s.course_id===c.id).length})),
  academicSession:activeAcademicSession?activeAcademicSession.session_type+" "+activeAcademicSession.academic_year:"",calendarEvents:state.calendar.length
 };
};
window.loadAcademicModules=loadAcademicModules;
  window.refreshAcademicDashboard=renderModules;
})();
