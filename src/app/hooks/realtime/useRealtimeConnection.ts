import { RefObject, useEffect, useRef, useState } from 'react';
import { createRealtimeConnection, cleanupRealtimeConnection } from '@/app/lib/realtimeConnection';
import { SessionStatus } from '@/app/types';

interface UseRealtimeConnectionProps {
  audioElement: RefObject<HTMLAudioElement | null>;
  codec: string;
  onConnectionStatusChange?: (status: SessionStatus) => void;
  onDataChannelMessage?: (data: any) => void;
}

export function useRealtimeConnection({
  audioElement,
  codec,
  onConnectionStatusChange,
  onDataChannelMessage
}: UseRealtimeConnectionProps) {
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("DISCONNECTED");
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [retryTimeout, setRetryTimeout] = useState<NodeJS.Timeout | null>(null);
  const isReconnecting = useRef(false);
  const MAX_RETRIES = 3;
  const INITIAL_RETRY_DELAY = 1000;

  const updateSessionStatus = (status: SessionStatus) => {
    setSessionStatus(status);
    onConnectionStatusChange?.(status);
  };

  const fetchEphemeralKey = async (): Promise<string | null> => {
    try {
      const tokenResponse = await fetch("/api/session");
      const data = await tokenResponse.json();

      if (!data.client_secret?.value) {
        console.error("No ephemeral key provided by the server");
        updateSessionStatus('DISCONNECTED');
        return null;
      }

      return data.client_secret.value;
    } catch (error) {
      console.error("Error fetching ephemeral key:", error);
      updateSessionStatus('DISCONNECTED');
      return null;
    }
  };

  const handleConnectionLost = async () => {
    if (isReconnecting.current) {
      console.log("Ya hay un proceso de reconexión en curso");
      return;
    }
    
    if (retryCount >= MAX_RETRIES) {
      console.error("Máximo número de reintentos alcanzado");
      await disconnectFromRealtime();
      updateSessionStatus('DISCONNECTED');
      setRetryCount(0);
      return;
    }

    isReconnecting.current = true;
    const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
    console.log(`Reintentando conexión en ${delay/1000} segundos (${retryCount + 1}/${MAX_RETRIES})...`);
    
    try {
      // Limpiar cualquier timeout existente
      if (retryTimeout) {
        clearTimeout(retryTimeout);
        setRetryTimeout(null);
      }

      // Limpiar estado actual
      await disconnectFromRealtime();
      
      // Esperar el delay con backoff exponencial
      await new Promise(resolve => {
        const timeout = setTimeout(resolve, delay);
        setRetryTimeout(timeout);
      });

      setRetryCount(prev => prev + 1);
      updateSessionStatus('DISCONNECTED');
      
      // Intentar reconectar una sola vez
      try {
        await initializeConnection();
      } catch (error) {
        console.error("Error durante la reconexión:", error);
        // Programar el siguiente intento después del delay
        const nextRetryTimeout = setTimeout(() => {
          isReconnecting.current = false;
          handleConnectionLost();
        }, INITIAL_RETRY_DELAY);
        setRetryTimeout(nextRetryTimeout);
      }
    } finally {
      isReconnecting.current = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
        setRetryTimeout(null);
      }
    }
  };

  const initializeConnection = async () => {
    const EPHEMERAL_KEY = await fetchEphemeralKey();
    if (!EPHEMERAL_KEY) {
      throw new Error('No se pudo obtener la clave efímera');
    }

    if (!audioElement.current) {
      audioElement.current = document.createElement("audio");
    }

    const { pc, dc } = await createRealtimeConnection(
      EPHEMERAL_KEY,
      audioElement,
      codec
    );

    pcRef.current = pc;
    dcRef.current = dc;

    dc.addEventListener("open", () => {
      console.log("Canal de datos abierto");
      updateSessionStatus('CONNECTED');
      setRetryCount(0);
    });

    dc.addEventListener("close", () => {
      console.log("Canal de datos cerrado");
      if (sessionStatus === 'CONNECTED') {
        handleConnectionLost();
      }
    });

    dc.addEventListener("message", (e: MessageEvent) => {
      onDataChannelMessage?.(JSON.parse(e.data));
    });

    setDataChannel(dc);
  };

  const connectToRealtime = async () => {
    // Prevenir múltiples llamadas si ya se está conectando, conectado o reconectando.
    if (sessionStatus === 'CONNECTING' || sessionStatus === 'CONNECTED' || isReconnecting.current) {
      console.log(`Intento de conexión abortado. Estado actual: ${sessionStatus}, Reconectando: ${isReconnecting.current}`);
      return;
    }
    
    try {
      updateSessionStatus('CONNECTING');
      await initializeConnection();
    } catch (err) {
      console.error("Error en la conexión inicial:", err);
      // Solo intentar reconexión si no estamos ya en proceso de reconexión
      // y si el error no es por una conexión ya en proceso (lo que indicaría una condición de carrera)
      if (!isReconnecting.current && !(err instanceof Error && err.message.includes('Ya hay una conexión en proceso'))) {
        await handleConnectionLost();
      } else if (err instanceof Error && err.message.includes('Ya hay una conexión en proceso')) {
        // Si el error es por conexión en proceso, simplemente actualizamos el estado a desconectado
        // para permitir un nuevo intento manual o automático si es pertinente.
        updateSessionStatus('DISCONNECTED');
      }
    }
  };

  const disconnectFromRealtime = async () => {
    console.log("Desconectando y limpiando conexión...");
    if (retryTimeout) {
      clearTimeout(retryTimeout);
      setRetryTimeout(null);
    }
    isReconnecting.current = false; // Asegurar que se resetea el flag de reconexión
    setRetryCount(0); // Resetear contador de reintentos
    
    // Limpiar referencias de PeerConnection y DataChannel
    if (pcRef.current) {
        pcRef.current.close(); // Asegurar que se cierra la conexión WebRTC
        pcRef.current = null;
    }
    if (dcRef.current) {
        dcRef.current.close(); // Asegurar que se cierra el canal de datos
        dcRef.current = null;
    }
    setDataChannel(null);
    
    await cleanupRealtimeConnection(); // Limpieza a bajo nivel
    updateSessionStatus('DISCONNECTED'); // Finalmente, actualizar el estado
  };

  const sendEvent = (eventObj: any, eventNameSuffix = "") => {
    if (!dcRef.current || dcRef.current.readyState !== "open") {
      console.error("Canal de datos no disponible");
      return false;
    }

    try {
      dcRef.current.send(JSON.stringify(eventObj));
      return true;
    } catch (error) {
      console.error("Error al enviar evento:", error);
      handleConnectionLost();
      return false;
    }
  };

  useEffect(() => {
    // La conexión inicial no se hará aquí automáticamente.
    // Debe ser disparada por el componente que usa el hook.
    // Esto previene conexiones automáticas no deseadas en cada renderizado.
    return () => {
      // Limpieza exhaustiva al desmontar el componente
      console.log("Hook useRealtimeConnection desmontándose. Limpiando...");
      disconnectFromRealtime();
    };
  }, []); // Dependencias vacías para que solo se ejecute al montar/desmontar

  return {
    sessionStatus,
    dataChannel,
    connectToRealtime,
    disconnectFromRealtime,
    sendEvent
  };
}
