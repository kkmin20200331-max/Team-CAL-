# CI and Docker Images

GitHub Actions runs each service independently.

## Required GitHub Secrets

Add these in GitHub repository settings:

- `DOCKERHUB_USERNAME`: Docker Hub username, for example `kkmin1106`
- `DOCKERHUB_TOKEN`: Docker Hub access token
- `VM_HOST`: VM host or IP, for example `20.196.96.1`
- `VM_USER`: SSH user, for example `dongmin`
- `VM_PASSWORD`: SSH password for the VM user

## Workflows

- `Backend Docker`: builds `docker.io/<DOCKERHUB_USERNAME>/bitemateback`
- `Frontend Docker`: builds `docker.io/<DOCKERHUB_USERNAME>/bitematefront`
- `OpenCV Docker`: builds `docker.io/<DOCKERHUB_USERNAME>/bitemateopencv`
- `Native CI`: runs `npm ci` and `npx tsc --noEmit` for the Expo app

## Docker Tags

The Docker workflows publish:

- `latest` on pushes to the repository default branch
- `sha-<short-git-sha>` on every run
- a manual tag such as `006` when provided through `workflow_dispatch`

## VM Tag Variables

GitHub Actions updates the VM `.env` image tag automatically on pushes to `dev` or `main`. It does not run `docker compose pull` or `docker compose up -d`.

```env
BACKEND_IMAGE_TAG=sha-xxxxxxx
FRONTEND_IMAGE_TAG=sha-xxxxxxx
OPENCV_IMAGE_TAG=sha-xxxxxxx
```

The VM `docker-compose.yml` must use these variables:

```yaml
backend:
  image: kkmin1106/bitemateback:${BACKEND_IMAGE_TAG:-latest}

frontend:
  image: kkmin1106/bitematefront:${FRONTEND_IMAGE_TAG:-latest}

opencv:
  image: kkmin1106/bitemateopencv:${OPENCV_IMAGE_TAG:-latest}
```

## Manual Docker Release

In GitHub Actions, run the service workflow manually:

- **Backend Docker**
- **Frontend Docker**
- **OpenCV Docker**

Use `tag` for a release tag such as `006`.
Check `update_vm_tag` to update only the matching VM image tag variable.

Then apply on the VM manually:

```bash
docker compose pull
docker compose up -d
docker ps
```
