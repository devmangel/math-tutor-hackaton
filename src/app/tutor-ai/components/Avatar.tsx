import React from 'react';

interface AvatarProps {
  imageUrl?: string;
  characterName?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  imageUrl,
  characterName = '',
  size = 'medium',
  className = '',
}) => {
  // Mapeo de tamaños a clases de Tailwind
  const sizeClasses = {
    small: 'w-8 h-8 text-sm avatar-small',
    medium: 'w-12 h-12 text-base avatar-medium',
    large: 'w-16 h-16 text-lg avatar-large',
  };

  // Si hay una imagen, mostrarla
  if (imageUrl) {
    return (
      <div className={`relative rounded-full overflow-hidden ${sizeClasses[size]} ${className}`}>
        <img
          src={imageUrl}
          alt={characterName || 'Avatar'}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Si no hay imagen pero hay nombre, mostrar las iniciales
  if (characterName) {
    const initials = characterName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    // Color de fondo basado en el tipo de personaje
    const bgColorClass = characterName.toLowerCase().includes('ana')
      ? 'bg-agent-ana'
      : characterName.toLowerCase().includes('takeshi')
      ? 'bg-agent-takeshi'
      : characterName.toLowerCase().includes('sócrates')
      ? 'bg-agent-socrates'
      : 'bg-primary';

    return (
      <div
        className={`
          ${sizeClasses[size]}
          ${bgColorClass}
          ${className}
          rounded-full
          flex
          items-center
          justify-center
          text-text-on-primary
          font-semibold
        `}
      >
        {initials}
      </div>
    );
  }

  // Fallback: mostrar un placeholder
  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${className}
        rounded-full
        bg-light-gray
        flex
        items-center
        justify-center
      `}
    >
      <svg
        className="w-1/2 h-1/2 text-medium-gray"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    </div>
  );
};

export default Avatar;
