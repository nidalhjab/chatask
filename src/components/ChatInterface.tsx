import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../contexts/ChatContext';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';

const ChatInterface: React.FC = () => {
  const { 
    currentConversation, 
    currentMessages, 
    isStreaming, 
    streamingMessageId, 
    error, 
    sendMessage, 
    setError 
  } = useChat();
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, isStreaming]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    setInputMessage('');
    
    try {
      await sendMessage(message);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleInputChange = (value: string) => {
    setInputMessage(value);
  };

  const renderWelcomeScreen = () => (
    <div className="h-full flex items-center justify-center p-8">
      <div className="text-center max-w-2xl w-full">
        <h1 className="text-4xl md:text-5xl text-gray-700 mb-4 font-bold">ChatGPT-Style Assistant</h1>
        <p className="text-lg md:text-xl text-gray-500 mb-8">Start a conversation by typing a message below</p>
        <div className="mb-8">
          <h3 className="text-gray-700 mb-4 text-lg">Try asking:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              className="bg-white border border-gray-200 p-4 rounded-lg cursor-pointer text-left transition-all duration-200 text-sm text-gray-700 hover:border-green-500 hover:shadow-md"
              onClick={() => handleSendMessage("Explain quantum computing in simple terms")}
            >
              "Explain quantum computing in simple terms"
            </button>
            <button
              className="bg-white border border-gray-200 p-4 rounded-lg cursor-pointer text-left transition-all duration-200 text-sm text-gray-700 hover:border-green-500 hover:shadow-md"
              onClick={() => handleSendMessage("Write a creative story about a robot")}
            >
              "Write a creative story about a robot"
            </button>
            <button
              className="bg-white border border-gray-200 p-4 rounded-lg cursor-pointer text-left transition-all duration-200 text-sm text-gray-700 hover:border-green-500 hover:shadow-md"
              onClick={() => handleSendMessage("Help me plan a healthy meal")}
            >
              "Help me plan a healthy meal"
            </button>
            <button
              className="bg-white border border-gray-200 p-4 rounded-lg cursor-pointer text-left transition-all duration-200 text-sm text-gray-700 hover:border-green-500 hover:shadow-md"
              onClick={() => handleSendMessage("What are the benefits of meditation?")}
            >
              "What are the benefits of meditation?"
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMessages = () => {
    if (!currentConversation || currentMessages.length === 0) {
      return renderWelcomeScreen();
    }

    return (
      <div className="max-w-3xl mx-auto w-full px-4">
        {currentMessages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isStreaming={isStreaming && streamingMessageId === message.id}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-white">
      <div className="py-4 px-6 border-b border-gray-200 bg-white flex items-center justify-between">
        <h2 className="text-gray-700 text-lg font-semibold">
          {currentConversation ? currentConversation.title : 'New Chat'}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {renderMessages()}
      </div>

      <div className="py-4 px-6 border-t border-gray-200 bg-white">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-lg mb-4 flex items-center justify-between text-sm">
            <span>❌ {error}</span>
            <button 
              className="bg-none border-none text-red-600 cursor-pointer text-base p-1"
              onClick={() => setError(null)}
            >
              ✕
            </button>
          </div>
        )}
        
        <ChatInput
          value={inputMessage}
          onChange={handleInputChange}
          onSend={handleSendMessage}
          disabled={isStreaming}
          placeholder={
            isStreaming 
              ? "Please wait for the current response to complete..." 
              : "Type your message here..."
          }
        />
      </div>
    </div>
  );
};

export default ChatInterface; 