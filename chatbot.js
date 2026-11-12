/* CampusDesk Assistant — AI help with accurate built-in fallback */
(() => {
  const icon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-6.5A7.5 7.5 0 1 1 20 11.5Z"/><path d="M8 11h.01M12 11h.01M16 11h.01"/></svg>';
  const launcher = document.createElement("button");
  launcher.className = "chat-launcher";
  launcher.type = "button";
  launcher.setAttribute("aria-label", "Open CampusDesk assistant");
  launcher.innerHTML = '<span class="chat-open-icon">' + icon + '</span><span class="chat-close-icon">×</span>';

  const panel = document.createElement("section");
  panel.className = "chat-window";
  panel.setAttribute("aria-label", "CampusDesk help chat");
  panel.innerHTML = '<header class="chat-header"><div class="chat-bot-avatar">✦</div><div class="chat-header-copy"><strong>CampusDesk Assistant</strong><span><i class="chat-online"></i>Here to help with your campus system</span></div><button type="button" aria-label="Close chat">×</button></header><div class="chat-messages" aria-live="polite"></div><form class="chat-input-area"><textarea rows="1" maxlength="500" placeholder="Type your question..." aria-label="Your message"></textarea><button class="chat-send" type="submit" aria-label="Send message">➤</button></form>';
  document.body.append(launcher, panel);

  const messages = panel.querySelector(".chat-messages");
  const form = panel.querySelector("form");
  const input = form.querySelector("textarea");
  const sendButton = form.querySelector(".chat-send");
  const close = panel.querySelector(".chat-header button");
  const quick = [
    "How do I add a student?",
    "Can I change a Student ID?",
    "How do I enroll a student?",
    "How do I export attendance?"
  ];

  function addMessage(text, who) {
    const el = document.createElement("div");
    el.className = "chat-message " + who;
    el.textContent = text;
    messages.append(el);
    messages.scrollTop = messages.scrollHeight;
  }

  function addSuggestions(items) {
    const wrap = document.createElement("div");
    wrap.className = "chat-suggestions";
    items.forEach(label => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "chat-suggestion";
      button.textContent = label;
      button.addEventListener("click", () => send(label));
      wrap.append(button);
    });
    messages.append(wrap);
    messages.scrollTop = messages.scrollHeight;
  }

  function answer(question) {
    const s = question.toLowerCase();
    const context = window.getCampusDeskChatContext?.() || {};
    const totals = context.totals || {};
    const attendance = context.attendanceToday || {};
    const fees = context.fees || {};
    if (/how many|total.*student|student.*count/.test(s) && /student/.test(s) && Number.isFinite(totals.students)) {
      return `CampusDesk has ${totals.students} student records: ${totals.activeStudents||0} active and ${totals.inactiveStudents||0} inactive.`;
    }
    if (/attendance|present today|absent today/.test(s) && /today|current/.test(s)) {
      return `Today's attendance (${context.asOf||"current date"}): ${attendance.present||0} Present, ${attendance.absent||0} Absent, ${attendance.late||0} Late and ${attendance.notMarked||0} not marked.`;
    }
    if (/fee|outstanding|dues|paid amount/.test(s) && Number.isFinite(fees.outstanding)) {
      return `Fee summary: Rs ${Number(fees.billed||0).toLocaleString("en-PK")} billed, Rs ${Number(fees.paid||0).toLocaleString("en-PK")} paid, and Rs ${Number(fees.outstanding||0).toLocaleString("en-PK")} outstanding across ${fees.records||0} fee records.`;
    }
    if (/course.*student|students.*course|course wise/.test(s) && Array.isArray(context.courseBreakdown)) {
      return context.courseBreakdown.map(x=>`${x.course}: ${x.students} students and ${x.subjects} subjects`).join("\n") || "No course records are available.";
    }
    if (/dashboard.*summary|system.*summary|overall.*summary/.test(s) && totals.students !== undefined) {
      return `Current CampusDesk summary: ${totals.students} students, ${totals.courses} courses, ${totals.subjects} subjects, ${totals.teachers} teachers, ${totals.enrollments} enrollments, ${totals.exams} exams, ${totals.results} results and Rs ${Number(fees.outstanding||0).toLocaleString("en-PK")} outstanding fees.`;
    }

    if (/\b(hello|hi|salam|assalam)\b/.test(s)) {
      return "Hello! Welcome to CampusDesk. I can guide you about students, courses, subjects, enrollments, teachers, attendance, exams, results, fees and timetable.";
    }
    if (/student id|id number|change.*\bid\b|edit.*\bid\b/.test(s)) {
      return "No. Student IDs are generated automatically when you add a student and are read-only. You can edit the student's other profile details, but not the Student ID.";
    }
    if (/add|register|new student|student form/.test(s) && /student|admission|record/.test(s)) {
      return "To add a student:\n1. Sign in as administrator.\n2. Open Students from the left menu.\n3. Select + Add student.\n4. Enter the student's name, course, email and other available details. The Student ID is generated automatically and is read-only.\n5. Press Save student.";
    }
    if (/parent|father|mother|guardian|date of birth|dob|cnic|personal information/.test(s)) {
      return "The Add student form includes date of birth, gender, address, admission date, father name and CNIC, mother name and CNIC, and guardian phone. Open Students → + Add student. These details can also be viewed or edited later.";
    }
    if (/enroll|enrollment/.test(s)) {
      return "To enroll a student, open Enrollments under Academics and select + New enrollment. Choose the student and course, set the enrollment date and choose Active, Completed or Withdrawn. You can edit or delete an enrollment later.";
    }
    if (/attendance|present|absent|late/.test(s)) {
      return "To mark attendance, open Attendance, choose the date and optionally filter by course. Select Present, Absent or Late for every active student shown, then press Save attendance. Every displayed student needs a status before saving.";
    }
    if (/export|download|csv|report/.test(s) && /attendance/.test(s)) {
      return "Open Attendance, choose the required date and course filter if needed, then press Export CSV. The download contains the attendance status for the selected date and students.";
    }
    if (/export|download|csv|report/.test(s) && /student/.test(s)) {
      return "Open Students and press Export CSV. The student list can be exported as a CSV file. Attendance CSV export is available separately on the Attendance page.";
    }
    if (/export|download|csv|report/.test(s)) {
      return "CSV export is available on the Students and Attendance pages. Open the relevant page and press Export CSV. PDF admission slips and PDF reports are not currently available.";
    }
    if (/subject/.test(s)) {
      return "Open Subjects under Academics and press + Add subject. Enter the subject name and code, select its course, and optionally choose a semester (1–8). Subjects can be edited or deleted.";
    }
    if (/teacher|faculty/.test(s)) {
      return "Open Teachers under Academics and press + Add teacher. Enter the full name; email, phone and specialization are optional. Teacher records can be edited or deleted.";
    }
    if (/exam|result|marks|grade|percentage/.test(s)) {
      return "Open Exams & Results. Press + Add exam to enter the exam title, course, optional subject/date and total marks. Then use + Add result to select a student and exam and enter obtained marks. CampusDesk calculates the percentage and grade.";
    }
    if (/fee|payment|dues|outstanding/.test(s)) {
      return "Open Fee Management and press + Add fee record. Select a student, fee title, total amount and amount paid; due date and notes are optional. CampusDesk calculates Pending, Partial or Paid status and the outstanding balance. Amounts are in PKR/Rs.";
    }
    if (/timetable|class schedule|room|lab/.test(s)) {
      return "Open Timetable and press + Add class. Select the course, subject, teacher, weekday (Monday–Saturday), start and end times, and optionally enter a room or lab. The end time must be after the start time.";
    }
    if (/course/.test(s)) {
      return "Open Courses from the left menu and press + Add course. Enter a course name and unique course code; description and duration are optional. You can edit or delete courses later.";
    }
    if (/search|find student/.test(s)) {
      return "Open Students and use the search box. You can search by student name, Student ID, email or course. The course filter can narrow the list.";
    }
    if (/login|sign in|password|account/.test(s)) {
      return "CampusDesk uses an administrator account created in Supabase Authentication. Enter the administrator email and password on the sign-in screen. Public sign-up is not available.";
    }
    if (/dashboard|total students|statistics|stats/.test(s)) {
      return "The Dashboard shows student and active-student totals, courses, today's attendance, teacher and subject counts, pending fees, upcoming exams, course distribution and an academic snapshot.";
    }
    if (/who are you|your name|chatbot|assistant/.test(s)) {
      return "I am CampusDesk Assistant, the built-in help chatbot for the Student Management System. I explain how to use the features available on this website, but I cannot change records for you.";
    }
    return "I can guide you through the features currently available in CampusDesk: students, Student IDs, courses, subjects, enrollments, teachers, attendance, exams, results, fees, timetable, dashboard and CSV exports. Ask me about one of these features.";
  }

  async function send(text) {
    const question = String(text || "").trim();
    if (!question) return;
    addMessage(question, "user");
    input.value = "";
    input.disabled = true;
    sendButton.disabled = true;

    const waiting = document.createElement("div");
    waiting.className = "chat-message bot";
    waiting.textContent = "Thinking…";
    messages.append(waiting);
    messages.scrollTop = messages.scrollHeight;

    try {
      const { data, error } = await db.functions.invoke("campusdesk-assistant", {
        body: { message: question, context: window.getCampusDeskChatContext?.() || null }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      waiting.remove();
      addMessage(data?.reply || answer(question), "bot");
    } catch (_error) {
      waiting.remove();
      addMessage(answer(question) + "\n\n(The built-in help is being shown because the AI service is temporarily unavailable.)", "bot");
    } finally {
      input.disabled = false;
      sendButton.disabled = false;
      input.focus();
    }
  }

  function open() {
    panel.classList.add("is-open");
    launcher.classList.add("is-open");
    launcher.setAttribute("aria-label", "Close CampusDesk assistant");
    if (!messages.childElementCount) {
      addMessage("Assalamu Alaikum! 👋\nI’m the CampusDesk Assistant. Ask me how to use the Student Management System.", "bot");
      addSuggestions(quick);
    }
    input.focus();
  }

  function shut() {
    panel.classList.remove("is-open");
    launcher.classList.remove("is-open");
    launcher.setAttribute("aria-label", "Open CampusDesk assistant");
  }

  launcher.addEventListener("click", () => panel.classList.contains("is-open") ? shut() : open());
  close.addEventListener("click", shut);
  form.addEventListener("submit", event => {
    event.preventDefault();
    send(input.value);
  });
  input.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send(input.value);
    }
  });
})();