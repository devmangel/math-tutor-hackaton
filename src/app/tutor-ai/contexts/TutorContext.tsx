import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Tipos
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp?: string;
  avatarUrl?: string;
  characterName?: string;
  isCode?: boolean;
  codeLanguage?: string;
}

interface Agent {
  name: string;
  description: string;
  avatarUrl?: string;
  instructions?: string;
  voice?: string;
}

interface TutorState {
  currentAgent: Agent | null;
  messages: Message[];
  isProcessing: boolean;
  sessionStatus: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED';
  isRecording: boolean;
  isAudioPlaybackEnabled: boolean;
  sessionProgress: number;
  currentStep: number;
  totalSteps: number;
}

type TutorAction =
  | { type: 'SET_CURRENT_AGENT'; payload: Agent }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_SESSION_STATUS'; payload: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' }
  | { type: 'SET_RECORDING'; payload: boolean }
  | { type: 'SET_AUDIO_PLAYBACK'; payload: boolean }
  | { type: 'SET_SESSION_PROGRESS'; payload: { progress: number; currentStep: number; totalSteps: number } }
  | { type: 'CLEAR_MESSAGES' };

// Contexto
const TutorContext = createContext<{
  state: TutorState;
  dispatch: React.Dispatch<TutorAction>;
} | null>(null);

// Reducer
const tutorReducer = (state: TutorState, action: TutorAction): TutorState => {
  switch (action.type) {
    case 'SET_SESSION_PROGRESS':
      return {
        ...state,
        sessionProgress: action.payload.progress,
        currentStep: action.payload.currentStep,
        totalSteps: action.payload.totalSteps,
      };
    case 'SET_CURRENT_AGENT':
      return {
        ...state,
        currentAgent: action.payload,
      };
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    case 'SET_PROCESSING':
      return {
        ...state,
        isProcessing: action.payload,
      };
    case 'SET_SESSION_STATUS':
      return {
        ...state,
        sessionStatus: action.payload,
      };
    case 'SET_RECORDING':
      return {
        ...state,
        isRecording: action.payload,
      };
    case 'SET_AUDIO_PLAYBACK':
      return {
        ...state,
        isAudioPlaybackEnabled: action.payload,
      };
    case 'CLEAR_MESSAGES':
      return {
        ...state,
        messages: [],
      };
    default:
      return state;
  }
};

// Provider
export const TutorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(tutorReducer, {
    currentAgent: null,
    messages: [],
    isProcessing: false,
    sessionStatus: 'DISCONNECTED',
    isRecording: false,
    isAudioPlaybackEnabled: true,
    sessionProgress: 0,
    currentStep: 0,
    totalSteps: 0,
  });

  return (
    <TutorContext.Provider value={{ state, dispatch }}>
      {children}
    </TutorContext.Provider>
  );
};

// Hook personalizado
export const useTutor = () => {
  const context = useContext(TutorContext);
  if (!context) {
    throw new Error('useTutor debe ser usado dentro de un TutorProvider');
  }
  return context;
};

// Acciones helper
export const tutorActions = {
  setCurrentAgent: (agent: Agent): TutorAction => ({
    type: 'SET_CURRENT_AGENT',
    payload: agent,
  }),
  
  addMessage: (message: Omit<Message, 'id'>): TutorAction => ({
    type: 'ADD_MESSAGE',
    payload: {
      ...message,
      id: Date.now().toString(), // Generar ID único
      timestamp: new Date().toLocaleTimeString(), // Añadir timestamp actual
    },
  }),
  
  setProcessing: (isProcessing: boolean): TutorAction => ({
    type: 'SET_PROCESSING',
    payload: isProcessing,
  }),

  setSessionStatus: (status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'): TutorAction => ({
    type: 'SET_SESSION_STATUS',
    payload: status,
  }),

  setRecording: (isRecording: boolean): TutorAction => ({
    type: 'SET_RECORDING',
    payload: isRecording,
  }),

  setAudioPlayback: (enabled: boolean): TutorAction => ({
    type: 'SET_AUDIO_PLAYBACK',
    payload: enabled,
  }),
  
  setSessionProgress: (progress: number, currentStep: number, totalSteps: number): TutorAction => ({
    type: 'SET_SESSION_PROGRESS',
    payload: {
      progress: Math.min(100, Math.max(0, progress)),
      currentStep,
      totalSteps
    }
  }),

  clearMessages: (): TutorAction => ({
    type: 'CLEAR_MESSAGES',
  }),
};

export type { Message, Agent, TutorState, TutorAction };
