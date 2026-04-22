import cv2
import numpy as np
from PIL import Image, ImageChops, ImageEnhance
import os
import exifread
import imagehash
from datetime import datetime
from ultralytics import YOLO

class ImageVerificationService:
    @staticmethod
    def perform_ela(image_path: str, quality: int = 90):
        """
        Error Level Analysis (ELA) to detect manipulation.
        """
        temp_file = "temp_ela.jpg"
        img = Image.open(image_path).convert('RGB')
        
        # Save at lower quality
        img.save(temp_file, 'JPEG', quality=quality)
        temp_img = Image.open(temp_file)
        
        # Calculate difference
        ela_img = ImageChops.difference(img, temp_img)
        
        # Enhance for visibility
        extrema = ela_img.getextrema()
        max_diff = max([ex[1] for ex in extrema])
        if max_diff == 0:
            max_diff = 1
        scale = 255.0 / max_diff
        
        ela_img = ImageEnhance.Brightness(ela_img).enhance(scale)
        
        # Statistical analysis
        stat = np.array(ela_img).mean()
        if os.path.exists(temp_file):
            os.remove(temp_file)
        
        return stat / 255.0

    @staticmethod
    def extract_exif(image_path: str):
        with open(image_path, 'rb') as f:
            tags = exifread.process_file(f)
            
        data = {}
        if 'Image DateTime' in tags:
            data['timestamp'] = str(tags['Image DateTime'])
        
        if 'GPS GPSLatitude' in tags and 'GPS GPSLongitude' in tags:
            data['gps'] = {
                'lat': str(tags['GPS GPSLatitude']),
                'lng': str(tags['GPS GPSLongitude'])
            }
        return data

    @staticmethod
    def get_image_hashes(image_path: str):
        img = Image.open(image_path)
        return {
            'phash': str(imagehash.phash(img)),
            'ahash': str(imagehash.average_hash(img))
        }

    @staticmethod
    def detect_faces_and_blur(image_path: str, output_path: str):
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        img = cv2.imread(image_path)
        if img is None:
            return 0
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        
        for (x, y, w, h) in faces:
            roi = img[y:y+h, x:x+w]
            roi = cv2.GaussianBlur(roi, (99, 99), 30)
            img[y:y+h, x:x+w] = roi
            
        cv2.imwrite(output_path, img)
        return len(faces)

    @staticmethod
    def detect_objects(image_path: str):
        """
        Use YOLOv8 to detect relevant objects (food, medicine, people).
        """
        try:
            model = YOLO('yolov8n.pt') # Lightweight model
            results = model(image_path)
            
            detected = []
            for result in results:
                for box in result.boxes:
                    cls = int(box.cls[0])
                    name = model.names[cls]
                    conf = float(box.conf[0])
                    if conf > 0.3:
                        detected.append({"object": name, "confidence": conf})
            
            return detected
        except Exception as e:
            print(f"Object Detection Error: {e}")
            return []

    @staticmethod
    def detect_deepfake(image_path: str):
        """
        Analyze image for deepfake/AI generation characteristics.
        Uses Laplacian variance to check for unnaturally smooth textures 
        common in synthesized faces.
        """
        img = cv2.imread(image_path)
        if img is None:
            return 0.0
            
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Laplacian variance (blurriness/texture check)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        # AI generated images often have specific noise patterns or 
        # unnatural smoothness (low variance) in certain patches.
        # We'll normalize this into a 'Deepfake Probability' score.
        # Thresholds are tuned for demo: low variance (< 100) on a 1080p scale 
        # often indicates high manipulation or blur.
        
        score = 0.0
        if laplacian_var < 50:
            score = 0.8 # High probability
        elif laplacian_var < 100:
            score = 0.5 # Medium probability
        elif laplacian_var < 200:
            score = 0.2 # Low probability
        
        return float(score)
