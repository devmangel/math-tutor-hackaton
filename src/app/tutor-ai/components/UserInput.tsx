import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Code2, Calculator, Sigma } from 'lucide-react';

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  template: string;
  tooltip: string;
}

const quickActions: QuickAction[] = [
  {
    icon: <Calculator className="w-5 h-5" />,
    label: 'Fórmula en línea',
    template: '$ tu_fórmula $',
    tooltip: 'Insertar fórmula matemática en línea'
  },
  {
    icon: <Sigma className="w-5 h-5" />,
    label: 'Fórmula en bloque',
    template: '$$\ntu_fórmula\n$$',
    tooltip: 'Insertar fórmula matemática en bloque'
  },
  {
    icon: <Code2 className="w-5 h-5" />,
    label: 'Código Python',
    template: '```python\n# Tu código aquí\n```',
    tooltip: 'Insertar bloque de código Python'
  }
];

interface UserInputProps {
  value: string;
  onChange: (text: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const UserInput: React.FC<UserInputProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Escribe un mensaje...',
  disabled = false,
  className = '',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Ajustar altura automáticamente
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '0px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`; // Máximo 120px
    }
  }, [value]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onSubmit();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const insertTemplate = (template: string) => {
    const cursorPosition = textareaRef.current?.selectionStart || 0;
    const newText = value.slice(0, cursorPosition) + template + value.slice(cursorPosition);
    onChange(newText);
    
    // Calcular la nueva posición del cursor
    const newPosition = cursorPosition + template.indexOf('tu_');
    
    // Establecer el foco y la posición del cursor después de la actualización
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPosition, newPosition + 10);
      }
    }, 0);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        flex
        flex-col
        gap-3
        p-4
        md:p-6
        bg-white/80
        backdrop-blur-sm
        border-t
        border-gray-200
        shadow-lg
        user-input
        ${className}
      `}
    >
      {/* Barra de acciones rápidas con animaciones */}
      <motion.div 
        className="flex gap-2 px-2"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
      >
        {quickActions.map((action, index) => (
          <motion.button
            key={index}
            type="button"
            onClick={() => insertTemplate(action.template)}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
            title={action.tooltip}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
          >
            <span className="text-lg font-medium transition-transform duration-200 group-hover:scale-110">
              {action.icon}
            </span>
          </motion.button>
        ))}
      </motion.div>

      <motion.form
        onSubmit={handleSubmit}
        className="flex items-end gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex-grow relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={`
              w-full
              resize-none
              bg-white/60
              backdrop-blur-sm
              rounded-2xl
              px-4
              py-3
              text-gray-800
              placeholder-gray-400
              border
              border-gray-200
              focus:outline-none
              focus:border-blue-400
              focus:ring-2
              focus:ring-blue-100
              disabled:opacity-50
              disabled:cursor-not-allowed
              transition-all
              duration-200
              min-h-[52px]
              max-h-[120px]
              shadow-sm
              hover:border-gray-300
            `}
          />
          <AnimatePresence>
            {value.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute right-3 bottom-3 text-xs text-gray-400"
              >
                {value.length} caracteres
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.button
          type="submit"
          disabled={!value.trim() || disabled}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`
            flex-shrink-0
            rounded-2xl
            p-3
            bg-gradient-to-r
            from-blue-500
            to-blue-600
            text-white
            font-medium
            shadow-sm
            transition-all
            duration-200
            min-h-[52px]
            min-w-[52px]
            flex
            items-center
            justify-center
            ${!value.trim() || disabled
              ? 'opacity-50 cursor-not-allowed from-gray-400 to-gray-500'
              : 'hover:from-blue-600 hover:to-blue-700 hover:shadow-md'
            }
          `}
        >
          <Send className="w-5 h-5" />
        </motion.button>
      </motion.form>
    </motion.div>
  );
};

export default UserInput;
