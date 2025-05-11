import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  updatedAt?: string;
  status?: string;
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

  // Auto-scroll al último mensaje SIEMPRE
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const messageVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    exit: { 
      opacity: 0,
      scale: 0.9,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <div 
      className={`
        flex
        flex-col
        overflow-y-auto
        bg-gradient-to-b
        from-white/50
        to-blue-50/30
        backdrop-blur-sm
        chat-interface
        custom-scrollbar
        relative
        rounded-xl
        max-h-[600px]
        min-h-[400px]
        ${className}
      `}
      style={{ height: '100%' }}
    >
      {/* Fondo con efecto de glassmorphism */}
      <div className="absolute inset-0 bg-white/40 backdrop-blur-sm rounded-xl" />

      {/* Contenido principal */}
      <div className="relative flex flex-col h-full">
        {/* Espaciador inicial con gradiente */}
        <div className="flex-grow min-h-[20px] bg-gradient-to-b from-white/60 to-transparent" />

        {/* Lista de mensajes con animaciones */}
        <div className="flex flex-col space-y-6 py-8 px-4 md:px-6 chat-messages">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                layout
                variants={messageVariants}
                initial="hidden"
                animate={{
                  ...messageVariants.visible,
                  backgroundColor: message.updatedAt ? ["#fffbe6", "#ffffff"] : undefined,
                  transition: { duration: 0.7 },
                }}
                exit="exit"
                className="message-container"
              >
                <MessageBubble
                  text={message.text}
                  sender={message.sender}
                  timestamp={message.timestamp}
                  avatarUrl={message.avatarUrl}
                  characterName={message.characterName}
                  isCode={message.isCode}
                  codeLanguage={message.codeLanguage}
                  updatedAt={message.updatedAt}
                  status={message.status}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Elemento de referencia para auto-scroll con sombra superior */}
        <div 
          ref={messagesEndRef} 
          className="h-4 bg-gradient-to-t from-white/60 to-transparent" 
        />
      </div>
    </div>
  );
};

export default ChatInterface;
