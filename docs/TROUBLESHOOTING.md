# 문제 해결 문서

운영 중 자주 발생한 오류와 확인 명령을 정리합니다.

## `bootRun`이 80%에서 멈춘 것처럼 보임

정상입니다. Spring Boot 서버가 실행 중이라 Gradle 작업이 계속 열려 있는
상태입니다.

## 8080 포트가 이미 사용 중

```bash
sudo ss -tulpn | grep 8080
sudo kill -9 <PID>
cd /home/dongmin/Team-CAL-/backend
./gradlew bootRun
```

Docker Compose 운영 환경이라면:

```bash
docker compose up -d --force-recreate backend
```

## HTTPS는 열리지만 로그인에서 `Invalid CORS request`

Spring CORS 설정에 운영 도메인이 포함되어야 합니다.

`backend/src/main/java/com/dm/backend/config/WebConfig.java` 확인:

```java
"http://bitemate.kro.kr",
"http://www.bitemate.kro.kr",
"https://bitemate.kro.kr",
"https://www.bitemate.kro.kr"
```

수정 후 백엔드를 재시작합니다.

Origin 헤더를 넣어 테스트:

```bash
curl -i -X POST https://www.bitemate.kro.kr/api/users/login \
  -H "Origin: https://www.bitemate.kro.kr" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin01","password":"123"}'
```

정상 결과는 `HTTP/1.1 200`입니다.

## HTTPS 접속이 안 됨

Nginx와 443 포트를 확인합니다.

```bash
sudo nginx -t
sudo systemctl status nginx
sudo ss -tulpn | grep nginx
```

Nginx가 내부에서 `:443`을 열고 있는데 외부 접속만 실패하면 Azure Network
Security Group의 TCP 443 인바운드 규칙을 확인합니다.

## 프론트가 예전 IP 또는 localhost를 호출함

운영 프론트는 아래 값으로 빌드되어야 합니다.

```env
VITE_API_BASE_URL=/api
```

Docker 프론트 이미지를 다시 빌드/푸시하고 VM에서 새 태그로 pull합니다.

## 관리자 로그인 403

`401`은 아이디/비밀번호 불일치에 가깝고, `403`은 사용자를 찾았지만 상태가
활성 상태가 아닐 때 발생할 수 있습니다.

```sql
SELECT username, password, role, '[' || status || ']' AS status_text, LENGTH(status)
FROM users
WHERE username = 'admin01';
```

공백이 섞여 있으면 정리합니다.

```sql
UPDATE users
SET status = TRIM(status)
WHERE username = 'admin01';

COMMIT;
```

## OpenCV 500 또는 502

OpenCV 상태 확인:

```bash
curl http://127.0.0.1:8000/health
```

Docker Compose 환경에서는 백엔드 컨테이너 안에서 확인합니다.

```bash
docker exec shiftops-backend printenv | grep FASTAPI
docker exec shiftops-backend wget -qO- http://opencv:8000/health
```

백엔드 컨테이너에서 OpenCV 주소는 아래처럼 설정합니다.

```env
FASTAPI_BASE_URL=http://opencv:8000
FASTAPI_DOCUMENT_OCR_URL=http://opencv:8000/api/v1/documents/ocr
```

`127.0.0.1:8000`은 백엔드 컨테이너 자기 자신을 의미하므로 사용하지 않습니다.

환경변수 수정 후:

```bash
docker compose up -d --force-recreate backend opencv
```

## OpenCV 컨테이너에서 `cv2` import 실패

예시:

```txt
ImportError: libxcb.so.1: cannot open shared object file
```

OpenCV 이미지에 시스템 라이브러리가 부족한 상태입니다. base image를 다시
빌드/푸시합니다.

```bash
docker buildx build --platform linux/amd64 \
  -t kkmin1106/bitemateopencv-base:py312-yolo \
  --push ./opencvbase
```

그 다음 OpenCV 앱 이미지를 다시 빌드하고 배포합니다.

## 브라우저 웹캠 프레임 업로드가 400 반환

`/api/cctv/frame` 응답에 아래 문구가 있으면 요청은 Spring과 OpenCV까지
도착했지만 OpenCV 런타임이 깨진 상태입니다.

```txt
opencv-python and numpy are required for image inference
```

OpenCV base image부터 수정합니다.

## Docker pull 중 `no space left on device`

디스크 사용량 확인:

```bash
df -h
docker system df
sudo du -sh /var/lib/docker /var/lib/containerd /home/dongmin /var/log
```

사용하지 않는 Docker 데이터 정리:

```bash
docker system prune -af
docker builder prune -af
sudo systemctl restart docker
```

DB가 외부 Oracle이고 중요한 로컬 Docker volume이 없다면 unused volume도 정리할
수 있습니다.

```bash
docker system prune -af --volumes
```

OpenCV/Torch 이미지를 사용하는 현재 구조에서는 VM 디스크를 최소 128GB
Standard SSD 정도로 늘리는 것이 현실적입니다.

## AI 스케줄 생성 timeout

공통 axios timeout은 10초입니다. AI 스케줄 생성은 더 오래 걸릴 수 있으므로
월별 근무표 화면의 아래 요청만 60초 timeout을 사용합니다.

```txt
POST /api/shift/ai-preview
```

그래도 실패하면 백엔드 로그와 `ShiftService.explainGeneratedShifts`가 호출하는
OpenCV/LLM 엔드포인트를 확인합니다.

## 메인 대시보드 AI 추천 문구가 너무 구체적임

화면 문구가 실제 DB 값과 연결되었는지 확인해야 합니다.

현재 실제 데이터로 판단 가능한 항목:

- `people_log`: 고객 수, 피크 시간
- `shift`: 예정 근무자, 현재 배치 인원
- 출퇴근 QR/근태 데이터: 출근, 미출근
- 대타 모집 데이터
- 문서 만료 데이터

고객 연령대, 메뉴 선호도, 프로모션 추천은 POS/회원/고객 통계가 연결되어야
실제 분석이라고 말할 수 있습니다. 데이터가 없으면 샘플 또는 fallback 문구로
표시하거나 숨깁니다.

## QR 출퇴근 기대 동작

1. 하루 첫 번째 스캔: 출근
2. 같은 날 두 번째 스캔: 퇴근
3. 같은 날 세 번째 이후 스캔: 퇴근 시간 갱신
4. 다음 날: 다시 출근부터 시작
