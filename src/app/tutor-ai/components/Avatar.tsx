import React from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';

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
    small: 'w-8 h-8 text-xs avatar-small',
    medium: 'w-12 h-12 text-sm avatar-medium',
    large: 'w-16 h-16 text-base avatar-large',
  };

  const ringClasses = {
    small: 'ring-2',
    medium: 'ring-[3px]',
    large: 'ring-4',
  };

  // Si hay una imagen, mostrarla
  if (imageUrl) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        className={`
          relative 
          rounded-full 
          overflow-hidden 
          ${sizeClasses[size]} 
          ${className}
          ring-offset-2
          ring-blue-400/50
          ${ringClasses[size]}
          shadow-lg
          transition-shadow
          duration-300
          hover:shadow-xl
          hover:ring-blue-500/50
        `}
      >
        <img
          src={imageUrl}
          alt={characterName || 'Avatar'}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(characterName || 'U')}&background=random`;
          }}
        />
      </motion.div>
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

    // Gradientes basados en el tipo de personaje
    const gradientClass = characterName.toLowerCase().includes('sensei')
      ? 'from-purple-500 to-indigo-600'
      : characterName.toLowerCase().includes('sócrates')
      ? 'from-blue-500 to-cyan-600'
      : characterName.toLowerCase().includes('onboarding')
      ? 'from-green-500 to-emerald-600'
      : 'from-blue-500 to-blue-600';

    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        className={`
          ${sizeClasses[size]}
          ${className}
          rounded-full
          flex
          items-center
          justify-center
          text-white
          font-semibold
          bg-gradient-to-br
          ${gradientClass}
          shadow-lg
          transition-shadow
          duration-300
          hover:shadow-xl
          ring-offset-2
          ring-blue-400/50
          ${ringClasses[size]}
          backdrop-blur-sm
        `}
      >
        {initials}
      </motion.div>
    );
  }

  // Fallback: mostrar un placeholder con animación
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      className={`
        ${sizeClasses[size]}
        ${className}
        rounded-full
        bg-gradient-to-br
        from-gray-100
        to-gray-200
        flex
        items-center
        justify-center
        shadow-sm
        transition-all
        duration-300
        hover:shadow-md
        hover:from-gray-200
        hover:to-gray-300
        ring-1
        ring-gray-200
        ring-offset-2
      `}
    >
      <User 
        className="w-1/2 h-1/2 text-gray-400 transition-colors duration-300 group-hover:text-gray-500" 
        strokeWidth={1.5}
      />
    </motion.div>
  );
};

export default Avatar;
