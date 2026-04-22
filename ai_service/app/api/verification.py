from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.image_service import ImageVerificationService
import os
import shutil
import uuid

router = APIRouter()

@router.post("/verify")
async def verify_image(file: UploadFile = File(...)):
    # Save file temporarily
    file_id = str(uuid.uuid4())
    temp_path = f"temp_{file_id}_{file.filename}"
    output_path = f"processed_{file_id}_{file.filename}"
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 1. ELA Analysis
        manipulation_score = ImageVerificationService.perform_ela(temp_path)
        
        # 2. EXIF Data
        exif_data = ImageVerificationService.extract_exif(temp_path)
        
        # 3. Image Hashes
        hashes = ImageVerificationService.get_image_hashes(temp_path)
        
        # 4. Privacy: Blur Faces
        faces_count = ImageVerificationService.detect_faces_and_blur(temp_path, output_path)
        
        # 5. Object Detection
        detected_objects = ImageVerificationService.detect_objects(temp_path)
        
        # 6. Deepfake Detection
        deepfake_score = ImageVerificationService.detect_deepfake(temp_path)
        
        # logic for overall confidence
        confidence = 1.0 - (max(manipulation_score, deepfake_score) * 0.5) 
        
        status = "passed" if confidence > 0.85 else "failed"
        if manipulation_score > 0.4 or deepfake_score > 0.4:
            status = "needs_manual_review"
            
        return {
            "status": status,
            "confidence": confidence,
            "manipulation_score": manipulation_score,
            "deepfake_score": deepfake_score,
            "exif": exif_data,
            "hashes": hashes,
            "faces_detected": faces_count,
            "objects_detected": detected_objects,
            "report": {
                "ai_generated": deepfake_score > 0.5, 
                "tampered": manipulation_score > 0.3,
                "metadata_present": len(exif_data) > 0,
                "relevant_objects": len(detected_objects) > 0
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup
        if os.path.exists(temp_path):
            os.remove(temp_path)
        # In a real app, output_path would be uploaded to S3
        if os.path.exists(output_path):
             os.remove(output_path)

@router.post("/verify-url")
async def verify_image_url(image_url: str):  # Expect simple body or query? Better json body.
    return { "status": "passed", "confidence": 0.95, "manipulation_score": 0.05, "exif": {}, "hashes": {}, "faces_detected": 1 }

# Actually, I should implement real download logic if possible, but for MVP, I'll stick to updating the controller to use the existing mock-like verify or implement a real one later.
# Let's stick to Node calling Python.
# I'll add `from pydantic import BaseModel` and define request body.

from pydantic import BaseModel

class VerifyUrlRequest(BaseModel):
    image_url: str

@router.post("/verify-url")
async def verify_image_url(request: VerifyUrlRequest):
    import httpx
    
    file_id = str(uuid.uuid4())
    temp_path = f"temp_url_{file_id}.jpg"
    output_path = f"processed_url_{file_id}.jpg"
    
    try:
        # 1. Download image
        async with httpx.AsyncClient() as client:
            resp = await client.get(request.image_url)
            if resp.status_code != 200:
                raise HTTPException(status_code=400, detail="Could not download image")
            with open(temp_path, "wb") as f:
                f.write(resp.content)
        
        # 2. Re-use logic from verify_image
        manipulation_score = ImageVerificationService.perform_ela(temp_path)
        exif_data = ImageVerificationService.extract_exif(temp_path)
        hashes = ImageVerificationService.get_image_hashes(temp_path)
        faces_count = ImageVerificationService.detect_faces_and_blur(temp_path, output_path)
        detected_objects = ImageVerificationService.detect_objects(temp_path)
        deepfake_score = ImageVerificationService.detect_deepfake(temp_path)
        
        confidence = 1.0 - (max(manipulation_score, deepfake_score) * 0.5)
        status = "passed" if confidence > 0.85 else "failed"
        if manipulation_score > 0.4 or deepfake_score > 0.4:
            status = "needs_manual_review"
            
        return {
            "status": status,
            "confidence": confidence,
            "manipulation_score": manipulation_score,
            "deepfake_score": deepfake_score,
            "exif": exif_data,
            "hashes": hashes,
            "faces_detected": faces_count,
            "objects_detected": detected_objects,
            "report": {
                "ai_generated": deepfake_score > 0.5,
                "tampered": manipulation_score > 0.3,
                "metadata_present": len(exif_data) > 0,
                "relevant_objects": len(detected_objects) > 0
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        if os.path.exists(output_path):
            os.remove(output_path)
