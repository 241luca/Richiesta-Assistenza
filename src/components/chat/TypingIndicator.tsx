import React from 'react';

interface TypingIndicatorProps {
  users: string[];
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ users }) => {
  if (users.length === 0) return null;

  const text = users.length === 1 
    ? 'sta scrivendo...' 
    : `${users.length} persone stanno scrivendo...`;

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 italic">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
      </div>
      <span>{text}</span>
    </div>
  );
};

export default TypingIndicator;
