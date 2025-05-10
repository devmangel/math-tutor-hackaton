'use client';

import React, { useState } from 'react';
import { TutorProvider, useTutor, tutorActions } from './contexts/TutorContext';
import { TranscriptProvider } from '../contexts/TranscriptContext';
import { EventProvider } from '../contexts/EventContext';
import AgentDisplay from './components/AgentDisplay';
import ChatInterface from './components/ChatInterface';
import UserInput from './components/UserInput';
import PTTButton from './components/PTTButton';
import TranscriptionToggle from './components/TranscriptionToggle';
import { RealtimeAgentView } from '../components/RealtimeAgentView';
import { SessionStatus } from '../types';
import { TutorContentProps } from '../types/tutor';

// Componente interno que maneja la UI
const TutorContent = () => {
  const { state, dispatch } = useTutor();
  const [showTranscription, setShowTranscription] = useState(false);

  const handleConnectionStatusChange = (status: SessionStatus) => {
    dispatch(tutorActions.setSessionStatus(status));
  };

  const handleDataChannelMessage = (data: any) => {
    // Aquí puedes manejar los mensajes del canal de datos si es necesario
  };

  const TutorUI = React.memo((props: TutorContentProps) => (
    <div className="flex flex-col h-full bg-background">
      {/* Header con información del agente */}
      {state.currentAgent && props.sessionStatus !== 'DISCONNECTED' && (
        <AgentDisplay
          agentName={state.currentAgent.name}
          agentDescription={state.currentAgent.description}
          agentAvatarUrl={state.currentAgent.avatarUrl}
          className="flex-shrink-0"
        />
      )}

      {/* Toggle de transcripción */}
      <TranscriptionToggle
        isVisible={showTranscription}
        onToggle={() => setShowTranscription(!showTranscription)}
      />

      {/* Área de chat (solo visible si showTranscription es true) */}
      {showTranscription && (
        <ChatInterface
          messages={state.messages}
          className="flex-grow"
        />
      )}

      {/* Input de texto (solo visible si showTranscription es true) */}
      {showTranscription && (
        <UserInput
          onSubmit={props.handleSendMessage}
          disabled={props.isProcessing}
          className="flex-shrink-0"
        />
      )}

      {/* Botón PTT */}
      <PTTButton
        isRecording={props.isRecording}
        isProcessing={props.isProcessing}
        onPressStart={props.handlePTTStart}
        onPressEnd={props.handlePTTEnd}
        sessionStatus={props.sessionStatus}
      />
    </div>
  ));

  return (
    <RealtimeAgentView
      onConnectionStatusChange={handleConnectionStatusChange}
      onDataChannelMessage={handleDataChannelMessage}
      className="flex flex-col h-full bg-background"
    >
      {(props: TutorContentProps) => <TutorUI {...props} />}
    </RealtimeAgentView>
  );
};

// Componente principal que provee el contexto
const TutorMainView: React.FC = () => {
  return (
    <EventProvider>
      <TranscriptProvider>
        <TutorProvider>
          <TutorContent />
        </TutorProvider>
      </TranscriptProvider>
    </EventProvider>
  );
};

export default TutorMainView;
