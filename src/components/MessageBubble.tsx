import React from 'react';
import { Message } from '../contexts/ChatContext';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isStreaming = false }) => {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderContent = () => {
    if (isStreaming && message.role === 'assistant') {
      return (
        <div className="relative">
          {message.content}
          <span className="inline-block animate-pulse font-bold ml-0.5 text-blue-500">|</span>
        </div>
      );
    }
    return message.content;
  };

  return (
    <div className={`mb-6 animate-fade-in ${message.role}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`font-semibold text-sm flex items-center gap-2 ${
          message.role === 'user' ? 'text-green-500' : 'text-purple-500'
        }`}>
          {message.role === 'user' ? '👤 You' : '🤖 Assistant'}
        </span>
        <span className="text-xs text-gray-400">
          {formatTimestamp(message.timestamp)}
        </span>
      </div>
      
      <div className={`p-4 rounded-xl leading-relaxed break-words ${
        message.role === 'user' 
          ? 'bg-green-500 text-white ml-8' 
          : 'bg-gray-100 text-gray-700 mr-8'
      }`}>
        {renderContent()}
      </div>
    </div>
  );
};

export default MessageBubble; 