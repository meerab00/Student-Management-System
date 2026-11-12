# Student Management System — CampusDesk

CampusDesk is a responsive, browser-based Student Management System. It uses Supabase for secure sign-in and online PostgreSQL storage, so records are shared across devices.

## Features

- Single administrator sign-in and sign-out (public registration is not provided)
- Dashboard with student, course and attendance summaries
- Add, view, edit and delete student records; Student IDs are generated automatically and cannot be edited
- Add, edit and delete courses and subjects
- Manage student course enrollments and teacher records
- Mark attendance and export student lists and date-wise attendance reports as CSV or print/save them as PDF
- Manage exams, student results, fee records and class timetable
- Supabase Row Level Security: each signed-in account can access only its own records
- Responsive layout for desktop and mobile browsers
- Floating CampusDesk Assistant with AI-powered guidance, live non-sensitive dashboard summaries, and built-in FAQ fallback

## Main workflows

1. The administrator signs in using the pre-created Supabase Auth account.
2. The dashboard loads live student, course and attendance summaries.
3. Student records can be added, viewed, searched, edited (except the automatically generated Student ID), and deleted.
4. Courses and subjects can be created, edited and removed. When a course is removed, its students remain and their course assignment is cleared.
5. Students can be assigned to courses through Enrollments.
6. Attendance is recorded by date. Every active student shown in the selected course filter must have an explicit status before saving.
7. Teachers, exams, results, fee records and timetable classes can be managed from the Academics and Finance sections.
8. Student and attendance reports can be exported as CSV or printed / saved as PDF from the browser print dialog.

## Technology

- Frontend: HTML, CSS and JavaScript
- Authentication and database: Supabase Auth and PostgreSQL
- AI assistant: Groq API called securely through a Supabase Edge Function
- Repository and version control: GitHub
- Static hosting: GitHub Pages

## Built-in chatbot

The floating **CampusDesk Assistant** opens from the bottom-right corner of the website. It uses a Supabase Edge Function to call the Groq AI service. The function contains a feature-specific system guide so the assistant should explain only workflows that exist in the website. If the AI service is temporarily unavailable, the browser chatbot shows built-in FAQ guidance instead.

The Groq API key must be stored as the `GROQ_API_KEY` secret in Supabase Edge Function settings. Never place this key in `chatbot.js`, `app.js`, or any other browser file. The assistant explains how to use CampusDesk and receives only non-sensitive aggregate dashboard figures (counts, course totals, attendance totals and fee totals) from the signed-in browser. It does not receive student names, emails, CNICs, phone numbers or other individual records, and it cannot add, edit or delete records.

## Database setup

The Supabase project is configured for this app. The schema is maintained in `supabase/schema.sql` (core tables) and `supabase/modules-schema.sql` (subjects, enrollments, teachers, exams, results, fees, timetable and user profiles). Both scripts enable Row Level Security, add per-user access policies, and grant access only to authenticated users.

To apply the core schema to another Supabase project, open its SQL Editor and run the complete `supabase/schema.sql` script. Configure the matching project URL and publishable key in `app.js`.

**Security:** The frontend uses only a Supabase publishable key. Never put a Supabase secret or service-role key in browser code.

## Run locally

Open `index.html` in a modern browser, or serve the repository with any static web server. Create the one administrator account in Supabase Authentication before publishing the app, then disable public sign-ups in Supabase Auth settings. The browser app intentionally provides sign-in only. If email confirmation is enabled, confirm the administrator email before signing in.

## Publish with GitHub Pages

In the repository's **Settings → Pages**, confirm that the deployment source is the `main` branch and the `/(root)` folder. GitHub displays the published website URL on that page.

## Project structure

```
Student-Management-System/
├── index.html
├── styles.css
├── app.js
├── modules.js
├── chatbot.js
├── chatbot.css
├── README.md
└── supabase/
    └── schema.sql
```
