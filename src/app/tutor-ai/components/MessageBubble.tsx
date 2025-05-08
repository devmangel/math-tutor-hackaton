import React from 'react';
import Avatar from './Avatar';
import CodeBlock from './CodeBlock';

interface MessageBubbleProps {
  text: string;
  sender: 'user' | 'agent';
  timestamp?: string;
  avatarUrl?: string;
  characterName?: string;
  isCode?: boolean;
  codeLanguage?: string;
  className?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  text,
  sender,
  timestamp,
  avatarUrl,
  characterName,
  isCode = false,
  codeLanguage = 'python',
  className = '',
}) => {
  const isAgent = sender === 'agent';

  return (
    <div
      className={`
        flex
        ${isAgent ? 'flex-row' : 'flex-row-reverse'}
        items-start
        gap-3
        mx-4
        my-2
        message-enter
        message-bubble
        ${className}
      `}
    >
      {/* Avatar */}
      <Avatar
        imageUrl={avatarUrl}
        characterName={characterName || (isAgent ? 'Agent' : 'User')}
        size="small"
        className="mt-1"
      />

      {/* Contenido del mensaje */}
      <div
        className={`
          flex
          flex-col
          max-w-[80%]
          ${isAgent ? 'items-start' : 'items-end'}
        `}
      >
        {/* Nombre del remitente (solo para agentes) */}
        {isAgent && characterName && (
          <span className="text-xs text-medium-gray mb-1">
            {characterName}
          </span>
        )}

        {/* Burbuja de mensaje */}
        <div
          className={`
            rounded-2xl
            ${isAgent 
              ? 'bg-content-background border border-light-gray rounded-tl-none' 
              : 'bg-primary text-text-on-primary rounded-tr-none'
            }
            ${isCode ? 'p-0 overflow-hidden' : 'p-3'}
            message-bubble
          `}
        >
          {isCode ? (
            <CodeBlock
              code={text}
              language={codeLanguage}
            />
          ) : (
            <p className="whitespace-pre-wrap break-words">
              {text}
            </p>
          )}
        </div>

        {/* Timestamp */}
        {timestamp && (
          <span className="text-xs text-medium-gray mt-1">
            {timestamp}
          </span>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
