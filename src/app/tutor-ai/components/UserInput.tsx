import React, { useState, useRef, useEffect } from 'react';

interface QuickAction {
  icon: string;
  label: string;
  template: string;
  tooltip: string;
}

const quickActions: QuickAction[] = [
  {
    icon: '∑',
    label: 'Fórmula en línea',
    template: '$ tu_fórmula $',
    tooltip: 'Insertar fórmula matemática en línea'
  },
  {
    icon: '∫',
    label: 'Fórmula en bloque',
    template: '$$\ntu_fórmula\n$$',
    tooltip: 'Insertar fórmula matemática en bloque'
  },
  {
    icon: '{ }',
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
    <div className={`
      flex
      flex-col
      gap-2
      p-4
      bg-content-background
      border-t
      border-light-gray
      user-input
      ${className}
    `}>
      {/* Barra de acciones rápidas */}
      <div className="flex gap-2 px-2">
        {quickActions.map((action, index) => (
          <button
            key={index}
            type="button"
            onClick={() => insertTemplate(action.template)}
            className="p-2 text-medium-gray hover:text-primary hover:bg-background rounded-lg transition-colors"
            title={action.tooltip}
          >
            <span className="text-lg font-medium">{action.icon}</span>
          </button>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2"
      >
        <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className={`
          flex-grow
          resize-none
          bg-background
          rounded-xl
          px-4
          py-3
          text-foreground
          placeholder-medium-gray
          border
          border-light-gray
          focus:outline-none
          focus:border-primary
          focus:ring-1
          focus:ring-primary
          disabled:opacity-50
          disabled:cursor-not-allowed
          min-h-[44px]
          max-h-[120px]
        `}
      />

        <button
          type="submit"
          disabled={!value.trim() || disabled}
          className={`
            flex-shrink-0
            rounded-xl
            px-4
            py-3
            bg-primary
            text-text-on-primary
            font-medium
            transition-colors
            min-h-[44px]
            ${!value.trim() || disabled
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-primary-dark'
            }
          `}
        >
          Enviar
        </button>
      </form>
    </div>
  );
};

export default UserInput;
