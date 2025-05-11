"use client";

import React, { createContext, useContext, useState, useEffect, FC, PropsWithChildren } from "react";
import { v4 as uuidv4 } from "uuid";
import { TranscriptItem, SessionState } from "@/app/types";

type TranscriptContextValue = {
  transcriptItems: TranscriptItem[];
  addTranscriptMessage: (itemId: string, role: "user" | "assistant", text: string, hidden?: boolean) => void;
  updateTranscriptMessage: (itemId: string, text: string, isDelta: boolean) => void;
  addTranscriptBreadcrumb: (title: string, data?: Record<string, any>) => void;
  toggleTranscriptItemExpand: (itemId: string) => void;
  updateTranscriptItem: (itemId: string, updatedProperties: Partial<TranscriptItem>) => void;
  getLastMessageId: () => string | null;
  getConversationContext: () => any;
  setConversationContext: (context: any) => void;
};

const STORAGE_KEY = {
  TRANSCRIPT: "chatTranscript",
  SESSION: "chatSession",
};

// Funciones de utilidad para localStorage
const saveToLocalStorage = (items: TranscriptItem[], sessionState: Partial<SessionState>) => {
  try {
    // Asegurar que todos los mensajes del asistente estén marcados como completados
    const completedItems = items.map(item => {
      if (item.type === "MESSAGE" && item.role === "assistant") {
        return { ...item, status: "DONE" };
      }
      return item;
    });

    // Guardar la transcripción
    localStorage.setItem(STORAGE_KEY.TRANSCRIPT, JSON.stringify(completedItems));

    // Guardar o actualizar el estado de la sesión
    if (Object.keys(sessionState).length > 0) {
      const currentSession = loadSessionFromLocalStorage();
      const updatedSession = {
        ...currentSession,
        ...sessionState,
        timestamp: Date.now(),
        lastMessageId: sessionState.lastMessageId || currentSession?.lastMessageId,
        conversationContext: sessionState.conversationContext || currentSession?.conversationContext,
      };
      localStorage.setItem(STORAGE_KEY.SESSION, JSON.stringify(updatedSession));
    }
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
};

const loadFromLocalStorage = (): TranscriptItem[] => {
  try {
    const savedItems = localStorage.getItem(STORAGE_KEY.TRANSCRIPT);
    if (savedItems) {
      return JSON.parse(savedItems);
    }
  } catch (error) {
    console.error("Error loading from localStorage:", error);
  }
  return [];
};

const loadSessionFromLocalStorage = (): SessionState | null => {
  try {
    const savedSession = localStorage.getItem(STORAGE_KEY.SESSION);
    if (savedSession) {
      const session = JSON.parse(savedSession);
      // Verificar si la sesión no es muy antigua (30 minutos)
      if (Date.now() - session.timestamp < 30 * 60 * 1000) {
        return session;
      }
    }
  } catch (error) {
    console.error("Error loading session from localStorage:", error);
  }
  return null;
};

const TranscriptContext = createContext<TranscriptContextValue | undefined>(undefined);

export const TranscriptProvider: FC<PropsWithChildren> = ({ children }) => {
  const [transcriptItems, setTranscriptItems] = useState<TranscriptItem[]>([]);
  const [conversationContext, setConversationContext] = useState<any>(null);

  // Cargar desde localStorage solo en el cliente
  useEffect(() => {
    const savedItems = loadFromLocalStorage();
    const session = loadSessionFromLocalStorage();
    
    if (savedItems.length > 0) {
      setTranscriptItems(savedItems);
    }
    
    if (session) {
      setConversationContext(session.conversationContext || null);
    }
  }, []);

  // Guardar en localStorage cuando transcriptItems o conversationContext cambien
  useEffect(() => {
    const lastMessage = [...transcriptItems].reverse().find(item => 
      item.type === "MESSAGE" && item.role === "assistant"
    );

    saveToLocalStorage(transcriptItems, {
      lastMessageId: lastMessage?.itemId || null,
      conversationContext,
    });
  }, [transcriptItems, conversationContext]);

  function newTimestampPretty(): string {
    if (typeof window === "undefined") return ""; // Evita timestamp en SSR
    return new Date().toLocaleTimeString([], {
      hour12: true,
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  const addTranscriptMessage: TranscriptContextValue["addTranscriptMessage"] = (itemId, role, text = "", isHidden = false) => {
    setTranscriptItems((prev) => {
      const existingIdx = prev.findIndex((log) => log.itemId === itemId && log.type === "MESSAGE");
      if (existingIdx !== -1) {
        // Si el texto es diferente, actualiza el mensaje existente
        if (prev[existingIdx].title !== text) {
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            title: text,
            updatedAt: Date.now(),
            isHidden,
          };
          return updated;
        }
        // Si el texto es igual, no hagas nada
        return prev;
      }

      const newItem: TranscriptItem = {
        itemId,
        type: "MESSAGE",
        role,
        title: text,
        expanded: false,
        timestamp: newTimestampPretty(),
        createdAtMs: Date.now(),
        status: "IN_PROGRESS",
        isHidden,
      };

      return [...prev, newItem];
    });
  };

  const updateTranscriptMessage: TranscriptContextValue["updateTranscriptMessage"] = (itemId, newText, append = false) => {
    setTranscriptItems((prev) =>
      prev.map((item) => {
        if (item.itemId === itemId && item.type === "MESSAGE") {
          const updatedText = append ? ((item.title ?? "") + newText) : newText;
          // Siempre actualiza el texto para forzar el renderizado inmediato
          return {
            ...item,
            title: updatedText,
            updatedAt: Date.now(),
          };
        }
        return item;
      })
    );
  };

  const addTranscriptBreadcrumb: TranscriptContextValue["addTranscriptBreadcrumb"] = (title, data) => {
    setTranscriptItems((prev) => [
      ...prev,
      {
        itemId: `breadcrumb-${uuidv4()}`,
        type: "BREADCRUMB",
        title,
        data,
        expanded: false,
        timestamp: newTimestampPretty(),
        createdAtMs: Date.now(),
        status: "DONE",
        isHidden: false,
      },
    ]);
  };

  const toggleTranscriptItemExpand: TranscriptContextValue["toggleTranscriptItemExpand"] = (itemId) => {
    setTranscriptItems((prev) =>
      prev.map((log) =>
        log.itemId === itemId ? { ...log, expanded: !log.expanded } : log
      )
    );
  };

  const updateTranscriptItem: TranscriptContextValue["updateTranscriptItem"] = (itemId, updatedProperties) => {
    setTranscriptItems((prev) =>
      prev.map((item) =>
        item.itemId === itemId ? { ...item, ...updatedProperties } : item
      )
    );
  };

  const getLastMessageId = () => {
    const lastMessage = [...transcriptItems].reverse().find(item => 
      item.type === "MESSAGE" && item.role === "assistant"
    );
    return lastMessage?.itemId || null;
  };

  const getConversationContext = () => conversationContext;

  return (
    <TranscriptContext.Provider
      value={{
        transcriptItems,
        addTranscriptMessage,
        updateTranscriptMessage,
        addTranscriptBreadcrumb,
        toggleTranscriptItemExpand,
        updateTranscriptItem,
        getLastMessageId,
        getConversationContext,
        setConversationContext,
      }}
    >
      {children}
    </TranscriptContext.Provider>
  );
};

export function useTranscript() {
  const context = useContext(TranscriptContext);
  if (!context) {
    throw new Error("useTranscript must be used within a TranscriptProvider");
  }
  return context;
}
