import React from 'react';
import Avatar from './Avatar';

interface AgentDisplayProps {
  agentName: string;
  agentDescription: string;
  agentAvatarUrl?: string;
  className?: string;
  agentRole?: 'onboarding' | 'sensei' | 'mayeutic';
  progress?: number;
}

// Función auxiliar para obtener el ícono y color según el rol
const getRoleStyles = (role?: 'onboarding' | 'sensei' | 'mayeutic') => {
  switch (role) {
    case 'onboarding':
      return {
        icon: '👋',
        color: 'text-blue-500',
        label: 'Onboarding'
      };
    case 'sensei':
      return {
        icon: '🎓',
        color: 'text-purple-500',
        label: 'Maestro Takeshi'
      };
    case 'mayeutic':
      return {
        icon: '🤔',
        color: 'text-green-500',
        label: 'Sócrates'
      };
    default:
      return {
        icon: '🤖',
        color: 'text-gray-500',
        label: 'Asistente'
      };
  }
};

const AgentDisplay: React.FC<AgentDisplayProps> = ({
  agentName,
  agentDescription,
  agentAvatarUrl,
  className = '',
  agentRole,
  progress = 0
}) => {
  const roleStyles = getRoleStyles(agentRole);
  return (
    <div 
      className={`
        flex
        flex-col
        bg-content-background
        border-b
        border-light-gray
        shadow-sm
        agent-display
        ${className}
      `}
    >
      {/* Barra superior con rol e ícono */}
      <div className={`
        w-full
        py-1
        px-4
        flex
        items-center
        justify-end
        gap-2
        text-sm
        ${roleStyles.color}
        border-b
        border-light-gray
      `}>
        <span>{roleStyles.label}</span>
        <span className="text-lg">{roleStyles.icon}</span>
      </div>

      {/* Contenido principal */}
      <div className="flex items-center gap-4 p-4">
        <Avatar
          imageUrl={agentAvatarUrl}
          characterName={agentName}
          size="large"
          className="flex-shrink-0"
        />
        
        <div className="flex-grow min-w-0">
          <h2 className="text-lg font-semibold text-foreground truncate">
            {agentName}
          </h2>
          <p className="text-sm text-medium-gray truncate">
            {agentDescription}
          </p>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="w-full h-1 bg-gray-200">
        <div 
          className="h-full bg-accent-2 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default AgentDisplay;
