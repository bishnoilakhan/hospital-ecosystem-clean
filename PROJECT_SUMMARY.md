# Project Summary — Hospital Ecosystem (Full Stack MERN)

## 1. Project Overview
A hospital ecosystem with four roles: Patient, Doctor, Receptionist, Admin.
Core features: appointment management, digital medical vault, doctor consultation workflow,
receptionist queue system, admin staff management, role-based dashboards, symptom triage.

## 2. Backend Architecture

**Stack:** Node.js + Express + MongoDB (Mongoose)
**Base folder:** `backend/`

**Models**
- **User:** `name`, `email`, `password`, `role` (`patient|doctor|receptionist|admin`), `healthId` (patients only)
- **Patient:** `healthId`, `age`, `gender`, `bloodGroup`, `allergies`, `chronicDiseases`, `phone`
- **Doctor:** `userId` (ref User), `department`, `experience`, `availability`
- **Appointment:** `patientHealthId`, `doctorId`, `date`, `status` (`scheduled|checked-in|completed`)
- **MedicalRecord:** `patientHealthId`, `doctorId`, `diagnosis`, `prescription` (array/structured), `notes`, `reports`, `date`

**Key backend files**
- `backend/controllers/authController.js`
- `backend/controllers/appointmentController.js`
- `backend/controllers/doctorController.js`
- `backend/controllers/medicalRecordController.js`
- `backend/controllers/adminController.js`
- `backend/controllers/statsController.js`
- `backend/controllers/patientController.js`
- `backend/routes/*.js`
- `backend/models/*.js`

## 3. Backend APIs (by role)

**Auth**
- `POST /api/auth/register` (patients only; creates patient + healthId)
- `POST /api/auth/login`

**Admin**
- `POST /api/admin/create-staff` (create doctor/receptionist/admin)
- `POST /api/admin/create-doctor` (create Doctor profile for user)
- `GET /api/admin/stats`
- `GET /api/admin/doctor-users` (doctor users without profiles)

**Patient**
- `GET /api/doctors`
- `POST /api/appointment/create`
- `GET /api/patient/records`
- `POST /api/triage`

**Reception**
- `GET /api/patients?search=`
- `GET /api/appointments/today`
- `PUT /api/appointment/checkin/:id`

**Doctor**
- `GET /api/doctor/appointments`
- `PUT /api/appointment/complete/:id`
- `POST /api/medical-record/add`

**Stats**
- `GET /api/patient/stats`
- `GET /api/doctor/stats`
- `GET /api/reception/stats`

## 4. Frontend Architecture

**Stack:** React + Vite + Tailwind CSS + React Router
**Base folder:** `frontend/`

**Pages**
- Login
- Register
- PatientDashboard
- DoctorDashboard
- ReceptionDashboard
- AdminDashboard

**Components**
- DashboardLayout
- DashboardCard
- StatsCard
- StatsSkeleton
- MedicalTimeline
- AppointmentCard
- Loader
- ProtectedRoute

**Core frontend files**
- `frontend/src/pages/*.jsx`
- `frontend/src/components/*.jsx`
- `frontend/src/services/api.js`
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/App.jsx`

## 5. UX Improvements Implemented

- Removed manual ID inputs across dashboards.
- Patients select doctors via dropdown (from `/api/doctors`).
- Reception uses autocomplete search for patients.
- Doctor consultation uses appointment context (no manual patient IDs).
- Prescription is structured as an array of medicines (add/remove).
- Reception dashboard has a queue list with status-based check-in.
- Admin selects doctor users without profiles (dropdown from `/api/admin/doctor-users`).
- Toasts for feedback, loading spinners/skeletons, role-based sidebar visibility.

## 6. Current System Workflow

**Patient:**
Register → Login → Book appointment → View medical timeline → Triage

**Reception:**
Search patient → Create appointment → View today’s queue → Check-in

**Doctor:**
View appointments → Open consultation → Add diagnosis + medicines → Save record → Complete appointment

**Admin:**
Create staff → Create doctor profile → View stats

## 7. Remaining Possible Improvements

- Upload/attach medical reports (file storage)
- Real-time queue updates (Socket.IO)
- Smarter triage AI / NLP
- Doctor availability scheduling + time slots

## 8. Project Folder Structure

```
hospital-ecosystem/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── services/
│   │   ├── context/
│   │   └── App.jsx
│
└── PROJECT_SUMMARY.md
```

## 9. Development Setup

**Backend**
```
cd backend
npm install
npm run dev
```

**Frontend**
```
cd frontend
npm install
npm run dev
```

## 10. Key Design Principles

- No manual ID entry in UI
- Search/autocomplete for entities
- Structured prescriptions
- Queue-based reception workflow
- Role-based dashboards
