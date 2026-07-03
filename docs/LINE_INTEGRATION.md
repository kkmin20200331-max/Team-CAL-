# LINE 연동 문서

LINE 연동은 두 가지 기능으로 나뉩니다.

1. LINE Login을 이용한 사용자 계정 연동
2. LINE 공식 계정을 통한 push 알림

단순 친구 추가 URL만으로는 사용자 계정과 LINE 계정을 매핑할 수 없습니다.

## 올바른 계정 연동 흐름

```txt
사용자가 LINE 연동 버튼 클릭
  -> 프론트엔드가 /api/line/login?userId=<현재 사용자 ID> 호출
  -> Spring Boot가 LINE Login authorize URL로 redirect
  -> LINE이 /api/line/callback?code=...&state=<user-id>로 redirect
  -> Spring Boot가 code를 access token으로 교환
  -> Spring Boot가 LINE profile 조회
  -> USER_ID <-> LINE_USER_ID 매핑을 USER_LINE에 저장
  -> /line/success로 redirect
  -> 사용자는 필요하면 공식 계정을 친구 추가
```

## 운영 설정

`backend/src/main/resources/application.properties` 또는 운영 환경변수에 아래 값을
설정합니다.

```properties
line.login.redirect-uri=https://www.bitemate.kro.kr/api/line/callback
app.frontend-base-url=https://www.bitemate.kro.kr
line.official-account-url=https://line.me/R/ti/p/@354cpsdr
```

LINE Developers Console의 callback URL은 아래 값과 정확히 일치해야 합니다.

```txt
https://www.bitemate.kro.kr/api/line/callback
```

## 주요 테이블

`USER_LINE`:

```sql
CREATE TABLE USER_LINE (
    USER_ID VARCHAR2(21 CHAR) PRIMARY KEY,
    LINE_USER_ID VARCHAR2(100 CHAR) UNIQUE NOT NULL,
    FOLLOW_YN CHAR(1) DEFAULT 'N'
);
```

Push 알림은 아래 조건을 만족할 때만 전송됩니다.

- `USER_LINE`에 사용자 매핑 정보가 있음
- `FOLLOW_YN = 'Y'`

`FOLLOW_YN`은 LINE webhook의 follow/unfollow 이벤트로 갱신합니다.

## 휴무 신청 알림

직원이 휴무를 신청하면 다음 흐름으로 처리합니다.

1. 휴무 신청이 `PENDING` 상태로 저장됩니다.
2. 신청자에게 아래 LINE 메시지가 전송됩니다.

```txt
휴무 신청이 완료되었습니다.
사유: ...
```

3. 점주 또는 관리자에게는 별도의 휴무 신청 알림을 전송합니다.

## 디버깅 체크리스트

LINE 로그인 진입 확인:

```bash
curl -I https://www.bitemate.kro.kr/api/line/login?userId=U1StGXR8_Z5jdHi6B-my1
```

연동된 사용자 확인:

```sql
SELECT *
FROM USER_LINE
WHERE USER_ID = 'U1StGXR8_Z5jdHi6B-my1';
```

Push 알림이 오지 않으면 아래 항목을 확인합니다.

- 사용자가 LINE 공식 계정을 친구 추가했는지
- LINE webhook URL이 설정되어 있는지
- `FOLLOW_YN = 'Y'`인지
- channel access token이 유효한지
