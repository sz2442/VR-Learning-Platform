# VR Meta University - Frontend

React frontend for the VR Meta University adaptive learning platform.

## 🚀 Tech Stack

- **React 18** + TypeScript
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **TanStack Query** - Server state management
- **Zustand** - Client state management
- **React Router v6** - Routing
- **Framer Motion** - Animations
- **Axios** - HTTP client
- **Lucide React** - Icons

## 📁 Project Structure

```
src/
├── api/           # API client and endpoint functions
├── components/
│   ├── auth/      # Login, Register forms
│   ├── courses/   # Course cards, grid
│   ├── layout/    # Header, Footer, Layout
│   ├── quiz/      # Quiz UI components
│   └── ui/        # Reusable UI components
├── hooks/         # Custom React Query hooks
├── lib/           # Utilities
├── pages/         # Page components
├── stores/        # Zustand stores
└── types/         # TypeScript types
```

## 🛠️ Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your backend URL
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## 🔗 API Integration

The frontend expects the backend API at `VITE_API_URL` (default: `http://localhost:5000/api`).

### Required Endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | User login |
| POST | `/auth/register` | User registration |
| GET | `/courses` | List all courses |
| GET | `/courses/{id}` | Get course details |
| POST | `/quiz/start/{courseId}` | Start quiz session |
| GET | `/quiz/{sessionId}/next` | Get next question |
| POST | `/quiz/{sessionId}/answer` | Submit answer |
| GET | `/quiz/{sessionId}/stats` | Get session stats |

## 🎨 Features

- **Adaptive Quiz System** - Difficulty adjusts based on performance
- **Real-time Progress** - Track accuracy and difficulty level
- **Dark/Light Mode** - System preference + manual toggle
- **Responsive Design** - Mobile-first approach
- **Smooth Animations** - Framer Motion transitions
- **Toast Notifications** - Feedback for user actions

## 📝 Scripts

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 🔐 Authentication

JWT-based authentication with:
- Token stored in localStorage (via Zustand persist)
- Automatic token refresh check
- Protected routes redirect to login
- 401 responses trigger logout

## 📊 State Management

| Store | Purpose |
|-------|---------|
| `authStore` | User authentication state |
| `quizStore` | Active quiz session state |
| `uiStore` | Theme, sidebar preferences |

---

**VR Meta University** - Diploma Project by IT2-2217
