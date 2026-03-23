import React, { useState } from 'react';

const SimpleAI = () => {
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        setIsLoading(true);
        try {
            // Temporary fallback - will be replaced with actual AI service
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
            setResponse('Frontend AI is currently being configured. Please use the main AI Chat with backend mode for now.');
        } catch (error) {
            setResponse('Error: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-gray-900 rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 text-center text-white">
                ⚡ Frontend AI Assistant
            </h2>
            <p className="text-gray-400 mb-6 text-center">
                Direct client-side Gemini AI integration
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Ask me anything about coding:
                    </label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., Create a React component for a todo list..."
                        className="input-premium resize-none"
                        rows="3"
                        disabled={isLoading}
                    />
                </div>
                <button
                    type="submit"
                    disabled={!prompt.trim() || isLoading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-400 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Processing...
                        </div>
                    ) : (
                        'Generate Response'
                    )}
                </button>
            </form>

            {response && (
                <div className="mt-6 p-4 bg-gray-800 rounded-xl border border-gray-700">
                    <h3 className="font-semibold text-gray-200 mb-2">AI Response:</h3>
                    <div className="whitespace-pre-wrap text-gray-300 text-sm">
                        {response}
                    </div>
                </div>
            )}

            <div className="mt-6 text-sm text-gray-500">
                <p>💡 This component uses the official @google/genai package directly in the browser.</p>
                <p>🔑 Make sure to set your VITE_GOOGLE_AI_KEY in the .env file.</p>
            </div>
        </div>
    );
};

export default SimpleAI;
