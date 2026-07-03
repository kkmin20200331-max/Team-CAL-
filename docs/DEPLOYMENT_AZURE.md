# Azure VM Deployment

Production host:

```txt
https://www.bitemate.kro.kr
```

## Upload Project

From Windows:

```powershell
scp -r C:\Users\soldesk\Desktop\Team-CAL- dongmin@20.196.96.1:/home/dongmin/
```

If using the prepared archive:

```powershell
scp C:\Users\soldesk\Desktop\Team-CAL-\team-cal-deploy.tar.gz dongmin@20.196.96.1:/home/dongmin/
```

On the VM:

```bash
cd /home/dongmin
tar -xzf team-cal-deploy.tar.gz
```

## Backend

```bash
cd /home/dongmin/Team-CAL-/backend
chmod +x gradlew
./gradlew bootRun
```

If port 8080 is already in use:

```bash
sudo ss -tulpn | grep 8080
sudo kill -9 <PID>
./gradlew bootRun
```

## Frontend

Production `.env`:

```bash
cd /home/dongmin/Team-CAL-/frontend
echo 'VITE_API_BASE_URL=/api' > .env
npm install
npm run build
```

Deploy static files:

```bash
sudo rm -rf /var/www/calpeace/*
sudo mkdir -p /var/www/calpeace
sudo cp -r dist/* /var/www/calpeace/
sudo systemctl reload nginx
```

## Nginx

Recommended site config:

```nginx
server {
    listen 80;
    server_name bitemate.kro.kr www.bitemate.kro.kr;
    return 301 https://$host$request_uri;
}

server {
    listen 80;
    server_name 20.196.96.1;

    root /var/www/calpeace;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
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

    root /var/www/calpeace;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
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

Validate and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## TLS Certificate

If using `acme.sh`, certificate files are usually under:

```bash
~/.acme.sh/<domain>/
```

Install the cert into the Nginx path:

```bash
mkdir -p /etc/nginx/ssl/bitemate

~/.acme.sh/acme.sh --install-cert -d www.bitemate.kro.kr \
  --key-file /etc/nginx/ssl/bitemate/privkey.pem \
  --fullchain-file /etc/nginx/ssl/bitemate/fullchain.pem \
  --reloadcmd "sudo systemctl reload nginx"
```

## OpenCV/FastAPI

```bash
cd /home/dongmin/Team-CAL-/opencv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000
```

## Azure Network Rules

Open these inbound ports in the Azure Network Security Group:

| Port | Purpose |
| --- | --- |
| 22 | SSH |
| 80 | HTTP |
| 443 | HTTPS |

Do not expose Spring Boot 8080 or OpenCV 8000 directly unless debugging.
