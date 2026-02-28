<p align="center">
  <img src="https://img.shields.io/badge/CollabClass-Classroom%20Intelligence-7c3aed?style=for-the-badge&logo=bookstack&logoColor=white" alt="CollabClass Banner" />
</p>

<h1 align="center">CollabClass</h1>

<p align="center">
  <b>AI-Driven Classroom Collaboration & Intelligence Platform</b><br/>
  <sub>Real-time collaboration · Analytics-driven insights · Peer mentoring · Role-based access</sub>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-5.x-000000?style=flat-square&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/MongoDB-9.x-47A248?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Socket.io-4.x-010101?style=flat-square&logo=socket.io&logoColor=white" alt="Socket.io" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/license-ISC-blue?style=flat-square" alt="License" />
</p>

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Application](#running-the-application)
- [API Reference](#api-reference)
  - [Authentication](#authentication)
  - [Assignments](#assignments)
  - [Submissions](#submissions)
  - [Doubt Discussion Forum](#doubt-discussion-forum)
  - [Notifications](#notifications)
  - [Analytics & Intelligence](#analytics--intelligence)
  - [Dashboard](#dashboard)
  - [Study Materials](#study-materials)
  - [Peer Sessions](#peer-sessions)
- [Database Schema](#database-schema)
- [Real-Time Events](#real-time-events)
- [Authentication & Authorization](#authentication--authorization)
- [Analytics Intelligence Engine](#analytics-intelligence-engine)
- [Frontend Architecture](#frontend-architecture)
- [Design System](#design-system)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**CollabClass** is a full-stack classroom collaboration platform that transforms traditional learning management into an intelligent, data-driven experience. Built on the MERN stack with TypeScript, it combines real-time communication, advanced analytics, and AI-powered peer mentoring to help teachers identify at-risk students, recommend interventions, and foster peer-to-peer learning — all within a modern, glass-morphism UI.

### Who Is It For?

| Role | What They Get |
|------|---------------|
| **Teachers** | Teaching Intelligence dashboard, assignment management with analytics, automated risk detection, peer mentor suggestions, intervention recommendations, section-wide analytics |
| **Students** | Personal Learning Graph, assignment submissions, doubt discussion forum, study material access, peer mentoring sessions, performance trend tracking |
| **Admins** | Full access control, thread moderation capabilities |

---

## Key Features

### Core Platform
- **Role-Based Access Control** — Three-tier role system (student / teacher / admin) with middleware-enforced permissions
- **Section Isolation** — All data automatically scoped to user sections ensuring data segregation
- **Google OAuth + Email Auth** — Dual authentication with Google One Tap sign-in and traditional email/password
- **University Detection** — Automatic identification of university users via `@srmap.edu.in` email domain

### Assignment Management
- **Full CRUD Lifecycle** — Create, read, update (close) assignments with deadlines
- **Auto-Expiry** — Assignments automatically transition to `expired` status when past deadline
- **Late Submission Tracking** — System automatically flags late submissions
- **Per-Assignment Analytics** — Submission rates, grade distribution, top performers

### Doubt Discussion Forum
- **Threaded Discussions** — Nested reply tree with unlimited depth
- **Assignment-Linked Threads** — Doubts can be linked to specific assignments or subjects
- **Thread Moderation** — Pin, resolve, close, soft-delete threads
- **Best Answer Marking** — Teachers can flag authoritative replies

### Real-Time Notifications
- **WebSocket-Powered** — Instant notifications via Socket.io with JWT authentication
- **Multi-Device Support** — Users receive notifications across all connected devices simultaneously
- **Notification Types** — New threads, new replies, thread resolved, thread closed
- **Optimistic UI Updates** — Instant read-state toggling with background API sync

### Analytics Intelligence Engine
- **Student Strength Mapping** — Per-subject strength scores derived from marks, submissions, and engagement
- **Risk Index Calculation** — Composite risk scoring combining academic performance, submission timeliness, and engagement
- **Declining Trend Detection** — Identifies students with 20%+ performance drops in recent months
- **AI-Powered Peer Suggestions** — Automatically pairs weak students with strong mentors via round-robin matching
- **Intervention Recommendations** — Generates per-student action items (Academic Support / Engagement Support / Monitor)
- **Performance Trend Tracking** — Monthly trend visualization with DECLINING / IMPROVING / STABLE status

### Peer Mentoring
- **Teacher-Initiated Sessions** — Structured pairing of strong and weak students per subject
- **Session Lifecycle** — SUGGESTED → SCHEDULED → COMPLETED / CANCELLED
- **Duplicate Prevention** — System prevents creating duplicate open sessions for the same pair
- **Section-Scoped** — Sessions respect section boundaries

### Study Materials
- **Shared Resource Library** — Both teachers and students can upload materials
- **Section-Filtered Browsing** — Students see only their section's materials
- **Owner Permissions** — Material owners and teachers can delete resources

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         CLIENT (React + TS)                         │
│  ┌────────────┐  ┌────────────┐  ┌───────────┐  ┌───────────────┐  │
│  │ Auth Context│  │Socket Ctx  │  │ API Layer │  │  Pages/UI     │  │
│  │ (JWT+Google)│  │(Realtime)  │  │ (Axios)   │  │ (Lazy-loaded) │  │
│  └──────┬─────┘  └──────┬─────┘  └─────┬─────┘  └───────────────┘  │
│         │               │               │                            │
└─────────┼───────────────┼───────────────┼────────────────────────────┘
          │               │               │
          │  WebSocket    │   HTTP/REST   │
          │  (JWT Auth)   │  (/api/*)     │
          ▼               ▼               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     SERVER (Node.js + Express 5)                     │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ Auth MW  │  │ Role MW      │  │ Controllers  │  │ Socket.io  │  │
│  │(JWT verify│  │(RBAC check) │  │ (Business    │  │ (Realtime  │  │
│  │ + user)  │  │              │  │  Logic)      │  │  Events)   │  │
│  └────┬─────┘  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘  │
│       │               │                 │                 │          │
│       └───────────────┼─────────────────┤                 │          │
│                       │                 │                 │          │
│                       ▼                 ▼                 │          │
│              ┌──────────────────────────────────┐        │          │
│              │    Notification Service           │◄───────┘          │
│              │  (DB + Real-time Emit)            │                   │
│              └───────────────┬────────────────────┘                   │
│                              │                                       │
└──────────────────────────────┼───────────────────────────────────────┘
                               │
                               ▼
                  ┌─────────────────────────┐
                  │     MongoDB (Mongoose)   │
                  │  ┌──────┐ ┌───────────┐ │
                  │  │Users │ │Assignments│ │
                  │  ├──────┤ ├───────────┤ │
                  │  │Submis│ │DoubtThread│ │
                  │  ├──────┤ ├───────────┤ │
                  │  │Notifs│ │DoubtReply │ │
                  │  ├──────┤ ├───────────┤ │
                  │  │PeerSe│ │StudyMater │ │
                  │  └──────┘ └───────────┘ │
                  └─────────────────────────┘
```

---

## Tech Stack

### Backend

| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | ≥ 18 | JavaScript runtime |
| **Express** | 5.x | HTTP framework |
| **MongoDB** | — | NoSQL document database |
| **Mongoose** | 9.x | ODM for MongoDB |
| **Socket.io** | 4.x | Real-time bidirectional communication |
| **JSON Web Token** | 9.x | Stateless authentication |
| **bcryptjs** | 3.x | Password hashing |
| **Google Auth Library** | 10.x | Google OAuth verification |
| **dotenv** | 17.x | Environment variable management |
| **nodemon** | 3.x | Development hot-reloading |

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| **React** | 18.x | Component-based UI framework |
| **TypeScript** | 5.x | Static type checking |
| **Vite** | 5.x | Build tool with HMR (SWC plugin) |
| **Tailwind CSS** | 3.x | Utility-first CSS framework |
| **React Router** | 6.x | Client-side routing |
| **React Hook Form** | 7.x | Performant form state management |
| **Zod** | 3.x | Schema validation |
| **Axios** | 1.x | HTTP client with interceptors |
| **Recharts** | 2.x | Composable charting library |
| **Framer Motion** | 11.x | Animation library |
| **Lucide React** | — | Icon library |
| **Radix UI** | — | Accessible headless UI primitives |
| **class-variance-authority** | — | Variant-based component styling |
| **socket.io-client** | 4.x | Real-time client |

---

## Project Structure

```
CollabClass/
├── backend/
│   ├── server.js                    # Express + Socket.io server entry
│   ├── package.json
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── controllers/
│   │   ├── analyticsController.js   # Intelligence engine (875+ lines)
│   │   ├── assignmentController.js  # Assignment CRUD + analytics
│   │   ├── authController.js        # Register, login, Google OAuth
│   │   ├── dashboardController.js   # Teacher dashboard aggregation
│   │   ├── doubtController.js       # Discussion forum
│   │   ├── notificationController.js# Notification management
│   │   ├── peerSessionController.js # Peer mentoring sessions
│   │   ├── studyMaterialController.js# Study material management
│   │   └── submissionController.js  # Assignment submission + grading
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT verification + user injection
│   │   └── roleMiddleware.js        # Role-based authorization
│   ├── models/
│   │   ├── Assignment.js            # Assignment schema
│   │   ├── DoubtReply.js            # Nested reply schema
│   │   ├── DoubtThread.js           # Discussion thread schema
│   │   ├── Notification.js          # Notification schema
│   │   ├── PeerSession.js           # Peer session schema
│   │   ├── StudyMaterial.js         # Study material schema
│   │   ├── submission.js            # Submission schema
│   │   └── User.js                  # User schema with roles
│   ├── routes/
│   │   ├── analyticsRoutes.js       # /api/analytics
│   │   ├── assignmentRoutes.js      # /api/assignments
│   │   ├── authRoutes.js            # /api/auth
│   │   ├── dashboardRoutes.js       # /api/dashboard
│   │   ├── doubtRoutes.js           # /api/doubts
│   │   ├── notificationRoutes.js    # /api/notifications
│   │   ├── peerSessionRoutes.js     # /api/peer-sessions
│   │   ├── studyMaterialRoutes.js   # /api/materials
│   │   └── submissionRoutes.js      # /api/submissions
│   ├── socket/
│   │   ├── ioInstance.js            # Socket.io singleton
│   │   └── socketManager.js         # Multi-device user tracking
│   └── utils/
│       ├── generateToken.js         # JWT generation (7-day expiry)
│       └── notificationService.js   # Real-time notification engine
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts               # Dev server + API proxy
│   ├── tailwind.config.cjs          # Glass-morphism design tokens
│   ├── postcss.config.cjs
│   ├── tsconfig.json                # Strict TypeScript config
│   └── src/
│       ├── App.tsx                   # Route definitions + lazy loading
│       ├── main.tsx                  # React entry point
│       ├── index.css                 # Global styles
│       ├── api/
│       │   ├── axios.ts             # Axios instance + interceptors
│       │   ├── analytics.ts         # Analytics API calls
│       │   ├── assignments.ts       # Assignment API calls
│       │   ├── dashboard.ts         # Dashboard API calls
│       │   ├── doubts.ts            # Doubt API calls
│       │   ├── notifications.ts     # Notification API calls
│       │   └── studyMaterials.ts    # Study material API calls
│       ├── components/
│       │   ├── analytics/           # StatCard, ProgressBar, RiskBadge, TrendPill
│       │   └── ui/
│       │       └── button.tsx       # CVA-based button component
│       ├── context/
│       │   ├── AuthContext.tsx       # Auth state + Google OAuth
│       │   └── SocketContext.tsx     # Real-time notification state
│       ├── layouts/
│       │   └── AppLayout.tsx        # Sidebar + header + notification bell
│       ├── pages/
│       │   ├── auth/
│       │   │   ├── LoginPage.tsx
│       │   │   └── RegisterPage.tsx
│       │   ├── shared/
│       │   │   ├── DoubtDiscussionPage.tsx
│       │   │   └── DoubtDiscussionPage2.tsx
│       │   ├── student/
│       │   │   ├── AssignmentsPage.tsx
│       │   │   ├── PeerSessionsPage.tsx
│       │   │   ├── StudentDashboardPage.tsx
│       │   │   └── StudyMaterialsPage.tsx
│       │   └── teacher/
│       │       ├── AssignmentsPage.tsx
│       │       ├── PeerSessionsPage.tsx
│       │       ├── StudyMaterialsPage.tsx
│       │       └── TeacherDashboardPage.tsx
│       ├── routes/
│       │   └── paths.ts             # Centralized route constants
│       ├── theme/
│       │   └── ThemeProvider.tsx     # Dark/light mode toggle
│       └── utils/
│           └── cn.ts                # clsx + tailwind-merge utility
│
└── README.md
```

---

## Getting Started

### Prerequisites

| Requirement | Minimum Version |
|---|---|
| **Node.js** | 18.x or higher |
| **npm** | 9.x or higher |
| **MongoDB** | 6.x or higher (local or Atlas) |
| **Git** | 2.x |

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/CollabClass.git
cd CollabClass

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Environment Variables

#### Backend (`backend/.env`)

```env
# MongoDB connection string
MONGO_URI=mongodb://localhost:27017/collabclass

# JWT secret key (use a strong, random string)
JWT_SECRET=your_super_secret_jwt_key_here

# Google OAuth Client ID
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# Server port (optional, defaults to 5000)
PORT=5000
```

#### Frontend (`frontend/.env`)

```env
# Google OAuth Client ID (must match backend)
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

> **Note:** Never commit `.env` files to version control. Add them to `.gitignore`.

### Running the Application

#### Development Mode

```bash
# Terminal 1 — Start the backend server
cd backend
npm run dev
# Server starts on http://localhost:5000

# Terminal 2 — Start the frontend dev server
cd frontend
npm run dev
# Client starts on http://localhost:5173
```

The Vite dev server automatically proxies `/api/*` and `/socket.io` requests to the backend at `http://localhost:5000`, so no CORS configuration is needed during development.

#### Production Build

```bash
# Build the frontend
cd frontend
npm run build
# Output: frontend/dist/

# Start the backend in production mode
cd ../backend
npm start
```

---

## API Reference

All endpoints are prefixed with `/api`. Protected routes require an `Authorization: Bearer <token>` header.

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register a new user |
| `POST` | `/api/auth/login` | Public | Login with email/password |
| `POST` | `/api/auth/google` | Public | Authenticate via Google One Tap |

<details>
<summary><b>Request / Response Examples</b></summary>

**POST /api/auth/register**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "student",
  "section": "A"
}
```

**POST /api/auth/login**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200)**
```json
{
  "_id": "64a...",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "student",
  "section": "A",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```
</details>

---

### Assignments

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/assignments` | ✅ | Teacher | Create a new assignment |
| `GET` | `/api/assignments` | ✅ | Any | List assignments (section-filtered for students) |
| `GET` | `/api/assignments/:id` | ✅ | Any | Get assignment by ID |
| `PUT` | `/api/assignments/:id/close` | ✅ | Teacher | Manually close an assignment |
| `GET` | `/api/assignments/:id/analytics` | ✅ | Teacher | Get per-assignment analytics |

<details>
<summary><b>Request / Response Examples</b></summary>

**POST /api/assignments**
```json
{
  "title": "Data Structures Quiz 3",
  "description": "Implement a binary search tree with insert, delete, and search operations.",
  "subject": "Data Structures",
  "section": "A",
  "deadline": "2026-03-15T23:59:59.000Z"
}
```

**GET /api/assignments/:id/analytics — Response (200)**
```json
{
  "totalSubmissions": 45,
  "gradedSubmissions": 38,
  "pendingSubmissions": 7,
  "lateSubmissions": 5,
  "submissionRate": 90,
  "highestMarks": 100,
  "lowestMarks": 32,
  "topStudent": {
    "name": "Alice Smith",
    "marks": 100
  }
}
```
</details>

---

### Submissions

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/submissions` | ✅ | Student | Submit an assignment |
| `GET` | `/api/submissions/:assignmentId` | ✅ | Teacher | View submissions (paginated) |
| `PUT` | `/api/submissions/:id` | ✅ | Teacher | Grade a submission (marks + feedback) |

<details>
<summary><b>Request / Response Examples</b></summary>

**POST /api/submissions**
```json
{
  "assignment": "64a...",
  "content": "Here is my BST implementation: ..."
}
```

**PUT /api/submissions/:id**
```json
{
  "marks": 85,
  "feedback": "Good implementation. Consider edge cases for deletion."
}
```
</details>

---

### Doubt Discussion Forum

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/doubts` | ✅ | Any | Create a new discussion thread |
| `GET` | `/api/doubts` | ✅ | Any | List threads (paginated, filtered, section-isolated) |
| `GET` | `/api/doubts/:id` | ✅ | Any | Get thread with nested reply tree |
| `POST` | `/api/doubts/:id/reply` | ✅ | Any | Add a reply (supports nesting via `parentReply`) |
| `PATCH` | `/api/doubts/:id/resolve` | ✅ | Any* | Mark thread as resolved (*teacher or creator) |
| `PATCH` | `/api/doubts/:id/close` | ✅ | Teacher/Admin | Close a thread |
| `DELETE` | `/api/doubts/:id` | ✅ | Any* | Soft-delete thread (*teacher or creator) |

<details>
<summary><b>Query Parameters</b></summary>

**GET /api/doubts**

| Parameter | Type | Description |
|---|---|---|
| `page` | Number | Page number (default: 1) |
| `status` | String | Filter by status: `open`, `resolved`, `closed` |
| `assignment` | String | Filter by assignment ID |
| `subject` | String | Filter by subject name |

</details>

---

### Notifications

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/notifications` | ✅ | Get user's notifications (paginated) |
| `GET` | `/api/notifications/unread-count` | ✅ | Get unread notification count |
| `PATCH` | `/api/notifications/:id/read` | ✅ | Mark a notification as read |
| `PATCH` | `/api/notifications/read-all` | ✅ | Mark all notifications as read |

**Notification Types:**
- `NEW_THREAD` — A new doubt thread was created in your section
- `NEW_REPLY` — Someone replied to a thread you're participating in
- `THREAD_RESOLVED` — A thread you're involved in was resolved
- `THREAD_CLOSED` — A thread you're involved in was closed

---

### Analytics & Intelligence

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/analytics/student-strength` | ✅ | Student | Per-subject strength analysis for the logged-in student |
| `GET` | `/api/analytics/student-trend` | ✅ | Student | Monthly performance trend with status |
| `GET` | `/api/analytics/section-analytics` | ✅ | Teacher | Per-subject weak-topic analysis for the section |
| `GET` | `/api/analytics/interventions` | ✅ | Teacher | Per-student intervention recommendations |
| `GET` | `/api/analytics/top-performers` | ✅ | Teacher | Top 5 students by overall strength |
| `GET` | `/api/analytics/risk-students` | ✅ | Teacher | Full section risk rollup (highest risk first) |
| `GET` | `/api/analytics/peer-suggestions?subject=X` | ✅ | Teacher | AI-driven peer mentor pairing suggestions |

<details>
<summary><b>Response Examples</b></summary>

**GET /api/analytics/student-strength — Response (200)**
```json
[
  {
    "subject": "Data Structures",
    "avgMarks": 78.5,
    "totalSubmissions": 8,
    "lateSubmissions": 1,
    "doubtsRaised": 3,
    "repliesGiven": 12,
    "strengthScore": 72,
    "riskLevel": "LOW"
  }
]
```

**GET /api/analytics/risk-students — Response (200)**
```json
[
  {
    "studentId": "64a...",
    "name": "Bob Johnson",
    "avgMarks": 35.2,
    "lateRatio": 0.6,
    "engagementScore": 12,
    "overallStrength": 28,
    "riskIndex": 72,
    "overallRisk": "HIGH"
  }
]
```

**GET /api/analytics/peer-suggestions?subject=Data+Structures — Response (200)**
```json
[
  {
    "weakStudent": { "_id": "64a...", "name": "Bob Johnson", "strengthScore": 28 },
    "strongStudent": { "_id": "64b...", "name": "Alice Smith", "strengthScore": 92 },
    "subject": "Data Structures",
    "reason": "HIGH risk student paired with top performer"
  }
]
```
</details>

---

### Dashboard

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/dashboard/teacher` | ✅ | Teacher | Aggregated teaching dashboard statistics |

<details>
<summary><b>Response Example</b></summary>

```json
{
  "totalAssignments": 12,
  "totalStudents": 50,
  "totalSubmissions": 432,
  "gradedSubmissions": 380,
  "pendingGrading": 52,
  "lateSubmissions": 28,
  "averageMarks": 72.5
}
```
</details>

---

### Study Materials

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/materials` | ✅ | Any | Upload a study material |
| `GET` | `/api/materials` | ✅ | Any | List materials (section-filtered, paginated) |
| `DELETE` | `/api/materials/:id` | ✅ | Owner/Teacher | Delete a material |

---

### Peer Sessions

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/peer-sessions` | ✅ | Any | List peer sessions for section |
| `POST` | `/api/peer-sessions` | ✅ | Teacher | Create a peer mentoring session |
| `PATCH` | `/api/peer-sessions/:id/status` | ✅ | Teacher | Update session status |

**Session Status Flow:**
```
SUGGESTED → SCHEDULED → COMPLETED
                     → CANCELLED
```

---

## Database Schema

### Entity-Relationship Overview

```
┌──────────┐      ┌────────────┐      ┌────────────┐
│   User   │──1:N─│ Assignment │──1:N─│ Submission │
│          │      │            │      │            │
│ name     │      │ title      │      │ content    │
│ email    │      │ description│      │ isLate     │
│ password │      │ subject    │      │ marks      │
│ role     │      │ section    │      │ feedback   │
│ section  │      │ deadline   │      └────────────┘
│ subjects │      │ status     │
│ regNo    │      │ createdBy  │──────────────────────┐
└──────┬───┘      └──────┬─────┘                      │
       │                 │                             │
       │    ┌────────────┘                             │
       │    │                                          │
       │    ▼                                          │
       │  ┌──────────────┐      ┌──────────────┐      │
       ├──│ DoubtThread  │──1:N─│ DoubtReply   │      │
       │  │              │      │              │      │
       │  │ title        │      │ content      │      │
       │  │ content      │      │ parentReply  │──self│
       │  │ status       │      │ isBestAnswer │      │
       │  │ isPinned     │      │ isDeleted    │      │
       │  │ isDeleted    │      └──────────────┘      │
       │  └──────────────┘                             │
       │                                               │
       │  ┌──────────────┐      ┌──────────────────┐  │
       ├──│ Notification │      │ StudyMaterial     │──┘
       │  │              │      │                   │
       │  │ type         │      │ title             │
       │  │ message      │      │ subject           │
       │  │ isRead       │      │ fileUrl           │
       │  │ thread (opt) │      │ uploaderRole      │
       │  └──────────────┘      └───────────────────┘
       │
       │  ┌──────────────────┐
       └──│ PeerSession      │
          │                  │
          │ weakStudent      │
          │ strongStudent    │
          │ subject          │
          │ scheduledDate    │
          │ status           │
          │ notes            │
          └──────────────────┘
```

### Index Strategy

| Model | Index | Type | Purpose |
|---|---|---|---|
| `User` | `email` | Unique | Fast login lookups |
| `DoubtReply` | `thread` | Standard | Fast reply retrieval per thread |
| `Notification` | `recipient` | Standard | Fast per-user notification queries |
| `PeerSession` | `weakStudent`, `strongStudent` | Standard | Session lookups |
| `PeerSession` | `section` | Standard | Section-scoped queries |
| `PeerSession` | `(section, subject, weakStudent, strongStudent)` | Compound | Duplicate detection |

---

## Real-Time Events

CollabClass uses Socket.io for bidirectional real-time communication with JWT-authenticated connections.

### Connection Flow

```
Client                          Server
  │                                │
  │── connect(token) ─────────────▶│
  │                                │── JWT verify
  │                                │── User lookup
  │                                │── registerUser(userId, socketId)
  │◀── connection_ack ────────────│
  │                                │
  │     ... real-time events ...   │
  │                                │
  │── disconnect ─────────────────▶│
  │                                │── removeUserSocket(socketId)
```

### Events

| Event | Direction | Payload | Description |
|---|---|---|---|
| `new_notification` | Server → Client | `Notification` object | Real-time notification delivery |

### Multi-Device Architecture

The socket manager uses a `Map<userId, Set<socketId>>` structure to support multiple simultaneous connections per user. When a notification is emitted, it's sent to **all** socket IDs associated with the recipient, ensuring delivery across every connected device.

---

## Authentication & Authorization

### Two-Layer Security Model

```
Request → [Auth Middleware] → [Role Middleware] → Controller
              │                      │
              ├── Extract Bearer      ├── Check req.user.role
              │   token               │   against allowed roles
              ├── Verify JWT          │
              ├── Lookup user         ├── 403 if unauthorized
              └── Attach req.user    └── next() if authorized
```

### Auth Methods

| Method | Flow |
|---|---|
| **Email/Password** | Register → bcrypt hash → DB store → JWT issued |
| **Google One Tap** | Google ID token → Server verification via `google-auth-library` → Auto-create user if new → JWT issued |

### JWT Configuration

- **Algorithm:** HS256 (default)
- **Expiry:** 7 days
- **Storage:** `localStorage` key: `collabclass-jwt`
- **Transport:** `Authorization: Bearer <token>` header

### Role Hierarchy

| Role | Permissions |
|---|---|
| **Admin** | Full access, thread moderation |
| **Teacher** | Assignment CRUD, grading, analytics, peer sessions, thread moderation |
| **Student** | Submissions, doubt threads, study materials, personal analytics |

---

## Analytics Intelligence Engine

The analytics controller (~875 lines) implements a comprehensive intelligence layer using MongoDB aggregation pipelines.

### Scoring Algorithms

#### Engagement Score
```
engagementScore = (replies × 3) + (threads × 2) - (lateSubmissions × 1)
```

#### Overall Strength
```
overallStrength = (avgMarks × 0.6) + (engagementScore × 0.2) - (lateRatio × 10)
```

#### Risk Index
```
riskIndex = 100 - overallStrength
```

#### Risk Classification

| Risk Level | Condition |
|---|---|
| **HIGH** | Risk index ≥ 60 |
| **MEDIUM** | Risk index ≥ 35 |
| **LOW** | Risk index < 35 |

### Declining Trend Detection

The system analyzes monthly performance windows and flags students with a **20% or greater drop** in recent months compared to their baseline performance.

### Peer Suggestion Algorithm

1. **Identify weak students** — HIGH risk or subject strength < 40
2. **Identify strong students** — Top 30% by subject strength
3. **Detect declining trends** — 20%+ performance drop
4. **Round-robin matching** — Distributes weak students across strong mentors evenly

### Intervention Types

| Type | Trigger |
|---|---|
| `ACADEMIC_SUPPORT` | Low marks or high risk index |
| `ENGAGEMENT_SUPPORT` | Low engagement score despite adequate marks |
| `MONITOR` | Declining trend detected |

---

## Frontend Architecture

### Routing Strategy

All pages are **lazy-loaded** via `React.lazy()` + `<Suspense>` for optimal bundle splitting.

```
/
├── /login                     (Public)
├── /register                  (Public)
├── /teacher/                  (Protected: teacher)
│   ├── /dashboard
│   ├── /assignments
│   ├── /doubts
│   ├── /study-materials
│   └── /peer-sessions
├── /student/                  (Protected: student)
│   ├── /dashboard
│   ├── /assignments
│   ├── /doubts
│   ├── /study-materials
│   └── /peer-sessions
└── /*                         (Redirect to role-based dashboard)
```

### State Management

| Context | Responsibility |
|---|---|
| **AuthContext** | User state, JWT management, login/register/Google auth, auto-hydration from localStorage |
| **SocketContext** | Socket.io connection lifecycle, notification state, unread count, optimistic updates |

### API Layer

All API calls go through a centralized Axios instance (`src/api/axios.ts`) with:
- **Base URL:** `/api` (proxied to backend in dev)
- **Request interceptor:** Automatically attaches JWT from localStorage
- **Response interceptor:** Redirects to `/login` on 401 (token expired/invalid)

---

## Design System

CollabClass uses a custom **glass-morphism** design system built on Tailwind CSS.

### Color Palette

| Token | Value | Usage |
|---|---|---|
| `background` | `hsl(222.2 84% 4.9%)` | Dark navy base |
| `primary` | Blue | Interactive elements, links |
| `secondary` | Purple | Accents, secondary actions |
| `accent` | Green | Success states, positive indicators |
| `destructive` | Rose | Error states, danger actions |

### Design Tokens

- **Dark mode** — Class-based toggle (`dark` class on root)
- **Shadows** — Custom `soft-xl` shadow for elevated surfaces
- **Border radius** — Extended radius scale for rounded surfaces
- **Glass surfaces** — Semi-transparent backgrounds with backdrop blur
- **Animations** — Framer Motion for page transitions, hover effects, and micro-interactions

---

## Deployment

### Docker (Recommended)

```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ .
EXPOSE 5000
CMD ["node", "server.js"]
```

```dockerfile
# Frontend Dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

### Environment Checklist for Production

- [ ] Set `NODE_ENV=production`
- [ ] Use a strong, random `JWT_SECRET` (minimum 256-bit)
- [ ] Use MongoDB Atlas or a secured MongoDB instance
- [ ] Configure CORS origins (replace `*` with your frontend domain)
- [ ] Set up HTTPS/TLS termination (via reverse proxy or cloud provider)
- [ ] Enable MongoDB connection pooling
- [ ] Set rate limiting on auth endpoints
- [ ] Configure proper logging (e.g., Winston, Pino)
- [ ] Set up health check endpoint monitoring

### Cloud Deployment Options

| Platform | Backend | Frontend | Database |
|---|---|---|---|
| **Railway** | Node.js service | Static site | MongoDB Atlas |
| **Render** | Web service | Static site | MongoDB Atlas |
| **Vercel** | — | Vercel deployment | MongoDB Atlas |
| **AWS** | EC2 / ECS | S3 + CloudFront | DocumentDB / Atlas |
| **DigitalOcean** | App Platform | App Platform | Managed MongoDB |

---

## Contributing

Contributions are welcome! Please follow these guidelines:

### Getting Started

1. **Fork** the repository
2. **Clone** your fork locally
3. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Install dependencies** for both frontend and backend
5. **Make your changes** with clear, descriptive commits

### Code Standards

- **Backend:** Follow existing Express/Mongoose patterns. Use async/await for all asynchronous operations.
- **Frontend:** TypeScript strict mode. Use functional components with hooks. Follow the established file/folder conventions.
- **Commits:** Use [Conventional Commits](https://www.conventionalcommits.org/) format:
  ```
  feat: add student attendance tracking
  fix: resolve deadline timezone calculation
  docs: update API reference for analytics
  ```

### Pull Request Process

1. Ensure your code passes linting: `cd frontend && npm run lint`
2. Ensure TypeScript compiles: `cd frontend && npm run typecheck`
3. Update documentation if you change API endpoints or add features
4. Open a PR against `main` with a clear description of changes
5. Link any related issues

### Reporting Issues

- Use GitHub Issues to report bugs or request features
- Include steps to reproduce for bugs
- Include expected vs. actual behavior
- Attach screenshots for UI issues

---

## License

This project is licensed under the **ISC License**.

---

<p align="center">
  Built with ❤️ for smarter classrooms
</p>
