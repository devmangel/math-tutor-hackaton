"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import Image from "next/image";
import { motion, px } from "framer-motion";
import { BookOpen, User, Lightbulb } from 'lucide-react';

// UI components
import TutorMainView from "./tutor-ai/TutorMainView";
 
// Types
import { AgentConfig, SessionStatus } from "@/app/types";
 
// Context providers & hooks
import { useTranscript } from "@/app/contexts/TranscriptContext";
import { useEvent } from "@/app/contexts/EventContext";
import { useHandleServerEvent, setTriggerSessionUpdate } from "./hooks/useHandleServerEvent";

// Utilities
import { createRealtimeConnection } from "./lib/realtimeConnection";

// Agent configs
import { allAgentSets, defaultAgentSetKey } from "@/app/tutor-ai/agentConfigs";

import useAudioDownload from "./hooks/useAudioDownload";
import { TutorProvider } from "./tutor-ai/contexts/TutorContext";

function AppContent() {
  const searchParams = useSearchParams();

  // Use urlCodec directly from URL search params (default: "opus")
  const urlCodec = searchParams.get("codec") || "opus";

  const { transcriptItems, addTranscriptMessage, addTranscriptBreadcrumb } =
    useTranscript();
  const { logClientEvent, logServerEvent } = useEvent();

  const [selectedAgentName, setSelectedAgentName] = useState<string>("");
  const [selectedAgentConfigSet, setSelectedAgentConfigSet] = useState<AgentConfig[] | null>(null);
  const [conversationContext, setConversationContext] = useState<any>(null);
  const [sessionStatus, setSessionStatus] =
    useState<SessionStatus>("DISCONNECTED");

  const [isEventsPaneExpanded, setIsEventsPaneExpanded] =
    useState<boolean>(true);
  const [userText, setUserText] = useState<string>("");
  const [isPTTActive, setIsPTTActive] = useState<boolean>(false);
  const [isPTTUserSpeaking, setIsPTTUserSpeaking] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isAudioPlaybackEnabled, setIsAudioPlaybackEnabled] =
    useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isOutputAudioBufferActive, setIsOutputAudioBufferActive] =
    useState<boolean>(false);

  // Initialize the recording hook.
  const { startRecording, stopRecording, downloadRecording } =
    useAudioDownload();

  // Bandera para saber si hubo transcripción de voz
  const [hasVoiceTranscript, setHasVoiceTranscript] = useState(false);

  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const sendClientEvent = (eventObj: any, eventNameSuffix = "") => {
    if (dcRef.current && dcRef.current.readyState === "open") {
      logClientEvent(eventObj, eventNameSuffix);
      dcRef.current.send(JSON.stringify(eventObj));
    } else {
      logClientEvent(
        { attemptedEvent: eventObj.type },
        "error.data_channel_not_open"
      );
      console.error(
        "Failed to send message - no data channel available",
        eventObj
      );
    }
  };

  const handleServerEventRef = useHandleServerEvent({
    setSessionStatus,
    selectedAgentName,
    selectedAgentConfigSet,
    sendClientEvent,
    setSelectedAgentName,
    setIsOutputAudioBufferActive,
    onUserVoiceTranscript: () => setHasVoiceTranscript(true),
  });

  // Cargar el estado inicial de manera segura para SSR
  useEffect(() => {
    let finalAgentConfig = searchParams.get("agentConfig");
    if (!finalAgentConfig || !allAgentSets[finalAgentConfig]) {
      finalAgentConfig = defaultAgentSetKey;
      const url = new URL(window.location.toString());
      url.searchParams.set("agentConfig", finalAgentConfig);
      window.location.replace(url.toString());
      return;
    }

    const agents = allAgentSets[finalAgentConfig];
    setSelectedAgentConfigSet(agents);

    // Intentar cargar el estado de la sesión
    const session = localStorage.getItem("chatSession");
    if (session) {
      try {
        const { agentName, conversationContext, timestamp } = JSON.parse(session);
        // Verificar si la sesión no es muy antigua (30 minutos)
        if (Date.now() - timestamp < 30 * 60 * 1000) {
          // Verificar que el agente existe en el conjunto actual
          const matchingAgent = agents.find(a => a.name === agentName);
          if (matchingAgent) {
            setSelectedAgentName(agentName);
            // Restaurar el contexto de la conversación si existe
            if (conversationContext) {
              setConversationContext(conversationContext);
            }
            return;
          }
        }
      } catch (error) {
        console.error("Error parsing session:", error);
      }
    }

    // Si no hay sesión válida, usar el primer agente
    setSelectedAgentName(agents[0]?.name || "");
  }, [searchParams]);

  // Guardar el estado de la sesión cuando cambie el agente o el contexto
  useEffect(() => {
    if (selectedAgentName && selectedAgentConfigSet) {
      const sessionState = {
        agentName: selectedAgentName,
        conversationContext: conversationContext,
        timestamp: Date.now()
      };
      localStorage.setItem("chatSession", JSON.stringify(sessionState));
    }
  }, [selectedAgentName, conversationContext]);

  // Conectar a realtime cuando se selecciona un agente
  useEffect(() => {
    if (selectedAgentName && sessionStatus === "DISCONNECTED") {
      connectToRealtime();
    }
  }, [selectedAgentName]);

  // Actualizar la sesión cuando se conecta
  useEffect(() => {
    if (
      sessionStatus === "CONNECTED" &&
      selectedAgentConfigSet &&
      selectedAgentName
    ) {
      const currentAgent = selectedAgentConfigSet.find(
        (a) => a.name === selectedAgentName
      );

      // Solo añadir el breadcrumb si no hay transcripción previa
      if (transcriptItems.length === 0) {
        addTranscriptBreadcrumb(`Agent: ${selectedAgentName}`, currentAgent);
        updateSession(true);
      } else {
        // Si hay transcripción previa, solo actualizar la sesión sin mensaje inicial
        updateSession(false);
      }
    }
  }, [selectedAgentConfigSet, selectedAgentName, sessionStatus]);

  useEffect(() => {
    if (sessionStatus === "CONNECTED") {
      console.log(
        `updatingSession, isPTTACtive=${isPTTActive} sessionStatus=${sessionStatus}`
      );
      updateSession();
    }
  }, [isPTTActive]);

  const fetchEphemeralKey = async (): Promise<string | null> => {
    logClientEvent({ url: "/session" }, "fetch_session_token_request");
    const tokenResponse = await fetch("/api/session");
    const data = await tokenResponse.json();
    logServerEvent(data, "fetch_session_token_response");

    if (!data.client_secret?.value) {
      logClientEvent(data, "error.no_ephemeral_key");
      console.error("No ephemeral key provided by the server");
      setSessionStatus("DISCONNECTED");
      return null;
    }

    return data.client_secret.value;
  };

  const connectToRealtime = async () => {
    if (sessionStatus !== "DISCONNECTED") return;
    setSessionStatus("CONNECTING");

    try {
      const EPHEMERAL_KEY = await fetchEphemeralKey();
      if (!EPHEMERAL_KEY) {
        return;
      }

      if (!audioElementRef.current) {
        audioElementRef.current = document.createElement("audio");
      }
      audioElementRef.current.autoplay = isAudioPlaybackEnabled;

      const { pc, dc } = await createRealtimeConnection(
        EPHEMERAL_KEY,
        audioElementRef,
        urlCodec
      );
      pcRef.current = pc;
      dcRef.current = dc;

      dc.addEventListener("open", () => {
        logClientEvent({}, "data_channel.open");
      });
      dc.addEventListener("close", () => {
        logClientEvent({}, "data_channel.close");
      });
      dc.addEventListener("error", (err: any) => {
        logClientEvent({ error: err }, "data_channel.error");
      });
      dc.addEventListener("message", (e: MessageEvent) => {
        handleServerEventRef.current(JSON.parse(e.data));
      });

      setDataChannel(dc);
    } catch (err) {
      console.error("Error connecting to realtime:", err);
      setSessionStatus("DISCONNECTED");
    }
  };

  const disconnectFromRealtime = () => {
    if (pcRef.current) {
      pcRef.current.getSenders().forEach((sender) => {
        if (sender.track) {
          sender.track.stop();
        }
      });

      pcRef.current.close();
      pcRef.current = null;
    }
    setDataChannel(null);
    setSessionStatus("DISCONNECTED");
    setIsPTTUserSpeaking(false);

    logClientEvent({}, "disconnected");
  };

  const updateSession = (shouldTriggerResponse: boolean = false) => {
    sendClientEvent(
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

    const instructions = currentAgent?.instructions || "";
    const tools = currentAgent?.tools || [];

    const sessionUpdateEvent = {
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
        instructions,
        voice: "sage",
        input_audio_transcription: { model: "whisper-1" },
        turn_detection: turnDetection,
        tools,
      },
    };

    sendClientEvent(sessionUpdateEvent);
  };

  const cancelAssistantSpeech = async () => {
    // Send a response.cancel if the most recent assistant conversation item is IN_PROGRESS. This implicitly does a item.truncate as well
    const mostRecentAssistantMessage = [...transcriptItems]
      .reverse()
      .find((item) => item.role === "assistant");

    if (!mostRecentAssistantMessage) {
      // No recent assistant message found to cancel (silenciado para limpiar consola)
      return;
    }
    if (mostRecentAssistantMessage.status === "IN_PROGRESS") {
      sendClientEvent(
        { type: "response.cancel" },
        "(cancel due to user interruption)"
      );
    }

    // Send an output_audio_buffer.cancel if the isOutputAudioBufferActive is True
    if (isOutputAudioBufferActive) {
      sendClientEvent(
        { type: "output_audio_buffer.clear" },
        "(cancel due to user interruption)"
      );
    }
  };

  const handleSendTextMessage = () => {
    if (!userText.trim()) return;
    setIsProcessing(true);
    cancelAssistantSpeech();

    // Optimistic update: agrega el mensaje del usuario inmediatamente
    const tempId = `temp-${Date.now()}`;
    addTranscriptMessage(tempId, "user", userText.trim(), false);

    sendClientEvent(
      {
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text: userText.trim() }],
        },
      },
      "(send user text message)"
    );
    setUserText("");

    sendClientEvent({ type: "response.create" }, "(trigger response)");
    setIsProcessing(false);
  };

  const handleTalkButtonDown = async () => {
    if (sessionStatus !== "CONNECTED" || dataChannel?.readyState !== "open")
      return;
    
    try {
      cancelAssistantSpeech();
      setIsPTTUserSpeaking(true);
      setIsRecording(true);
      
      // Solicitar permisos del micrófono antes de empezar
      await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      sendClientEvent({ type: "input_audio_buffer.clear" }, "clear PTT buffer");
    } catch (error) {
      console.error('Error al acceder al micrófono:', error);
      setIsPTTUserSpeaking(false);
      setIsRecording(false);
    }
  };

  const handleTalkButtonUp = async () => {
    if (
      sessionStatus !== "CONNECTED" ||
      dataChannel?.readyState !== "open" ||
      !isPTTUserSpeaking
    )
      return;

    try {
      setIsPTTUserSpeaking(false);
      setIsRecording(false);
      setIsProcessing(true);
      setHasVoiceTranscript(false);
      await sendClientEvent({ type: "input_audio_buffer.commit" }, "commit PTT");
      setTimeout(() => {
        if (hasVoiceTranscript) {
          sendClientEvent({ type: "response.create" }, "trigger response PTT");
        }
        setIsProcessing(false);
      }, 1500);
    } catch (error) {
      console.error('Error al procesar audio:', error);
      setIsProcessing(false);
    }
  };

  const onToggleConnection = () => {
    if (sessionStatus === "CONNECTED" || sessionStatus === "CONNECTING") {
      disconnectFromRealtime();
      setSessionStatus("DISCONNECTED");
    } else {
      connectToRealtime();
    }
  };

  const handleAgentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newAgentConfig = e.target.value;
    const url = new URL(window.location.toString());
    url.searchParams.set("agentConfig", newAgentConfig);
    window.location.replace(url.toString());
  };


  const handleSelectedAgentChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newAgentName = e.target.value;
    setSelectedAgentName(newAgentName);
  };

  // Instead of using setCodec, we update the URL and refresh the page when codec changes
  const handleCodecChange = (newCodec: string) => {
    const url = new URL(window.location.toString());
    url.searchParams.set("codec", newCodec);
    window.location.replace(url.toString());
  };

  useEffect(() => {
    const storedPushToTalkUI = localStorage.getItem("pushToTalkUI");
    if (storedPushToTalkUI) {
      setIsPTTActive(storedPushToTalkUI === "true");
    }
    const storedLogsExpanded = localStorage.getItem("logsExpanded");
    if (storedLogsExpanded) {
      setIsEventsPaneExpanded(storedLogsExpanded === "true");
    }
    const storedAudioPlaybackEnabled = localStorage.getItem(
      "audioPlaybackEnabled"
    );
    if (storedAudioPlaybackEnabled) {
      setIsAudioPlaybackEnabled(storedAudioPlaybackEnabled === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("pushToTalkUI", isPTTActive.toString());
  }, [isPTTActive]);

  useEffect(() => {
    localStorage.setItem("logsExpanded", isEventsPaneExpanded.toString());
  }, [isEventsPaneExpanded]);

  useEffect(() => {
    localStorage.setItem(
      "audioPlaybackEnabled",
      isAudioPlaybackEnabled.toString()
    );
  }, [isAudioPlaybackEnabled]);

  useEffect(() => {
    if (audioElementRef.current) {
      if (isAudioPlaybackEnabled) {
        audioElementRef.current.play().catch((err) => {
          console.warn("Autoplay may be blocked by browser:", err);
        });
      } else {
        audioElementRef.current.pause();
      }
    }
  }, [isAudioPlaybackEnabled]);

  useEffect(() => {
    if (sessionStatus === "CONNECTED" && audioElementRef.current?.srcObject) {
      // The remote audio stream from the audio element.
      const remoteStream = audioElementRef.current.srcObject as MediaStream;
      startRecording(remoteStream);
    }

    // Clean up on unmount or when sessionStatus is updated.
    return () => {
      stopRecording();
    };
  }, [sessionStatus]);

  const agentSetKey = searchParams.get("agentConfig") || "default";

  useEffect(() => {
    // Registra updateSession como trigger para transferencias de agente
    setTriggerSessionUpdate(() => () => updateSession());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="text-base flex flex-col h-screen bg-gradient-to-b from-blue-50 to-white text-gray-800 relative">
      {/* Header con diseño responsive */}
      <div className="p-3 md:p-5 text-lg font-semibold flex flex-col md:flex-row justify-between items-center gap-3 md:gap-0 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        {/* Logo y título con mejor espaciado para móvil */}
        <div
          className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => window.location.reload()}
        >
          <div className="relative w-8 h-8 md:w-6 md:h-6">
            <Image
              src="/logo.png"
              alt="Logo"              
              width={200}
              height={200}
              className="object-contain"
              priority
            />
          </div>
          <div className="ml-3 md:ml-2 text-xl md:text-lg">
            Math <span className="text-blue-600 font-bold">Tutor</span>
          </div>
        </div>
        {/* Controles con mejor organización en móvil */}
        <div className="flex flex-col md:flex-row items-center gap-3 md:gap-6 w-full md:w-auto">
          <div className="flex items-center gap-3 w-full md:w-auto justify-center">
            <label className="flex items-center text-sm md:text-base gap-2 font-medium text-gray-700">
              <BookOpen className="w-4 h-4" />
              Modo de Tutoría
            </label>
            <div className="relative inline-block flex-1 md:flex-none max-w-[200px]">
              <select
                value={agentSetKey}
                onChange={handleAgentChange}
                className="w-full appearance-none border border-gray-300 rounded-lg text-sm md:text-base px-3 py-2 cursor-pointer font-normal bg-white hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
              >
                {Object.keys(allAgentSets).map((agentKey) => (
                  <option key={agentKey} value={agentKey}>
                    {agentKey}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-600">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 10.44l3.71-3.21a.75.75 0 111.04 1.08l-4.25 3.65a.75.75 0 01-1.04 0L5.21 8.27a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          {agentSetKey && (
            <div className="flex items-center gap-3 w-full md:w-auto justify-center">
              <label className="flex items-center text-sm md:text-base gap-2 font-medium text-gray-700">
                <User className="w-4 h-4" />
                Tutor
              </label>
              <div className="relative inline-block flex-1 md:flex-none max-w-[200px]">
                <select
                  value={selectedAgentName}
                  onChange={handleSelectedAgentChange}
                  className="w-full appearance-none border border-gray-300 rounded-lg text-sm md:text-base px-3 py-2 cursor-pointer font-normal bg-white hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                >
                  {selectedAgentConfigSet?.map((agent) => (
                    <option key={agent.name} value={agent.name}>
                      {agent.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-600">
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 10.44l3.71-3.21a.75.75 0 111.04 1.08l-4.25 3.65a.75.75 0 01-1.04 0L5.21 8.27a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Vista principal con diseño mejorado y contenedor para PTT */}
      <div className="flex-1 overflow-hidden relative">
        <TutorMainView 
          sessionStatus={sessionStatus}
          userText={userText}
          setUserText={setUserText}
          handleSendMessage={handleSendTextMessage}
          isProcessing={isProcessing}
          isRecording={isRecording}
          handlePTTStart={handleTalkButtonDown}
          handlePTTEnd={handleTalkButtonUp}
          downloadRecording={downloadRecording}
        />
      </div>

      {/* Indicador de estado de conexión con mejor diseño */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center items-center pointer-events-none">
        <motion.div 
          className="flex flex-col items-center gap-2 pointer-events-auto mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
        </motion.div>
      </div>
    </div>
  );
}

function App() {
  return (
    <TutorProvider>
      <AppContent />
    </TutorProvider>
  );
}

export default App;
