import React from 'react';

interface TranscriptionToggleProps {
  isVisible: boolean;
  onToggle: () => void;
  className?: string;
}

const TranscriptionToggle: React.FC<TranscriptionToggleProps> = ({
  isVisible,
  onToggle,
  className = '',
}) => {
  return (
    <button
      onClick={onToggle}
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
        ${isVisible 
          ? 'bg-primary text-text-on-primary'
          : 'bg-surface/80 text-text-primary hover:bg-surface'
        }
        shadow-md
        focus:outline-none
        focus:ring-2
        focus:ring-primary
        focus:ring-offset-2
        transition-all
        duration-200
        ease-in-out
        hover:-translate-y-0.5
        active:translate-y-0
        ${className}
      `}
      aria-label={isVisible ? 'Ocultar transcripción' : 'Mostrar transcripción'}
    >
      {/* Icono de texto/transcripción */}
      <svg
        className="w-5 h-5"
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
      
      {/* Texto del botón */}
      <span className="text-sm font-medium">
        {isVisible ? 'Ocultar texto' : 'Ver texto'}
      </span>

      {/* Indicador de estado */}
      <div
        className={`
          w-2
          h-2
          rounded-full
          transition-colors
          duration-300
          ${isVisible ? 'bg-success' : 'bg-medium-gray'}
        `}
      />
    </button>
  );
};

export default TranscriptionToggle;
