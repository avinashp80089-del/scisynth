from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    database_path: str = "./scisynth.db"
    arxiv_base_url: str = "http://export.arxiv.org/api/query"
    max_papers_per_search: int = 20

    model_config = {"env_file": ".env"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
