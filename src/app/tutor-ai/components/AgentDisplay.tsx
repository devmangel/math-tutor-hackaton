import React from 'react';
import Avatar from './Avatar';

interface AgentDisplayProps {
  agentName: string;
  agentDescription: string;
  agentAvatarUrl?: string;
  className?: string;
}

const AgentDisplay: React.FC<AgentDisplayProps> = ({
  agentName,
  agentDescription,
  agentAvatarUrl,
  className = '',
}) => {
  return (
    <div 
      className={`
        flex
        items-center
        gap-4
        p-4
        bg-content-background
        border-b
        border-light-gray
        shadow-sm
        agent-display
        ${className}
      `}
    >
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
  );
};

export default AgentDisplay;
