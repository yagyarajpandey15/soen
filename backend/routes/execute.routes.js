import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { runCode, getHistory } from '../controllers/execute.controller.js';
import { authUser } from '../middleware/auth.middleware.js';

const router = Router();

const executeLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, output: null, error: '⚠️ Too many requests. Max 10 executions per minute.', executionTime: 0 }
});

router.post('/run',     executeLimiter, authUser, runCode);
router.get('/history',  authUser, getHistory);

export default router;
