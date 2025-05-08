import React, { useEffect, useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { TutorProvider, useTutor, tutorActions } from './contexts/TutorContext';
import { TranscriptProvider } from '../contexts/TranscriptContext';
import { EventProvider, useEvent } from '../contexts/EventContext';
import { AgentConfig } from '../types';
import AgentDisplay from './components/AgentDisplay';
import ChatInterface from './components/ChatInterface';
import UserInput from './components/UserInput';
import PTTButton from './components/PTTButton';
import TranscriptionToggle from './components/TranscriptionToggle';
import { createRealtimeConnection } from '../lib/realtimeConnection';
import { useHandleServerEvent } from '../hooks/useHandleServerEvent';
import useAudioDownload from '../hooks/useAudioDownload';

// Componente interno que usa el contexto
const TutorContent: React.FC = () => {
  const { state, dispatch } = useTutor();
  const [showTranscription, setShowTranscription] = useState(false);
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const MAX_RETRIES = 3;

  // Initialize the recording hook
  const { startRecording, stopRecording } = useAudioDownload();

  // Importar la configuración de agentes
  const [selectedAgentConfig, setSelectedAgentConfig] = useState<AgentConfig | null>(null);

  const { logClientEvent } = useEvent();

  const sendClientEvent = async (eventObj: any, eventNameSuffix = "") => {
    if (!dcRef.current || dcRef.current.readyState !== "open") {
      console.error("Canal de datos no disponible");
      logClientEvent(
        { attemptedEvent: eventObj.type },
        "error.data_channel_not_open"
      );
      await handleConnectionLost();
      return;
    }

    try {
      logClientEvent(eventObj, eventNameSuffix);
      dcRef.current.send(JSON.stringify(eventObj));
    } catch (error) {
      console.error("Error al enviar evento:", error);
      await handleConnectionLost();
    }
  };

  const handleServerEventRef = useHandleServerEvent({
    setSessionStatus: (status) => dispatch(tutorActions.setSessionStatus(status)),
    selectedAgentName: state.currentAgent?.name || '',
    selectedAgentConfigSet: [selectedAgentConfig].filter(Boolean) as AgentConfig[],
    sendClientEvent,
    setSelectedAgentName: (name) => {
      if (selectedAgentConfig && name !== selectedAgentConfig.name) {
        // TODO: Implementar cambio de agente cuando se necesite
        console.log('Cambio de agente solicitado:', name);
      }
    },
    setIsOutputAudioBufferActive: () => {},
  });

  // Inicializar con el agente Ana y conectar al montar el componente
  useEffect(() => {
    const loadAgent = async () => {
      try {
        const { default: mathTutors } = await import('./agentConfigs/mathTutors');
        const onboardingAgent = mathTutors[0]; // El primer agente es el onboarding
        setSelectedAgentConfig(onboardingAgent);
        
        if (!state.currentAgent) {
          dispatch(
            tutorActions.setCurrentAgent({
              name: onboardingAgent.publicDescription.split(' - ')[0], // "Ana"
              description: onboardingAgent.publicDescription.split(' - ')[1], // Descripción
              instructions: onboardingAgent.instructions,
            })
          );

          connectToRealtime();
        }
      } catch (error) {
        console.error('Error loading agent config:', error);
      }
    };

    loadAgent();
  }, []);

  const fetchEphemeralKey = async (): Promise<string | null> => {
    const tokenResponse = await fetch("/api/session");
    const data = await tokenResponse.json();

    if (!data.client_secret?.value) {
      console.error("No ephemeral key provided by the server");
      dispatch(tutorActions.setSessionStatus('DISCONNECTED'));
      return null;
    }

    return data.client_secret.value;
  };

  const handleConnectionLost = async () => {
    if (retryCount < MAX_RETRIES) {
      console.log(`Reintentando conexión (${retryCount + 1}/${MAX_RETRIES})...`);
      setRetryCount(prev => prev + 1);
      dispatch(tutorActions.setSessionStatus('DISCONNECTED'));
      await connectToRealtime();
    } else {
      console.error("Máximo número de reintentos alcanzado");
      dispatch(tutorActions.setSessionStatus('DISCONNECTED'));
    }
  };

  const initializeOnboardingAgent = async () => {
    try {
      const { default: mathTutors } = await import('./agentConfigs/mathTutors');
      const onboardingAgent = mathTutors[0];
      
      if (!onboardingAgent) {
        throw new Error('No se pudo cargar el agente de onboarding');
      }

      setSelectedAgentConfig(onboardingAgent);
      
      dispatch(
        tutorActions.setCurrentAgent({
          name: onboardingAgent.publicDescription.split(' - ')[0],
          description: onboardingAgent.publicDescription.split(' - ')[1],
          instructions: onboardingAgent.instructions,
        })
      );

      // Mensaje de bienvenida
      dispatch(
        tutorActions.addMessage({
          text: '¡Hola! Soy Ana, tu guía para el aprendizaje de matemáticas. Me gustaría conocerte mejor para personalizar tu experiencia de aprendizaje. ¿Cómo te gustaría que te llame?',
          sender: 'agent',
          characterName: 'Ana',
        })
      );

      // Actualizar la sesión con la configuración del agente
      updateSession(true);
      
      console.log('Agente de onboarding inicializado:', onboardingAgent.name);
      
    } catch (error) {
      console.error('Error al inicializar el agente:', error);
      await handleConnectionLost();
    }
  };

  const connectToRealtime = async () => {
    if (state.sessionStatus === 'CONNECTING') return;
    
    try {
      dispatch(tutorActions.setSessionStatus('CONNECTING'));
      
      const EPHEMERAL_KEY = await fetchEphemeralKey();
      if (!EPHEMERAL_KEY) {
        throw new Error('No se pudo obtener la clave efímera');
      }

      if (!audioElementRef.current) {
        audioElementRef.current = document.createElement("audio");
      }
      audioElementRef.current.autoplay = state.isAudioPlaybackEnabled;

      const { pc, dc } = await createRealtimeConnection(
        EPHEMERAL_KEY,
        audioElementRef,
        'opus'
      );

      pcRef.current = pc;
      dcRef.current = dc;

      // Manejar eventos del canal de datos
      dc.addEventListener("open", () => {
        console.log("Canal de datos abierto");
        dispatch(tutorActions.setSessionStatus('CONNECTED'));
        setRetryCount(0); // Resetear contador de reintentos
        initializeOnboardingAgent();
      });

      dc.addEventListener("close", () => {
        console.log("Canal de datos cerrado");
        handleConnectionLost();
      });

      dc.addEventListener("message", (e: MessageEvent) => {
        handleServerEventRef.current(JSON.parse(e.data));
      });

      setDataChannel(dc);
    } catch (err) {
      console.error("Error en la conexión:", err);
      await handleConnectionLost();
    }
  };

  const updateSession = (shouldTriggerResponse: boolean = false) => {
    sendClientEvent(
      { type: "input_audio_buffer.clear" },
      "clear audio buffer on session update"
    );

    const currentAgent = state.currentAgent;

    const sessionUpdateEvent = {
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
        instructions: selectedAgentConfig?.instructions || "",
        voice: selectedAgentConfig?.voice || "nova",
        input_audio_transcription: { model: "whisper-1" },
        turn_detection: null,
        tools: selectedAgentConfig?.tools || [],
      },
    };

    sendClientEvent(sessionUpdateEvent);

    // No necesitamos enviar un mensaje inicial, el agente comenzará con su saludo
    if (shouldTriggerResponse) {
      sendClientEvent({ type: "response.create" }, "(trigger initial response)");
    }
  };

  const handleSubmit = (text: string) => {
    if (!text.trim()) return;
    
    // Añadir mensaje del usuario
    dispatch(
      tutorActions.addMessage({
        text,
        sender: 'user',
      })
    );

    const id = uuidv4().slice(0, 32);
    sendClientEvent(
      {
        type: "conversation.item.create",
        item: {
          id,
          type: "message",
          role: "user",
          content: [{ type: "input_text", text }],
        },
      },
      "(send user text message)"
    );
    sendClientEvent({ type: "response.create" }, "(trigger response)");
  };

  const handlePTTStart = () => {
    if (state.sessionStatus !== 'CONNECTED' || !dataChannel?.readyState) return;
    
    dispatch(tutorActions.setRecording(true));
    sendClientEvent({ type: "input_audio_buffer.clear" }, "clear PTT buffer");
    
    if (audioElementRef.current?.srcObject) {
      const remoteStream = audioElementRef.current.srcObject as MediaStream;
      startRecording(remoteStream);
    }
  };

  const handlePTTEnd = () => {
    if (
      state.sessionStatus !== 'CONNECTED' ||
      !dataChannel?.readyState ||
      !state.isRecording
    )
      return;

    dispatch(tutorActions.setRecording(false));
    stopRecording();
    
    sendClientEvent({ type: "input_audio_buffer.commit" }, "commit PTT");
    sendClientEvent({ type: "response.create" }, "trigger response PTT");
  };

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (pcRef.current) {
        pcRef.current.getSenders().forEach((sender) => {
          if (sender.track) {
            sender.track.stop();
          }
        });
        pcRef.current.close();
      }
      stopRecording();
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header con información del agente */}
      {state.currentAgent && (
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
          onSubmit={handleSubmit}
          disabled={state.isProcessing}
          className="flex-shrink-0"
        />
      )}

      {/* Botón PTT */}
      <PTTButton
        isRecording={state.isRecording}
        isProcessing={state.isProcessing}
        onPressStart={handlePTTStart}
        onPressEnd={handlePTTEnd}
        sessionStatus={state.sessionStatus}
      />
    </div>
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
