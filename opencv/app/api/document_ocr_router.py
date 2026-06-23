from fastapi import APIRouter, HTTPException, Request

from app.schemas.document_ocr import DocumentOcrRequest, DocumentOcrResponse
from app.services.document_ocr_service import document_ocr_service

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/ocr", response_model=DocumentOcrResponse)
async def extract_document(request: Request):
    try:
        payload = await _read_payload(request)
        return document_ocr_service.extract(payload)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"document OCR failed: {exc}") from exc


async def _read_payload(request: Request) -> DocumentOcrRequest:
    body = await request.body()
    if body:
        try:
            return DocumentOcrRequest.model_validate_json(body)
        except Exception:
            pass

    params = request.query_params
    if params.get("file_id") and params.get("file_type") and params.get("file_url"):
        return DocumentOcrRequest(
            file_id=params["file_id"],
            file_type=params["file_type"],
            file_url=params["file_url"],
            original_name=params.get("original_name"),
        )

    raise ValueError("OCR request requires file_id, file_type, and file_url")
