import express from 'express';
import multer from 'multer';
import { uploadSingleImage } from '../controllers/uploadController';
import { protect } from '../middleware/auth';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.use(protect);

router.post('/image', upload.single('image'), uploadSingleImage);

export default router;
