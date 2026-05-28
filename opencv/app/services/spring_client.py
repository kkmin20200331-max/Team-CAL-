from app.core.config import settings
from app.core.logger import get_logger
from app.schemas.response import DetectionResponse

logger = get_logger(__name__)


class SpringClient:
    def send_congestion(self, payload: DetectionResponse) -> bool:
        if not settings.send_to_spring:
            logger.info("[SPRING] skipped; SEND_TO_SPRING=false")
            return True

        try:
            import httpx

            response = httpx.post(
                settings.spring_congestion_url,
                headers={"X-AI-API-KEY": settings.spring_api_key},
                json=self._to_spring_payload(payload),
                timeout=5,
            )
            response.raise_for_status()
            logger.info("[SPRING] POST success: %s", settings.spring_congestion_url)
            return True
        except Exception as exc:
            logger.error("[SPRING] POST failed: %s", exc)
            return False

    def _to_spring_payload(self, payload: DetectionResponse) -> dict:
        data = payload.model_dump(mode="json")
        data.pop("boxes", None)
        data.pop("annotatedImage", None)
        return data


spring_client = SpringClient()
