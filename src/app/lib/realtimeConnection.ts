import { RefObject } from "react";

// Estado global de la conexión
let existingStream: MediaStream | null = null;
let existingPeerConnection: RTCPeerConnection | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;
let connectionLock: Promise<void> | null = null;
let isConnecting = false;

const CONNECTION_TIMEOUT = 15000; // 15 segundos timeout

function isConnectionClosed(pc: RTCPeerConnection): boolean {
  return pc.connectionState === 'closed' || pc.connectionState === 'failed' || pc.signalingState === 'closed';
}

export async function createRealtimeConnection(
  EPHEMERAL_KEY: string,
  audioElement: RefObject<HTMLAudioElement | null>,
  codec: string
): Promise<{ pc: RTCPeerConnection; dc: RTCDataChannel }> {
  // Asegurarse de que cualquier conexión existente esté completamente limpia
  // antes de intentar una nueva conexión.
  await cleanupRealtimeConnection();

  // Sistema de bloqueo para evitar conexiones simultáneas
  if (isConnecting || connectionLock) { // Comprobar ambas variables
    console.warn('Intento de conexión mientras otra está en proceso o bloqueada.');
    throw new Error('Ya hay una conexión en proceso');
  }
  isConnecting = true; // Marcar como conectando INMEDIATAMENTE
  
  let resolveConnectionLock: (() => void) | undefined;
  let rejectConnectionLock: ((reason?: any) => void) | undefined;
  let connectionLockActive = true; // Flag para controlar el estado del lock

  connectionLock = new Promise<void>((resolve, reject) => {
    resolveConnectionLock = () => {
      if (connectionLockActive) {
        connectionLockActive = false;
        resolve();
      }
    };
    rejectConnectionLock = (reason?: any) => {
      if (connectionLockActive) {
        connectionLockActive = false;
        reject(reason);
      }
    };
  });

  let timeoutId: NodeJS.Timeout | null = null;
  timeoutId = setTimeout(() => {
    if (connectionLockActive && rejectConnectionLock) {
      isConnecting = false; // Asegurar que se libera el estado de conexión
      rejectConnectionLock(new Error('Timeout al intentar establecer la conexión'));
    }
  }, CONNECTION_TIMEOUT);
  
  try {

    // Limpiar timeout de reconexión si existe
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }

    // Esperar un momento para asegurar que la limpieza se completó
    // Esto ya se hace al inicio de la función.
    // await new Promise(resolve => setTimeout(resolve, 500)); 

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }
      ],
      iceTransportPolicy: 'all',
      bundlePolicy: 'balanced',
      rtcpMuxPolicy: 'require'
    });
    existingPeerConnection = pc;

    // Manejar cambios en el estado de la conexión
    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      console.log("ICE Connection State:", state);
      
      if (state === 'disconnected') {
        // Intentar reconectar automáticamente después de un breve delay
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
        }
        reconnectTimeout = setTimeout(() => {
          if (pc.iceConnectionState === 'disconnected' && !isConnectionClosed(pc)) {
            console.log("Intentando restablecer conexión ICE...");
            pc.restartIce();
          }
        }, 1000);
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log("Connection State:", state);
      
      if (state === 'failed' || state === 'closed') {
        cleanupRealtimeConnection();
      }
    };

    pc.ontrack = (e) => {
      if (audioElement.current) {
        audioElement.current.srcObject = e.streams[0];
      }
    };

    // Manejar el stream de audio
    let ms: MediaStream;
    try {
      if (existingStream && existingStream.active && existingStream.getTracks().some(track => track.readyState === 'live')) {
        ms = existingStream;
      } else {
        if (existingStream) {
          existingStream.getTracks().forEach(track => track.stop());
        }
        ms = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
            sampleRate: 48000
          } 
        });
        existingStream = ms;
      }
    } catch (error) {
      console.error("Error al obtener stream de audio:", error);
      throw error;
    }
    
    // Verificar que la conexión aún esté activa
    if (isConnectionClosed(pc)) {
      throw new Error('La conexión se cerró durante la configuración');
    }
    pc.addTrack(ms.getTracks()[0]);

    try {
      const capabilities = RTCRtpSender.getCapabilities("audio");
      if (capabilities) {
        const chosenCodec = capabilities.codecs.find(
          (c) => c.mimeType.toLowerCase() === `audio/${codec}`
        );
        if (chosenCodec) {
          pc.getTransceivers()[0].setCodecPreferences([chosenCodec]);
        }
      }
    } catch (error) {
      console.warn("Error setting codec preferences:", error);
    }

    const dc = pc.createDataChannel("oai-events", {
      ordered: true,
      maxRetransmits: 3
    });

    // Configurar manejadores de eventos del canal de datos
    dc.onclose = () => {
      console.log("Canal de datos cerrado");
    };

    dc.onerror = (error) => {
      console.error("Error en el canal de datos:", error);
    };

    try {
      // Verificar estado antes de crear la oferta
      if (isConnectionClosed(pc)) {
        throw new Error('La conexión se cerró antes de crear la oferta');
      }

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        iceRestart: true
      });
      
      // Verificar estado antes de establecer la descripción local
      if (isConnectionClosed(pc)) {
        throw new Error('La conexión se cerró antes de establecer la descripción local');
      }
      await pc.setLocalDescription(offer);

      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";

      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp",
        },
      });

      if (!sdpResponse.ok) {
        throw new Error(`Error en la respuesta del servidor: ${sdpResponse.status}`);
      }

      const answerSdp = await sdpResponse.text();
      const answer: RTCSessionDescriptionInit = {
        type: "answer",
        sdp: answerSdp,
      };

      // Verificar estado antes de establecer la descripción remota
      if (isConnectionClosed(pc)) {
        throw new Error('La conexión se cerró antes de establecer la descripción remota');
      }
      await pc.setRemoteDescription(answer);

      return { pc, dc };
    } catch (error) {
      await cleanupRealtimeConnection();
      throw error;
    }
  } finally {
    isConnecting = false; 
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    // Resolver el lock si aún está activo y no fue resuelto/rechazado por el timeout
    if (connectionLockActive && resolveConnectionLock) {
      resolveConnectionLock();
    }
    connectionLock = null; 
  }
}

export async function cleanupRealtimeConnection(): Promise<void> {
  // Esperar a que cualquier conexión en proceso termine
  if (connectionLock) {
    try {
      await Promise.race([
        connectionLock,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout en limpieza')), 5000))
      ]);
    } catch (error) {
      console.warn('Timeout esperando el bloqueo de conexión:', error);
    }
    connectionLock = null;
  }

  return new Promise<void>((resolve) => {
    // Limpiar timeout de reconexión
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }

    if (existingPeerConnection) {
      try {
        // Detener todos los senders
        existingPeerConnection.getSenders().forEach(sender => {
          if (sender.track) {
            sender.track.stop();
          }
        });

        // Detener todos los receivers
        existingPeerConnection.getReceivers().forEach(receiver => {
          if (receiver.track) {
            receiver.track.stop();
          }
        });

        // Cerrar la conexión
        if (!isConnectionClosed(existingPeerConnection)) {
          existingPeerConnection.close();
        }
      } catch (error) {
        console.warn("Error durante la limpieza de RTCPeerConnection:", error);
      }
      existingPeerConnection = null;
    }
    
    if (existingStream) {
      try {
        existingStream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.warn("Error durante la limpieza del stream:", error);
      }
      existingStream = null;
    }

    // Dar tiempo para que se complete la limpieza
    setTimeout(resolve, 500);
  });
}
