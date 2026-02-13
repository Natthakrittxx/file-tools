from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str
    supabase_key: str
    supabase_bucket: str = "file-conversions"
    max_upload_bytes: int = 50 * 1024 * 1024  # 50MB
    allowed_origins: list[str] = ["http://localhost:3000"]
    temp_dir: str = "/tmp/file-conversions"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
