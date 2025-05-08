import React, { useState, useEffect } from 'react';

interface PTTButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  onPressStart: () => void;
  onPressEnd: () => void;
  className?: string;
  sessionStatus?: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';
}

const getConnectionStatus = (sessionStatus?: string) => {
  switch (sessionStatus) {
    case 'CONNECTING':
      return {
        className: 'bg-warning',
        label: 'Conectando...',
        disabled: true
      };
    case 'DISCONNECTED':
      return {
        className: 'bg-error',
        label: 'Reconectando...',
        disabled: true
      };
    default:
      return {
        className: '',
        label: '',
        disabled: false
      };
  }
};

const PTTButton: React.FC<PTTButtonProps> = ({
  isRecording,
  isProcessing,
  onPressStart,
  onPressEnd,
  className = '',
  sessionStatus = 'CONNECTED',
}) => {
  const connectionState = getConnectionStatus(sessionStatus);
  const [isPressed, setIsPressed] = useState(false);

  // Manejar eventos de mouse
  const handleMouseDown = () => {
    setIsPressed(true);
    onPressStart();
  };

  const handleMouseUp = () => {
    setIsPressed(false);
    onPressEnd();
  };

  // Manejar eventos táctiles
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevenir eventos fantasma
    setIsPressed(true);
    onPressStart();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsPressed(false);
    onPressEnd();
  };

  // Limpiar estado si el mouse/touch sale del botón
  const handleMouseLeave = () => {
    if (isPressed) {
      setIsPressed(false);
      onPressEnd();
    }
  };

  // Efecto para vibración en dispositivos móviles
  useEffect(() => {
    if (isRecording && 'vibrate' in navigator) {
      navigator.vibrate(100); // Vibración corta al comenzar a grabar
    }
  }, [isRecording]);

  return (
    <button
      className={`
        fixed
        bottom-6
        left-1/2
        -translate-x-1/2
        w-16
        h-16
        md:w-[64px]
        md:h-[64px]
        rounded-full
        flex
        items-center
        justify-center
        shadow-lg
        focus:outline-none
        ptt-button
        z-50
        ${isProcessing 
          ? 'bg-warning processing'
          : isRecording
            ? 'bg-error recording scale-110'
            : connectionState.className || 'bg-primary hover:bg-accent-2 active:scale-95'
        }
        transition-all
        duration-200
        ease-in-out
        ${className}
      `}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      disabled={isProcessing || connectionState.disabled}
      aria-label={
        connectionState.label ||
        (isProcessing 
          ? 'Procesando audio...' 
          : isRecording 
            ? 'Suelta para enviar mensaje' 
            : 'Mantén presionado para hablar')
      }
    >
      {/* Icono de micrófono */}
      <svg
        className={`
          w-8
          h-8
          ${isRecording ? 'text-error' : 'text-text-on-primary'}
          transition-colors
          duration-300
        `}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
        />
      </svg>

      {/* Ondas de audio animadas cuando está grabando */}
      {isRecording && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute w-full h-full rounded-full animate-ping bg-error opacity-20" />
          <div className="absolute w-[90%] h-[90%] rounded-full animate-ping bg-error opacity-10 delay-150" />
          <div className="absolute w-[80%] h-[80%] rounded-full animate-ping bg-error opacity-5 delay-300" />
          <div className="absolute w-[70%] h-[70%] rounded-full animate-ping bg-error opacity-5 delay-500" />
        </div>
      )}

      {/* Animación de procesamiento */}
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-8 h-8 border-4 border-text-on-primary rounded-full border-t-transparent animate-spin" />
        </div>
      )}
    </button>
  );
};

export default PTTButton;
