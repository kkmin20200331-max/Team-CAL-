# OpenCV Base Image

This image contains the slow-changing runtime dependencies for the OpenCV
service. Build and push it only when Python, system libraries, or heavy ML
dependencies change.

```bash
docker build -t kkmin1106/bitemateopencv-base:py312-yolo ./opencvbase
docker push kkmin1106/bitemateopencv-base:py312-yolo
```

The application image in `../opencv` uses this image as its base so GitHub
Actions only has to copy the app code for normal changes.
