/**
 * AI Routes — All AI agent endpoints
 */
import { Router } from 'express';
import { aiController } from '../controllers/aiController';

const router = Router();

// Full AI pipeline
router.post('/process', aiController.processRequest);

// Quick text analysis
router.post('/analyze', aiController.analyzeDescription);

// Priority & emotion detection
router.post('/priority', aiController.detectPriority);

// Trust score
router.get('/trust-score/:userId', aiController.getTrustScore);

// Matching
router.post('/match', aiController.findMatches);

// Prediction
router.post('/predict', aiController.predict);

// Story generation
router.post('/story', aiController.generateStory);

// Chat assistant
router.post('/chat', aiController.chat);

// AI Dashboard insights
router.get('/insights', aiController.getInsights);

export default router;
