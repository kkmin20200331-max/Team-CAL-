# ShiftOps AI Docs

이 폴더는 OpenCV/FastAPI 기반 AI 서버의 구조, 실행 방법, 발표 자료, 성능 실험 기록을 모아둔 문서 공간입니다.

## 먼저 볼 문서

| 목적 | 문서 |
| --- | --- |
| 프로젝트 전체 구조 파악 | [project_analysis.md](./project_analysis.md) |
| 실행/시연 흐름 확인 | [today_tasks.md](./today_tasks.md) |
| 발표용 설명 정리 | [opencv_portfolio.md](./opencv_portfolio.md) |
| 서버 기능 빠른 요약 | [ai_server_summary.md](./ai_server_summary.md) |
| 성능 실험 기록 | [performance_report.md](./performance_report.md) |

## 문서 역할

- [project_analysis.md](./project_analysis.md): 코드 구조, API, 요청/응답 모델, 환경변수, 운영 체크포인트를 정리한 기준 문서입니다.
- [today_tasks.md](./today_tasks.md): 발표 또는 시연 전에 확인할 체크리스트와 테스트 절차입니다.
- [opencv_portfolio.md](./opencv_portfolio.md): 포트폴리오/발표에서 사용할 설명 문장과 강조 포인트입니다.
- [ai_server_summary.md](./ai_server_summary.md): AI 서버의 역할, 처리 파이프라인, 주요 API를 짧게 요약한 문서입니다.
- [performance_report.md](./performance_report.md): 모델, 이미지 크기, worker 수에 따른 성능 실험 결과를 기록하는 문서입니다.

## 실행 핵심

```powershell
venv\Scripts\activate
python -m pip install -r requirements.txt
uvicorn main:app --reload
```

- Swagger: <http://127.0.0.1:8000/docs>
- 실험 페이지: <http://127.0.0.1:8000/experiment>
- 헬스체크: <http://127.0.0.1:8000/api/v1/health>

## 자주 헷갈리는 부분

- `/api/v1/camera/start`는 `POST` 전용입니다. `GET` 요청의 `405 Method Not Allowed`는 정상입니다.
- 웹캠을 사용할 때는 `source: "0"`만 넣으면 안 되고 `sourceType: "WEBCAM"`을 함께 넣어야 합니다.
- 영상 파일을 사용할 때는 `sourceType: "VIDEO_FILE"`과 실제 mp4 경로를 넣어야 합니다.
- `aggregationIntervalSec`는 aggregate 기능을 켜는 값입니다. 예를 들어 `intervalSec=1`, `aggregationIntervalSec=5`이면 5개 샘플 단위로 집계합니다.
- `ultralytics is not installed`가 나오면 서버를 실행하는 같은 Python 환경에서 `python -m pip install -r requirements.txt`를 실행합니다.

## 현재 범위

AI 서버는 고객의 신원, 신규/재방문 여부, 연령대를 판단하지 않습니다. CCTV 분석 범위는 방문 인원 수와 시간대별 혼잡도 추정으로 제한합니다.

프론트엔드와 LLM 인사이트는 이 집계 데이터를 POS, 날씨, 스케줄 데이터와 조합해 다음과 같은 운영 인사이트로 확장합니다.

- 시간대별 방문 흐름
- 피크 시간 예측
- 방문 대비 매출 전환
- 인력 부족/과잉 시간대
- AI 스케줄 추천
