from pydantic import Field
from pydantic_settings import SettingsConfigDict

from backend_common.settings import BaseServiceSettings


class Settings(BaseServiceSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    service_name: str = Field(default="astro-api", alias="SERVICE_NAME")
    astro_api_port: int = Field(default=8100, alias="ASTRO_API_PORT")


settings = Settings()
