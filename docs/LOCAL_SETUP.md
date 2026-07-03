# 로컬 실행 문서

## 필요 환경

- Java 17
- Node.js, npm
- Python 3.10 이상
- Oracle wallet 파일: `backend/wallet`

## 백엔드 실행

```powershell
cd backend
.\gradlew.bat bootRun
```

정상 실행 로그 예시:

```txt
Tomcat started on port 8080 (http)
Started BackendApplication
```

Gradle이 `80% EXECUTING`에서 멈춘 것처럼 보이는 것은 정상입니다. Spring Boot
서버가 실행 중이라 작업이 계속 열려 있는 상태입니다.

## 프론트엔드 실행

```powershell
cd frontend
npm install
npm run dev
```

로컬 `.env`:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

브라우저 접속:

```txt
http://localhost:5173
```

## OpenCV/FastAPI 실행

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

## Native 앱 실행

```powershell
cd native
npm install
npm run start
```

Expo QR 코드를 모바일 기기로 스캔해서 실행합니다.

## 권장 실행 순서

1. 백엔드
2. OpenCV/FastAPI: 고객 수 분석 또는 AI 인사이트가 필요할 때
3. 프론트엔드
4. Native 앱
