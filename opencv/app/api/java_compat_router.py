from fastapi import APIRouter

from app.core.state import inference_state

router = APIRouter(tags=["java-compat"])


@router.post("/analyze/opencv")
def analyze_opencv_for_java():
    aggregate = inference_state.aggregate_latest()
    if aggregate is None:
        return {
            "available": False,
            "aggregate": None,
        }

    return {
        "available": True,
        "aggregate": {
            "cameraId": aggregate.cameraId,
            "measuredAt": aggregate.measuredAt,
            "lastCustomerCount": aggregate.lastCustomerCount,
            "status": aggregate.status,
        },
    }
