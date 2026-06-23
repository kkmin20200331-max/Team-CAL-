from pydantic import BaseModel, Field


class DocumentOcrRequest(BaseModel):
    file_id: str
    file_type: str
    file_url: str
    original_name: str | None = None


class DocumentOcrResponse(BaseModel):
    file_id: str
    ocr_status: str = "COMPLETED"
    status: str = "PENDING"
    expiry_date: str | None = None
    notes: str | None = None
    extracted_data: dict[str, str] = Field(default_factory=dict)
