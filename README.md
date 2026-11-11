# Student Management System — CampusDesk

CampusDesk is a responsive, browser-based Student Management System. It uses Supabase for secure sign-in and online PostgreSQL storage, so records are shared across devices.

## Features

- Single administrator sign-in and sign-out (public registration is not provided)
- Dashboard with student, course and attendance summaries
- Add, edit, search and delete student records
- Add and view courses
- Mark attendance as Present, Absent or Late
- Export student lists and date-wise attendance reports as CSV
- Supabase Row Level Security: each signed-in account can access only its own records
- Responsive layout for desktop and mobile browsers
- Floating CampusDesk Assistant chat widget with guided answers for common student, course, attendance, search, export and sign-in questions

## Main workflows

1. The administrator signs in using the pre-created Supabase Auth account.
2. The dashboard loads live student, course and attendance summaries.
3. Student records can be added, searched, edited (including Student ID), and deleted.
4. Courses can be created, edited and removed. When a course is removed, its students remain and their course assignment is cleared.
5. Attendance is recorded by date. Every active student must have an explicit status before saving.
6. Student and attendance data can be exported as CSV for spreadsheet use.

## Technology

- Frontend: HTML, CSS and JavaScript (including the in-page help chatbot)
- Authentication and database: Supabase Auth and PostgreSQL
- Repository and version control: GitHub
- Static hosting: GitHub Pages

## Built-in chatbot

The floating **CampusDesk Assistant** opens from the bottom-right corner of the website. This first version is a guided FAQ chatbot implemented in browser JavaScript; it does not send messages to an external AI model and does not require an API key. It answers common how-to questions about the existing website. A generative ChatGPT-style backend can be added later through a secured Supabase Edge Function and a server-side AI provider key; that key must never be placed in `chatbot.js` or other browser files.

## Database setup

The Supabase project is configured for this app. The schema is maintained in `supabase/schema.sql`. It creates the `courses`, `students` and `attendance` tables, enables Row Level Security, and applies per-user access policies.

To apply the schema to another Supabase project, open its SQL Editor and run the complete `supabase/schema.sql` script. Configure the matching project URL and publishable key in `app.js`.

**Security:** The frontend uses only a Supabase publishable key. Never put a Supabase secret or service-role key in browser code.

## Run locally

Open `index.html` in a modern browser, or serve the repository with any static web server. Create the one administrator account in Supabase Authentication before publishing the app, then disable public sign-ups in Supabase Auth settings. The browser app intentionally provides sign-in only. If email confirmation is enabled, confirm the administrator email before signing in.

## Publish with GitHub Pages

The repository has GitHub Pages enabled. In the repository's **Settings → Pages**, confirm that the deployment source is the `main` branch and the `/(root)` folder. GitHub displays the published website URL on that page.

## Project structure

```
Student-Management-System/
├── index.html
├── styles.css
├── app.js
├── README.md
└── supabase/
    └── schema.sql
```
