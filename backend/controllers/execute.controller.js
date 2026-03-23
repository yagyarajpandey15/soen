import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { prisma } from '../db/db.js';

// ── Constants ────────────────────────────────────────────────
const TIMEOUT_MS = 5000;
const MAX_CODE_LENGTH = 10000;
const MAX_OUTPUT_LENGTH = 5000;

const LANGUAGE_CONFIG = {
    javascript: { filename: 'code.js',  runner: 'node'    },
    python:     { filename: 'code.py',  runner: 'python3' }
};

// Extended security: block dangerous patterns
const BLOCKED_PATTERNS = [
    /require\s*\(\s*['"`]fs['"`]\s*\)/,
    /require\s*\(\s*['"`]child_process['"`]\s*\)/,
    /require\s*\(\s*['"`]net['"`]\s*\)/,
    /require\s*\(\s*['"`]http['"`]\s*\)/,
    /require\s*\(\s*['"`]https['"`]\s*\)/,
    /process\s*\.\s*exit/,
    /process\s*\.\s*env/,
    /while\s*\(\s*true\s*\)/,
    /import\s+.*\s+from\s+['"`]fs['"`]/,
    /import\s+.*\s+from\s+['"`]child_process['"`]/,
    /__dirname/,
    /__filename/,
    /\beval\s*\(/,
    /\bFunction\s*\(/,
    /\bsetInterval\s*\(/,
    /\bsetTimeout\s*\(/,
];

// ── Helpers ──────────────────────────────────────────────────

function cleanup(dir) {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
}

function truncate(str) {
    if (!str) return str;
    if (str.length <= MAX_OUTPUT_LENGTH) return str;
    return str.slice(0, MAX_OUTPUT_LENGTH) + '\n...output truncated';
}

function isSafe(code) {
    return !BLOCKED_PATTERNS.some(p => p.test(code));
}

// ── Core spawn executor ──────────────────────────────────────

function spawnExecute(filePath, runner) {
    return new Promise((resolve) => {
        let stdout = '';
        let stderr = '';
        let timedOut = false;

        const child = spawn(runner, [filePath], {
            env: { PATH: process.env.PATH } // minimal env — no secrets exposed
        });

        const timer = setTimeout(() => {
            timedOut = true;
            child.kill('SIGKILL');
        }, TIMEOUT_MS);

        child.stdout.on('data', (d) => { stdout += d.toString(); });
        child.stderr.on('data', (d) => { stderr += d.toString(); });

        child.on('close', () => {
            clearTimeout(timer);
            if (timedOut) {
                return resolve({ success: false, output: null, error: '⏱️ Execution timed out (5s limit)' });
            }
            if (stderr && !stdout) {
                return resolve({ success: false, output: null, error: truncate(stderr.trim()) });
            }
            return resolve({ success: true, output: truncate((stdout || '(no output)').trim()), error: null });
        });

        child.on('error', (err) => {
            clearTimeout(timer);
            resolve({ success: false, output: null, error: `Spawn error: ${err.message}` });
        });
    });
}

// ── Save execution to DB (non-blocking) ─────────────────────

async function saveHistory(userId, code, language, result, executionTime) {
    try {
        await prisma.execution.create({
            data: {
                userId,
                code,
                language,
                output: result.output ?? null,
                error: result.error ?? null,
                executionTime
            }
        });
    } catch (err) {
        console.error('Failed to save execution history:', err.message);
    }
}

// ── Controllers ──────────────────────────────────────────────

/**
 * POST /execute/run
 * Body: { code: string, language?: 'javascript' | 'python' }
 */
export const runCode = async (req, res) => {
    const { code, language = 'javascript' } = req.body;

    if (!code || typeof code !== 'string' || !code.trim())
        return res.status(400).json({ success: false, output: null, error: 'Code is required.', executionTime: 0 });

    if (code.length > MAX_CODE_LENGTH)
        return res.status(400).json({ success: false, output: null, error: `Code exceeds ${MAX_CODE_LENGTH} character limit.`, executionTime: 0 });

    const config = LANGUAGE_CONFIG[language];
    if (!config)
        return res.status(400).json({ success: false, output: null, error: `Unsupported language: "${language}". Use: javascript, python`, executionTime: 0 });

    if (!isSafe(code))
        return res.status(400).json({ success: false, output: null, error: '🚫 Unsafe code detected. Restricted patterns are not allowed.', executionTime: 0 });

    const jobId = uuidv4();
    const tempDir = path.join(os.tmpdir(), 'collabai', jobId);
    const filePath = path.join(tempDir, config.filename);
    const startTime = Date.now();

    try {
        fs.mkdirSync(tempDir, { recursive: true });
        fs.writeFileSync(filePath, code, 'utf8');

        const result = await spawnExecute(filePath, config.runner);
        const executionTime = Date.now() - startTime;

        // Save to history (fire and forget — don't block response)
        if (req.user?.id) {
            saveHistory(req.user.id, code, language, result, executionTime);
        }

        return res.status(200).json({ ...result, executionTime });

    } catch (err) {
        console.error('Execute controller error:', err.message);
        return res.status(500).json({ success: false, output: null, error: 'Internal server error.', executionTime: 0 });
    } finally {
        cleanup(tempDir);
    }
};

/**
 * GET /execute/history
 * Returns last 10 executions for the logged-in user
 */
export const getHistory = async (req, res) => {
    try {
        const executions = await prisma.execution.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
                id: true,
                language: true,
                code: true,
                output: true,
                error: true,
                executionTime: true,
                createdAt: true
            }
        });
        return res.status(200).json({ executions });
    } catch (err) {
        console.error('History fetch error:', err.message);
        return res.status(500).json({ error: 'Failed to fetch history.' });
    }
};
