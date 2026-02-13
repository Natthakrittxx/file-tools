from pathlib import Path

from pydantic_settings import BaseSettings

_env_file = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    supabase_url: str
    supabase_key: str
    supabase_service_role_key: str
    supabase_bucket: str = "file-conversions"
    max_upload_bytes: int = 50 * 1024 * 1024  # 50MB
    allowed_origins: list[str] = ["http://localhost:3000"]
    temp_dir: str = "/tmp/file-conversions"

    model_config = {"env_file": str(_env_file), "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
