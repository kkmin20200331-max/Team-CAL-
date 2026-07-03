# Team-CAL

Team-CAL is a store operations project for staff management, schedules,
attendance, leave requests, substitute shifts, payroll, documents, and
OpenCV-based customer counting.

## Quick Links

| Document | Purpose |
| --- | --- |
| [docs/README.md](./docs/README.md) | Documentation index |
| [docs/LOCAL_SETUP.md](./docs/LOCAL_SETUP.md) | Local development setup |
| [docs/DEPLOYMENT_AZURE.md](./docs/DEPLOYMENT_AZURE.md) | Azure VM deployment |
| [docs/LINE_INTEGRATION.md](./docs/LINE_INTEGRATION.md) | LINE Login and notification flow |
| [docs/OPENCV.md](./docs/OPENCV.md) | OpenCV/FastAPI server |
| [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) | Common problems and fixes |

## Project Layout

```txt
backend/   Spring Boot API and Oracle DB integration
frontend/  React/Vite admin web app
native/    Expo React Native employee app
opencv/    FastAPI/OpenCV analysis server
docs/      Operational documentation
```

## Runtime Ports

| Service | Port |
| --- | --- |
| Frontend dev server | 5173 |
| Spring Boot backend | 8080 |
| OpenCV/FastAPI server | 8000 |
| Nginx HTTP/HTTPS | 80 / 443 |
