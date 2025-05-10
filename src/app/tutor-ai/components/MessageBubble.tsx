import React from 'react';
import Avatar from './Avatar';
import CodeBlock from './CodeBlock';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface MessageBubbleProps {
  text: string;
  sender: 'user' | 'agent';
  timestamp?: string;
  avatarUrl?: string;
  characterName?: string;
  isCode?: boolean;
  codeLanguage?: string;
  className?: string;
  messageType?: 'text' | 'math' | 'code' | 'mixed';
}

// Función para detectar y procesar fórmulas matemáticas en el texto
const processMathContent = (text: string) => {
  const parts = text.split(/(\$\$.*?\$\$|\$.*?\$)/g);
  return parts.map((part, index) => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      // Fórmula en bloque
      const formula = part.slice(2, -2);
      return <BlockMath key={index} math={formula} />;
    } else if (part.startsWith('$') && part.endsWith('$')) {
      // Fórmula en línea
      const formula = part.slice(1, -1);
      return <InlineMath key={index} math={formula} />;
    }
    return part;
  });
};

// Función para detectar el tipo de mensaje
const detectMessageType = (text: string): 'text' | 'math' | 'code' | 'mixed' => {
  const hasMath = text.includes('$');
  const hasCode = text.includes('```');
  const hasText = text.replace(/\$[\s\S]*?\$|\$\$[\s\S]*?\$\$|```[\s\S]*?```/g, '').trim().length > 0;
  
  if (hasCode && !hasMath && !hasText) return 'code';
  if (hasMath && !hasCode && !hasText) return 'math';
  if (!hasMath && !hasCode) return 'text';
  return 'mixed';
};

const MessageBubble: React.FC<MessageBubbleProps> = ({
  text,
  sender,
  timestamp,
  avatarUrl,
  characterName,
  isCode = false,
  codeLanguage = 'python',
  className = '',
  messageType: propMessageType,
}) => {
  const messageType = propMessageType || detectMessageType(text);
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
            ${messageType === 'code' ? 'p-0 overflow-hidden' : 'p-3'}
          ${messageType === 'math' ? 'bg-opacity-95' : ''}
            message-bubble
          `}
        >
          {messageType === 'code' ? (
            <CodeBlock
              code={text.replace(/```\w*\n?|\n?```/g, '')}
              language={codeLanguage}
            />
          ) : messageType === 'math' ? (
            <div className="math-content">
              {processMathContent(text)}
            </div>
          ) : messageType === 'mixed' ? (
            <div className="mixed-content whitespace-pre-wrap break-words">
              {processMathContent(text)}
            </div>
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
