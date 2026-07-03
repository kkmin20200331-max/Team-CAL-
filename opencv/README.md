# OpenCV/FastAPI Server

FastAPI server for customer-count analysis. It can analyze camera/video/image
input and provide results to Spring Boot.

## Run

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

## Main APIs

| API | Purpose |
| --- | --- |
| `GET /health` | Server health |
| `POST /analyze/opencv` | Java compatibility analysis |
| `POST /api/v1/inference/image` | Image inference |
| `POST /api/v1/camera/start` | Start video/camera analysis |
| `POST /api/v1/camera/stop` | Stop analysis |

See [../docs/OPENCV.md](../docs/OPENCV.md) for operational notes.
