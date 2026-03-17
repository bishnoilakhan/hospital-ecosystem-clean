# AGENTS.md

## Project Context

This repository contains a full-stack MERN application called **Hospital Ecosystem**.

Roles in the system:
- Patient
- Doctor
- Receptionist
- Admin

Core modules:
- Appointment system
- Digital medical vault
- Doctor consultation workflow
- Reception queue system
- Admin staff management
- Role-based dashboards
- Symptom triage

Agents should read `PROJECT_SUMMARY.md` to understand the full architecture.

## Development Setup

Backend:
```
cd backend
npm install
npm run dev
```

Frontend:
```
cd frontend
npm install
npm run dev
```

## Architecture Rules

The project follows a role-based architecture.

Patient → appointment booking  
Reception → appointment management and check-in  
Doctor → consultation workflow and medical records  
Admin → staff and system management

Agents must maintain this structure when modifying the code.

## UX Design Rules

Important rule: **Never expose internal database IDs in the UI.**

Instead always use:
- search
- dropdown selection
- autocomplete

Examples:
- Patients select doctors instead of entering doctorId.
- Reception searches patients instead of entering healthId.
- Doctors open consultations from appointments instead of typing patient IDs.
- Admins select doctor users from dropdown instead of entering userId.

## Backend Coding Rules

Use:
- Express controllers
- async/await
- clean JSON responses

All endpoints must:
- validate input
- return proper HTTP status codes
- handle errors gracefully

Database access must use **Mongoose models**.

## Frontend Coding Rules

Use:
- React functional components
- Tailwind CSS for styling
- Axios API helpers from `src/services/api.js`

User feedback must use **toast notifications**.
Avoid manual page refreshes — update UI state instead.

## Important Workflows

Patient workflow:
Register → Login → Book appointment → View medical timeline

Reception workflow:
Search patient → Create appointment → Check-in patient

Doctor workflow:
View appointments → Open consultation → Add diagnosis + medicines → Save medical record

Admin workflow:
Create staff → Create doctor profile → View system stats

## Safety Rules

Agents must NOT:
- remove authentication
- expose sensitive data
- bypass role-based access control

## When Modifying Code

Agents should:
1. Understand the relevant module first.
2. Follow existing project patterns.
3. Keep UX consistent across dashboards.
4. Avoid introducing manual ID inputs.
