import re
import time
from datetime import date, timedelta
from uuid import uuid4

import httpx

from app.core.config import settings
from app.schemas.document_ocr import DocumentOcrRequest, DocumentOcrResponse


class DocumentOcrService:
    def extract(self, request: DocumentOcrRequest) -> DocumentOcrResponse:
        if settings.naver_ocr_invoke_url and settings.naver_ocr_secret:
            extracted = self._extract_with_naver(request)
            notes = self._notes(request.file_type, naver_used=True)
        else:
            extracted = self._extract_fallback(request)
            notes = self._notes(request.file_type, naver_used=False)

        return DocumentOcrResponse(
            file_id=request.file_id,
            ocr_status="COMPLETED",
            status="PENDING",
            expiry_date=extracted.get("expiryDate"),
            notes=notes,
            extracted_data=extracted,
        )

    def _extract_with_naver(self, request: DocumentOcrRequest) -> dict[str, str]:
        payload = {
            "version": "V2",
            "requestId": str(uuid4()),
            "timestamp": int(time.time() * 1000),
            "lang": "ko",
            "images": [
                {
                    "format": self._format(request.original_name),
                    "name": request.file_id,
                    "url": request.file_url,
                }
            ],
        }

        with httpx.Client(timeout=settings.naver_ocr_timeout_sec) as client:
            response = client.post(
                settings.naver_ocr_invoke_url,
                headers={
                    "Content-Type": "application/json",
                    "X-OCR-SECRET": settings.naver_ocr_secret,
                },
                json=payload,
            )
            response.raise_for_status()

        result = response.json()
        raw_text = self._raw_text(result)
        extracted = self._extract_fields(request, raw_text)
        extracted["rawText"] = raw_text
        extracted["fileName"] = request.original_name or ""
        return extracted

    def _raw_text(self, result: dict) -> str:
        lines: list[str] = []
        for image in result.get("images", []):
            for field in image.get("fields", []):
                text = field.get("inferText")
                if text:
                    lines.append(str(text))
        return "\n".join(lines)

    def _extract_fields(self, request: DocumentOcrRequest, raw_text: str) -> dict[str, str]:
        file_type = (request.file_type or "").upper()
        extracted: dict[str, str] = {}

        name = self._find_name(raw_text) or self._name_hint(request.original_name)
        if name:
            extracted["name"] = name

        dates = self._find_dates(raw_text)
        if dates:
            extracted["issueDate"] = dates[0]
        if len(dates) > 1:
            extracted["expiryDate"] = dates[-1]

        if file_type == "HEALTH_CERT":
            certificate_number = self._match(raw_text, r"(?:증번호|번호|No\.?)\s*[:：]?\s*([A-Za-z0-9\-]{4,})")
            if certificate_number:
                extracted["certificateNumber"] = certificate_number
        elif file_type == "CONTRACT":
            start_date = self._match(raw_text, r"(?:근로개시일|계약기간|시작일)\s*[:：]?\s*(\d{4}[.\-/년]\s*\d{1,2}[.\-/월]\s*\d{1,2})")
            if start_date:
                extracted["startDate"] = self._normalize_date(start_date)
            position = self._match(raw_text, r"(?:직무|담당업무|직책)\s*[:：]?\s*([^\n]+)")
            if position:
                extracted["position"] = position.strip()
        elif file_type == "ID_CARD":
            id_number = self._match(raw_text, r"(\d{6}\s*[-]\s*[1-4]\*{6}|\d{6}\s*[-]\s*[1-4]\d{6})")
            if id_number:
                extracted["idNumber"] = id_number.replace(" ", "")
        elif file_type == "BANK_ACCOUNT":
            account = self._match(raw_text, r"(\d{2,6}[-\s]\d{2,6}[-\s]\d{2,8})")
            if account:
                extracted["accountNumber"] = account.replace(" ", "")

        return extracted

    def _extract_fallback(self, request: DocumentOcrRequest) -> dict[str, str]:
        name_hint = self._name_hint(request.original_name)
        file_type = (request.file_type or "").upper()
        extracted = {
            "fileName": request.original_name or "",
            "ocrProvider": "fallback",
        }
        if name_hint:
            extracted["name"] = name_hint

        if file_type == "HEALTH_CERT":
            today = date.today()
            extracted["issueDate"] = today.isoformat()
            extracted["expiryDate"] = (today + timedelta(days=365)).isoformat()
            extracted["certificateNumber"] = "OCR_REVIEW_REQUIRED"
        elif file_type == "CONTRACT":
            extracted["startDate"] = date.today().isoformat()
            extracted["position"] = "OCR_REVIEW_REQUIRED"
        elif file_type == "ID_CARD":
            extracted["idNumber"] = "OCR_REVIEW_REQUIRED"
        elif file_type == "BANK_ACCOUNT":
            extracted["accountNumber"] = "OCR_REVIEW_REQUIRED"

        return extracted

    def _format(self, original_name: str | None) -> str:
        if not original_name or "." not in original_name:
            return "jpg"
        extension = original_name.rsplit(".", 1)[1].lower()
        if extension == "jpeg":
            return "jpg"
        if extension in {"jpg", "png", "pdf", "tiff"}:
            return extension
        return "jpg"

    def _find_name(self, raw_text: str) -> str | None:
        return self._match(raw_text, r"(?:성명|이름|Name)\s*[:：]?\s*([가-힣A-Za-z]{2,20})")

    def _find_dates(self, raw_text: str) -> list[str]:
        candidates = re.findall(r"\d{4}[.\-/년]\s*\d{1,2}[.\-/월]\s*\d{1,2}", raw_text)
        normalized: list[str] = []
        for candidate in candidates:
            value = self._normalize_date(candidate)
            if value and value not in normalized:
                normalized.append(value)
        return normalized

    def _normalize_date(self, value: str) -> str:
        numbers = re.findall(r"\d+", value)
        if len(numbers) < 3:
            return ""
        year, month, day = numbers[:3]
        return f"{int(year):04d}-{int(month):02d}-{int(day):02d}"

    def _match(self, text: str, pattern: str) -> str | None:
        match = re.search(pattern, text, flags=re.I)
        return match.group(1).strip() if match else None

    def _name_hint(self, original_name: str | None) -> str | None:
        if not original_name:
            return None
        stem = original_name.rsplit(".", 1)[0]
        cleaned = re.sub(r"[_\-]+", " ", stem)
        cleaned = re.sub(
            r"(보건증|근로계약서|계약서|신분증|통장사본|health|contract|id|bank)",
            "",
            cleaned,
            flags=re.I,
        )
        cleaned = cleaned.strip()
        return cleaned or None

    def _notes(self, file_type: str, naver_used: bool) -> str:
        label = {
            "HEALTH_CERT": "보건증",
            "CONTRACT": "근로계약서",
            "ID_CARD": "신분증",
            "BANK_ACCOUNT": "통장사본",
        }.get((file_type or "").upper(), "문서")
        provider = "네이버 OCR" if naver_used else "fallback OCR"
        return f"{label}을 {provider}로 처리했습니다. 추출값은 관리자가 최종 확인해야 합니다."


document_ocr_service = DocumentOcrService()
