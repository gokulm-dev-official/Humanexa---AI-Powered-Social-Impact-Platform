from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.api import verification

app = FastAPI(
    title="HUMANEXA AI Verification Service",
    description="Microservice for image verification, fraud detection, and privacy protection",
    version="1.0.0"
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(verification.router, prefix="/api/v1/verification", tags=["Verification"])

@app.get("/")
async def root():
    return {"status": "success", "message": "HUMANEXA AI Service is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
