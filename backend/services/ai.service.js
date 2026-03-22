import OpenAI from 'openai';

let openai = null;

const getOpenAI = () => {
    if (openai) return openai;
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
        console.warn('⚠️ OPENAI_API_KEY not found in environment variables');
        return null;
    }
    openai = new OpenAI({ apiKey: key });
    console.log('✅ OpenAI initialized successfully');
    return openai;
};

const systemInstruction = `You are a senior software engineer and expert full-stack developer running inside a WebContainer browser sandbox.

RESPONSE FORMAT — always return valid JSON:
For code requests:
{
  "text": "<clear explanation of what you built>",
  "fileTree": {
    "filename.ext": { "file": { "contents": "<actual file contents>" } }
  },
  "buildCommand": { "mainItem": "npm", "commands": ["install"] },
  "startCommand": { "mainItem": "npm", "commands": ["start"] }
}
For general questions: { "text": "<your actual answer>" }

CODE QUALITY RULES (non-negotiable):

UI & INTERACTIONS:
- NEVER use alert(), confirm(), or prompt() — they block the browser
- Always use DOM overlays, modals, or on-screen elements for messages
- Game over / win states must use HTML/CSS overlays with a restart button

GAME & LOOP SAFETY:
- Always use a gameOver boolean flag to guard all game logic
- Always call clearInterval() or cancelAnimationFrame() before setting gameOver = true
- Pattern to follow:
  let gameOver = false;
  let loopId = null;
  function endGame(msg) {
    if (gameOver) return;
    gameOver = true;
    cancelAnimationFrame(loopId);
    showOverlay(msg);
  }

PERFORMANCE:
- No memory leaks — always clean up intervals, listeners, and animation frames
- Avoid unnecessary DOM queries inside loops — cache elements in variables
- Use requestAnimationFrame for animations, not setInterval
- Debounce resize/scroll event listeners

CODE STRUCTURE:
- Use const/let, never var
- Use descriptive variable and function names
- Separate concerns — keep logic, rendering, and state clearly divided
- Handle all edge cases and null checks

HTML/CSS/JS PROJECTS (no package.json):
- Single self-contained index.html with <style> and <script> inline
- No ES module imports/exports in plain HTML files
- No external file references unless included in fileTree

NODE/REACT PROJECTS:
- Always include complete package.json with correct scripts
- Vite projects: "dev": "vite"
- Plain Node: "start": "node index.js"
- React projects must include all required dependencies

JSON ESCAPING in fileTree contents:
- Newlines → \\n
- Quotes → \\"
- Backslashes → \\\\

NEVER write placeholder text. Always write complete, working, production-ready code.
Do not wrap response in markdown code blocks.`;

// Strip any bad patterns that slip through
const sanitizeCode = (content) => {
    if (!content) return content;
    return content
        .replace(/\balert\s*\(/g, '// [removed alert](')
        .replace(/\bconfirm\s*\(/g, '// [removed confirm](')
        .replace(/\bprompt\s*\(/g, '// [removed prompt](')
        .replace(/document\.location\.reload\s*\(\)/g, '// [removed reload]')
        .replace(/window\.location\.reload\s*\(\)/g, '// [removed reload]');
};

// Sanitize all file contents in a parsed response
const sanitizeResponse = (parsed) => {
    if (!parsed?.fileTree) return parsed;
    for (const key of Object.keys(parsed.fileTree)) {
        const contents = parsed.fileTree[key]?.file?.contents;
        if (typeof contents === 'string') {
            parsed.fileTree[key].file.contents = sanitizeCode(contents);
        }
    }
    return parsed;
};

export const generateResult = async (prompt) => {
    try {
        const client = getOpenAI();
        if (!client) {
            throw new Error('OpenAI not initialized - check OPENAI_API_KEY');
        }

        console.log('🤖 AI prompt:', prompt);
        const startTime = Date.now();

        // Enhance the user prompt to enforce quality
        const enhancedPrompt = `${String(prompt ?? '')}

Requirements for your response:
- Production-quality, optimized code only
- No alert(), confirm(), or prompt() — use UI overlays instead
- Clean structure with proper variable names
- Handle all edge cases
- No memory leaks or unnecessary re-renders`;

        const response = await Promise.race([
            client.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemInstruction },
                    { role: 'user', content: enhancedPrompt },
                ],
                temperature: 0.7,
                max_tokens: 4096,
                response_format: { type: 'json_object' },
            }),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout after 60s')), 60000)
            )
        ]);

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        const raw = response.choices?.[0]?.message?.content;
        console.log(`✅ AI response in ${elapsed}s`);
        console.log('📄 Preview:', raw?.slice(0, 200));

        if (typeof raw !== 'string' || !raw.trim()) {
            throw new Error('Empty response from model');
        }

        // Parse, sanitize bad patterns, return clean JSON
        try {
            const parsed = JSON.parse(raw);
            const sanitized = sanitizeResponse(parsed);
            return JSON.stringify(sanitized);
        } catch {
            // If not valid JSON, sanitize as plain text and return
            return JSON.stringify({ text: sanitizeCode(raw) });
        }

    } catch (error) {
        const msg = error.message || '';
        console.error('❌ OpenAI Error:', msg);

        if (error.status === 429 || msg.includes('429') || msg.includes('Rate limit')) {
            return JSON.stringify({ text: '⚠️ OpenAI rate limit reached. Please wait a moment and try again.' });
        }
        if (error.status === 401 || msg.includes('401') || msg.includes('Incorrect API key')) {
            return JSON.stringify({ text: '❌ Invalid OpenAI API key. Please check OPENAI_API_KEY in backend/.env' });
        }
        if (error.status === 402 || msg.includes('insufficient_quota')) {
            return JSON.stringify({ text: '⚠️ OpenAI quota exceeded. Please check your billing at platform.openai.com' });
        }

        return JSON.stringify({ text: `❌ AI Error: ${msg}` });
    }
};
