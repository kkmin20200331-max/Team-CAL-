# Azure VM 배포 문서

운영 도메인:

```txt
https://www.bitemate.kro.kr
```

## 현재 배포 구조

현재 Azure VM 배포는 Docker Compose 기반입니다.

```txt
Nginx 443 포트
  -> 프론트엔드 컨테이너 127.0.0.1:3000
  -> /api/* 요청은 백엔드 컨테이너 127.0.0.1:8080

백엔드 컨테이너
  -> Oracle Cloud DB
  -> OpenCV 컨테이너 http://opencv:8000
```

기존 `/var/www/calpeace`에 프론트 정적 파일을 복사하는 방식은 예전 방식입니다.
현재 운영 기준은 Nginx가 프론트엔드 Docker 컨테이너로 프록시하는 구조입니다.

## 프로젝트 업로드

Windows에서 전체 프로젝트를 VM으로 올릴 때:

```powershell
scp -r C:\Users\soldesk\Desktop\Team-CAL- dongmin@20.196.96.1:/home/dongmin/
```

압축 파일을 만들어 올린 경우:

```powershell
scp C:\Users\soldesk\Desktop\Team-CAL-\team-cal-deploy.tar.gz dongmin@20.196.96.1:/home/dongmin/
```

VM에서 압축 해제:

```bash
cd /home/dongmin
tar -xzf team-cal-deploy.tar.gz
```

## Compose 환경 변수

VM의 `.env`에는 이미지 태그와 운영 secret을 넣습니다. 이 파일은 절대 Git에
커밋하지 않습니다.

```env
BACKEND_IMAGE_TAG=sha-xxxxxxx
FRONTEND_IMAGE_TAG=sha-xxxxxxx
OPENCV_IMAGE_TAG=sha-xxxxxxx

FASTAPI_BASE_URL=http://opencv:8000
FASTAPI_DOCUMENT_OCR_URL=http://opencv:8000/api/v1/documents/ocr
```

Docker Compose 내부에서 백엔드가 OpenCV를 호출할 때는 반드시
`http://opencv:8000`을 사용합니다.

`127.0.0.1:8000`은 백엔드 컨테이너 자기 자신을 의미하므로 OpenCV 컨테이너로
연결되지 않습니다.

## 배포 적용

GitHub Actions가 VM `.env`의 태그를 갱신한 뒤, VM에서 아래 명령으로 실제
컨테이너를 갱신합니다.

```bash
cd /home/dongmin/Team-CAL-
docker compose pull
docker compose up -d
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
```

## Nginx 설정

권장 site 설정:

```nginx
server {
    listen 80;
    server_name bitemate.kro.kr www.bitemate.kro.kr;
    return 301 https://$host$request_uri;
}

server {
    listen 80;
    server_name 20.196.96.1;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl;
    server_name bitemate.kro.kr www.bitemate.kro.kr;

    ssl_certificate /etc/nginx/ssl/bitemate/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/bitemate/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

설정 검증 및 reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## TLS 인증서

`acme.sh`를 사용하면 인증서는 보통 아래 경로에 있습니다.

```bash
~/.acme.sh/<domain>/
```

Nginx 경로로 설치:

```bash
sudo mkdir -p /etc/nginx/ssl/bitemate

~/.acme.sh/acme.sh --install-cert -d www.bitemate.kro.kr \
  --key-file /etc/nginx/ssl/bitemate/privkey.pem \
  --fullchain-file /etc/nginx/ssl/bitemate/fullchain.pem \
  --reloadcmd "sudo systemctl reload nginx"
```

## OpenCV/FastAPI

운영에서는 OpenCV도 Docker Compose 서비스로 실행합니다. 예전에 백그라운드로
띄운 `uvicorn` 프로세스가 8000 포트를 잡고 있으면 컨테이너가 뜨지 않습니다.

```bash
sudo ss -tulpn | grep :8000
pkill -f "uvicorn"
docker compose up -d opencv backend
docker exec shiftops-backend wget -qO- http://opencv:8000/health
```

## Azure 네트워크 규칙

Azure Network Security Group 인바운드 규칙은 아래 포트를 열어둡니다.

| 포트 | 용도 |
| --- | --- |
| 22 | SSH |
| 80 | HTTP |
| 443 | HTTPS |

Spring Boot 8080과 OpenCV 8000은 디버깅이 아니면 외부로 직접 열지 않습니다.

## 예전 수동 실행 방식

문제 확인이 필요할 때만 사용할 수 있는 예전 방식입니다.

백엔드:

```bash
cd /home/dongmin/Team-CAL-/backend
chmod +x gradlew
./gradlew bootRun
```

프론트 정적 빌드:

```bash
cd /home/dongmin/Team-CAL-/frontend
echo 'VITE_API_BASE_URL=/api' > .env
npm install
npm run build
sudo rm -rf /var/www/calpeace/*
sudo mkdir -p /var/www/calpeace
sudo cp -r dist/* /var/www/calpeace/
sudo systemctl reload nginx
```
