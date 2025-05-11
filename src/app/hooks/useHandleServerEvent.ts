"use client";

import { useRef } from "react";
import {
  ServerEvent,
  SessionStatus,
  AgentConfig,
  GuardrailResultType,
} from "@/app/types";
import { useTranscript } from "@/app/contexts/TranscriptContext";
import { useEvent } from "@/app/contexts/EventContext";
import { runGuardrailClassifier } from "@/app/lib/callOai";
import { useTutor } from "@/app/tutor-ai/contexts/TutorContext";
import { tutorActions } from "@/app/tutor-ai/contexts/TutorContext";

export interface UseHandleServerEventParams {
  setSessionStatus: (status: SessionStatus) => void;
  selectedAgentName: string;
  selectedAgentConfigSet: AgentConfig[] | null;
  sendClientEvent: (eventObj: any, eventNameSuffix?: string) => void;
  setSelectedAgentName: (name: string) => void;
  shouldForceResponse?: boolean;
  setIsOutputAudioBufferActive: (active: boolean) => void;
}

export function useHandleServerEvent({
  setSessionStatus,
  selectedAgentName,
  selectedAgentConfigSet,
  sendClientEvent,
  setSelectedAgentName,
  setIsOutputAudioBufferActive,
  onUserVoiceTranscript,
}: UseHandleServerEventParams & { onUserVoiceTranscript?: () => void }) {
  const {
    transcriptItems,
    addTranscriptBreadcrumb,
    addTranscriptMessage,
    updateTranscriptMessage,
    updateTranscriptItem,
  } = useTranscript();

  const { logServerEvent } = useEvent();

  const assistantDeltasRef = useRef<{ [itemId: string]: string }>({});

  const { state, dispatch } = useTutor();

  async function processGuardrail(itemId: string, text: string) {
    let res;
    try {
      res = await runGuardrailClassifier(text);
    } catch (error) {
      console.warn(error);
      return;
    }
    
    const currentItem = transcriptItems.find((item) => item.itemId === itemId);
    if ((currentItem?.guardrailResult?.testText?.length ?? 0) > text.length) {
      // If the existing guardrail result is more complete, skip updating. We're running multiple guardrail checks and you don't want an earlier one to overwrite a later, more complete result.
      return;
    }
    
    const newGuardrailResult: GuardrailResultType = {
      status: "DONE",
      testText: text,
      category: res.moderationCategory,
      rationale: res.moderationRationale,
    };

    // Update the transcript item with the new guardrail result.
    updateTranscriptItem(itemId, { guardrailResult: newGuardrailResult });
  }

  const handleFunctionCall = async (functionCallParams: {
    name: string;
    call_id?: string;
    arguments: string;
  }) => {
    let args;
    const rawArgsString = functionCallParams.arguments;
    let jsonStringToParse = rawArgsString;

    // Intenta extraer la primera estructura JSON válida (objeto o array) de la cadena
    const firstBrace = rawArgsString.indexOf('{');
    const firstBracket = rawArgsString.indexOf('[');
    let startIndex = -1;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIndex = firstBrace;
    } else if (firstBracket !== -1) {
      startIndex = firstBracket;
    }

    if (startIndex !== -1) {
      let openCount = 0;
      let endIndex = -1;
      const openChar = rawArgsString[startIndex];
      const closeChar = openChar === '{' ? '}' : ']';

      for (let i = startIndex; i < rawArgsString.length; i++) {
        if (rawArgsString[i] === openChar) {
          openCount++;
        } else if (rawArgsString[i] === closeChar) {
          openCount--;
        }
        if (openCount === 0) {
          endIndex = i;
          break;
        }
      }

      if (endIndex !== -1) {
        jsonStringToParse = rawArgsString.substring(startIndex, endIndex + 1);
      } else {
        console.warn("Could not find a balanced JSON structure in arguments, attempting to parse as is:", rawArgsString);
      }
    } else {
      console.warn("No JSON object or array start found in arguments:", rawArgsString);
    }
    
    try {
      args = JSON.parse(jsonStringToParse);
    } catch (error) {
      console.error("Error parsing function call arguments. Original raw arguments:", rawArgsString);
      console.error("Attempted to parse (after extraction attempt):", jsonStringToParse);
      console.error("Error details:", error);
      throw error;
    }
    const currentAgent = selectedAgentConfigSet?.find(
      (a) => a.name === selectedAgentName
    );

    addTranscriptBreadcrumb(`function call: ${functionCallParams.name}`, args);

    if (state.isAwaitingUser) return; // No permitir que el agente hable de nuevo

    if (currentAgent?.toolLogic?.[functionCallParams.name]) {
      const fn = currentAgent.toolLogic[functionCallParams.name];
      const fnResult = await fn(args, transcriptItems);
      addTranscriptBreadcrumb(
        `function call result: ${functionCallParams.name}`,
        fnResult
      );

      sendClientEvent({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: functionCallParams.call_id,
          output: JSON.stringify(fnResult),
        },
      });
      sendClientEvent({ type: "response.create" });
    } else if (functionCallParams.name === "transferAgents") {
      const destinationAgent = args.destination_agent;
      const newAgentConfig =
        selectedAgentConfigSet?.find((a) => a.name === destinationAgent) ||
        null;
      if (newAgentConfig) {
        setSelectedAgentName(destinationAgent);
        // Sincroniza el agente activo en localStorage
        localStorage.setItem("chatSession", JSON.stringify({
          agentName: destinationAgent,
          timestamp: Date.now()
        }));
        // Llama a triggerSessionUpdate si está definida
        if (triggerSessionUpdate) triggerSessionUpdate();
        // Dispara el inicio automático de conversación del nuevo agente
        sendClientEvent({ type: "response.create" }, "trigger response after agent transfer");
      }
      const functionCallOutput = {
        destination_agent: destinationAgent,
        did_transfer: !!newAgentConfig,
      };
      sendClientEvent({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: functionCallParams.call_id,
          output: JSON.stringify(functionCallOutput),
        },
      });
      addTranscriptBreadcrumb(
        `function call: ${functionCallParams.name} response`,
        functionCallOutput
      );
    } else {
      const simulatedResult = { result: true };
      addTranscriptBreadcrumb(
        `function call fallback: ${functionCallParams.name}`,
        simulatedResult
      );

      sendClientEvent({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: functionCallParams.call_id,
          output: JSON.stringify(simulatedResult),
        },
      });
      sendClientEvent({ type: "response.create" });
    }
  };

  const handleServerEvent = (serverEvent: ServerEvent) => {
    logServerEvent(serverEvent);

    switch (serverEvent.type) {
      case "session.created": {
        if (serverEvent.session?.id) {
          setSessionStatus("CONNECTED");
          addTranscriptBreadcrumb(
            `session.id: ${
              serverEvent.session.id
            }\nStarted at: ${new Date().toLocaleString()}`
          );
        }
        break;
      }

      case "output_audio_buffer.started": {
        setIsOutputAudioBufferActive(true);
        break;
      }
      case "output_audio_buffer.stopped": {
        setIsOutputAudioBufferActive(false);
        break;
      }

      case "conversation.item.created": {
        let text =
          serverEvent.item?.content?.[0]?.text ||
          serverEvent.item?.content?.[0]?.transcript ||
          "";
        const role = serverEvent.item?.role as "user" | "assistant";
        const itemId = serverEvent.item?.id;

        if (itemId && transcriptItems.some((item) => item.itemId === itemId)) {
          // don't add transcript message if already exists
          break;
        }

        if (itemId && role) {
          if (role === "user" && !text) {
            text = "[Transcribing...]";
          }
          if (role === "assistant") {
            // Inicializa vacío para que los deltas llenen la burbuja en tiempo real
            addTranscriptMessage(itemId, role, "", false);
            dispatch(tutorActions.setAwaitingUser(true));
          } else {
            addTranscriptMessage(itemId, role, text);
            dispatch(tutorActions.setAwaitingUser(false));
          }
        }
        break;
      }

      case "conversation.item.input_audio_transcription.completed": {
        const itemId = serverEvent.item_id;
        const finalTranscript =
          !serverEvent.transcript || serverEvent.transcript === "\n"
            ? "[inaudible]"
            : serverEvent.transcript;
        if (itemId) {
          updateTranscriptMessage(itemId, finalTranscript, false);
          if (serverEvent.item?.role === "user" && finalTranscript && onUserVoiceTranscript) {
            onUserVoiceTranscript();
          }
        }
        break;
      }

      case "response.audio_transcript.delta": {
        const itemId = serverEvent.item_id;
        const deltaText = serverEvent.delta || "";
        const role = serverEvent.item?.role as "user" | "assistant";
        
        if (itemId) {
          // Si el mensaje no existe, créalo primero con el rol correcto (usuario o asistente)
          if (!transcriptItems.some(item => item.itemId === itemId)) {
            addTranscriptMessage(itemId, role || "assistant", "", false);
          }
          
          // Actualiza el mensaje con el delta
          updateTranscriptMessage(itemId, deltaText, true);

          // Si es usuario y hay texto, activa el callback
          if (role === "user" && deltaText && onUserVoiceTranscript) {
            onUserVoiceTranscript();
          }

          // Solo para el asistente, acumula los deltas y ejecuta el guardrail
          if (role === "assistant") {
            if (!assistantDeltasRef.current[itemId]) {
              assistantDeltasRef.current[itemId] = "";
            }
            assistantDeltasRef.current[itemId] += deltaText;
            const newAccumulated = assistantDeltasRef.current[itemId];
            const wordCount = newAccumulated.trim().split(" ").length;

            // Ejecuta el guardrail cada 5 palabras
            if (wordCount > 0 && wordCount % 5 === 0) {
              processGuardrail(itemId, newAccumulated);
            }
          }
        }
        break;
      }

      case "response.done": {
        if (serverEvent.response?.output) {
          serverEvent.response.output.forEach((outputItem) => {
            if (
              outputItem.type === "function_call" &&
              outputItem.name &&
              outputItem.arguments
            ) {
              handleFunctionCall({
                name: outputItem.name,
                call_id: outputItem.call_id,
                arguments: outputItem.arguments,
              });
            }
            if (
              outputItem.type === "message" &&
              outputItem.role === "assistant"
            ) {
              const itemId = outputItem.id;
              const text = outputItem.content[0].transcript;
              // Final guardrail for this message
              processGuardrail(itemId, text);
            }
          });
        }
        break;
      }

      case "response.output_item.done": {
        const itemId = serverEvent.item?.id;
        if (itemId) {
          updateTranscriptItem(itemId, { status: "DONE" });
        }
        break;
      }

      default:
        break;
    }
  };

  const handleServerEventRef = useRef(handleServerEvent);
  handleServerEventRef.current = handleServerEvent;

  return handleServerEventRef;
}

// Al final del archivo, exporta una función auxiliar para disparar la actualización de sesión
export let triggerSessionUpdate: (() => void) | null = null;
export function setTriggerSessionUpdate(fn: () => void) {
  triggerSessionUpdate = fn;
}
