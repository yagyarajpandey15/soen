// Lazy import and initialization to prevent immediate execution
let GoogleGenAI = null;
let ai = null;
let initializationAttempted = false;

// Function to initialize AI only when needed
const initializeAI = async () => {
    if (initializationAttempted) {
        return ai;
    }
    
    initializationAttempted = true;
    
    try {
        // Check for API key
        const apiKey = import.meta.env.VITE_GOOGLE_AI_KEY;
        
        if (!apiKey) {
            console.warn('VITE_GOOGLE_AI_KEY not found. Frontend AI features will be disabled.');
            return null;
        }

        // Dynamically import GoogleGenAI
        const module = await import("@google/genai");
        GoogleGenAI = module.GoogleGenAI;
        
        // Initialize with API key
        ai = new GoogleGenAI({ apiKey });
        console.log('✅ Frontend AI initialized successfully');
        return ai;
        
    } catch (error) {
        console.error('❌ Failed to initialize Frontend AI:', error);
        return null;
    }
};

const systemInstruction = `You are an expert in MERN and Development. You have an experience of 10 years in the development. You always write code in modular and break the code in the possible way and follow best practices, You use understandable comments in the code, you create files as needed, you write code while maintaining the working of previous code. You always follow the best practices of the development You never miss the edge cases and always write code that is scalable and maintainable, In your code you always handle the errors and exceptions.
    
    Examples: 

    <example>
 
    response: {
    "text": "this is you fileTree structure of the express server",
    "fileTree": {
        "app.js": {
            "file": {
                "contents": "const express = require('express');\n\nconst app = express();\n\napp.get('/', (req, res) => {\n    res.send('Hello World!');\n});\n\napp.listen(3000, () => {\n    console.log('Server is running on port 3000');\n})"
            }
        },
        "package.json": {
            "file": {
                "contents": "{\n    \"name\": \"temp-server\",\n    \"version\": \"1.0.0\",\n    \"main\": \"app.js\",\n    \"scripts\": {\n        \"start\": \"node app.js\",\n        \"test\": \"echo \\\"Error: no test specified\\\" && exit 1\"\n    },\n    \"keywords\": [],\n    \"author\": \"\",\n    \"license\": \"ISC\",\n    \"description\": \"\",\n    \"dependencies\": {\n        \"express\": \"^4.21.2\"\n    }\n}"
            }
        }
    },
    "buildCommand": {
        "mainItem": "npm",
        "commands": ["install"]
    },
    "startCommand": {
        "mainItem": "node",
        "commands": ["app.js"]
    }
}

user: Create an express application 
   
    </example>
    
       <example>

user: Hello 
response: {
    "text": "Hello, How can I help you today?"
       }
       
       </example>
    
IMPORTANT: 
- Always return valid JSON format
- Don't use file names like routes/index.js
- Use proper JSON escaping for file contents
- Provide complete, working code examples
- Include necessary dependencies in package.json`;

// AI Service for frontend using Google GenAI
export const generateAIResponse = async (prompt) => {
    try {
        // Initialize AI if not already done
        const aiInstance = await initializeAI();
        
        if (!aiInstance) {
            return JSON.stringify({
                text: `Frontend AI is not available. Please use the backend AI mode instead.\n\n**To enable Frontend AI:**\n1. Add VITE_GOOGLE_AI_KEY=your-api-key to frontend/.env\n2. Restart the dev server\n\n**Or simply toggle to 'Backend' mode for full AI functionality.**`,
                error: true
            });
        }

        const response = await aiInstance.models.generateContent({
            model: "gemini-2.0-flash",
            contents: String(prompt ?? ""),
            config: {
                systemInstruction: systemInstruction,
            },
        });

        const text = response?.text;
        if (typeof text === 'string' && text.trim().length > 0) {
            return text;
        }

        throw new Error('Empty response from model');
    } catch (error) {
        console.error('AI Service Error:', error);
        return JSON.stringify({
            text: "I apologize, but I'm experiencing technical difficulties with frontend AI. Please try using the backend AI mode (toggle the switch to 'Backend').",
            error: true
        });
    }
};

// Simple response function
export const generateSimpleResponse = async (prompt) => {
    try {
        const response = await generateAIResponse(prompt);
        
        // If it's a JSON response, parse and return just the text
        try {
            const parsed = JSON.parse(response);
            return parsed.text || response;
        } catch {
            return response;
        }
    } catch (error) {
        console.error('AI Service Error:', error);
        return "I apologize, but I'm experiencing technical difficulties. Please try using the backend AI mode.";
    }
};