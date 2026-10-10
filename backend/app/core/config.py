import os

class Settings:
    PROJECT_NAME: str = "UrbanPulse API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./urbanpulse.db")
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./data_uploads")
    SAMPLE_DATA_DIR: str = os.getenv("SAMPLE_DATA_DIR", "./app/sample_data")
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]
    MAX_UPLOAD_SIZE_MB: int = 50

settings = Settings()
