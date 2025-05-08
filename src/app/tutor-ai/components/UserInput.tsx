import React, { useState, useRef, useEffect } from 'react';

interface UserInputProps {
  onSubmit: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const UserInput: React.FC<UserInputProps> = ({
  onSubmit,
  placeholder = 'Escribe un mensaje...',
  disabled = false,
  className = '',
}) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Ajustar altura automáticamente
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '0px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`; // Máximo 120px
    }
  }, [text]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !disabled) {
      onSubmit(text.trim());
      setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`
        flex
        items-end
        gap-2
        p-4
        bg-content-background
        border-t
        border-light-gray
        user-input
        ${className}
      `}
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
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
        disabled={!text.trim() || disabled}
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
          ${!text.trim() || disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-primary-dark'
          }
        `}
      >
        Enviar
      </button>
    </form>
  );
};

export default UserInput;
