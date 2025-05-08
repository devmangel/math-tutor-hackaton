import React, { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp?: string;
  avatarUrl?: string;
  characterName?: string;
  isCode?: boolean;
  codeLanguage?: string;
}

interface ChatInterfaceProps {
  messages: Message[];
  className?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  className = '',
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div 
      className={`
        flex
        flex-col
        overflow-y-auto
        bg-background
        chat-interface
        relative
        ${className}
      `}
    >
      {/* Espaciador inicial para mantener los mensajes en la parte inferior cuando hay pocos */}
      <div className="flex-grow min-h-[20px]" />

      {/* Lista de mensajes */}
      <div className="flex flex-col space-y-4 py-6 px-4 chat-messages">
        {messages.map((message) => (
          <div key={message.id} className="message-enter">
            <MessageBubble
              text={message.text}
              sender={message.sender}
              timestamp={message.timestamp}
              avatarUrl={message.avatarUrl}
              characterName={message.characterName}
              isCode={message.isCode}
              codeLanguage={message.codeLanguage}
            />
          </div>
        ))}
      </div>

      {/* Elemento de referencia para auto-scroll */}
      <div ref={messagesEndRef} className="h-4" />
    </div>
  );
};

export default ChatInterface;
