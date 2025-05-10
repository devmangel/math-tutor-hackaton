import React, { useState } from 'react';
import { Highlight, themes } from 'prism-react-renderer';

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
    <div className={`rounded-lg overflow-hidden ${className}`}>
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
              backgroundColor: 'rgb(1, 22, 39)',
            }}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line, key: i })}>
                <span className="inline-block w-8 select-none opacity-50 text-right mr-4">
                  {i + 1}
                </span>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token, key })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
      
      {/* Barra de herramientas */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#011627]">
        <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">
          {language}
        </span>
        <CopyButton code={code} />
      </div>
    </div>
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
    <button
      onClick={handleCopy}
      className={`
        text-xs
        px-2
        py-1
        rounded
        transition-all
        duration-200
        ${copied 
          ? 'bg-green-500/10 text-green-400'
          : 'text-gray-400 hover:text-white hover:bg-white/10'
        }
      `}
    >
      {copied ? (
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Copiado
        </span>
      ) : (
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copiar
        </span>
      )}
    </button>
  );
};

export default CodeBlock;
