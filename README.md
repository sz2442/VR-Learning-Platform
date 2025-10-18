# VR Learning Platform

A modern educational platform combining VR learning experiences with web-based testing. Students download VR applications for immersive courses and complete tests through the web interface.

## Tech Stack

**Backend:**
- ASP.NET Core Web API (.NET 8/9)
- PostgreSQL
- Entity Framework Core
- JWT Authentication

**Frontend:**
- React
- Axios
- React Router

## Features

- User authentication (register/login)
- Role-based access (student, teacher, admin)
- Course management
- VR application downloads
- Online testing system
- Progress tracking

## Getting Started

### Prerequisites

- .NET SDK 8.0+
- Node.js 18+
- PostgreSQL 14+

### Backend Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/VR-Learning-Platform.git
cd VR-Learning-Platform/backend/VRCourses.API
```

2. Configure database connection in `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=vrcourses;Username=your_user;Password=your_password"
  }
}
```

3. Apply migrations:
```bash
dotnet ef database update
```

4. Run the application:
```bash
dotnet run
```

Backend will be available at `http://localhost:5000`

Swagger documentation: `http://localhost:5000/swagger`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

Application will be available at `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/{id}` - Get course by ID

## Project Structure

```
VR-Learning-Platform/
├── backend/
│   └── VRCourses.API/
│       ├── Controllers/
│       ├── Services/
│       ├── Data/
│       └── Models/
└── frontend/
    └── src/
        ├── components/
        ├── pages/
        └── services/
```

## License

This project is licensed under the MIT License.
