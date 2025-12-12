
-----

# 🎓 VR Meta University

**VR Meta University** is a modern educational platform that bridges the gap between immersive VR learning and web-based adaptive assessments. Students engage with immersive course content via VR applications and validate their knowledge through an intelligent web interface that adapts to their learning pace in real-time.

## 🛠 Tech Stack

### **Backend**

* **Framework:** ASP.NET Core 8 (Web API)
* **Database:** PostgreSQL (Containerized via Docker)
* **ORM:** Entity Framework Core
* **Authentication:** JWT Bearer tokens with BCrypt password hashing
* **API Documentation:** Swagger / OpenAPI 3.0

### **Frontend**

* **Core:** React 18 + Vite + TypeScript
* **State Management:** Zustand (Stores for Auth, Quiz, and UI)
* **Data Fetching:** TanStack Query (React Query)
* **Styling:** Tailwind CSS + Framer Motion for smooth animations
* **Icons:** Lucide React

## 🚀 Key Features

* **Adaptive Testing Engine:** A rule-based difficulty adjustment system (Levels 1–10) that recalibrates based on student accuracy and response time.
* **Automated Data Seeding:** Instant database initialization with Mathematics and Science course demo data upon startup.
* **Modern UI/UX:** Fully responsive design with **Dark Mode** support and system preference detection.
* **Session Management:** Real-time tracking of quiz attempts, time spent, and performance analytics.
* **Secure Access:** Role-based access control and protected frontend routes.

## 🏁 Getting Started

### Prerequisites

* [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
* [Node.js 18+](https://nodejs.org/)
* [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### 1\. Database Setup (Docker)

The project uses PostgreSQL 16. Run the database container using the provided Compose file:

```bash
# From the project root
docker compose up -d
```

### 2\. Backend Initialization

1.  Navigate to the API directory:
    ```bash
    cd backend/VRCourses.API
    ```
2.  The application is configured to run migrations and seed data automatically on startup. Simply run:
    ```bash
    dotnet run
    ```
    * **API Base URL:** `http://localhost:5272`
    * **Swagger UI:** `http://localhost:5272/swagger`

### 3\. Frontend Initialization

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies and start the development server:
    ```bash
    npm install
    npm run dev
    ```
    * **App URL:** `http://localhost:5173`

## 📡 API Endpoints (Core)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user & return JWT |
| `GET` | `/api/courses` | List all published courses |
| `POST` | `/api/quiz/start` | Initialize a new adaptive quiz session |
| `GET` | `/api/quiz/next-question` | Fetch next question based on current difficulty |
| `POST` | `/api/quiz/submit-answer` | Submit answer & update session difficulty |
| `GET` | `/api/quiz/stats` | Retrieve detailed session performance stats |

## 🏗 Project Structure

```text
VR-Learning-Platform/
├── backend/
│   ├── VRCourses.API/
│   │   ├── Controllers/    # REST Endpoints
│   │   ├── Services/       # Business Logic & Adaptive Algorithm
│   │   ├── Models/         # DB Entities & Data Transfer Objects (DTOs)
│   │   └── Data/           # EF Core Context & Seed Data
│   └── docker-compose.yml  # Infrastructure as Code
└── frontend/
    └── src/
        ├── components/     # UI Components & Quiz Logic
        ├── hooks/          # API Hooks (React Query)
        ├── stores/         # Global State (Zustand)
        └── pages/          # Application Views
```

## 🔮 Future Roadmap

* **ML Integration:** Migration of the adaptive engine to a dedicated **FastAPI** microservice utilizing **Scikit-learn** for advanced pedagogical forecasting.
* **Instructor Dashboard:** Visual analytics for teachers to track class-wide progress.
* **VR Sync:** Direct API integration with the VR headset client to sync learning progress.

## 📄 License

This project is licensed under the MIT License.

-----

### 📝 Dev Note on Quiz Logic

The current adaptation logic uses a **rule-based algorithm**:

* **Accuracy ≥ 80% & Time \< 30s:** Increase difficulty level.
* **Accuracy \< 40%:** Decrease difficulty level.
* **Otherwise:** Maintain current challenge level.

-----

