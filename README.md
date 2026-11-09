# Student Management System — CampusDesk

A responsive Student Management System starter project built with HTML, CSS and JavaScript. Supabase is provided as the online database and authentication backend.

## Features in the current demo

- Dashboard with student, course and attendance summaries
- Add, edit, delete and search student records
- Course listing and add-course flow
- Daily attendance marking (Present, Absent, Late)
- Responsive desktop and mobile layout
- Sample records stored in the current browser

## Run the demo

Open `index.html` in a modern browser, or publish the repository using GitHub Pages. Demo records are stored only in that browser's local storage.

**Important:** Demo mode is not a secure admin login, and data is not shared between devices. Do not enter real student personal information in demo mode.

## Connect Supabase for shared online data

1. Create a Supabase project at https://supabase.com/.
2. Open the SQL Editor and run `supabase/schema.sql`.
3. Copy the Project URL and anon/public key from Project Settings → API.
4. Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `app.js`.
5. Configure Supabase Authentication and create an administrator account.
6. Connect the app's data operations to Supabase before using it with real student records.

Never put a Supabase service-role key in browser code. The anon key is safe to expose only when Row Level Security is correctly configured.

## Publish with GitHub Pages

1. Open repository Settings → Pages.
2. Under Build and deployment, select **Deploy from a branch**.
3. Select branch **main** and folder **/(root)**, then Save.
4. Wait for GitHub Pages to publish. GitHub will show the website URL on that settings screen.

## Technology stack

- Frontend: HTML5, CSS3, JavaScript
- Database and authentication: Supabase (PostgreSQL + Auth)
- Version control: GitHub
- Hosting: GitHub Pages (static frontend)

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
