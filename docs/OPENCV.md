# OpenCV/FastAPI Server

The OpenCV service analyzes video or image input and returns customer-count
data to Spring Boot.

## Local Run

```powershell
cd opencv
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

## VM Run

```bash
cd /home/dongmin/Team-CAL-/opencv
source venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8000
```

## Main Endpoints

| Endpoint | Purpose |
| --- | --- |
| `GET /health` | Health check |
| `POST /analyze/opencv` | Java compatibility endpoint |
| `POST /api/v1/inference/image` | Single image inference |
| `POST /api/v1/camera/start` | Start camera/video analysis |
| `POST /api/v1/camera/stop` | Stop analysis |
| `GET /docs` | Swagger UI |

## Data Flow

```txt
OpenCV/FastAPI
  -> detects people/customer count
  -> Spring Boot stores result in PEOPLE_LOG
  -> React dashboard reads /api/people_log
```

The dashboard should not rely on automatic `/people_log/opencv` POST calls on
page load. OpenCV ingestion should be a separate running process or explicit
action.

## WebSocket Warning

This warning is not fatal for REST API usage:

```txt
WARNING: Unsupported upgrade request.
WARNING: No supported WebSocket library detected.
```

Install optional dependencies if WebSocket support is needed:

```bash
pip install "uvicorn[standard]"
```
