import React from 'react';

interface InputBarProps {
  onSendMessage: (message: string) => void;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  isLoading: boolean;
  text: string;
  setText: (text: string) => void;
}

const MicrophoneIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
    <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.75 6.75 0 11-13.5 0v-1.5A.75.75 0 016 10.5z" />
  </svg>
);

const SendIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
);


const InputBar: React.FC<InputBarProps> = ({
  onSendMessage,
  isListening,
  startListening,
  stopListening,
  isLoading,
  text,
  setText,
}) => {
  const handleSend = () => {
    if (isLoading || !text.trim()) return;

    if (isListening) {
      stopListening();
    }
    onSendMessage(text.trim());
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      setText('');
      startListening();
    }
  };

  const showSendButton = text.trim() !== '';

  return (
    <footer className="bg-gray-800 p-3 md:p-4 transition-all duration-300">
      <div className="flex items-center space-x-3 max-w-3xl mx-auto">
        <button
          onClick={handleMicClick}
          disabled={isLoading}
          className={`relative w-14 h-14 flex-shrink-0 flex items-center justify-center rounded-full transition-colors duration-200 ${
            isListening ? 'bg-red-500' : 'bg-green-500 hover:bg-green-600'
          } text-white disabled:bg-gray-600 disabled:cursor-not-allowed`}
          aria-label={isListening ? 'Stop listening' : 'Start listening'}
        >
          <MicrophoneIcon className="w-7 h-7 relative z-10" />
        </button>
        <div className="relative flex-grow">
            <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                }}
                placeholder={isListening ? 'Listening...' : 'Type your yardage, club, lie...'}
                disabled={isLoading}
                readOnly={isListening}
                className="w-full h-14 pl-4 pr-14 rounded-full bg-gray-700 text-gray-200 placeholder-gray-400 border border-gray-600 focus:ring-2 focus:ring-green-500 focus:outline-none disabled:bg-gray-600 read-only:bg-gray-700 transition-all duration-200"
            />
            {showSendButton && !isLoading && (
                 <button 
                    onClick={handleSend}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-green-500 hover:bg-green-600 rounded-full text-white disabled:bg-gray-500 transition-colors"
                    aria-label="Send message"
                 >
                    <SendIcon className="w-5 h-5" />
                 </button>
            )}
        </div>
      </div>
    </footer>
  );
};

export default InputBar;