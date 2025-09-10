import React from 'react';
import { Message, Role } from '../types';

interface ChatMessageProps {
  message: Message;
  isLoading?: boolean;
}

const UserIcon: React.FC = () => (
  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white flex-shrink-0">
    U
  </div>
);

const CaddieIcon: React.FC = () => (
    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
     <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 256 256"
        fill="currentColor"
        className="w-5 h-5 text-white"
      >
        <path d="M224,128a96,96,0,1,1-96-96A96,96,0,0,1,224,128ZM128,48a80,80,0,1,0,80,80A80.09,80.09,0,0,0,128,48Zm0,112a12,12,0,1,1,12-12A12,12,0,0,1,128,160Zm-40-28a12,12,0,1,1,12-12A12,12,0,0,1,88,132Zm-4-48a12,12,0,1,1,12-12A12,12,0,0,1,84,84Zm56,8a12,12,0,1,1,12-12A12,12,0,0,1,140,92Zm40-24a12,12,0,1,1,12-12A12,12,0,0,1,180,68Zm-8,64a12,12,0,1,1,12-12A12,12,0,0,1,172,132Z" />
      </svg>
    </div>
);

const LoadingDots: React.FC = () => (
    <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
    </div>
);

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLoading = false }) => {
  const isModel = message.role === Role.MODEL;

  const containerClasses = isModel
    ? 'flex items-start gap-3 justify-start'
    : 'flex items-start gap-3 justify-end';

  const bubbleClasses = isModel
    ? 'bg-gray-700 text-gray-100 rounded-r-lg rounded-bl-lg'
    : 'bg-blue-600 text-white rounded-l-lg rounded-br-lg';
return (
    <div className={containerClasses}>
      {isModel && <CaddieIcon />}
     <div className={`max-w-md md:max-w-lg p-3 ${bubbleClasses} text-base break-words`}>
        {isLoading ? <LoadingDots /> : <p className="whitespace-pre-wrap break-words">{message.content}</p>}
      </div>
      {!isModel && <UserIcon />}
    </div>
  );
};

export default ChatMessage;
