import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudioInput } from '@/app/hooks/useAudioInput';

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
  const {
    isActive,
    audioLevel,
    error,
    permissionStatus,
    startRecording,
    stopRecording
  } = useAudioInput();
  const [isPressed, setIsPressed] = useState(false);

  // Manejar eventos de mouse
  const handleMouseDown = () => {
    setIsPressed(true);
    startRecording();
    onPressStart();
  };

  const handleMouseUp = () => {
    setIsPressed(false);
    stopRecording();
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
    if (isRecording && !isProcessing && sessionStatus === 'CONNECTED' && 'vibrate' in navigator) {
      navigator.vibrate(100); // Vibración corta al comenzar a grabar
    }
  }, [isRecording, isProcessing, sessionStatus]);

  // Limpiar estado cuando se desconecta
  useEffect(() => {
    if (sessionStatus !== 'CONNECTED' && isPressed) {
      setIsPressed(false);
      onPressEnd();
    }
  }, [sessionStatus, isPressed, onPressEnd]);

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={{
        scale: isRecording ? 1.1 : 1,
        backgroundColor: isRecording 
          ? 'var(--color-error)' 
          : isProcessing 
            ? 'var(--color-warning)' 
            : 'var(--color-primary)'
      }}
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
        focus:ring-2
        focus:ring-offset-2
        focus:ring-primary
        ptt-button
        z-50
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

      {/* Visualizador de nivel de audio */}
      <AnimatePresence>
        {isRecording && (
          <motion.div 
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full bg-error"
                animate={{
                  scale: [1, 1 + (audioLevel * 0.5 * (i + 1))],
                  opacity: [0.4 - (i * 0.1), 0]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  delay: i * 0.2,
                  ease: "easeOut"
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animación de procesamiento */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="w-8 h-8 border-4 border-text-on-primary rounded-full border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mensaje de error */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-error text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default PTTButton;
