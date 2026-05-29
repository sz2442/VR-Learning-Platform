# VR Meta University

Адаптивная образовательная платформа, сочетающая иммерсивное VR-обучение с веб-квизами на основе ML. ИИ подбирает сложность вопросов в реальном времени (уровни 1–10) по результатам каждого ответа. Студенты проходят курсы в браузере или VR-шлеме (WebXR), прогресс синхронизируется через SignalR.

---

## Архитектура

```
┌─────────────────┐     REST / SignalR     ┌──────────────────────┐
│   Frontend      │ ─────────────────────► │   Backend (ASP.NET)  │
│  React 18 + Vite│ ◄───────────────────── │   :5272 / :80        │
│  :3000 / :80    │                        └────────┬─────────────┘
└─────────────────┘                                 │ HTTP (5 s timeout)
                                                    ▼
                                        ┌──────────────────────┐
                                        │   ML Service         │
                                        │   FastAPI + sklearn  │
                                        │   :8000              │
                                        └────────┬─────────────┘
                                                 │
                                        ┌────────▼─────────────┐
                                        │   PostgreSQL 16       │
                                        │   :5432              │
                                        └──────────────────────┘
```

| Сервис      | URL (локально)                   | Описание                        |
|-------------|----------------------------------|---------------------------------|
| Frontend    | http://localhost:3000            | React-приложение                |
| Backend     | http://localhost:5272            | REST API + SignalR               |
| Swagger     | http://localhost:5272/swagger    | API-документация                |
| ML Service  | http://localhost:8000            | FastAPI                         |
| ML Docs     | http://localhost:8000/docs       | Swagger ML-сервиса              |

---

## Стек

| Слой       | Технологии                                                    |
|------------|---------------------------------------------------------------|
| Frontend   | React 18, TypeScript, Vite, Tailwind CSS, Zustand, TanStack Query, Framer Motion, R3F / drei / `@react-three/xr` v5, react-i18next (EN/RU/KZ) |
| Backend    | ASP.NET Core 9.0, Entity Framework Core, PostgreSQL 16, JWT + BCrypt, SignalR |
| ML         | Python 3.11, FastAPI, scikit-learn (RandomForestClassifier), joblib |
| Infra      | Docker, Docker Compose, Nginx (prod frontend) |

---

## Быстрый старт

### Предусловия
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) ≥ 4.x
- Git

### 1. Клонировать и настроить окружение

```bash
git clone <repo-url>
cd VR-Learning-Platform
cp .env.example .env
```

Откройте `.env` и задайте **минимум два значения**:

```env
DB_PASSWORD=придумайте_пароль
JWT_SECRET_KEY=минимум_32_символа_любой_строки
```

Остальные значения можно оставить по умолчанию для локального запуска.

### 2. Запустить все сервисы

```bash
docker compose up -d --build
```

Первый запуск занимает ~3–5 минут (сборка образов + обучение ML-модели).

**Проверить здоровье:**
```bash
docker compose ps          # все сервисы Up
docker compose logs backend --tail=20   # должно быть "Seed complete"
```

### 3. Открыть приложение

- **Frontend:** http://localhost:3000
- **Swagger:** http://localhost:5272/swagger
- **ML Docs:** http://localhost:8000/docs

> **VR-режим из браузера Quest:** откройте http://`<IP вашего компьютера>`:3000 в браузере шлема,
> войдите в курс и нажмите «Start in VR» — запустится WebXR-сессия.
> На десктопе VR-сцена работает в режиме эмуляции (мышь + WASD).

---

## Демо-аккаунты

Создаются автоматически при первом запуске:

| Email                  | Пароль         | Роль       |
|------------------------|----------------|------------|
| `student@test.com`     | `student123`   | Student    |
| `instructor@test.com`  | `instructor123`| Instructor |
| `admin@test.com`       | `admin123`     | Admin      |

---

## Демо-сценарий (smoke test)

1. Открыть http://localhost:3000 → переключить язык EN / RU / KZ (флаги в шапке).
2. Войти как `student@test.com` / `student123`.
3. Открыть курс **«Adaptive Learning and VR in Education»** (курс 3).
4. В левой панели выбрать урок из Module 1, прочитать контент, отметить «Complete».
5. Пройти **Mini Quiz** модуля (≥ 5 вопросов: MCQ + drag-drop).
6. После 3-го правильного ответа в интерфейсе обновится индикатор сложности (SignalR `DifficultyUpdated`).
7. Разблокировать Module 2, пройти его, затем запустить **Final Quiz** (`Start Final Quiz`).
8. Дойти до экрана результатов — увидеть точность, финальный уровень, график.
9. Выйти, войти как `instructor@test.com` → Dashboard с прогрессом студентов.
10. Войти как `admin@test.com` → `/admin/users` и `/admin/courses` с платформенной статистикой.

**ML-fallback:** остановите ML-сервис (`docker compose stop ml-service`) и повторите квиз — система автоматически переключится на rules-fallback (accuracy/time-based), квиз продолжается без ошибок.

---

## Структура репозитория

```
VR-Learning-Platform/
├── docker-compose.yml          # Оркестрация всех 4 сервисов
├── .env.example                # Шаблон переменных окружения
├── backend/
│   ├── Dockerfile
│   └── VRCourses.API/
│       ├── Controllers/        # REST endpoints
│       ├── Services/           # Бизнес-логика и адаптивный алгоритм
│       ├── Hubs/               # SignalR (DifficultyUpdated)
│       ├── Models/             # Сущности и DTO
│       ├── Data/               # EF Core контекст и сид-данные
│       └── Migrations/
├── frontend/
│   ├── Dockerfile
│   └── src/
│       ├── components/         # UI-компоненты и логика квиза
│       ├── hooks/              # TanStack Query + SignalR хуки
│       ├── stores/             # Zustand
│       ├── pages/              # Страницы приложения
│       └── locales/            # i18n: en / ru / kz
├── ml_module/
│   ├── Dockerfile
│   ├── models/                 # Обученная модель (random_forest_v1.joblib)
│   ├── training/               # Скрипт дообучения
│   ├── tests/                  # pytest: API + features + prediction
│   └── app/
│       ├── api/routes/         # FastAPI endpoints
│       ├── services/           # Загрузка модели, инференс
│       └── main.py
└── .github/workflows/          # CI/CD (deploy on push to main)
```

---

## Адаптивный алгоритм

ML-модель (Random Forest) предсказывает следующий уровень сложности по признакам:
`accuracy_rate`, `avg_time_per_question`, `current_difficulty`, `streak`, `session_length`.

Если ML-сервис недоступен — автоматический rules-fallback:

| Условие                              | Действие             |
|--------------------------------------|----------------------|
| Точность ≥ 80 % и время < 30 с       | +1 к сложности       |
| Точность 60–80 %                     | без изменений / +1   |
| Точность 40–60 %                     | без изменений        |
| Точность < 40 %                      | −1 к сложности       |

Минимальная сложность — 3 (чтобы новичок не застрял на trivial-вопросах).

---

## Запуск тестов

**ML (pytest):**
```bash
cd ml_module
pip install -r requirements.txt
pytest tests/ -v
```

**Backend (сборка):**
```bash
cd backend
dotnet build
```

**Frontend (тайпчек + сборка):**
```bash
cd frontend
npm install
npm run build
```

---

## Траблшутинг

| Проблема | Решение |
|----------|---------|
| Порт 3000/5272/8000 занят | Изменить `FRONTEND_PORT` / `BACKEND_PORT` / `ML_SERVICE_PORT` в `.env` |
| Backend не стартует | Проверить `docker compose logs backend` — чаще всего неверный `DB_PASSWORD` в `.env` |
| ML-сервис `unhealthy` | `docker compose logs ml-service` — модель может обучаться до 60 с; backend работает на rules-fallback |
| БД пустая после рестарта | Данные в volume `postgres_data`; `docker compose down -v` сбросит volume и пересеет данные |
| VR-сцена не открывается | Нужен HTTPS или `localhost`; в сети — настройте reverse proxy с TLS или используйте `ngrok` |
| Шлем не видит приложение | Шлем и ПК должны быть в одной Wi-Fi сети; открыть `http://<IP>:3000` в браузере шлема |

---

## Локальная разработка (без Docker)

```bash
# Backend
cd backend/VRCourses.API
# Задать DB в appsettings.Development.json или через env
dotnet run

# Frontend
cd frontend
npm install
npm run dev   # http://localhost:5173

# ML Service
cd ml_module
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

---

## License

MIT
