from app.vision.person_detector import DetectionResult


def to_customer_count(result: DetectionResult) -> int:
    return result.customer_count
