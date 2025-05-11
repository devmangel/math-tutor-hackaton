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

const PTTButton: React.FC<PTTButtonProps> = ({
  isRecording,
  isProcessing,
  onPressStart,
  onPressEnd,
  className = '',
  sessionStatus = 'CONNECTED',
}) => {
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
        relative
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
      disabled={isProcessing || sessionStatus !== 'CONNECTED'}
      aria-label={
        isProcessing 
          ? 'Procesando audio...' 
          : isRecording 
            ? 'Suelta para enviar mensaje' 
            : 'Mantén presionado para hablar'
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
        {/* Icono de micrófono siempre visible */}
        <svg
          className={`
            w-8
            h-8
            text-white
            drop-shadow-lg
            transition-all
            duration-300
          `}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 18a4 4 0 004-4V7a4 4 0 10-8 0v7a4 4 0 004 4zm6-4v-1a6 6 0 00-12 0v1m6 4v2m-4 0h8"
          />
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

      {/* Tooltip y mensajes de estado */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="absolute -top-16 left-1/2 transform -translate-x-1/2 
              px-4 py-2 rounded-xl text-sm whitespace-nowrap shadow-lg
              backdrop-blur-sm border bg-red-500/90 text-white border-red-400/50"
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
