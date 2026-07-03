# CI와 Docker 이미지

GitHub Actions는 백엔드, 프론트엔드, OpenCV, Native를 각각 분리해서
실행합니다. 서비스별로 빌드 범위를 나누면 한쪽 코드만 수정했을 때 전체
이미지를 다시 만들 필요가 없습니다.

## 필요한 GitHub Secrets

GitHub 저장소 설정의 Actions secrets에 아래 값을 등록합니다.

| Secret | 설명 |
| --- | --- |
| `DOCKERHUB_USERNAME` | Docker Hub 아이디 |
| `DOCKERHUB_TOKEN` | Docker Hub access token |
| `VM_HOST` | Azure VM IP 또는 호스트 |
| `VM_USER` | SSH 사용자 |
| `VM_PASSWORD` | SSH 비밀번호 |

## Workflow 구성

| Workflow | 역할 |
| --- | --- |
| `Backend Docker` | `docker.io/<namespace>/bitemateback` 빌드/푸시 |
| `Frontend Docker` | `docker.io/<namespace>/bitematefront` 빌드/푸시 |
| `OpenCV Docker` | `docker.io/<namespace>/bitemateopencv` 빌드/푸시 |
| `Native CI` | Expo 앱 `npm ci`, `npx tsc --noEmit` 검증 |

Docker 이미지 workflow는 `dev`, `main` 브랜치에서만 실행하는 것을 기준으로
합니다. `yuni` 같은 작업 브랜치는 자유롭게 push하고, `dev`로 merge할 때
배포 가능한 이미지가 만들어지도록 운영합니다.

## Docker 태그 규칙

각 Docker workflow는 다음 태그를 사용합니다.

| 태그 | 설명 |
| --- | --- |
| `sha-<짧은 git sha>` | 일반 배포 기준 태그 |
| `latest` | 기본 브랜치 push 시 생성 |
| 직접 입력한 태그 | `workflow_dispatch`에서 `006` 같은 수동 태그 입력 시 생성 |

운영에서는 `sha-xxxxxxx` 태그를 기준으로 배포 상태를 추적합니다.

## VM 태그 변수

GitHub Actions는 `dev` 또는 `main`에 push되면 VM의 `.env` 안에 있는 이미지
태그만 자동으로 갱신합니다.

```env
BACKEND_IMAGE_TAG=sha-xxxxxxx
FRONTEND_IMAGE_TAG=sha-xxxxxxx
OPENCV_IMAGE_TAG=sha-xxxxxxx
```

이미지 pull과 컨테이너 재시작은 사람이 VM에서 직접 실행합니다.

```bash
docker compose pull
docker compose up -d
docker ps
```

이렇게 분리한 이유는 태그 갱신과 실제 재시작을 분리해서, 운영 중 즉시
재시작되면 곤란한 상황을 피하기 위해서입니다.

## docker-compose 이미지 예시

VM의 `docker-compose.yml`은 `.env`의 태그 변수를 사용합니다.

```yaml
services:
  backend:
    image: kkmin1106/bitemateback:${BACKEND_IMAGE_TAG:-latest}

  frontend:
    image: kkmin1106/bitematefront:${FRONTEND_IMAGE_TAG:-latest}

  opencv:
    image: kkmin1106/bitemateopencv:${OPENCV_IMAGE_TAG:-latest}
```

## 수동 릴리즈

GitHub Actions에서 특정 서비스 workflow를 직접 실행할 수 있습니다.

- `Backend Docker`
- `Frontend Docker`
- `OpenCV Docker`

수동 릴리즈 태그가 필요하면 `tag`에 `006` 같은 값을 입력합니다.
VM `.env` 태그까지 같이 바꾸려면 `update_vm_tag` 옵션을 체크합니다.

## OpenCV Base Image

OpenCV 이미지는 Torch, Ultralytics, OpenCV, numpy 같은 무거운 의존성이 있어
빌드 시간이 길어집니다. 그래서 자주 바뀌지 않는 런타임 의존성은 별도 base
image로 분리합니다.

```txt
kkmin1106/bitemateopencv-base:py312-yolo
```

이 이미지는 Python 버전, apt 라이브러리, Torch, OpenCV, Ultralytics 같은
무거운 의존성이 바뀔 때만 다시 빌드합니다.

저장소 루트에서 실행:

```bash
docker buildx build --platform linux/amd64 \
  -t kkmin1106/bitemateopencv-base:py312-yolo \
  --push ./opencvbase
```

`opencvbase` 폴더 안에서 실행:

```bash
docker buildx build --platform linux/amd64 \
  -t kkmin1106/bitemateopencv-base:py312-yolo \
  --push .
```

일반적인 OpenCV 코드 변경은 `kkmin1106/bitemateopencv` 앱 이미지만 다시
빌드하면 됩니다.
