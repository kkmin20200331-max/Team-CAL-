# LINE Integration

LINE integration has two separate parts:

1. Account linking with LINE Login
2. Push notifications through the LINE Official Account

The friend-add URL alone is not enough for account linking.

## Correct Account-Linking Flow

```txt
User clicks LINE link button
  -> frontend opens /api/line/login?userId=<current-user-id>
  -> Spring redirects to LINE Login authorize URL
  -> LINE redirects back to /api/line/callback?code=...&state=<user-id>
  -> Spring exchanges code for access token
  -> Spring fetches LINE profile
  -> Spring stores USER_ID <-> LINE_USER_ID in USER_LINE
  -> Spring redirects to /line/success
  -> user optionally adds the Official Account as a friend
```

## Production Settings

`backend/src/main/resources/application.properties`:

```properties
line.login.redirect-uri=https://www.bitemate.kro.kr/api/line/callback
app.frontend-base-url=https://www.bitemate.kro.kr
line.official-account-url=https://line.me/R/ti/p/@354cpsdr
```

LINE Developers Console callback URL must match exactly:

```txt
https://www.bitemate.kro.kr/api/line/callback
```

## Important Tables

`USER_LINE`:

```sql
CREATE TABLE USER_LINE (
    USER_ID VARCHAR2(21 CHAR) PRIMARY KEY,
    LINE_USER_ID VARCHAR2(100 CHAR) UNIQUE NOT NULL,
    FOLLOW_YN CHAR(1) DEFAULT 'N'
);
```

Push notifications are sent only when the user has:

- a row in `USER_LINE`
- `FOLLOW_YN = 'Y'`

The `FOLLOW_YN` value is updated through the LINE webhook follow/unfollow
events.

## Leave Request Notification

When a staff member submits a leave request:

1. The request is saved as `PENDING`.
2. The requester receives:

```txt
휴무 신청이 완료되었습니다.
사유: ...
```

3. The owner/admin receives a separate leave request notification.

## Debug Checklist

Check callback route:

```bash
curl -I https://www.bitemate.kro.kr/api/line/login?userId=U1StGXR8_Z5jdHi6B-my1
```

Check linked user:

```sql
SELECT *
FROM USER_LINE
WHERE USER_ID = 'U1StGXR8_Z5jdHi6B-my1';
```

If push does not arrive, verify:

- user has added the Official Account as a friend
- LINE webhook URL is configured
- `FOLLOW_YN = 'Y'`
- channel access token is valid
