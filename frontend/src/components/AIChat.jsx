import React, { useState, useRef, useEffect } from 'react';
import axios from '../config/axios';
import Markdown from 'markdown-to-jsx';
import { generateAIResponse } from '../services/ai.service';
import VirtualBoxModal from './VirtualBoxModal';

const AIChat = ({ isOpen, onClose, onCodeGenerated }) => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'ai',
            content: 'Hello! I\'m your AI assistant powered by Gemini. I can help you with:\n\n- Creating React components\n- Writing Node.js/Express code\n- Building full-stack applications\n- Debugging and optimization\n- Best practices and architecture\n\n**Choose your processing mode:**\n- 🌐 **Backend**: Server-side processing (default)\n- ⚡ **Frontend**: Client-side processing (faster, requires API key)\n\nWhat would you like me to help you build today?',
            timestamp: new Date()
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [useBackend, setUseBackend] = useState(true);
    const [sandboxFileTree, setSandboxFileTree] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: String(inputMessage),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            let aiResponse;
            
            if (useBackend) {
                const response = await axios.get('/ai/get-result', {
                    params: { prompt: inputMessage }
                });

                // axios already parses JSON — no need to JSON.parse again
                aiResponse = response.data;
                console.log('🤖 AI response received:', aiResponse);
            } else {
                const response = await generateAIResponse(inputMessage);
                try {
                    aiResponse = JSON.parse(response);
                } catch {
                    aiResponse = { text: response };
                }
            }

            // Extract text — it's always in aiResponse.text
            const content = typeof aiResponse?.text === 'string'
                ? aiResponse.text
                : JSON.stringify(aiResponse);

            const aiMessage = {
                id: Date.now() + 1,
                type: 'ai',
                content,
                fileTree: aiResponse?.fileTree || null,
                buildCommand: aiResponse?.buildCommand || null,
                startCommand: aiResponse?.startCommand || null,
                timestamp: new Date(),
                source: useBackend ? 'backend' : 'frontend'
            };

            setMessages(prev => [...prev, aiMessage]);

            if (aiResponse?.fileTree) {
                onCodeGenerated && onCodeGenerated({
                    fileTree: aiResponse.fileTree,
                    buildCommand: aiResponse.buildCommand,
                    startCommand: aiResponse.startCommand
                });
            }

        } catch (error) {
            console.error('AI Error:', error);
            const errorMessage = {
                id: Date.now() + 1,
                type: 'ai',
                content: `Sorry, I encountered an error with ${useBackend ? 'backend' : 'frontend'} processing. ${error.message || 'Please try again or switch processing mode.'}`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isLoading && inputMessage.trim()) {
                sendMessage();
            }
        }
    };

    const formatTimestamp = (timestamp) => {
        return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            {/* Custom animations */}
            <style>{`
                @keyframes aiSpin {
                    to { transform: rotate(360deg); }
                }
                @keyframes aiPing {
                    75%, 100% {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
                @keyframes aiBounce {
                    0%, 80%, 100% {
                        transform: translateY(0);
                        opacity: 0.4;
                    }
                    40% {
                        transform: translateY(-6px);
                        opacity: 1;
                    }
                }
                @keyframes aiPulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.5;
                    }
                }
                .ai-spin {
                    animation: aiSpin 1s linear infinite;
                }
                .ai-ping {
                    animation: aiPing 1s cubic-bezier(0, 0, 0.2, 1) infinite;
                }
                .ai-bounce-1 {
                    animation: aiBounce 1.4s infinite;
                }
                .ai-bounce-2 {
                    animation: aiBounce 1.4s infinite 0.2s;
                }
                .ai-bounce-3 {
                    animation: aiBounce 1.4s infinite 0.4s;
                }
                .ai-pulse {
                    animation: aiPulse 2s ease-in-out infinite;
                }
            `}</style>
            <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl h-5/6 flex flex-col border border-gray-700">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold">AI</span>
                        </div>
                        <div>
                            <h3 className="font-semibold">Gemini AI Assistant</h3>
                            <p className="text-sm opacity-90">
                                {useBackend ? '🌐 Backend Processing' : '⚡ Frontend Processing'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        {/* Processing Mode Toggle */}
                        <div className="flex items-center space-x-2">
                            <span className="text-sm">Backend</span>
                            <button
                                onClick={() => setUseBackend(!useBackend)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    useBackend ? 'bg-white bg-opacity-30' : 'bg-green-400'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        useBackend ? 'translate-x-1' : 'translate-x-6'
                                    }`}
                                />
                            </button>
                            <span className="text-sm">Frontend</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900">
                    {(messages || []).map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-3xl rounded-xl p-3 ${
                                    message.type === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-800 text-gray-100 border border-gray-700'
                                }`}
                            >
                                <div className="prose prose-sm max-w-none">
                                    {message.type === 'ai' ? (
                                        <Markdown>{String(message.content ?? '')}</Markdown>
                                    ) : (
                                        <p className="whitespace-pre-wrap">{String(message.content ?? '')}</p>
                                    )}
                                </div>
                                
                                {/* Show file tree if AI generated code */}
                                {message.fileTree && (
                                    <div className="mt-3 p-3 bg-gray-700 rounded-lg border border-gray-600">
                                        <h4 className="font-semibold text-sm mb-2 text-green-400">
                                            🚀 Generated Project Structure
                                        </h4>
                                        <div className="text-xs text-gray-300 mb-3">
                                            <p>Files: {Object.keys(message.fileTree).length}</p>
                                            {message.buildCommand && (
                                                <p>Build: {message.buildCommand.mainItem} {message.buildCommand.commands?.join(' ')}</p>
                                            )}
                                            {message.startCommand && (
                                                <p>Start: {message.startCommand.mainItem} {message.startCommand.commands?.join(' ')}</p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setSandboxFileTree(message.fileTree)}
                                            className="w-full px-3 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white text-sm font-medium rounded-md hover:from-green-600 hover:to-blue-600 transition-all duration-200 flex items-center justify-center space-x-2"
                                        >
                                            <span>🖥️</span>
                                            <span>Run in Sandbox</span>
                                        </button>
                                    </div>
                                )}
                                
                                <div className={`text-xs mt-2 flex justify-between items-center ${message.type === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                                    <span>{formatTimestamp(message.timestamp)}</span>
                                    {message.source && (
                                        <span className={`px-2 py-1 rounded text-xs ${
                                            message.source === 'backend' 
                                                ? 'bg-blue-100 text-blue-600' 
                                                : 'bg-green-100 text-green-600'
                                        }`}>
                                            {message.source === 'backend' ? '🌐 Backend' : '⚡ Frontend'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-800 border border-gray-700 rounded-xl p-3">
                                <div className="flex items-center gap-3">
                                    <div className="relative flex items-center justify-center">
                                        <div className="w-6 h-6 rounded-full border-2 border-blue-400 border-t-transparent ai-spin"></div>
                                        <div className="absolute w-10 h-10 rounded-full border-2 border-blue-200 opacity-50 ai-ping"></div>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-400">
                                        <span className="mr-1 ai-pulse">Generating response</span>
                                        <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full ai-bounce-1 ml-1"></span>
                                        <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full ai-bounce-2 ml-1"></span>
                                        <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full ai-bounce-3 ml-1"></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-gray-700 p-4 bg-gray-900">
                    <div className="flex space-x-3">
                        <textarea
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask me to create components, write code, or help with your project..."
                            className="flex-1 input-premium resize-none"
                            rows="2"
                            disabled={isLoading}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!inputMessage.trim() || isLoading}
                            className="px-5 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            )}
                        </button>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
                        <span>Press Enter to send, Shift+Enter for new line</span>
                        {isLoading && (
                            <span className="text-blue-400 flex items-center gap-2" aria-live="polite">
                                <span className="relative inline-flex">
                                    <span className="w-3 h-3 rounded-full bg-blue-400 animate-ping"></span>
                                    <span className="absolute w-3 h-3 rounded-full bg-blue-500 opacity-75"></span>
                                </span>
                                Generating response...
                            </span>
                        )}
                    </div>
                    <span className="sr-only" aria-live="polite">{isLoading ? 'Generating response' : 'Idle'}</span>
                </div>
            </div>

            {/* Virtual Box Modal */}
            {sandboxFileTree && (
                <VirtualBoxModal
                    fileTree={sandboxFileTree}
                    onClose={() => setSandboxFileTree(null)}
                />
            )}
        </div>
    );
};

export default AIChat;
