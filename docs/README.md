# Team-CAL 문서

Team-CAL 프로젝트의 실행, 배포, 운영, 장애 대응 문서를 모아둔 폴더입니다.

## 운영 문서

| 문서 | 내용 |
| --- | --- |
| [LOCAL_SETUP.md](./LOCAL_SETUP.md) | 로컬 실행 방법 |
| [DEPLOYMENT_AZURE.md](./DEPLOYMENT_AZURE.md) | Azure VM 배포 방법 |
| [CI_DOCKER.md](./CI_DOCKER.md) | GitHub Actions Docker 빌드/푸시 흐름 |
| [DOCKER_INFRA_PORTFOLIO.md](./DOCKER_INFRA_PORTFOLIO.md) | Docker 인프라 포트폴리오 설명 |
| [LINE_INTEGRATION.md](./LINE_INTEGRATION.md) | LINE 로그인, 계정 연동, 알림 |
| [OPENCV.md](./OPENCV.md) | OpenCV/FastAPI 서버 사용 방법 |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | 운영 중 자주 발생한 오류와 해결 방법 |
| [TODAY_2026-07-03.md](./TODAY_2026-07-03.md) | 2026-07-03 작업 기록 |

## 관련 문서

| 경로 | 내용 |
| --- | --- |
| [../PORTFOLIO.md](../PORTFOLIO.md) | 프로젝트 포트폴리오 요약 |
| [../opencv/docs](../opencv/docs/README.md) | OpenCV 분석, 성능, 발표 자료 |
| [../native/docs](../native/docs/README.md) | Native 앱 작업 로그와 문제 해결 기록 |
| [../frontend/README.md](../frontend/README.md) | 프론트엔드 실행 문서 |

## 현재 운영 구조

```txt
사용자 브라우저
  -> https://www.bitemate.kro.kr
  -> Nginx 443
  -> frontend Docker container :3000
  -> /api/* 요청은 Spring Boot Docker container :8080
  -> Spring Boot는 OpenCV Docker container http://opencv:8000 호출
```

운영 프론트엔드는 API 주소를 아래처럼 상대 경로로 사용합니다.

```env
VITE_API_BASE_URL=/api
```

Docker Compose 내부에서 backend가 OpenCV를 호출할 때는 `localhost`나 `127.0.0.1`이 아니라 서비스명인 `opencv`를 사용합니다.

```env
FASTAPI_BASE_URL=http://opencv:8000
FASTAPI_DOCUMENT_OCR_URL=http://opencv:8000/api/v1/documents/ocr
```

## 최근 정리 사항

- 관리자 게시판의 미사용 기능인 첨부파일 업로드와 임시저장 버튼을 제거했습니다.
- 직원 게시판은 Supabase 환경 변수가 없어도 React가 즉시 중단되지 않도록 안전 처리했습니다.
- 보건증/문서관리 페이지의 좁은 화면 overflow 문제를 정리했습니다.
- 고객 행동 분석 화면의 미사용 리포트 기능을 제거했습니다.
- 직원 급여 화면의 이번 주 예상 급여/주급 신청 흐름을 `/payroll` 및 `/payroll/weekly-request` 기준으로 정리했습니다.
- GitHub PR 충돌은 최신 대상 브랜치를 로컬에 가져온 뒤 command line에서 해결해야 합니다.

## GitHub PR 충돌 해결 요약

GitHub의 `Resolve conflicts` 버튼이 비활성화되는 경우는 충돌이 복잡해서 웹 에디터로 처리할 수 없다는 뜻입니다. 로컬에서 아래 순서로 해결합니다.

```bash
git fetch origin
git checkout yuni
git merge origin/dev
```

충돌 파일을 수정한 뒤:

```bash
git status
npm.cmd run build
git add frontend/dist/index.html frontend/src/app/pages/admin/BoardManagement.tsx frontend/src/app/pages/employee/EmployeeBoard.tsx frontend/src/app/pages/employee/EmployeePayroll.tsx
git commit
git push origin yuni
```

현재 PR 기준으로 자주 충돌나는 파일은 다음 네 개입니다.

```txt
frontend/dist/index.html
frontend/src/app/pages/admin/BoardManagement.tsx
frontend/src/app/pages/employee/EmployeeBoard.tsx
frontend/src/app/pages/employee/EmployeePayroll.tsx
```
