from pydantic_settings import BaseSettings
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "Social Kind AI Service"
    API_V1_STR: str = "/api/v1"
    
    # AI Model Settings
    MODEL_DIR: str = os.path.join(os.getcwd(), "models")
    
    # Image Verification Thresholds
    CONFIDENCE_THRESHOLD: float = 0.85
    MANIPULATION_THRESHOLD: float = 0.5
    
    # External APIs (if any)
    GOOGLE_CLOUD_STORAGE_BUCKET: str = os.getenv("GCS_BUCKET", "")
    
    class Config:
        case_sensitive = True

settings = Settings()
