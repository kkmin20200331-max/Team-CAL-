# 문제 해결 문서

운영 중 자주 발생한 오류와 확인 명령을 정리합니다.

## GitHub PR의 Merge 버튼이 안 눌림

증상:

- `This branch has conflicts that must be resolved`
- `Resolve conflicts` 버튼이 회색으로 비활성화됨
- `These conflicts are too complex to resolve in the web editor`

원인:

- GitHub 웹 에디터가 처리하기 어려운 충돌입니다.
- 같은 파일을 양쪽 브랜치에서 크게 수정했거나, 빌드 산출물인 `frontend/dist/index.html`까지 충돌에 포함된 경우 자주 발생합니다.

해결:

```bash
git fetch origin
git checkout yuni
git merge origin/dev
```

충돌 마커를 확인합니다.

```bash
rg -n "<<<<<<<|=======|>>>>>>>" frontend
```

수정 후 검증합니다.

```bash
cd frontend
npm.cmd run build
```

정상 빌드 후 커밋/푸시합니다.

```bash
git add .
git commit -m "resolve frontend merge conflicts"
git push origin yuni
```

## React/Vite가 갑자기 터짐

확인:

```bash
cd frontend
npm.cmd run build
```

자주 발생한 원인:

- 충돌 마커가 남아 있음
- JSX 태그가 중복되거나 닫히지 않음
- import는 제거했는데 JSX에서 여전히 해당 컴포넌트를 사용함
- 환경 변수가 없는데 Supabase client를 즉시 생성함

최근 정리:

- `EmployeeBoard.tsx`는 Supabase URL/key가 없으면 client를 만들지 않도록 안전 처리했습니다.
- `BoardManagement.tsx`는 관리자 첨부파일/임시저장 기능을 제거하면서 관련 import와 JSX 잔여 코드도 제거했습니다.

## 게시판 첨부파일 업로드 실패

증상:

```txt
new row violates row-level security policy
```

원인:

- 브라우저에서 Supabase Storage에 직접 업로드할 때 bucket policy/RLS 설정과 충돌합니다.

현재 방향:

- 관리자 게시판의 첨부파일 기능은 제거했습니다.
- 직원 게시판 첨부파일은 Supabase 환경 변수가 없으면 앱이 죽지 않고, 업로드 시 안내 오류를 반환하도록 처리했습니다.
- 운영 기능으로 확정하려면 backend를 통한 업로드 프록시 또는 Supabase policy 정리가 필요합니다.

## OpenCV 500 또는 502

OpenCV 상태 확인:

```bash
curl http://127.0.0.1:8000/health
```

Docker Compose 환경에서는 backend 컨테이너 내부에서 확인합니다.

```bash
docker exec shiftops-backend printenv | grep FASTAPI
docker exec shiftops-backend wget -qO- http://opencv:8000/health
```

backend 컨테이너에서는 OpenCV 주소를 아래처럼 설정합니다.

```env
FASTAPI_BASE_URL=http://opencv:8000
FASTAPI_DOCUMENT_OCR_URL=http://opencv:8000/api/v1/documents/ocr
```

`127.0.0.1:8000`은 backend 컨테이너 자기 자신을 의미하므로 Compose 내부 통신에는 사용하지 않습니다.

## Oracle Wallet / DB 연결 문제

확인:

```bash
docker exec shiftops-backend printenv | grep SPRING_DATASOURCE
docker exec shiftops-backend ls -al /app/wallet
```

필수 파일:

```txt
cwallet.sso
ewallet.p12
ewallet.pem
keystore.jks
ojdbc.properties
sqlnet.ora
tnsnames.ora
truststore.jks
```

환경 변수 예:

```env
SPRING_DATASOURCE_DRIVER_CLASS_NAME=oracle.jdbc.OracleDriver
SPRING_DATASOURCE_HIKARI_DATA_SOURCE_PROPERTIES_ORACLE_NET_TNS_ADMIN=/app/wallet
```

## Docker pull 중 no space left on device

확인:

```bash
df -h
docker system df
sudo du -sh /var/lib/docker /var/lib/containerd /home/dongmin /var/log
```

정리:

```bash
docker system prune -af
docker builder prune -af
sudo systemctl restart docker
```

중요한 로컬 volume이 없는 환경에서만 아래 명령을 사용합니다.

```bash
docker system prune -af --volumes
```

## HTTPS/CORS 로그인 실패

운영 frontend는 API를 `/api`로 호출해야 합니다.

```env
VITE_API_BASE_URL=/api
```

Spring CORS 허용 origin에 운영 도메인이 포함되어야 합니다.

```txt
https://bitemate.kro.kr
https://www.bitemate.kro.kr
```

테스트:

```bash
curl -i -X POST https://www.bitemate.kro.kr/api/users/login \
  -H "Origin: https://www.bitemate.kro.kr" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin01","password":"123"}'
```

## 주급 신청 금액이 안 맞음

현재 방향:

- 이번 주 예상 급여는 화면에서 shift만으로 임시 계산하지 않고 `/payroll` API를 주간 범위로 다시 조회합니다.
- 신청 버튼은 `/payroll/weekly-request`로 점주/관리자 알림을 생성합니다.

확인할 API:

```txt
GET  /api/payroll
POST /api/payroll/weekly-request
```
