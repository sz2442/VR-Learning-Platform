# VR Meta University

A modern educational platform that bridges immersive VR learning with web-based adaptive assessments. Students engage with course content via VR applications and validate their knowledge through an intelligent web interface that adapts to their learning pace in real-time.

---

## Tech Stack

### Backend
- **Framework:** ASP.NET Core 9 (Web API)
- **Database:** PostgreSQL 16
- **ORM:** Entity Framework Core
- **Authentication:** JWT Bearer + BCrypt
- **Docs:** Swagger / OpenAPI 3.0

### Frontend
- **Core:** React 18 + Vite + TypeScript
- **State:** Zustand
- **Data fetching:** TanStack Query
- **Styling:** Tailwind CSS + Framer Motion
- **Icons:** Lucide React

### ML Service
- **Framework:** FastAPI (Python)
- **Models:** Scikit-learn
- **Config:** Pydantic Settings

### Infrastructure
- **Containerization:** Docker + Docker Compose (all 4 services)
- **CI/CD:** GitHub Actions (deploy on push to `main`)

---

## Key Features

- **Adaptive Testing Engine** — ML-powered difficulty adjustment (levels 1–10) recalibrated in real-time based on accuracy and response time
- **Admin Dashboard** — platform-wide analytics and user management
- **Instructor Dashboard** — class-wide progress tracking and course analytics
- **Student Dashboard** — personal performance stats and session history
- **Automated Seeding** — Mathematics and Science demo data initialized on startup
- **Dark Mode** — system preference detection with manual toggle
- **Secure Access** — role-based access control (Student / Instructor / Admin) with protected routes

---

## Getting Started (Local)

### Prerequisites
- .NET 9 SDK
- Node.js 18+
- Docker Desktop
- Python 3.11+ _(only if running ML service outside Docker)_

### 1. Start all services

```bash
# From the project root — starts PostgreSQL, ML service, backend, and frontend
docker compose up -d --build
```

| Service    | URL                           |
|------------|-------------------------------|
| Frontend   | http://localhost:3000         |
| Backend    | http://localhost:5272         |
| Swagger    | http://localhost:5272/swagger |
| ML Service | http://localhost:8000         |
| ML Docs    | http://localhost:8000/docs    |

### 2. Run services individually (dev mode)

**Backend:**
```bash
cd backend/VRCourses.API
dotnet run
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

**ML Service:**
```bash
cd ml_module
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Authenticate & return JWT |

### Courses & Content
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/courses` | List all courses |
| `GET` | `/api/courses/{id}` | Course details |
| `GET` | `/api/courses/{courseId}/modules` | Course structure with modules & lessons |
| `GET` | `/api/lessons/{lessonId}` | Lesson content |
| `GET` | `/api/modules/{moduleId}/miniquiz` | Mini-quiz questions for a module |

### Progress
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/progress/lesson` | Mark lesson as complete |
| `POST` | `/api/progress/miniquiz` | Submit mini-quiz answers |
| `POST` | `/api/progress/miniquiz/vr` | Record VR quiz results |
| `GET` | `/api/progress/{courseId}` | Student's course progress |

### Quiz (Adaptive)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/quiz/start` | Initialize adaptive quiz session |
| `GET` | `/api/quiz/next-question` | Fetch next question (difficulty-aware) |
| `POST` | `/api/quiz/submit-answer` | Submit answer & update difficulty |
| `GET` | `/api/quiz/stats` | Session performance stats |
| `POST` | `/api/quiz/end` | Close session & save progress |

### Student
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/students/me/stats` | Overall statistics |
| `GET` | `/api/students/me/progress` | Course progress |
| `GET` | `/api/students/me/activity` | Activity history |
| `GET` | `/api/students/me/accuracy-history` | Accuracy over time |

### Instructor
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/instructor/stats` | Dashboard statistics |
| `GET` | `/api/instructor/students` | List all students |
| `GET` | `/api/instructor/students/{userId}/details` | Detailed student stats |
| `GET` | `/api/instructor/courses/{courseId}/questions` | Course questions |
| `POST` | `/api/instructor/questions` | Create quiz question |
| `PUT` | `/api/instructor/questions/{id}` | Update quiz question |
| `GET` | `/api/instructor/analytics/daily-active` | Daily active users |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/platform-stats` | Overall platform statistics |
| `GET` | `/api/admin/users` | List all users with roles |
| `PUT` | `/api/admin/users/{id}/role` | Change user role |
| `PUT` | `/api/admin/users/{id}/deactivate` | Deactivate user account |
| `GET` | `/api/admin/courses` | Courses with enrollment stats |
| `PUT` | `/api/admin/courses/{id}/publish` | Toggle course published status |
| `GET` | `/api/admin/ml-status` | ML service health & model status |
| `GET` | `/api/admin/ml-predictions` | Recent ML predictions |
| `POST` | `/api/admin/ml-test` | Send test prediction to ML service |

---

## Project Structure

```
VR-Learning-Platform/
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD: automated deploy pipeline
├── backend/
│   └── VRCourses.API/
│       ├── Controllers/        # REST endpoints
│       ├── Services/           # Business logic & adaptive algorithm
│       ├── Models/             # Entities & DTOs
│       └── Data/               # EF Core context & seed data
├── frontend/
│   └── src/
│       ├── components/         # UI components & quiz logic
│       ├── hooks/              # React Query hooks
│       ├── stores/             # Zustand global state
│       └── pages/              # Application views
├── ml_module/
│   └── app/
│       ├── api/routes/         # FastAPI endpoints
│       ├── services/           # Model loading & inference
│       ├── config.py           # Pydantic settings
│       └── main.py             # FastAPI entry point
└── docker-compose.yml          # Orchestrates all 4 services
```

---

## Adaptive Algorithm

The ML service combines a trained Scikit-learn model with a rule-based fallback:

| Condition | Action |
|-----------|--------|
| Accuracy ≥ 80% and response time < 30s | Increase difficulty |
| Accuracy < 40% | Decrease difficulty |
| Otherwise | Maintain current level |

---

## Deployment

Push to `main` triggers automatic deployment:

1. SSH into the production server
2. Pull latest code
3. Rebuild and restart all Docker containers
4. Health check all services — fails the pipeline if any are unresponsive

Required GitHub secrets: `DO_HOST`, `DO_USER`, `SSH_PRIVATE_KEY`, `JWT_SECRET`, `DB_PASSWORD`.

---

## Roadmap

- [ ] VR headset API integration — sync learning progress directly from the headset client
- [ ] Real-time notifications — SignalR-based alerts for instructors on student milestones
- [ ] Export reports — PDF/CSV export of session analytics

---

## License

MIT
