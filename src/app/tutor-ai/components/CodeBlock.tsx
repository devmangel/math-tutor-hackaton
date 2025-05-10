import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Highlight, themes } from 'prism-react-renderer';
import { Check, Copy, Terminal } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language: string;
  className?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language,
  className = '',
}) => {
  return (
    <motion.div 
      className={`rounded-xl overflow-hidden shadow-lg ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Barra superior con título y lenguaje */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#011627]/90 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">
            {language}
          </span>
        </div>
        <CopyButton code={code} />
      </div>
      <Highlight
        theme={themes.nightOwl}
        code={code.trim()}
        language={language as any}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={`${className} p-4 overflow-x-auto text-sm`}
            style={{
              ...style,
              margin: 0,
              backgroundColor: 'rgba(1, 22, 39, 0.95)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line, key: i })}>
                <motion.span 
                  className="inline-block w-8 select-none opacity-50 text-right mr-4 text-gray-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  transition={{ delay: i * 0.05 }}
                >
                  {i + 1}
                </motion.span>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token, key })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
      
    </motion.div>
  );
};

// Componente para el botón de copiar
const CopyButton: React.FC<{ code: string }> = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  return (
    <motion.button
      onClick={handleCopy}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        flex
        items-center
        gap-1.5
        text-xs
        px-3
        py-1.5
        rounded-full
        transition-all
        duration-200
        ${copied 
          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
          : 'text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
        }
      `}
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.div
            key="check"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Copiado</span>
          </motion.div>
        ) : (
          <motion.div
            key="copy"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="flex items-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copiar</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default CodeBlock;
