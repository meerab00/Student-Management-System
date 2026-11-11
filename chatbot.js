/* CampusDesk Help Assistant — guided FAQ chatbot (no external API key required) */
(() => {
  const icon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-6.5A7.5 7.5 0 1 1 20 11.5Z"/><path d="M8 11h.01M12 11h.01M16 11h.01"/></svg>';
  const launcher=document.createElement("button");
  launcher.className="chat-launcher";launcher.type="button";launcher.setAttribute("aria-label","Open CampusDesk assistant");
  launcher.innerHTML='<span class="chat-open-icon">'+icon+'</span><span class="chat-close-icon">×</span>';
  const panel=document.createElement("section");panel.className="chat-window";panel.setAttribute("aria-label","CampusDesk help chat");
  panel.innerHTML='<header class="chat-header"><div class="chat-bot-avatar">✦</div><div class="chat-header-copy"><strong>CampusDesk Assistant</strong><span><i class="chat-online"></i>Here to help with your campus system</span></div><button type="button" aria-label="Close chat">×</button></header><div class="chat-messages" aria-live="polite"></div><form class="chat-input-area"><textarea rows="1" maxlength="500" placeholder="Type your question..." aria-label="Your message"></textarea><button class="chat-send" type="submit" aria-label="Send message">➤</button></form>';
  document.body.append(launcher,panel);
  const messages=panel.querySelector(".chat-messages"),form=panel.querySelector("form"),input=form.querySelector("textarea"),close=panel.querySelector(".chat-header button");
  const quick=["How do I add a student?","How can I edit a Student ID?","How do I manage courses?","How do I mark attendance?"];
  function addMessage(text,who){const el=document.createElement("div");el.className="chat-message "+who;el.textContent=text;messages.append(el);messages.scrollTop=messages.scrollHeight;}
  function addSuggestions(items){const wrap=document.createElement("div");wrap.className="chat-suggestions";items.forEach(label=>{const b=document.createElement("button");b.type="button";b.className="chat-suggestion";b.textContent=label;b.addEventListener("click",()=>send(label));wrap.append(b)});messages.append(wrap);messages.scrollTop=messages.scrollHeight;}
  function answer(q){
    const s=q.toLowerCase();
    if(/hello|hi\b|salam|assalam/.test(s))return "Hello! Welcome to CampusDesk. I can guide you about student records, courses, attendance and using the dashboard.";
    if(/add|register|new student|student form/.test(s))return "To add a student:\n1. Sign in as administrator.\n2. Open Students from the left menu.\n3. Select + Add student.\n4. Enter the student details and choose a course.\n5. Press Save student.";
    if(/edit|change|update/.test(s)&&/student id|id number|id/.test(s))return "To change a Student ID, open Students, find the student and select Edit. Update the Student ID field, then press Save student. The ID must be unique; an already-used ID cannot be saved.";
    if(/course|subject/.test(s))return "Open Courses from the left menu. Use + Add course to create a course. You can also edit or delete an existing course. Students can be assigned to a course in their student form.";
    if(/attendance|present|absent|late/.test(s))return "Open Attendance, select the date and course, choose Present, Absent or Late for each student, then press Save attendance.";
    if(/search|find student/.test(s))return "Open Students and use the search box. You can search by student name, Student ID, email or course. The course filter can narrow the list.";
    if(/export|download|csv|report/.test(s))return "On the Students page, choose Export CSV to download the student list. On the Attendance page, choose Export CSV to download the selected date's attendance report.";
    if(/login|sign in|password|account/.test(s))return "CampusDesk is accessed using the administrator account created in Supabase Authentication. Enter the administrator email and password on the sign-in screen. This website does not offer public sign-up.";
    if(/dashboard|total students|statistics|stats/.test(s))return "The Dashboard shows total students, active courses, today's present count and the attendance rate. It also displays recent student registrations and quick actions.";
    if(/parent|father|mother|guardian|date of birth|dob|cnic/.test(s))return "Student admission profiles are intended to hold personal and parent/guardian details. If a field is not visible in the current form, it has not been enabled in this website version yet.";
    if(/who are you|your name|chatbot|assistant/.test(s))return "I am CampusDesk Assistant, the built-in help chatbot for the Student Management System. I answer common questions about using the website.";
    return "I can currently help with adding or editing students, Student IDs, courses, attendance, search, exports and login. Please ask about one of these topics, or choose a suggestion below.";
  }
  function send(text){const q=String(text||"").trim();if(!q)return;addMessage(q,"user");input.value="";const reply=answer(q);window.setTimeout(()=>addMessage(reply,"bot"),180);}
  function open(){panel.classList.add("is-open");launcher.classList.add("is-open");launcher.setAttribute("aria-label","Close CampusDesk assistant");if(!messages.childElementCount){addMessage("Assalamu Alaikum! 👋\nI’m the CampusDesk Assistant. Ask me how to use the Student Management System.", "bot");addSuggestions(quick);}input.focus();}
  function shut(){panel.classList.remove("is-open");launcher.classList.remove("is-open");launcher.setAttribute("aria-label","Open CampusDesk assistant");}
  launcher.addEventListener("click",()=>panel.classList.contains("is-open")?shut():open());close.addEventListener("click",shut);
  form.addEventListener("submit",e=>{e.preventDefault();send(input.value);});
  input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send(input.value);}});
})();
