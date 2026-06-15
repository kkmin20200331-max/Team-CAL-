# ShiftOps AI Docs

OpenCV/FastAPI 기반 CCTV 분석 서버와 Spring Boot, React 관리자 화면의 연동 문서입니다.

## 문서 목록

| 문서 | 내용 |
| --- | --- |
| [integration_status.md](./integration_status.md) | 현재 실제 연동 상태, API 흐름, 프론트 반영 방식 |
| [project_analysis.md](./project_analysis.md) | FastAPI 서버 구조, 추론/집계/AI 인사이트 설계 |
| [today_tasks.md](./today_tasks.md) | 시연 전 점검 항목과 테스트 순서 |
| [opencv_portfolio.md](./opencv_portfolio.md) | 발표/포트폴리오용 설명 자료 |
| [ai_server_summary.md](./ai_server_summary.md) | AI 서버 기능 요약 |
| [performance_report.md](./performance_report.md) | 모델/처리 성능 기록 |

## 현재 실행 흐름

1. React 관리자 화면에서 CCTV 분석 시작
2. Spring Boot `/api/cctv/start` 호출
3. Spring Boot가 FastAPI `/api/v1/camera/start`로 전달
4. FastAPI가 OpenCV/YOLO 분석 루프 실행
5. `aggregationIntervalSec`마다 집계 결과 생성
6. `SEND_TO_SPRING=true`이면 Spring `/api/ai/congestion`으로 집계 전송
7. Spring이 `PEOPLE_LOG`에 저장
8. React 인사이트 페이지가 `people_log`, `metrics`, `aggregate`를 주기적으로 조회
9. 인사이트 페이지의 새로고침 버튼은 FastAPI LLM 인사이트 API를 호출

## 주요 URL

| 대상 | URL |
| --- | --- |
| React 관리자 화면 | `http://localhost:5173` |
| Spring Boot API | `http://localhost:8080` |
| FastAPI 서버 | `http://localhost:8000` |
| FastAPI Swagger | `http://localhost:8000/docs` |
| FastAPI 실험 페이지 | `http://localhost:8000/experiment` |

## 서버 실행

```powershell
cd opencv
venv\Scripts\activate
python -m pip install -r requirements.txt
uvicorn main:app --reload
```

Spring Boot와 React도 함께 실행해야 전체 화면이 동작합니다.

## 환경변수 핵심

```env
SEND_TO_SPRING=true
SPRING_CONGESTION_URL=http://127.0.0.1:8080/api/ai/congestion

LLM_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini
```

`LLM_PROVIDER` 또는 API 키가 없으면 LLM API는 `llm-fallback`으로 룰 기반 결과를 반환합니다.
