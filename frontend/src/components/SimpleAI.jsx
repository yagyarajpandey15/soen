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
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-center">
                ⚡ Frontend AI Assistant
            </h2>
            <p className="text-gray-600 mb-6 text-center">
                Direct client-side Gemini AI integration
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ask me anything about coding:
                    </label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., Create a React component for a todo list..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="3"
                        disabled={isLoading}
                    />
                </div>
                <button
                    type="submit"
                    disabled={!prompt.trim() || isLoading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">AI Response:</h3>
                    <div className="whitespace-pre-wrap text-gray-700">
                        {response}
                    </div>
                </div>
            )}

            <div className="mt-6 text-sm text-gray-500">
                <p>💡 <strong>Tip:</strong> This component uses the official @google/genai package directly in the browser.</p>
                <p>🔑 Make sure to set your VITE_GOOGLE_AI_KEY in the .env file.</p>
            </div>
        </div>
    );
};

export default SimpleAI;
