# ExamPortal

## Overview

pnpm workspace monorepo using TypeScript. Contains a full-featured online exam portal with Firebase authentication, Supabase data layer, and real-time proctoring.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/exam-portal)
- **API framework**: Express 5 (artifacts/api-server)
- **Auth**: Firebase (Gmail-only Google sign-in + email/password with OTP verification)
- **Data layer**: Supabase (PostgreSQL)
- **State/queries**: TanStack Query v5
- **UI**: shadcn/ui + Tailwind CSS + Framer Motion
- **Email (OTP)**: Nodemailer + Ethereal (auto-switches to Gmail SMTP when secrets set)

## Artifacts

- **exam-portal** (react-vite, port 18926) — Student exam portal, proxied to `/`
- **api-server** (Express, port 8080) — OTP send/verify endpoints

## Key Features

1. **Firebase Auth** — Gmail-only restriction; email/password sign-up with 6-digit OTP verification
2. **Student Registration** — College, Department, Roll Number stored in Supabase `profiles` table
3. **Dashboard** — Exam stats overview, available exams list, submission history
4. **Proctoring Engine** — Fullscreen enforcement, tab-switch/blur detection, violation counter, auto-submit when threshold exceeded, red breach overlay
5. **Exam Interface** — MCQ radio buttons + paragraph textarea, countdown timer, client-side MCQ grading
6. **Result Page** — Score, percentage, violations, time taken, pass/fail status

## Supabase Tables

- `profiles` — Firebase UID as PK, email, display_name, college, department, roll_number
- `exams` — id, title, description, duration_minutes, max_violations, is_active
- `exam_questions` — id, exam_id, question, question_type (mcq/paragraph/code), options[], correct_answer, marks, sort_order
- `exam_submissions` — id, user_id, exam_id, score, total_marks, violations, time_used_seconds, status, student_name, roll_number, submitted_at

## Key Source Files

- `artifacts/exam-portal/src/lib/supabase.ts` — Supabase client + TypeScript interfaces
- `artifacts/exam-portal/src/hooks/useExamData.ts` — All exam data hooks (TanStack Query)
- `artifacts/exam-portal/src/hooks/useProfile.ts` — Profile read/write hooks
- `artifacts/exam-portal/src/hooks/useAuth.ts` — Firebase auth state hook
- `artifacts/exam-portal/src/pages/login.tsx` — Sign in / sign up / OTP verify
- `artifacts/exam-portal/src/pages/register.tsx` — Student profile creation
- `artifacts/exam-portal/src/pages/dashboard.tsx` — Command center
- `artifacts/exam-portal/src/pages/exam.tsx` — Fullscreen proctored exam
- `artifacts/exam-portal/src/pages/result.tsx` — Result report
- `artifacts/api-server/src/routes/otp.ts` — OTP send/verify endpoints
- `artifacts/api-server/src/lib/mailer.ts` — Nodemailer (Ethereal/Gmail)

## Environment Variables

- `VITE_FIREBASE_*` — Firebase config (set in userenv.shared)
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — Supabase client config (set in userenv.shared)
- `SESSION_SECRET` — Express session secret (Replit secret)
- `SMTP_EMAIL` / `SMTP_APP_PASSWORD` — Optional: enables real Gmail SMTP for OTP emails
- `DATABASE_URL` — PostgreSQL for API server OTP table (auto-provisioned)

## Firebase Configuration Required

- Add `spock.replit.dev` and your `.replit.app` domain to Firebase Console → Authentication → Authorized Domains
- Enable "Email/Password" and "Google" sign-in methods in Firebase Console

## OTP Email (Development)

Check the **API Server** workflow logs for an Ethereal preview URL to view OTP emails without a real SMTP server.
