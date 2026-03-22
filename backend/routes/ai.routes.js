import { Router } from 'express';
import * as aiController from '../controllers/ai.controller.js';
const router = Router();

router.get('/get-result', aiController.getResult);
router.get('/test', aiController.testAI);

export default router;
