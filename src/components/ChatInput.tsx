import React, { KeyboardEvent } from 'react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = "Type your message here..."
}) => {
  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSend(value.trim());
      }
    }
  };

  const handleSendClick = () => {
    if (value.trim() && !disabled) {
      onSend(value.trim());
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full">
      <div className="flex items-end gap-3 bg-white border border-gray-200 rounded-xl p-3 transition-colors duration-200 focus-within:border-green-500">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 border-none outline-none text-base font-inherit leading-6 bg-transparent resize-none placeholder-gray-400"
          rows={1}
          style={{
            minHeight: '44px',
            maxHeight: '200px',
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = '44px';
            target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
          }}
        />
        <button
          onClick={handleSendClick}
          disabled={disabled || !value.trim()}
          className="bg-green-500 text-white border-none w-10 h-10 rounded-lg cursor-pointer flex items-center justify-center transition-colors duration-200 flex-shrink-0 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          title="Send message (Enter)"
        >
          <span className="text-lg transform -rotate-45">➤</span>
        </button>
      </div>
      <div className="text-center text-xs text-gray-400 mt-2">
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  );
};

export default ChatInput; 