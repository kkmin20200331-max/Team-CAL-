# Team-CAL 문서

이 폴더는 Team-CAL 프로젝트의 실행, 배포, 운영, 장애 대응 문서를 모아둔
메인 문서 폴더입니다.

## 운영 문서

| 문서 | 내용 |
| --- | --- |
| [LOCAL_SETUP.md](./LOCAL_SETUP.md) | 로컬 실행 방법 |
| [DEPLOYMENT_AZURE.md](./DEPLOYMENT_AZURE.md) | Azure VM 배포 방법 |
| [CI_DOCKER.md](./CI_DOCKER.md) | GitHub Actions Docker 빌드/푸시 흐름 |
| [DOCKER_INFRA_PORTFOLIO.md](./DOCKER_INFRA_PORTFOLIO.md) | Docker 인프라 포트폴리오 설명 |
| [LINE_INTEGRATION.md](./LINE_INTEGRATION.md) | LINE 로그인, 계정 연동, 알림 |
| [OPENCV.md](./OPENCV.md) | OpenCV/FastAPI 서버 사용 방법 |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | 자주 발생한 오류와 해결 방법 |
| [TODAY_2026-07-03.md](./TODAY_2026-07-03.md) | 2026-07-03 작업 기록 |

## 아카이브 문서

오래된 설계 노트, 발표 자료, 작업 로그는 각 모듈 폴더에 보관합니다.

| 경로 | 내용 |
| --- | --- |
| [../opencv/docs](../opencv/docs/README.md) | OpenCV 분석, 성능, 발표 자료 |
| [../native/docs](../native/docs/README.md) | Native 앱 작업 로그와 문제 해결 기록 |
| [../frontend/guidelines](../frontend/guidelines/Guidelines.md) | Figma 기반 프론트엔드 가이드 |

## 현재 운영 구조

```txt
사용자 브라우저
  -> https://www.bitemate.kro.kr
  -> Nginx 443 포트
  -> 프론트엔드 Docker 컨테이너 127.0.0.1:3000
  -> /api/* 요청은 Spring Boot Docker 컨테이너 127.0.0.1:8080
  -> Spring Boot가 OpenCV Docker 컨테이너 http://opencv:8000 호출
```

운영 프론트엔드 빌드에서는 API 주소를 아래처럼 둡니다.

```env
VITE_API_BASE_URL=/api
```
