import React, { useState, useEffect } from 'react';

interface TranscriptionToggleProps {
  isVisible: boolean;
  onToggle: () => void;
  className?: string;
}

const TransitionStates = {
  HIDDEN: 'hidden',
  SHOWING: 'showing',
  VISIBLE: 'visible',
  HIDING: 'hiding'
} as const;

type TransitionState = typeof TransitionStates[keyof typeof TransitionStates];

const TranscriptionToggle: React.FC<TranscriptionToggleProps> = ({
  isVisible,
  onToggle,
  className = '',
}) => {
  const [transitionState, setTransitionState] = useState<TransitionState>(
    isVisible ? TransitionStates.VISIBLE : TransitionStates.HIDDEN
  );

  useEffect(() => {
    if (isVisible && transitionState === TransitionStates.HIDDEN) {
      setTransitionState(TransitionStates.SHOWING);
      setTimeout(() => setTransitionState(TransitionStates.VISIBLE), 300);
    } else if (!isVisible && transitionState === TransitionStates.VISIBLE) {
      setTransitionState(TransitionStates.HIDING);
      setTimeout(() => setTransitionState(TransitionStates.HIDDEN), 300);
    }
  }, [isVisible]);

  const isAnimating = transitionState === TransitionStates.SHOWING || 
                     transitionState === TransitionStates.HIDING;
  return (
    <button
      onClick={onToggle}
      disabled={isAnimating}
      className={`
        fixed
        top-20
        right-4
        px-4
        py-2
        rounded-full
        flex
        items-center
        gap-2
        backdrop-blur-sm
        transcription-toggle
        z-40
        ${transitionState === TransitionStates.VISIBLE 
          ? 'bg-primary text-text-on-primary scale-100'
          : transitionState === TransitionStates.SHOWING
            ? 'bg-primary text-text-on-primary scale-105'
            : transitionState === TransitionStates.HIDING
              ? 'bg-surface/80 text-text-primary scale-95'
              : 'bg-surface/80 text-text-primary hover:bg-surface scale-100'
        }
        shadow-md
        focus:outline-none
        focus:ring-2
        focus:ring-primary
        focus:ring-offset-2
        transition-all
        duration-300
        ease-in-out
        hover:-translate-y-0.5
        active:translate-y-0
        disabled:cursor-wait
        ${className}
      `}
      aria-label={isVisible ? 'Ocultar transcripción' : 'Mostrar transcripción'}
    >
      {/* Icono de texto/transcripción con animación */}
      <svg
        className={`
          w-5 
          h-5 
          transition-transform 
          duration-300
          ${transitionState === TransitionStates.SHOWING ? 'rotate-180 scale-110' : 
            transitionState === TransitionStates.HIDING ? 'rotate-180 scale-90' : 
            'rotate-0 scale-100'}
        `}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      
      {/* Texto del botón con animación */}
      <span className={`
        text-sm 
        font-medium
        transition-all
        duration-300
        ${transitionState === TransitionStates.SHOWING ? 'opacity-0 scale-95' :
          transitionState === TransitionStates.HIDING ? 'opacity-0 scale-105' :
          'opacity-100 scale-100'}
      `}>
        {transitionState === TransitionStates.VISIBLE ? 'Ocultar texto' : 'Ver texto'}
      </span>

      {/* Indicador de estado con animación */}
      <div className="relative w-2 h-2">
        <div
          className={`
            absolute
            inset-0
            rounded-full
            transition-all
            duration-300
            ${transitionState === TransitionStates.VISIBLE || transitionState === TransitionStates.SHOWING
              ? 'bg-success scale-100 opacity-100'
              : 'bg-medium-gray scale-0 opacity-0'
            }
          `}
        />
        <div
          className={`
            absolute
            inset-0
            rounded-full
            bg-success
            animate-ping
            ${transitionState === TransitionStates.VISIBLE ? 'opacity-75' : 'opacity-0'}
          `}
        />
      </div>
    </button>
  );
};

export default TranscriptionToggle;
