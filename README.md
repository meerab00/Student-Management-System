# Student Management System — CampusDesk

CampusDesk is a responsive, browser-based Student Management System. It uses Supabase for secure sign-in and online PostgreSQL storage, so records are shared across devices.

## Features

- Administrator sign-up, sign-in and sign-out
- Dashboard with student, course and attendance summaries
- Add, edit, search and delete student records
- Add and view courses
- Mark attendance as Present, Absent or Late
- Supabase Row Level Security: each signed-in account can access only its own records
- Responsive layout for desktop and mobile browsers

## Technology

- Frontend: HTML, CSS and JavaScript
- Authentication and database: Supabase Auth and PostgreSQL
- Repository and version control: GitHub
- Static hosting: GitHub Pages

## Database setup

The Supabase project is configured for this app. The schema is maintained in `supabase/schema.sql`. It creates the `courses`, `students` and `attendance` tables, enables Row Level Security, and applies per-user access policies.

To apply the schema to another Supabase project, open its SQL Editor and run the complete `supabase/schema.sql` script. Configure the matching project URL and publishable key in `app.js`.

**Security:** The frontend uses only a Supabase publishable key. Never put a Supabase secret or service-role key in browser code.

## Run locally

Open `index.html` in a modern browser, or serve the repository with any static web server. Create an administrator account from the sign-in screen. If email confirmation is enabled in Supabase Auth, confirm the email before signing in.

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
