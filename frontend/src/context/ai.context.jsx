import React, { createContext, useState, useContext } from 'react';

// Create the AI Context
export const AIContext = createContext();

// Create a provider component
export const AIProvider = ({ children }) => {
    const [isAIChatOpen, setIsAIChatOpen] = useState(false);
    const [aiGeneratedCode, setAiGeneratedCode] = useState(null);
    const [aiHistory, setAiHistory] = useState([]);

    const openAIChat = () => setIsAIChatOpen(true);
    const closeAIChat = () => setIsAIChatOpen(false);

    const handleCodeGenerated = (codeData) => {
        setAiGeneratedCode(codeData);
        // Add to history
        setAiHistory(prev => [...prev, {
            id: Date.now(),
            timestamp: new Date(),
            ...codeData
        }]);
    };

    const clearGeneratedCode = () => setAiGeneratedCode(null);

    const value = {
        isAIChatOpen,
        aiGeneratedCode,
        aiHistory,
        openAIChat,
        closeAIChat,
        handleCodeGenerated,
        clearGeneratedCode
    };

    return (
        <AIContext.Provider value={value}>
            {children}
        </AIContext.Provider>
    );
};

// Custom hook to use AI context
export const useAI = () => {
    const context = useContext(AIContext);
    if (!context) {
        throw new Error('useAI must be used within an AIProvider');
    }
    return context;
};





