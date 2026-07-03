# CI and Docker Images

GitHub Actions runs each service independently.

## Required GitHub Secrets

Add these in GitHub repository settings:

- `DOCKERHUB_USERNAME`: Docker Hub username, for example `kkmin1106`
- `DOCKERHUB_TOKEN`: Docker Hub access token

## Workflows

- `Backend Docker`: builds `docker.io/<DOCKERHUB_USERNAME>/bitemateback`
- `Frontend Docker`: builds `docker.io/<DOCKERHUB_USERNAME>/bitematefront`
- `OpenCV Docker`: builds `docker.io/<DOCKERHUB_USERNAME>/bitemateopencv`
- `Native CI`: runs `npm ci` and `npx tsc --noEmit` for the Expo app

## Docker Tags

The Docker workflows publish:

- `latest` on pushes to `main`
- `sha-<short-git-sha>` on every run
- a manual tag such as `006` when provided through `workflow_dispatch`

## Manual Docker Release

In GitHub Actions, run the service workflow manually:

- **Backend Docker**
- **Frontend Docker**
- **OpenCV Docker**

Use `tag` for a release tag such as `006`.

Then update the VM `docker-compose.yml` image tags if you use fixed tags:

```yaml
backend:
  image: kkmin1106/bitemateback:006

frontend:
  image: kkmin1106/bitematefront:006

opencv:
  image: kkmin1106/bitemateopencv:006
```

Apply on the VM:

```bash
docker compose pull
docker compose up -d
docker ps
```
