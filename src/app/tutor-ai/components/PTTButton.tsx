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
        scale: isRecording ? [1, 1.05, 1] : 1,
        transition: {
          duration: 1,
          repeat: isRecording ? Infinity : 0,
          ease: "easeInOut"
        }
      }}
      className={`
        fixed
        bottom-6
        left-1/2
        -translate-x-1/2
        w-[72px]
        h-[72px]
        md:w-20
        md:h-20
        rounded-full
        flex
        items-center
        justify-center
        shadow-xl
        focus:outline-none
        focus:ring-4
        focus:ring-blue-300
        focus:ring-opacity-50
        z-50
        backdrop-blur-sm
        ${isRecording 
          ? 'bg-gradient-to-br from-red-500 to-red-600 border-2 border-red-400' 
          : isProcessing 
            ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 border-2 border-yellow-300'
            : 'bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-blue-400 hover:from-blue-600 hover:to-blue-700'}
        transition-all
        duration-300
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
      {/* Icono de micrófono con animación */}
      <motion.div
        className="relative z-10"
        animate={{
          scale: isRecording ? [1, 1.2, 1] : 1,
          rotate: isProcessing ? [0, 180, 360] : 0
        }}
        transition={{
          scale: {
            duration: 0.5,
            repeat: isRecording ? Infinity : 0,
            ease: "easeInOut"
          },
          rotate: {
            duration: 2,
            repeat: isProcessing ? Infinity : 0,
            ease: "linear"
          }
        }}
      >
        <svg
          className={`
            w-8
            h-8
            ${isRecording ? 'text-white' : 'text-white'}
            drop-shadow-lg
            transition-all
            duration-300
          `}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          {isProcessing ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
            />
          )}
        </svg>
      </motion.div>

      {/* Efectos de grabación */}
      <AnimatePresence>
        {isRecording && (
          <>
            {/* Ondas de audio */}
            <motion.div 
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border-4 border-white/30"
                  animate={{
                    scale: [1, 1.5 + (audioLevel * (i + 1))],
                    opacity: [0.6, 0]
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                    delay: i * 0.3,
                    ease: "easeOut"
                  }}
                />
              ))}
            </motion.div>

            {/* Indicador de nivel de audio */}
            <motion.div 
              className="absolute inset-4 rounded-full overflow-hidden bg-white/10"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <motion.div
                className="absolute bottom-0 w-full bg-white/20"
                animate={{
                  height: `${Math.min(100, audioLevel * 100)}%`
                }}
                transition={{
                  duration: 0.1
                }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Animación de procesamiento mejorada */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="w-12 h-12 rounded-full"
              style={{
                background: 'conic-gradient(from 0deg, transparent, rgba(255,255,255,0.8))'
              }}
              animate={{ 
                rotate: 360,
                scale: [0.8, 1, 0.8]
              }}
              transition={{
                rotate: {
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear"
                },
                scale: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mensaje de error mejorado */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-red-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-sm whitespace-nowrap shadow-lg border border-red-400/50"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{
              duration: 0.2,
              ease: "easeOut"
            }}
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default PTTButton;
