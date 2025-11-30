import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { Icons } from './Icons';

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  disabled: boolean;
}

const Chat: React.FC<ChatProps> = ({ messages, onSendMessage, disabled }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !disabled) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-black/40 border-l md:border-l-0 md:border-t border-white/10">
      <div className="p-3 border-b border-white/10 bg-black/20 flex items-center gap-2">
        <Icons.MessageSquare size={16} className="text-gray-400" />
        <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">Live Chat</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.isSystem ? 'items-center my-4 opacity-70' : 'items-start'}`}>
            {msg.isSystem ? (
              <span className="text-[10px] text-yellow-500/80 uppercase tracking-wider font-mono bg-yellow-900/10 px-3 py-1 rounded-full border border-yellow-900/20">
                {msg.text}
              </span>
            ) : (
              <div className="w-full">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-xs text-red-500 font-bold">{msg.sender}</span>
                  <span className="text-[10px] text-gray-600 font-mono">{formatTime(msg.timestamp)}</span>
                </div>
                <div className="text-sm text-gray-300 break-words leading-relaxed bg-white/5 p-2 rounded-lg rounded-tl-none">
                  {msg.text}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 bg-black/60 border-t border-white/10">
        <div className="relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={disabled}
            placeholder={disabled ? "Spectators cannot chat..." : "Type a message..."}
            className="w-full bg-gray-900 border border-gray-700 rounded pl-3 pr-10 py-2 text-sm text-white focus:outline-none focus:border-red-600 transition-colors placeholder:text-gray-600"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || disabled}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-white disabled:opacity-50 disabled:hover:text-gray-400"
          >
            <Icons.Send size={14} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;