# Проект

## Запуск проекта

Проект состоит из двух частей: **frontend** и **backend**.

---

## Frontend

Перейдите в папку фронтенда и запустите Vite:

```bash
cd frontend
npm install
npm run dev
```

После запуска фронтенд будет доступен по адресу, который выведет Vite (обычно http://localhost:5173).

Backend

Перейдите в папку бэкенда и запустите сервер:

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend будет доступен по адресу:
http://127.0.0.1:8000
