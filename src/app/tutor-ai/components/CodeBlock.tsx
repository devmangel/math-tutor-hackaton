import React from 'react';
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
      <div className="flex items-center justify-between px-4 py-2 bg-secondary">
        <span className="text-xs text-text-on-primary uppercase">
          {language}
        </span>
        <button
          onClick={() => navigator.clipboard.writeText(code)}
          className="text-xs text-text-on-primary hover:text-primary-light transition-colors"
        >
          Copiar código
        </button>
      </div>
    </div>
  );
};

export default CodeBlock;
