# Frontend (React)

## Установка зависимостей
```bash
npm install
```

## Запуск dev сервера
```bash
npm run dev
```

Приложение откроется на `http://localhost:5173` (Vite) или `http://localhost:3000` (Create React App)

## Backend API

**Base URL:** `http://localhost:5000`

**Swagger документация:** `http://localhost:5000/swagger`

## Доступные Endpoints

### Аутентификация

#### Регистрация
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "Иван",
  "lastName": "Петров"
}
```

**Успешный ответ (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Ошибка (400):**
```json
{
  "message": "Email already exists"
}
```

#### Логин
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Успешный ответ (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Ошибка (401):**
```json
{
  "message": "Invalid email or password"
}
```

## Работа с токеном

После получения токена при регистрации/логине:

1. **Сохраните токен** (в localStorage или state management)
```javascript
localStorage.setItem('token', response.data.token);
```

2. **Отправляйте токен в заголовках** при запросах к защищённым endpoints:
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

## Пример использования с Axios
```javascript
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Регистрация
const register = async (userData) => {
  const response = await axios.post(`${API_URL}/auth/register`, userData);
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

// Логин
const login = async (credentials) => {
  const response = await axios.post(`${API_URL}/auth/login`, credentials);
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

// Запрос с авторизацией (для будущих endpoints)
const getProtectedData = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/protected-route`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.data;
};
```

## Tech Stack (рекомендуемый)

- **React** - UI библиотека
- **React Router** - маршрутизация
- **Axios** - HTTP клиент для API запросов
- **Tailwind CSS** - стилизация (опционально)

## Структура проекта (рекомендуемая)
```
frontend/
├── src/
│   ├── components/       # Компоненты
│   ├── pages/           # Страницы
│   │   ├── Landing.jsx
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   ├── services/        # API сервисы
│   │   └── authService.js
│   ├── context/         # Context API для состояния
│   └── App.jsx
└── package.json
```

## CORS

CORS уже настроен на backend для:
- `http://localhost:3000` (Create React App)
- `http://localhost:5173` (Vite)

Если используете другой порт - сообщите backend разработчику.

## Статусы ответов

- **200** - Успех
- **400** - Неверные данные (валидация)
- **401** - Неавторизован (неверный токен или credentials)
- **404** - Не найдено
- **500** - Ошибка сервера

## Контакты

По вопросам к API обращайтесь к backend разработчику.
