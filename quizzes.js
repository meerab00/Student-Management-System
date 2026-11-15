/* CampusDesk Online Quiz Builder — authenticated administrator workspace */
(() => {
 const $q=id=>document.getElementById(id);
 const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 let quizzes=[],questions=[],selectedQuiz=null,editingQuiz=null,editingQuestion=null;
 const notify=m=>typeof toast==="function"?toast(m):alert(m);
 async function loadQuizzes(){
  if(!window.db||!window.currentUser)return;
  const {data,error}=await db.from("quizzes").select("*").eq("user_id",currentUser.id).order("created_at",{ascending:false});
  if(error){notify("Quiz module: "+error.message);return;}
  quizzes=data||[];
  const qres=await db.from("quiz_questions").select("*").eq("user_id",currentUser.id).order("sort_order");
  if(qres.error){notify(qres.error.message);return;}
  questions=qres.data||[];
  render();
 }
 function render(){
  if(!$q("quizList"))return;
  $q("quizCount").textContent=quizzes.length;
  $q("publishedQuizCount").textContent=quizzes.filter(x=>x.is_published).length;
  $q("quizQuestionCount").textContent=questions.length;
  $q("quizList").innerHTML=quizzes.map(q=>{
   const count=questions.filter(x=>x.quiz_id===q.id).length;
   return `<article class="panel quiz-card"><div class="quiz-card-top"><span class="pill ${q.is_published?"":"inactive"}">${q.is_published?"Published":"Draft"}</span><span class="muted small">${count} question${count===1?"":"s"}</span></div><h2>${esc(q.title)}</h2><p class="muted">${esc(q.description||"No description added.")}</p><div class="quiz-card-meta"><span>◷ ${q.time_limit_minutes} min</span><span>✎ ${questions.filter(x=>x.quiz_id===q.id).reduce((n,x)=>n+Number(x.points||0),0)} points</span></div><div class="quiz-card-actions"><button class="secondary-btn" data-quiz-questions="${q.id}">Manage questions</button><button class="secondary-btn" data-quiz-preview="${q.id}">Preview</button><button class="action-btn" data-quiz-edit="${q.id}">Edit</button><button class="action-btn delete" data-quiz-delete="${q.id}">Delete</button></div></article>`;
  }).join("")||'<div class="panel empty-state">No quizzes created yet. Select “Create quiz” to start.</div>';
  if(selectedQuiz){const q=quizzes.find(x=>x.id===selectedQuiz.id);if(q){selectedQuiz=q;renderQuestions();}}
 }
 function renderQuestions(){
  const rows=questions.filter(x=>x.quiz_id===selectedQuiz.id);
  $q("quizQuestionPanel").hidden=false;$q("selectedQuizTitle").textContent=selectedQuiz.title+" — Questions";
  $q("quizQuestionsTable").innerHTML=rows.map((q,i)=>`<tr><td>${esc(q.question_text)}</td><td>${q.choices.map((c,j)=>String.fromCharCode(65+j)+". "+esc(c)).join("<br>")}</td><td>${String.fromCharCode(65+q.correct_choice)}</td><td>${q.points}</td><td><button class="action-btn" data-question-edit="${q.id}">Edit</button><button class="action-btn delete" data-question-delete="${q.id}">Delete</button></td></tr>`).join("")||'<tr><td colspan="5" class="empty-state">No questions yet. Add at least one question.</td></tr>';
 }
 function openQuizModal(row=null){
  editingQuiz=row;$q("quizForm").reset();$q("quizModalTitle").textContent=row?"Edit quiz":"Create quiz";
  $q("quizTitleInput").value=row?.title||"";$q("quizDescriptionInput").value=row?.description||"";$q("quizTimeInput").value=row?.time_limit_minutes||20;$q("quizPublishedInput").value=String(!!row?.is_published);
  $q("quizModalBackdrop").classList.add("open");
 }
 function closeQuizModal(){$q("quizModalBackdrop").classList.remove("open");editingQuiz=null;}
 function openQuestionModal(row=null){
  editingQuestion=row;$q("questionForm").reset();$q("questionModalTitle").textContent=row?"Edit question":"Add question";
  $q("questionTextInput").value=row?.question_text||"";(row?.choices||["","","",""]).forEach((v,i)=>$q("choice"+i).value=v);
  $q("correctChoiceInput").value=String(row?.correct_choice??0);$q("questionPointsInput").value=row?.points??1;
  $q("questionModalBackdrop").classList.add("open");
 }
 function closeQuestionModal(){$q("questionModalBackdrop").classList.remove("open");editingQuestion=null;}
 async function previewQuiz(id){
  selectedQuiz=quizzes.find(x=>x.id===id);if(!selectedQuiz)return;
  const rows=questions.filter(x=>x.quiz_id===id);
  $q("quizQuestionPanel").hidden=true;$q("quizPreviewPanel").hidden=false;
  $q("previewQuizTitle").textContent=selectedQuiz.title;
  $q("previewQuizMeta").textContent=selectedQuiz.time_limit_minutes+" minute time limit · "+rows.length+" questions";
  $q("quizPreviewBody").innerHTML=rows.map((q,i)=>`<fieldset class="quiz-preview-question"><legend>${i+1}. ${esc(q.question_text)} <small>(${q.points} points)</small></legend>${q.choices.map((c,j)=>`<label class="quiz-choice"><input type="radio" name="preview-${q.id}" value="${j}"> ${String.fromCharCode(65+j)}. ${esc(c)}</label>`).join("")}</fieldset>`).join("")||'<p class="empty-state">Add questions to preview this quiz.</p>';
  if(rows.length)$q("quizPreviewBody").insertAdjacentHTML("beforeend",'<button type="button" class="primary-btn" id="gradeQuizPreview">Check preview answers</button><div id="quizPreviewScore" class="quiz-preview-score" aria-live="polite"></div>');
  $q("quizPreviewPanel").scrollIntoView({behavior:"smooth",block:"start"});
 }
 document.addEventListener("click",async e=>{
  const create=e.target.closest("#createQuizBtn");if(create){openQuizModal();return;}
  const qedit=e.target.closest("[data-quiz-edit]");if(qedit){openQuizModal(quizzes.find(x=>x.id===qedit.dataset.quizEdit));return;}
  const qdel=e.target.closest("[data-quiz-delete]");if(qdel){const row=quizzes.find(x=>x.id===qdel.dataset.quizDelete);if(row&&confirm("Delete this quiz and all its questions?")){const {error}=await db.from("quizzes").delete().eq("id",row.id).eq("user_id",currentUser.id);if(error)return notify(error.message);if(selectedQuiz?.id===row.id){selectedQuiz=null;$q("quizQuestionPanel").hidden=true;}$q("quizPreviewPanel").hidden=true;await loadQuizzes();notify("Quiz deleted.");}return;}
  const manage=e.target.closest("[data-quiz-questions]");if(manage){selectedQuiz=quizzes.find(x=>x.id===manage.dataset.quizQuestions);$q("quizPreviewPanel").hidden=true;renderQuestions();$q("quizQuestionPanel").scrollIntoView({behavior:"smooth",block:"start"});return;}
  const preview=e.target.closest("[data-quiz-preview]");if(preview){previewQuiz(preview.dataset.quizPreview);return;}
  const addQuestion=e.target.closest("#addQuizQuestionBtn");if(addQuestion){if(selectedQuiz)openQuestionModal();return;}
  const editQuestion=e.target.closest("[data-question-edit]");if(editQuestion){openQuestionModal(questions.find(x=>x.id===editQuestion.dataset.questionEdit));return;}
  const deleteQuestion=e.target.closest("[data-question-delete]");if(deleteQuestion){const row=questions.find(x=>x.id===deleteQuestion.dataset.questionDelete);if(row&&confirm("Delete this question?")){const {error}=await db.from("quiz_questions").delete().eq("id",row.id).eq("user_id",currentUser.id);if(error)return notify(error.message);await loadQuizzes();notify("Question deleted.");}return;}
  if(e.target.closest("#closeQuizPreview")){$q("quizPreviewPanel").hidden=true;return;}
  if(e.target.closest("#gradeQuizPreview")){const rows=questions.filter(x=>x.quiz_id===selectedQuiz?.id);let score=0,total=0,answered=0;rows.forEach(q=>{total+=Number(q.points);const selected=document.querySelector('input[name="preview-'+q.id+'"]:checked');if(selected){answered++;if(Number(selected.value)===q.correct_choice)score+=Number(q.points);}});$q("quizPreviewScore").textContent="Preview score: "+score+" / "+total+" points · "+answered+" of "+rows.length+" answered. This is only a local preview; no student result is saved.";return;}
 });
 $q("quizForm").addEventListener("submit",async e=>{e.preventDefault();const record={user_id:currentUser.id,title:$q("quizTitleInput").value.trim(),description:$q("quizDescriptionInput").value.trim(),time_limit_minutes:Number($q("quizTimeInput").value),is_published:$q("quizPublishedInput").value==="true"};if(!record.title)return notify("Enter a quiz title.");const query=editingQuiz?db.from("quizzes").update(record).eq("id",editingQuiz.id).eq("user_id",currentUser.id):db.from("quizzes").insert(record);const {error}=await query;if(error)return notify(error.message);closeQuizModal();await loadQuizzes();notify("Quiz saved.");});
 $q("questionForm").addEventListener("submit",async e=>{e.preventDefault();if(!selectedQuiz)return;const choices=[0,1,2,3].map(i=>$q("choice"+i).value.trim());if(choices.some(x=>!x))return notify("Fill all four choices.");if(new Set(choices.map(x=>x.toLowerCase())).size!==4)return notify("Each option must be different.");const record={user_id:currentUser.id,quiz_id:selectedQuiz.id,question_text:$q("questionTextInput").value.trim(),choices,correct_choice:Number($q("correctChoiceInput").value),points:Number($q("questionPointsInput").value),sort_order:questions.filter(x=>x.quiz_id===selectedQuiz.id).length};const query=editingQuestion?db.from("quiz_questions").update(record).eq("id",editingQuestion.id).eq("user_id",currentUser.id):db.from("quiz_questions").insert(record);const {error}=await query;if(error)return notify(error.message);closeQuestionModal();await loadQuizzes();renderQuestions();notify("Question saved.");});
 ["closeQuizModal","cancelQuizModal"].forEach(id=>$q(id).addEventListener("click",closeQuizModal));
 ["closeQuestionModal","cancelQuestionModal"].forEach(id=>$q(id).addEventListener("click",closeQuestionModal));
 window.loadQuizzes=loadQuizzes;
})();
