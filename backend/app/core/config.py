from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    app_env: str = "development"
    secret_key: str = "insecure-dev-key-replace-me"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080

    # Database
    database_url: str = "sqlite:///./stockies.db"

    # CORS
    cors_origins: str = "http://localhost:5173"

    # Providers
    stock_data_provider: str = "yfinance"
    stock_api_key: str = ""
    mf_data_provider: str = "mfapi"
    mf_api_key: str = ""

    # Cache TTLs (seconds)
    cache_quote_ttl_seconds: int = 300
    cache_fundamentals_ttl_seconds: int = 3600
    cache_history_ttl_seconds: int = 86400
    cache_nav_ttl_seconds: int = 86400

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def is_development(self) -> bool:
        return self.app_env.lower() == "development"


settings = Settings()
