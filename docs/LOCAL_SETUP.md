# Local Setup

## Requirements

- Java 17
- Node.js and npm
- Python 3.10+
- Oracle wallet files under `backend/wallet`

## Backend

```powershell
cd backend
.\gradlew.bat bootRun
```

Expected healthy log:

```txt
Tomcat started on port 8080 (http)
Started BackendApplication
```

Gradle staying at `80% EXECUTING` is normal. It means Spring Boot is running.

## Frontend

```powershell
cd frontend
npm install
npm run dev
```

Local `.env`:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

Open:

```txt
http://localhost:5173
```

## OpenCV/FastAPI

```powershell
cd opencv
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Swagger:

```txt
http://127.0.0.1:8000/docs
```

## Native App

```powershell
cd native
npm install
npm run start
```

Use the Expo QR code on a mobile device.

## Recommended Start Order

1. Backend
2. OpenCV/FastAPI, when customer counting or AI insight is needed
3. Frontend
4. Native app
