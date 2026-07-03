# Troubleshooting

## `bootRun` Stays at 80%

Normal. Spring Boot is running and Gradle keeps the task open.

## Port 8080 Already in Use

```bash
sudo ss -tulpn | grep 8080
sudo kill -9 <PID>
cd /home/dongmin/Team-CAL-/backend
./gradlew bootRun
```

## HTTPS Works But Browser Login Fails with `Invalid CORS request`

Spring CORS must allow the production origins.

Check `backend/src/main/java/com/dm/backend/config/WebConfig.java`:

```java
"http://bitemate.kro.kr",
"http://www.bitemate.kro.kr",
"https://bitemate.kro.kr",
"https://www.bitemate.kro.kr"
```

Restart the backend after editing.

Test with an Origin header:

```bash
curl -i -X POST https://www.bitemate.kro.kr/api/users/login \
  -H "Origin: https://www.bitemate.kro.kr" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin01","password":"123"}'
```

Expected result: `HTTP/1.1 200`.

## HTTPS Does Not Open

Check Nginx and port 443:

```bash
sudo nginx -t
sudo systemctl status nginx
sudo ss -tulpn | grep nginx
```

If Nginx listens on `:443` internally but external access fails, check Azure
Network Security Group inbound rule for TCP 443.

## Frontend Calls Old Private IP

Production frontend must be built with:

```env
VITE_API_BASE_URL=/api
```

Then rebuild and redeploy:

```bash
cd /home/dongmin/Team-CAL-/frontend
npm run build
sudo rm -rf /var/www/calpeace/*
sudo cp -r dist/* /var/www/calpeace/
sudo systemctl reload nginx
```

## Admin Login Returns 403

`401` means username/password mismatch. `403` means the user was found but is
not active.

Check:

```sql
SELECT username, password, role, '[' || status || ']' AS status_text, LENGTH(status)
FROM users
WHERE username = 'admin01';
```

Fix:

```sql
UPDATE users
SET status = TRIM(status)
WHERE username = 'admin01';

COMMIT;
```

## OpenCV 500 on Dashboard

Check the OpenCV service:

```bash
curl http://127.0.0.1:8000/health
```

Start if needed:

```bash
cd /home/dongmin/Team-CAL-/opencv
source venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8000
```

## QR Attendance Expected Behavior

1. First scan of the day: check-in
2. Second scan of the same day: check-out
3. Additional scans the same day: update check-out time
4. Next day: resets to check-in
