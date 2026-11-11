/* CampusDesk academic modules: subjects, teachers, exams, results, fees and timetable */
(() => {
  const $m = id => document.getElementById(id);
  const state = { subjects:[], teachers:[], exams:[], results:[], fees:[], timetable:[] };
  const configs = {
    subjects:{title:"Subject",table:"subjects",fields:[
      {key:"name",label:"Subject name",required:true},{key:"code",label:"Subject code",required:true},
      {key:"course_id",label:"Course",type:"select",source:"courses",required:true}]},
    teachers:{title:"Teacher",table:"teachers",fields:[
      {key:"full_name",label:"Full name",required:true},{key:"email",label:"Email",type:"email"},
      {key:"phone",label:"Phone"},{key:"specialization",label:"Specialization"}]},
    exams:{title:"Exam",table:"exams",fields:[
      {key:"title",label:"Exam title",required:true},{key:"course_id",label:"Course",type:"select",source:"courses",required:true},
      {key:"subject_id",label:"Subject",type:"select",source:"subjects"},{key:"exam_date",label:"Exam date",type:"date"},
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
    timetable:{title:"Timetable class",table:"timetable",fields:[
      {key:"course_id",label:"Course",type:"select",source:"courses",required:true},
      {key:"subject_id",label:"Subject",type:"select",source:"subjects",required:true},
      {key:"teacher_id",label:"Teacher",type:"select",source:"teachers",required:true},
      {key:"weekday",label:"Day",type:"select",options:[["1","Monday"],["2","Tuesday"],["3","Wednesday"],["4","Thursday"],["5","Friday"],["6","Saturday"]],required:true},
      {key:"start_time",label:"Start time",type:"time",required:true},{key:"end_time",label:"End time",type:"time",required:true},
      {key:"room",label:"Room / Lab"}]}
  };
  let activeType = "";
  let editingId = "";
  const escape = value => String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const courseLabel = id => (window.courses || []).find(x=>x.id===id)?.name || "—";
  const studentLabel = id => (window.students || []).find(x=>x.id===id)?.name || "—";
  const subjectLabel = id => state.subjects.find(x=>x.id===id)?.name || "—";
  const teacherLabel = id => state.teachers.find(x=>x.id===id)?.full_name || "—";
  const examLabel = id => state.exams.find(x=>x.id===id)?.title || "—";
  const money = value => "Rs " + Number(value||0).toLocaleString("en-PK");
  async function loadAcademicModules(){
    const tables = ["subjects","teachers","exams","results","fee_records","timetable"];
    const responses = await Promise.all(tables.map(table=>db.from(table).select("*").eq("user_id",currentUser.id)));
    responses.forEach((r,i)=>{if(r.error)throw r.error;state[["subjects","teachers","exams","results","fees","timetable"][i]]=r.data||[];});
    renderModules();
  }
  function renderModules(){
    $m("subjectsTable").innerHTML = state.subjects.map(x=>`<tr><td>${escape(x.name)}</td><td>${escape(x.code)}</td><td>${escape(courseLabel(x.course_id))}</td><td><button class="action-btn" data-module-edit="subjects" data-id="${x.id}">Edit</button><button class="action-btn delete" data-module-delete="subjects" data-id="${x.id}">Delete</button></td></tr>`).join("") || '<tr><td colspan="4" class="empty-state">No subjects yet.</td></tr>';
    $m("teachersTable").innerHTML = state.teachers.map(x=>`<tr><td><b>${escape(x.full_name)}</b></td><td>${escape(x.email)}</td><td>${escape(x.phone)}</td><td>${escape(x.specialization)}</td><td><button class="action-btn" data-module-edit="teachers" data-id="${x.id}">Edit</button><button class="action-btn delete" data-module-delete="teachers" data-id="${x.id}">Delete</button></td></tr>`).join("") || '<tr><td colspan="5" class="empty-state">No teachers yet.</td></tr>';
    $m("examsTable").innerHTML = state.exams.map(x=>`<tr><td>${escape(x.title)}</td><td>${escape(courseLabel(x.course_id))}</td><td>${escape(subjectLabel(x.subject_id))}</td><td>${escape(x.exam_date||"—")}</td><td>${escape(x.total_marks)}</td><td><button class="action-btn" data-module-edit="exams" data-id="${x.id}">Edit</button><button class="action-btn delete" data-module-delete="exams" data-id="${x.id}">Delete</button></td></tr>`).join("") || '<tr><td colspan="6" class="empty-state">No exams scheduled yet.</td></tr>';
    $m("resultsTable").innerHTML = state.results.map(x=>{const exam=state.exams.find(e=>e.id===x.exam_id);const pct=exam?Math.round(Number(x.obtained_marks)/Number(exam.total_marks)*100):0;const grade=pct>=80?"A":pct>=70?"B":pct>=60?"C":pct>=50?"D":"F";return `<tr><td>${escape(studentLabel(x.student_id))}</td><td>${escape(examLabel(x.exam_id))}</td><td>${escape(x.obtained_marks)} / ${escape(exam?.total_marks||"—")}</td><td>${pct}%</td><td><span class="pill ${grade==="F"?"inactive":""}">${grade}</span></td></tr>`}).join("") || '<tr><td colspan="5" class="empty-state">No results recorded yet.</td></tr>';
    const billed=state.fees.reduce((n,x)=>n+Number(x.amount||0),0),collected=state.fees.reduce((n,x)=>n+Number(x.paid_amount||0),0),due=billed-collected;
    $m("feeBilled").textContent=money(billed);$m("feeCollected").textContent=money(collected);$m("feeOutstanding").textContent=money(due);
    $m("feesTable").innerHTML = state.fees.map(x=>`<tr><td>${escape(studentLabel(x.student_id))}</td><td>${escape(x.fee_title)}</td><td>${money(x.amount)}</td><td>${money(x.paid_amount)}</td><td><b>${money(Number(x.amount)-Number(x.paid_amount))}</b></td><td>${escape(x.due_date||"—")}</td><td><span class="pill ${x.status==="Pending"?"inactive":""}">${escape(x.status)}</span></td></tr>`).join("") || '<tr><td colspan="7" class="empty-state">No fee records yet.</td></tr>';
    const days=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
    $m("timetableTable").innerHTML = state.timetable.slice().sort((a,b)=>a.weekday-b.weekday||a.start_time.localeCompare(b.start_time)).map(x=>`<tr><td>${days[x.weekday-1]||"—"}</td><td>${escape(String(x.start_time).slice(0,5))}–${escape(String(x.end_time).slice(0,5))}</td><td>${escape(courseLabel(x.course_id))}</td><td>${escape(subjectLabel(x.subject_id))}</td><td>${escape(teacherLabel(x.teacher_id))}</td><td>${escape(x.room||"—")}</td></tr>`).join("") || '<tr><td colspan="6" class="empty-state">No classes scheduled yet.</td></tr>';
    const pending = state.fees.reduce((n,x)=>n+Math.max(0,Number(x.amount)-Number(x.paid_amount)),0);
    const upcoming = state.exams.filter(x=>!x.exam_date||x.exam_date>=new Date().toISOString().slice(0,10)).length;
    if($m("statTeachers"))$m("statTeachers").textContent=state.teachers.length;
    if($m("statSubjects"))$m("statSubjects").textContent=state.subjects.length;
    if($m("statPendingFees"))$m("statPendingFees").textContent=money(pending);
    if($m("statExams"))$m("statExams").textContent=upcoming;
    if($m("academicSnapshot"))$m("academicSnapshot").innerHTML=`<div><span>Teachers</span><b>${state.teachers.length}</b></div><div><span>Subjects</span><b>${state.subjects.length}</b></div><div><span>Exams scheduled</span><b>${upcoming}</b></div><div><span>Outstanding fees</span><b>${money(pending)}</b></div><div><span>Results recorded</span><b>${state.results.length}</b></div>`;
  }
  function sourceOptions(field){
    let rows = field.source==="courses" ? courses : field.source==="students" ? students : field.source==="subjects" ? state.subjects : field.source==="teachers" ? state.teachers : state.exams;
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
  $m("moduleForm").addEventListener("submit",async e=>{
    e.preventDefault();if(!activeType)return;const type=activeType,config=configs[type],form=new FormData(e.currentTarget),record={user_id:currentUser.id};
    config.fields.forEach(f=>{const v=form.get(f.key);record[f.key]=v===""?null:v;});
    if(type==="exams")record.total_marks=Number(record.total_marks||100);
    if(type==="results")record.obtained_marks=Number(record.obtained_marks);
    if(type==="fees"){record.amount=Number(record.amount);record.paid_amount=Number(record.paid_amount||0);if(record.paid_amount>record.amount)return toast("Paid amount cannot exceed total fee.");record.status=record.paid_amount===0?"Pending":record.paid_amount>=record.amount?"Paid":"Partial";record.paid_on=record.paid_amount>0?new Date().toISOString().slice(0,10):null;}
    if(type==="timetable"&&record.end_time<=record.start_time)return toast("End time must be after start time.");
    const query=editingId?db.from(config.table).update(record).eq("id",editingId).eq("user_id",currentUser.id):db.from(config.table).insert(record);
    const {error}=await query;if(error)return toast(error.message);
    closeModuleForm();await loadAcademicModules();toast(config.title+" saved successfully.");
  });
  $m("closeModuleModal").addEventListener("click",closeModuleForm);
  $m("cancelModuleModal").addEventListener("click",closeModuleForm);
  $m("moduleModalBackdrop").addEventListener("click",e=>{if(e.target===$m("moduleModalBackdrop"))closeModuleForm();});
  window.loadAcademicModules=loadAcademicModules;
  window.refreshAcademicDashboard=renderModules;
})();
