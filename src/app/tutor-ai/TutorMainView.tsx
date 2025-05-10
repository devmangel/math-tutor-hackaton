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
    <div className="flex flex-col h-full bg-gradient-to-b from-blue-50/50 to-white/50 backdrop-blur-sm">
      {/* Contenedor principal con padding responsivo */}
      <div className="flex flex-col h-full max-w-6xl mx-auto w-full px-4 md:px-6 py-4 pb-36 md:pb-40">
        {/* Indicador de estado de conexión */}
        <motion.div 
          className="mb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className={`
            px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center gap-2
            shadow-sm backdrop-blur-sm border transition-all duration-300
            ${sessionStatus === 'CONNECTED' 
              ? 'bg-green-50/90 text-green-700 border-green-200/50' 
              : sessionStatus === 'CONNECTING' 
                ? 'bg-yellow-50/90 text-yellow-700 border-yellow-200/50' 
                : 'bg-red-50/90 text-red-700 border-red-200/50'}
          `}>
            <motion.div 
              className={`
                w-2 h-2 rounded-full
                ${sessionStatus === 'CONNECTED' 
                  ? 'bg-green-500' 
                  : sessionStatus === 'CONNECTING' 
                    ? 'bg-yellow-500' 
                    : 'bg-red-500'}
              `}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <span>
              {sessionStatus === 'CONNECTED' 
                ? 'Conectado' 
                : sessionStatus === 'CONNECTING' 
                  ? 'Conectando...' 
                  : 'Desconectado'}
            </span>
          </div>
        </motion.div>

        {/* Header con información del agente */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {state.currentAgent && sessionStatus !== 'DISCONNECTED' && (
            <AgentDisplay
              agentName={state.currentAgent.name}
              agentDescription={state.currentAgent.description}
              agentAvatarUrl={state.currentAgent.avatarUrl}
              agentRole={state.currentAgent.name.toLowerCase().includes('sensei') ? 'sensei' : 
                        state.currentAgent.name.toLowerCase().includes('socrates') ? 'mayeutic' : 
                        state.currentAgent.name.toLowerCase().includes('onboarding') ? 'onboarding' : undefined}
              progress={state.sessionProgress || 0}
              className="flex-shrink-0 rounded-xl bg-white/80 shadow-sm border border-gray-100 p-4 mb-4"
            />
          )}
        </motion.div>

        {/* Área de chat con animaciones */}
        <motion.div 
          className="flex-grow relative rounded-xl bg-white/80 shadow-sm border border-gray-100 mb-4 overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <ChatInterface
            messages={state.messages}
            className="h-full p-4"
          />
        </motion.div>

        {/* Área de input con animaciones */}
        <motion.div
          className="flex-shrink-0 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <UserInput
            value={userText}
            onChange={setUserText}
            onSubmit={handleSendMessage}
            disabled={isProcessing}
            placeholder="Escribe un mensaje..."
            className="w-full rounded-xl bg-white/80 shadow-sm border border-gray-100 transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200"
          />
        </motion.div>

        {/* Controles flotantes */}
        <div className="fixed bottom-0 left-0 right-0 flex flex-col items-center">
          {/* Contenedor de botones */}
          <div className="flex items-center gap-6 mb-8">
            <PTTButton
              isRecording={isRecording}
              isProcessing={isProcessing}
              onPressStart={handlePTTStart}
              onPressEnd={handlePTTEnd}
              sessionStatus={sessionStatus}
            />
            
            {/* Botón de descarga */}
            <motion.button
              onClick={downloadRecording}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 backdrop-blur-sm border-2 border-blue-400/30 hover:shadow-xl hover:shadow-blue-400/20"
              title="Descargar grabación"
            >
              <motion.svg 
                className="w-5 h-5" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                animate={{ 
                  y: [0, -2, 0],
                  scale: [1, 1.1, 1],
                  opacity: [1, 0.8, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
                />
              </motion.svg>
            </motion.button>
          </div>
        </div>
      </div>
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
