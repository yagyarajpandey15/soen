import * as ai from '../services/ai.service.js';


export const getResult = async (req, res) => {
    try {
        const { prompt } = req.query;
        const cleanPrompt = String(prompt ?? '').trim();

        console.log('📨 Received prompt:', cleanPrompt);

        if (!cleanPrompt) {
            return res.json({ text: 'Please provide a prompt.' });
        }

        const result = await ai.generateResult(cleanPrompt);
        console.log('📤 Sending result to frontend:', result?.slice(0, 200));

        // Always send as JSON
        try {
            const parsed = JSON.parse(result);
            return res.json(parsed);
        } catch {
            return res.json({ text: result });
        }
    } catch (error) {
        console.error('Controller error:', error.message);
        res.status(500).json({ text: `Server error: ${error.message}` });
    }
}

export const testAI = async (req, res) => {
    const report = {
        keyLoaded: false,
        keyPrefix: null,
        modelUsed: 'gpt-4o-mini',
        apiReachable: false,
        response: null,
        error: null,
        errorType: null,
    };

    try {
        const key = process.env.OPENAI_API_KEY;

        if (!key) {
            report.error = 'OPENAI_API_KEY is not set in environment variables';
            report.errorType = 'MISSING_KEY';
            return res.status(500).json(report);
        }

        report.keyLoaded = true;
        report.keyPrefix = key.slice(0, 10) + '...';

        const OpenAI = (await import('openai')).default;
        const client = new OpenAI({ apiKey: key });

        const response = await Promise.race([
            client.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: 'Say hello in one sentence.' }],
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000))
        ]);

        report.apiReachable = true;
        report.response = response.choices?.[0]?.message?.content;

        return res.json(report);

    } catch (e) {
        const msg = e.message || '';
        report.error = msg;

        if (e.status === 429 || msg.includes('429') || msg.includes('Rate limit')) {
            report.errorType = 'RATE_LIMITED';
        } else if (e.status === 401 || msg.includes('401') || msg.includes('Incorrect API key')) {
            report.errorType = 'INVALID_API_KEY';
        } else if (e.status === 402 || msg.includes('insufficient_quota')) {
            report.errorType = 'QUOTA_EXCEEDED';
        } else if (msg.includes('timeout') || msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND')) {
            report.errorType = 'NETWORK_ERROR';
        } else {
            report.errorType = 'UNKNOWN';
        }

        return res.status(500).json(report);
    }
}
