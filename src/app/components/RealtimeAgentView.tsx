'use client';

import React, { useRef } from 'react';
import { useRealtimeConnection } from '../hooks/realtime/useRealtimeConnection';
import { useAgentConfig } from '../hooks/realtime/useAgentConfig';
import { useSessionState } from '../hooks/realtime/useSessionState';
import { useHandleServerEvent } from '../hooks/useHandleServerEvent';
import useAudioDownload from '../hooks/useAudioDownload';
import { AgentConfig, SessionStatus } from '../types';
import { TutorContentProps } from '../types/tutor';

interface RealtimeAgentViewProps {
  children: (props: TutorContentProps) => React.ReactElement;
  onConnectionStatusChange?: (status: SessionStatus) => void;
  onDataChannelMessage?: (data: any) => void;
  className?: string;
}

export function RealtimeAgentView({
  children,
  onConnectionStatusChange,
  onDataChannelMessage,
  className = ''
}: RealtimeAgentViewProps) {
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const { startRecording, stopRecording } = useAudioDownload();

  // Configuración del agente
  const {
    selectedAgentName,
    selectedAgentConfigSet,
    agentSetKey,
    setSelectedAgentName,
    handleAgentChange,
    handleSelectedAgentChange
  } = useAgentConfig();

  // Conexión WebRTC
  const {
    sessionStatus,
    dataChannel,
    connectToRealtime,
    disconnectFromRealtime,
    sendEvent
  } = useRealtimeConnection({
    audioElement: audioElementRef,
    codec: 'opus',
    onConnectionStatusChange,
    onDataChannelMessage
  });

  // Estado de la sesión
  const {
    isPTTActive,
    setIsPTTActive,
    isAudioPlaybackEnabled,
    setIsAudioPlaybackEnabled,
    isOutputAudioBufferActive,
    setIsOutputAudioBufferActive,
    updateSession,
    cancelAssistantSpeech
  } = useSessionState({
    selectedAgentConfigSet,
    selectedAgentName,
    sendEvent
  });

  // Inicializar y mantener la conexión
  React.useEffect(() => {
    let isActive = true;
    let retryCount = 0;
    const MAX_RETRIES = 3;
    const INITIAL_RETRY_DELAY = 1000;

    const initConnection = async () => {
      if (!isActive) return;
      try {
        await connectToRealtime();
        retryCount = 0; // Resetear contador de intentos si la conexión es exitosa
      } catch (error) {
        console.error("Error al conectar:", error);
        if (retryCount < MAX_RETRIES && isActive) {
          const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
          console.log(`Reintentando conexión en ${delay/1000} segundos (${retryCount + 1}/${MAX_RETRIES})...`);
          setTimeout(initConnection, delay);
          retryCount++;
        }
      }
    };

    initConnection();

    return () => {
      isActive = false;
      disconnectFromRealtime();
    };
  }, []);

  // Manejar reconexión cuando el estado de la conexión cambia
  React.useEffect(() => {
    if (sessionStatus === 'DISCONNECTED') {
      connectToRealtime();
    }
  }, [sessionStatus]);

  // Actualizar la sesión cuando cambie el agente
  React.useEffect(() => {
    if (sessionStatus === 'CONNECTED' && selectedAgentConfigSet) {
      updateSession(true);
    }
  }, [sessionStatus, selectedAgentConfigSet]);

  // Manejo de eventos del servidor
  useHandleServerEvent({
    setSessionStatus: onConnectionStatusChange || (() => {}),
    selectedAgentName,
    selectedAgentConfigSet: selectedAgentConfigSet ? [selectedAgentConfigSet[0]] : [],
    sendClientEvent: sendEvent,
    setSelectedAgentName,
    setIsOutputAudioBufferActive
  });

  // Funciones de manejo de PTT
  const handlePTTStart = () => {
    if (sessionStatus !== 'CONNECTED' || !dataChannel?.readyState) return;
    
    cancelAssistantSpeech();
    sendEvent({ type: "input_audio_buffer.clear" }, "clear PTT buffer");
    
    if (audioElementRef.current?.srcObject) {
      const remoteStream = audioElementRef.current.srcObject as MediaStream;
      startRecording(remoteStream);
    }
  };

  const handlePTTEnd = () => {
    if (sessionStatus !== 'CONNECTED' || !dataChannel?.readyState) return;

    stopRecording();
    sendEvent({ type: "input_audio_buffer.commit" }, "commit PTT");
    sendEvent({ type: "response.create" }, "trigger response PTT");
  };

  // Función para enviar mensajes de texto
  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;
    
    cancelAssistantSpeech();
    sendEvent(
      {
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text: text.trim() }],
        },
      },
      "(send user text message)"
    );
    sendEvent({ type: "response.create" }, "(trigger response)");
  };

  const isRecording = sessionStatus === 'CONNECTED' && dataChannel?.readyState === 'open' && isPTTActive;
  const isProcessing = sessionStatus === 'CONNECTING' || (sessionStatus === 'CONNECTED' && isOutputAudioBufferActive);

  // Memoizar las props para evitar re-renders innecesarios
  const childProps = React.useMemo(() => ({
    sessionStatus,
    handlePTTStart,
    handlePTTEnd,
    handleSendMessage,
    isRecording,
    isProcessing
  }), [
    sessionStatus,
    handlePTTStart,
    handlePTTEnd,
    handleSendMessage,
    isRecording,
    isProcessing
  ]);

  return (
    <div className={className}>
      {children(childProps)}
    </div>
  );
}
