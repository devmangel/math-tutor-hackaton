import React from 'react';
import { motion } from 'framer-motion';
import Avatar from './Avatar';
import CodeBlock from './CodeBlock';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { CheckCircle2, Clock } from 'lucide-react';

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
  updatedAt?: string;
  status?: string;
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
  updatedAt,
  status,
}) => {
  const messageType = propMessageType || detectMessageType(text);
  const isAgent = sender === 'agent';

  // Animación sutil cuando updatedAt cambia
  const [highlight, setHighlight] = React.useState(false);
  React.useEffect(() => {
    if (updatedAt) {
      setHighlight(true);
      const timeout = setTimeout(() => setHighlight(false), 600);
      return () => clearTimeout(timeout);
    }
  }, [updatedAt]);

  // Mostrar spinner si está en progreso y el texto está vacío
  const showSpinner = status === 'IN_PROGRESS' && (!text || text.trim() === '');

  // --- STREAMING DE TEXTO PARA EL AGENTE Y USUARIO ---
  const [streamedText, setStreamedText] = React.useState('');
  const streamingActive = (isAgent || sender === 'user') && status === 'IN_PROGRESS' && text && text.length > 0;
  const prevTextRef = React.useRef('');

  React.useEffect(() => {
    if (!streamingActive) {
      setStreamedText(text);
      prevTextRef.current = text;
      return;
    }
    // Si el texto cambió abruptamente (nuevo mensaje o delta grande), reiniciar
    if (text !== prevTextRef.current) {
      setStreamedText('');
      prevTextRef.current = text;
    }
    let i = 0;
    let cancelled = false;
    function stream() {
      if (cancelled) return;
      if (i <= text.length) {
        setStreamedText(text.slice(0, i));
        i++;
        setTimeout(stream, 100); // 100ms por letra (más lento, estándar industria)
      }
    }
    stream();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, streamingActive]);

  // Si el mensaje ya está completo, mostrar todo
  const displayText = streamingActive ? streamedText : text;

  return (
    <div
      className={`
        flex
        ${isAgent ? 'flex-row' : 'flex-row-reverse'}
        items-start
        gap-4
        mx-4
        my-3
        message-bubble
        group
        ${className}
        ${highlight ? 'ring-2 ring-yellow-200 ring-offset-2 transition-all duration-300' : ''}
      `}
    >
      {/* Avatar con animación */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Avatar
          imageUrl={avatarUrl}
          characterName={characterName || (isAgent ? 'Agent' : 'User')}
          size="small"
          className="mt-1 transition-transform group-hover:scale-105"
        />
      </motion.div>

      {/* Contenido del mensaje */}
      <div
        className={`
          flex
          flex-col
          max-w-[80%]
          ${isAgent ? 'items-start' : 'items-end'}
        `}
      >
        {/* Nombre del remitente con estado */}
        {isAgent && characterName && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-gray-600">
              {characterName}
            </span>
            <motion.span 
              className="flex items-center text-xs text-gray-400"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {isAgent ? (
                <Clock className="w-3 h-3 mr-1" />
              ) : (
                <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
              )}
              {timestamp || 'Ahora'}
            </motion.span>
          </div>
        )}

        {/* Burbuja de mensaje con efectos modernos */}
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30
          }}
          className={`
            rounded-2xl
            shadow-sm
            backdrop-blur-sm
            transition-all
            duration-300
            group-hover:shadow-md
            ${isAgent 
              ? 'bg-white/80 border border-gray-200 rounded-tl-none hover:bg-white/90' 
              : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-none hover:from-blue-600 hover:to-blue-700'
            }
            ${messageType === 'code' ? 'p-0 overflow-hidden' : 'p-4'}
            ${messageType === 'math' ? 'bg-opacity-95' : ''}
            message-bubble
            max-w-[calc(100vw-6rem)]
            md:max-w-[600px]
          `}
        >
          {showSpinner ? (
            <div className="flex items-center gap-2 text-gray-400 animate-pulse">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
              <span>Transcribiendo...</span>
            </div>
          ) : messageType === 'code' ? (
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-white opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
              <CodeBlock
                code={text.replace(/```\w*\n?|\n?```/g, '')}
                language={codeLanguage}
              />
            </div>
          ) : messageType === 'math' ? (
            <div className="math-content px-1">
              {processMathContent(text)}
            </div>
          ) : messageType === 'mixed' ? (
            <div className="mixed-content whitespace-pre-wrap break-words">
              {processMathContent(text)}
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
              {displayText}
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default MessageBubble;
