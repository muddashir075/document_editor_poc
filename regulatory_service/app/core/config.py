import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./regulatory.db"
    SECRET_KEY: str = "changeme"
    APP_TITLE: str = "Regulatory Service"
    APP_VERSION: str = "1.0.0"
    # CORS origins (comma-separated)
    ALLOWED_ORIGINS: str = "*"

    # Media / file storage
    # Absolute path to the folder where uploaded documents are stored.
    # In development this resolves to the doc_media symlink inside regulatory_service/
    # which points to D:\doc_media on Windows.
    MEDIA_ROOT: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "doc_media")
    # URL prefix used to serve files (mounted as /media in main.py)
    MEDIA_URL: str = "/media"

    class Config:
        env_file = ".env"


settings = Settings()
