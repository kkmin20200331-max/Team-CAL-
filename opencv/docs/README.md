# OpenCV AI Server Docs

이 폴더는 ShiftOps AI의 Python/OpenCV 기반 AI 서버 문서를 모아둔 공간입니다.

## 문서 목록

| 파일 | 설명 |
| --- | --- |
| [opencv_portfolio.md](./opencv_portfolio.md) | OpenCV/YOLO AI 서버 프로젝트 발표용 포트폴리오 문서 |
| [project_analysis.md](./project_analysis.md) | 프로젝트 구조, API, 처리 흐름, 환경변수, 운영 체크포인트를 정리한 종합 분석 문서 |
| [ai_server_summary.md](./ai_server_summary.md) | AI 서버 역할, 구현 기능, 처리 파이프라인, API 요약 |
| [performance_report.md](./performance_report.md) | YOLO 추론 성능 기준, 실험 매트릭스, 후보 설정 |
| [today_tasks.md](./today_tasks.md) | 발표/시연 준비 체크리스트와 테스트 절차 |

## 현재 방향

AI 서버는 고객의 신원, 신규/재방문 여부, 연령대를 판단하지 않습니다. CCTV 분석 범위는 방문 인원 수와 시간대별 혼잡도 추정으로 제한합니다.

프론트엔드와 Gemini API에서는 이 집계 데이터를 POS, 날씨, 스케줄 데이터와 조합해 다음과 같은 운영 인사이트로 확장합니다.

- 시간대별 방문 흐름
- 피크 시간 예측
- 방문 대비 매출 전환
- 인력 부족/과잉 시간대
- AI 스케줄 추천
