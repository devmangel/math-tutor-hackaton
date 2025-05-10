'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TutorProvider, useTutor } from './contexts/TutorContext';
import { TranscriptProvider } from '../contexts/TranscriptContext';
import { EventProvider } from '../contexts/EventContext';
import AgentDisplay from './components/AgentDisplay';
import ChatInterface from './components/ChatInterface';
import UserInput from './components/UserInput';
import PTTButton from './components/PTTButton';
import { SessionStatus } from '../types';

interface TutorUIProps {
  sessionStatus: SessionStatus;
  userText: string;
  setUserText: (text: string) => void;
  handleSendMessage: () => void;
  isProcessing: boolean;
  isRecording: boolean;
  handlePTTStart: () => void;
  handlePTTEnd: () => void;
  downloadRecording: () => void;
}

const TutorContent: React.FC<TutorUIProps> = ({
  userText,
  setUserText,
  handleSendMessage,
  isProcessing,
  isRecording,
  handlePTTStart,
  handlePTTEnd,
  downloadRecording,
  sessionStatus
}) => {
  const { state } = useTutor();

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header con información del agente */}
      {state.currentAgent && sessionStatus !== 'DISCONNECTED' && (
        <AgentDisplay
          agentName={state.currentAgent.name}
          agentDescription={state.currentAgent.description}
          agentAvatarUrl={state.currentAgent.avatarUrl}
          agentRole={state.currentAgent.name.toLowerCase().includes('sensei') ? 'sensei' : 
                    state.currentAgent.name.toLowerCase().includes('socrates') ? 'mayeutic' : 
                    state.currentAgent.name.toLowerCase().includes('onboarding') ? 'onboarding' : undefined}
          progress={state.sessionProgress || 0}
          className="flex-shrink-0"
        />
      )}

      {/* Área de chat */}
      <ChatInterface
        messages={state.messages}
        className="flex-grow"
      />

      {/* Input de texto */}
      <UserInput
        value={userText}
        onChange={setUserText}
        onSubmit={handleSendMessage}
        disabled={isProcessing}
        placeholder="Escribe un mensaje..."
        className="flex-shrink-0"
      />

      {/* Botón PTT con feedback visual */}
      <AnimatePresence>
        <div className="relative">
        <PTTButton
          isRecording={isRecording}
          isProcessing={isProcessing}
          onPressStart={handlePTTStart}
          onPressEnd={handlePTTEnd}
          sessionStatus={sessionStatus}
        />
        
        {/* Tooltip de estado */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-3 py-1 rounded text-sm whitespace-nowrap"
        >
          {sessionStatus === 'CONNECTING' ? 'Conectando...' :
           sessionStatus === 'DISCONNECTED' ? 'Reconectando...' :
           isProcessing ? 'Procesando audio...' :
           isRecording ? 'Suelta para enviar' :
           'Mantén presionado para hablar'}
        </motion.div>
        </div>
      </AnimatePresence>

      {/* Botón de descarga con animación */}
      <motion.button
        onClick={downloadRecording}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-24 right-4 p-2 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 transition-colors"
        title="Descargar grabación"
      >
        <motion.svg 
          className="w-6 h-6" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          animate={{ y: [0, 2, 0] }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </motion.svg>
      </motion.button>
    </div>
  );
};

const TutorMainView: React.FC<TutorUIProps> = (props) => {
  return (
    <EventProvider>
      <TranscriptProvider>
        <TutorProvider>
          <TutorContent {...props} />
        </TutorProvider>
      </TranscriptProvider>
    </EventProvider>
  );
};

export default TutorMainView;
