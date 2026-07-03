# Team-CAL Documentation

Use this folder as the main entry point for running, deploying, and debugging
Team-CAL.

## Operational Docs

| Document | Purpose |
| --- | --- |
| [LOCAL_SETUP.md](./LOCAL_SETUP.md) | Run the project locally |
| [DEPLOYMENT_AZURE.md](./DEPLOYMENT_AZURE.md) | Deploy to the Azure VM |
| [LINE_INTEGRATION.md](./LINE_INTEGRATION.md) | LINE Login, account linking, and push notifications |
| [OPENCV.md](./OPENCV.md) | OpenCV/FastAPI server usage |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Common errors and fixes |

## Archive Docs

Older design notes, portfolio notes, and work logs are kept in module folders:

| Path | Notes |
| --- | --- |
| [../opencv/docs](../opencv/docs/README.md) | OpenCV analysis, performance, and presentation notes |
| [../native/docs](../native/docs/README.md) | Native app work logs and troubleshooting archive |
| [../frontend/guidelines](../frontend/guidelines/Guidelines.md) | Figma/generated frontend guidelines |

## Current Production Shape

```txt
Browser
  -> https://www.bitemate.kro.kr
  -> Nginx :443
  -> static frontend files in /var/www/calpeace
  -> /api/* proxy to Spring Boot 127.0.0.1:8080
  -> OpenCV calls from Spring to 127.0.0.1:8000
```

For production frontend builds, keep:

```env
VITE_API_BASE_URL=/api
```
