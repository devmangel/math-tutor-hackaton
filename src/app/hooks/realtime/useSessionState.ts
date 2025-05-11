import { useState, useEffect } from 'react';
import { AgentConfig } from '@/app/types';

interface UseSessionStateProps {
  selectedAgentConfigSet: AgentConfig[] | null;
  selectedAgentName: string;
  sendEvent: (eventObj: any, eventNameSuffix?: string) => boolean;
}

export function useSessionState({
  selectedAgentConfigSet,
  selectedAgentName,
  sendEvent
}: UseSessionStateProps) {
  const [isPTTActive, setIsPTTActive] = useState(false);
  const [isAudioPlaybackEnabled, setIsAudioPlaybackEnabled] = useState(true);
  const [isOutputAudioBufferActive, setIsOutputAudioBufferActive] = useState(false);

  useEffect(() => {
    // Cargar preferencias guardadas
    const storedPTT = localStorage.getItem("pushToTalkUI");
    if (storedPTT) {
      setIsPTTActive(storedPTT === "true");
    }

    const storedAudioPlayback = localStorage.getItem("audioPlaybackEnabled");
    if (storedAudioPlayback) {
      setIsAudioPlaybackEnabled(storedAudioPlayback === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("pushToTalkUI", isPTTActive.toString());
  }, [isPTTActive]);

  useEffect(() => {
    localStorage.setItem("audioPlaybackEnabled", isAudioPlaybackEnabled.toString());
  }, [isAudioPlaybackEnabled]);

  const updateSession = (shouldTriggerResponse: boolean = false) => {
    sendEvent(
      { type: "input_audio_buffer.clear" },
      "clear audio buffer on session update"
    );

    const currentAgent = selectedAgentConfigSet?.find(
      (a) => a.name === selectedAgentName
    );

    const turnDetection = isPTTActive
      ? null
      : {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 200,
          create_response: true,
        };

    const sessionUpdateEvent = {
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
        instructions: currentAgent?.instructions || "",
        voice: currentAgent?.voice || "nova",
        input_audio_transcription: { model: "whisper-1" },
        turn_detection: turnDetection,
        tools: currentAgent?.tools || [],
      },
    };

    sendEvent(sessionUpdateEvent);

    // Elimina el envío automático de mensajes simulados
    // if (shouldTriggerResponse) {
    //   sendSimulatedUserMessage("hi");
    // }
  };

  const sendSimulatedUserMessage = (text: string) => {
    sendEvent(
      {
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text }],
        },
      },
      "(simulated user text message)"
    );
    sendEvent({ type: "response.create" }, "(trigger response)");
  };

  const cancelAssistantSpeech = () => {
    if (isOutputAudioBufferActive) {
      sendEvent(
        { type: "output_audio_buffer.clear" },
        "(cancel due to user interruption)"
      );
    }
    sendEvent({ type: "response.cancel" }, "(cancel due to user interruption)");
  };

  return {
    isPTTActive,
    setIsPTTActive,
    isAudioPlaybackEnabled,
    setIsAudioPlaybackEnabled,
    isOutputAudioBufferActive,
    setIsOutputAudioBufferActive,
    updateSession,
    cancelAssistantSpeech,
    sendSimulatedUserMessage
  };
}
