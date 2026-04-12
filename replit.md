# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains an Exam Portal web app with Firebase authentication, AI-powered grading, and proctoring.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Auth**: Firebase (Gmail-only Google sign-in)
- **AI Grading**: Gemini via Replit AI Integrations

## Artifacts

- **exam-portal** (react-vite, `/`) — Main student exam portal
- **api-server** (Express, `/api`) — Backend REST API

## Key Features

1. **Firebase Gmail Auth** — Only @gmail.com accounts allowed; email verification flow
2. **Student Registration** — College, Department, Roll Number stored in PostgreSQL
3. **Command Center Dashboard** — Stats, available exams, past attempt history
4. **Proctoring Engine** — Fullscreen enforcement, tab-switch detection, violation counter, auto-submit on threshold
5. **Exam Interface** — MCQ + paragraph questions, debounced auto-save, countdown timer
6. **AI Grading** — MCQ auto-graded, paragraph answers graded by Gemini with rubric-based feedback

## Database Tables

- `students` — Firebase UID, email, college, department, roll number
- `exams` — Title, subject, duration, total marks, violation limit
- `questions` — MCQ or paragraph, options, correct answer, rubric, marks
- `attempts` — Student exam session with status, score, violation count
- `answers` — Per-question responses with AI feedback and marks awarded

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Environment Variables

- `VITE_FIREBASE_*` — Firebase configuration (all set)
- `AI_INTEGRATIONS_GEMINI_BASE_URL` / `AI_INTEGRATIONS_GEMINI_API_KEY` — Gemini AI (auto-provisioned)
- `DATABASE_URL` — PostgreSQL connection (auto-provisioned)
