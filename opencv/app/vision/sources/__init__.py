from app.schemas.request import SourceType
from app.vision.sources.base import VideoSource
from app.vision.sources.file_video_source import FileVideoSource
from app.vision.sources.stream_video_source import StreamVideoSource


def create_video_source(source: str, source_type: SourceType) -> VideoSource:
    if source_type == SourceType.VIDEO_FILE:
        return FileVideoSource(source)
    return StreamVideoSource(source, source_type)
