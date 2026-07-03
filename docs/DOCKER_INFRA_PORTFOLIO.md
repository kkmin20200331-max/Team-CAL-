# Docker 인프라 포트폴리오 정리

## 1. 도입 배경

Team-CAL은 Spring Boot 백엔드, React 프론트엔드, FastAPI/OpenCV 분석 서버,
Native 앱으로 구성된 복합 서비스입니다.

초기에는 VM에서 각 서비스를 직접 실행했습니다.

```txt
Spring Boot: ./gradlew bootRun
Frontend: npm run build 후 /var/www 복사
OpenCV: uvicorn 백그라운드 실행
```

이 방식은 빠르게 시연하기에는 좋지만 운영 관점에서는 문제가 있었습니다.

- 서버 재시작 시 프로세스를 다시 띄워야 함
- 어떤 코드와 이미지가 배포됐는지 추적하기 어려움
- 프론트/백엔드/OpenCV 배포 방식이 서로 다름
- OpenCV 의존성이 무거워 VM 환경이 쉽게 꼬임
- `localhost`, `127.0.0.1`, `host.docker.internal` 같은 주소 혼동 발생

그래서 운영 배포 구조를 Docker Compose 기반으로 정리했습니다.

## 2. 현재 인프라 구조

```txt
사용자 브라우저
  -> https://www.bitemate.kro.kr
  -> Nginx
      -> /          : frontend 컨테이너 127.0.0.1:3000
      -> /api/*     : backend 컨테이너 127.0.0.1:8080

backend 컨테이너
  -> Oracle Cloud DB
  -> OpenCV 컨테이너 http://opencv:8000

opencv 컨테이너
  -> YOLO/OpenCV 추론
  -> 이미지/웹캠 프레임 분석
```

외부에는 HTTP/HTTPS만 열고, Spring Boot와 OpenCV 포트는 VM 내부 또는 Docker
네트워크에서만 사용합니다.

## 3. 서비스 분리

| 서비스 | 역할 | 이미지 |
| --- | --- | --- |
| frontend | React/Vite 정적 화면 제공 | `kkmin1106/bitematefront` |
| backend | Spring Boot API, DB 저장, 인증, 비즈니스 로직 | `kkmin1106/bitemateback` |
| opencv | FastAPI, YOLO/OpenCV 추론, AI 인사이트 보조 | `kkmin1106/bitemateopencv` |

각 서비스는 독립 이미지로 관리합니다. 프론트만 수정하면 프론트 이미지만
빌드하고, OpenCV만 수정하면 OpenCV 이미지만 빌드합니다.

## 4. Docker Compose 네트워크

Compose 내부 서비스끼리는 컨테이너 이름으로 통신합니다.

```env
FASTAPI_BASE_URL=http://opencv:8000
```

백엔드 컨테이너 안에서 `127.0.0.1:8000`을 사용하면 OpenCV가 아니라 백엔드
컨테이너 자기 자신을 바라보게 됩니다. 이 문제를 해결하기 위해 OpenCV 주소를
Compose 서비스명인 `opencv`로 통일했습니다.

## 5. Nginx Reverse Proxy

Nginx는 외부 진입점을 하나로 통일합니다.

```txt
https://www.bitemate.kro.kr
  -> 화면 요청: frontend 컨테이너
  -> API 요청: backend 컨테이너
```

프론트엔드는 운영 빌드에서 API 주소를 `/api`로 사용합니다.

```env
VITE_API_BASE_URL=/api
```

이렇게 하면 브라우저가 `https://www.bitemate.kro.kr/api/...`로 호출하고,
Nginx가 내부 백엔드로 프록시합니다. CORS와 mixed content 문제를 줄일 수
있습니다.

## 6. CI/CD 흐름

GitHub Actions는 서비스별 Docker workflow로 나뉩니다.

```txt
dev/main push
  -> 변경된 서비스 Docker image build
  -> Docker Hub push
  -> VM .env의 IMAGE_TAG 자동 갱신
  -> 운영자가 VM에서 docker compose pull/up 실행
```

이미지는 Git SHA 기반 태그로 추적합니다.

```env
BACKEND_IMAGE_TAG=sha-xxxxxxx
FRONTEND_IMAGE_TAG=sha-xxxxxxx
OPENCV_IMAGE_TAG=sha-xxxxxxx
```

자동으로 컨테이너를 재시작하지 않고 태그만 갱신하는 이유는 운영자가 배포
시점을 직접 통제하기 위해서입니다.

## 7. OpenCV 이미지 최적화

OpenCV 서비스는 일반 웹 서버보다 이미지가 큽니다.

주요 원인:

- Torch
- Ultralytics
- OpenCV
- numpy
- Linux runtime libraries

매번 GitHub Actions에서 이 의존성을 설치하면 빌드 시간이 길어집니다. 그래서
무거운 의존성은 base image로 분리했습니다.

```txt
kkmin1106/bitemateopencv-base:py312-yolo
```

OpenCV 앱 이미지는 이 base image 위에 애플리케이션 코드만 복사합니다.

```dockerfile
FROM kkmin1106/bitemateopencv-base:py312-yolo
WORKDIR /app
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

이 구조의 장점:

- 일반 코드 변경 시 빌드 시간이 줄어듦
- OpenCV 런타임 라이브러리를 이미지에 고정 가능
- VM마다 Python 환경을 직접 맞출 필요가 없음

## 8. 브라우저 웹캠 분석 구조

배포 서버는 Azure VM에 있으므로, VM이 사용자의 로컬 웹캠을 직접 열 수
없습니다. 이 문제를 해결하기 위해 브라우저 프레임 업로드 방식을 사용합니다.

```txt
브라우저 getUserMedia
  -> 3~5초마다 JPEG 캡처
  -> POST /api/cctv/frame
  -> Spring Boot가 OpenCV로 전달
  -> PEOPLE_LOG 저장
```

이 방식은 설치형 에이전트 없이 웹페이지에서 바로 동작한다는 장점이 있습니다.
단, 브라우저 탭이 닫히면 분석도 종료됩니다.

## 9. 운영 중 확인 명령

컨테이너 상태:

```bash
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
```

OpenCV 연결 확인:

```bash
docker exec shiftops-backend wget -qO- http://opencv:8000/health
```

이미지 용량 확인:

```bash
docker system df
```

디스크 사용량 확인:

```bash
df -h
sudo du -sh /var/lib/docker /var/lib/containerd /home/dongmin /var/log
```

## 10. 개선 효과

| 항목 | 개선 전 | 개선 후 |
| --- | --- | --- |
| 배포 방식 | 서비스별 수동 실행 | Docker Compose 통합 |
| 버전 추적 | 어떤 코드인지 불명확 | `sha-xxxxxxx` 이미지 태그 |
| 프론트 배포 | `/var/www` 복사 | 프론트 컨테이너 교체 |
| OpenCV 실행 | VM Python 환경 의존 | Docker 이미지로 고정 |
| 서비스 통신 | localhost 혼동 | Compose 서비스명 사용 |
| 장애 대응 | 프로세스 직접 확인 | 컨테이너 단위 확인/재시작 |

## 11. 포트폴리오 설명 포인트

이 인프라 구조에서 강조할 수 있는 부분은 다음과 같습니다.

- 단순 기능 구현을 넘어서 실제 배포 가능한 구조로 정리했다.
- 프론트엔드, 백엔드, AI 서버를 독립 컨테이너로 분리했다.
- GitHub Actions와 Docker Hub를 이용해 이미지 빌드/푸시를 자동화했다.
- Git SHA 태그를 사용해 배포 버전을 추적 가능하게 했다.
- OpenCV처럼 무거운 AI 런타임은 base image로 분리해 빌드 시간을 줄였다.
- Nginx reverse proxy를 통해 HTTPS, API 프록시, 프론트 제공을 통합했다.
- Azure VM에서 운영 중 발생한 디스크 부족, 포트 충돌, 컨테이너 네트워크 문제를
  실제로 해결하며 운영 문서화까지 진행했다.
