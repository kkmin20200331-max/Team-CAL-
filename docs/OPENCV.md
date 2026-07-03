# OpenCV/FastAPI 서버

OpenCV 서비스는 영상 또는 이미지에서 사람 수를 추론하고, 그 결과를
Spring Boot가 `PEOPLE_LOG`에 저장할 수 있도록 제공합니다.

## 로컬 실행

```powershell
cd opencv
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

## VM 실행

운영 환경에서는 Docker Compose로 실행합니다. 수동 `uvicorn` 실행은 디버깅용입니다.

```bash
cd /home/dongmin/Team-CAL-/opencv
source venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8000
```

Docker Compose 환경에서 백엔드 컨테이너가 OpenCV를 볼 수 있는지 확인:

```bash
docker exec shiftops-backend wget -qO- http://opencv:8000/health
```

## 주요 엔드포인트

| 엔드포인트 | 설명 |
| --- | --- |
| `GET /health` | OpenCV 서버 상태 확인 |
| `POST /analyze/opencv` | Java 호환용 분석 엔드포인트 |
| `POST /api/v1/inference/image` | 단일 이미지 추론 |
| `POST /api/cctv/frame` | 브라우저 웹캠 프레임을 받는 Spring 프록시 엔드포인트 |
| `POST /api/v1/camera/start` | 카메라/영상 분석 시작 |
| `POST /api/v1/camera/stop` | 분석 중지 |
| `GET /docs` | Swagger UI |

## 데이터 흐름

```txt
OpenCV/FastAPI
  -> 이미지 또는 영상에서 사람 수 추론
  -> Spring Boot가 결과를 PEOPLE_LOG에 저장
  -> React 대시보드가 /api/people_log 조회
```

대시보드는 페이지 로드 시 자동으로 `/people_log/opencv`를 호출해서 분석을
트리거하지 않습니다. OpenCV 데이터 수집은 별도 실행 프로세스 또는 명시적
사용자 액션으로 처리합니다.

## 브라우저 웹캠 방식

배포된 HTTPS 페이지에서는 Azure VM이 사용자 PC의 웹캠을 직접 열 수 없습니다.
그래서 브라우저가 웹캠 프레임을 캡처해서 서버로 보내는 방식을 사용합니다.

```txt
브라우저 웹캠
  -> POST /api/cctv/frame
  -> Spring Boot가 multipart image를 OpenCV /api/v1/inference/image로 전달
  -> Spring Boot가 반환된 고객 수를 PEOPLE_LOG에 저장
```

중요한 점:

- 프론트엔드는 `storeId`, `cameraId`, `modelName`, `imageSize`, `confidence`를
  프레임과 함께 전송합니다.
- Spring은 OpenCV에 `sendToSpring=false`를 전달합니다.
- 이 설정 덕분에 OpenCV가 한 번 저장하고 Spring이 또 저장하는 중복 저장을
  막을 수 있습니다.
- 최종 저장은 Spring의 `PeopleLogService`가 담당합니다.
- 매장별 데이터는 `storeId` 기준으로 분리됩니다.

## Docker 런타임

OpenCV 컨테이너는 무거운 의존성을 미리 담은 base image를 사용합니다.

```dockerfile
FROM kkmin1106/bitemateopencv-base:py312-yolo
```

컨테이너에서 아래 오류가 나오면 base image에 시스템 라이브러리가 부족한
상태입니다.

```txt
ImportError: libxcb.so.1: cannot open shared object file
```

이 경우 `opencvbase` 이미지를 다시 빌드/푸시하고, OpenCV 앱 이미지를 다시
빌드합니다.

## WebSocket 경고

아래 경고는 REST API 사용에는 치명적인 오류가 아닙니다.

```txt
WARNING: Unsupported upgrade request.
WARNING: No supported WebSocket library detected.
```

WebSocket 지원이 필요하면 선택 의존성을 설치합니다.

```bash
pip install "uvicorn[standard]"
```
