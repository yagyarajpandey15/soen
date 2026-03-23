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
    python:     { filename: 'code.py',  runner: 'python3' },
    html:       null  // HTML is never executed — returned as-is for browser rendering
};

/**
 * Detect language from code content.
 * Client hint is ALWAYS trusted for javascript/python.
 * HTML is only returned when code literally starts with a doctype or <html.
 * This function NEVER returns 'html' if hint is 'javascript' or 'python'.
 */
function detectLanguage(code, hint) {
    const trimmed = code.trim();
    const lower = trimmed.toLowerCase();

    // If client explicitly says js or python — trust it, no override
    if (hint === 'javascript') return 'javascript';
    if (hint === 'python') return 'python';

    // HTML only when code literally starts with doctype or <html
    if (lower.startsWith('<!doctype html') || lower.startsWith('<html')) return 'html';

    // Fallback auto-detect for Python
    if (/^\s*(#|def |print\s*\(|import |from \w+ import|for |while |if |class )/m.test(trimmed)) return 'python';

    return 'javascript';
}

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

function spawnExecute(filePath, runner, stdin = '') {
    return new Promise((resolve) => {
        let stdout = '';
        let stderr = '';
        let timedOut = false;

        const child = spawn(runner, [filePath], {
            env: { PATH: process.env.PATH } // minimal env — no secrets exposed
        });

        // Pipe stdin input if provided (supports Python input(), JS prompt shim, etc.)
        if (stdin && stdin.trim()) {
            child.stdin.write(stdin);
        }
        child.stdin.end();

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
            // Show stderr alongside stdout if both exist (warnings + output)
            if (stderr && !stdout) {
                return resolve({ success: false, output: null, error: truncate(stderr.trim()) });
            }
            const combinedOutput = stdout + (stderr ? `\n[stderr]: ${stderr.trim()}` : '');
            return resolve({ success: true, output: truncate((combinedOutput || '(no output)').trim()), error: null });
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
 * Body: { code: string, language?: 'javascript' | 'python' | 'html', input?: string }
 */
export const runCode = async (req, res) => {
    const { code, language: langHint, input = '' } = req.body;

    if (!code || typeof code !== 'string' || !code.trim())
        return res.status(400).json({ success: false, output: null, html: null, error: 'Code is required.', executionTime: 0 });

    if (code.length > MAX_CODE_LENGTH)
        return res.status(400).json({ success: false, output: null, html: null, error: `Code exceeds ${MAX_CODE_LENGTH} character limit.`, executionTime: 0 });

    // Auto-detect language (overrides hint if HTML is detected in code)
    const language = detectLanguage(code, langHint);

    // ── HTML: return as-is for browser rendering ──────────────
    if (language === 'html') {
        return res.status(200).json({
            success: true,
            output: null,
            html: code,
            error: null,
            executionTime: 0,
            language: 'html'
        });
    }

    const config = LANGUAGE_CONFIG[language];
    // Safety net: if language resolved to something unexpected, default to javascript
    if (!config) {
        return res.status(400).json({
            success: false, output: null, html: null,
            error: `Unsupported language: "${language}". Supported: javascript, python, html`,
            executionTime: 0
        });
    }

    if (!isSafe(code))
        return res.status(400).json({ success: false, output: null, html: null, error: '🚫 Unsafe code detected. Restricted patterns are not allowed.', executionTime: 0 });

    // Inject prompt() shim for JavaScript so code using it doesn't crash Node
    // The shim reads line-by-line from the input provided by the user
    let codeToWrite = code;
    if (language === 'javascript') {
        // If code uses prompt() but no input was provided, return a helpful error
        if (code.includes('prompt(') && (!input || !input.trim())) {
            return res.status(400).json({
                success: false,
                output: null,
                html: null,
                error: '⚠️ This code uses prompt() for input.\n\nClick the "Input" button and enter your values (one per line).\n\nExample:\n5\n10',
                executionTime: 0
            });
        }

        const lines = input ? input.split('\n').map(l => l.trim()).filter(l => l !== '') : [];
        const promptShim =
            `const _inputLines = ${JSON.stringify(lines)};\n` +
            `let _inputIdx = 0;\n` +
            `const prompt = (msg) => {\n` +
            `  const val = _inputLines[_inputIdx++] ?? '';\n` +
            `  if (msg) console.log(String(msg) + val);\n` +
            `  return val;\n` +
            `};\n\n`;
        codeToWrite = promptShim + code;
    }

    const jobId = uuidv4();
    const tempDir = path.join(os.tmpdir(), 'collabai', jobId);
    const filePath = path.join(tempDir, config.filename);
    const startTime = Date.now();

    try {
        fs.mkdirSync(tempDir, { recursive: true });
        fs.writeFileSync(filePath, codeToWrite, 'utf8');

        const result = await spawnExecute(filePath, config.runner, input);
        const executionTime = Date.now() - startTime;

        // Save to history (fire and forget — don't block response)
        if (req.user?.id) {
            saveHistory(req.user.id, code, language, result, executionTime);
        }

        return res.status(200).json({ ...result, html: null, executionTime, language });

    } catch (err) {
        console.error('Execute controller error:', err.message);
        return res.status(500).json({ success: false, output: null, html: null, error: 'Internal server error.', executionTime: 0 });
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
