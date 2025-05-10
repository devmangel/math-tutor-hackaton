import { RefObject } from "react";

let existingStream: MediaStream | null = null;
let existingPeerConnection: RTCPeerConnection | null = null;

export async function createRealtimeConnection(
  EPHEMERAL_KEY: string,
  audioElement: RefObject<HTMLAudioElement | null>,
  codec: string
): Promise<{ pc: RTCPeerConnection; dc: RTCDataChannel }> {
  // Asegurarse de que cualquier conexión existente esté completamente limpia
  if (existingPeerConnection) {
    try {
      existingPeerConnection.close();
    } catch (error) {
      console.warn("Error al cerrar conexión existente:", error);
    }
    existingPeerConnection = null;
  }

  // Esperar un momento para asegurar que la conexión anterior se ha limpiado
  await new Promise(resolve => setTimeout(resolve, 100));

  const pc = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' }
    ]
  });
  existingPeerConnection = pc;

  // Manejar cambios en el estado de la conexión
  pc.oniceconnectionstatechange = () => {
    const state = pc.iceConnectionState;
    console.log("ICE Connection State:", state);
    if (state === 'failed' || state === 'disconnected' || state === 'closed') {
      console.error("Conexión ICE perdida o cerrada:", state);
    }
  };

  pc.onconnectionstatechange = () => {
    const state = pc.connectionState;
    console.log("Connection State:", state);
    if (state === 'failed' || state === 'closed') {
      console.error("Conexión perdida o cerrada:", state);
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
        existingStream.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (error) {
            console.warn("Error al detener track:", error);
          }
        });
      }
      ms = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      existingStream = ms;
    }
  } catch (error) {
    console.error("Error al obtener stream de audio:", error);
    throw error;
  }
  
  pc.addTrack(ms.getTracks()[0]);

  try {
    // Set codec preferences based on selected codec from the query parameter.
    const capabilities = RTCRtpSender.getCapabilities("audio");
    if (capabilities) {
      const chosenCodec = capabilities.codecs.find(
        (c) => c.mimeType.toLowerCase() === `audio/${codec}`
      );
      if (chosenCodec) {
        pc.getTransceivers()[0].setCodecPreferences([chosenCodec]);
      } else {
        console.warn(
          `Codec "${codec}" not found in capabilities. Using default settings.`
        );
      }
    }
  } catch (error) {
    console.warn("Error setting codec preferences:", error);
  }

  const dc = pc.createDataChannel("oai-events");

  try {
    const offer = await pc.createOffer();
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

    await pc.setRemoteDescription(answer);

    return { pc, dc };
  } catch (error) {
    // Limpiar recursos en caso de error
    pc.close();
    existingPeerConnection = null;
    throw error;
  }
}

  // Función para limpiar recursos
export function cleanupRealtimeConnection() {
  return new Promise<void>((resolve) => {
    if (existingPeerConnection) {
      try {
        // Detener todos los senders
        existingPeerConnection.getSenders().forEach(sender => {
          try {
            if (sender.track) {
              sender.track.stop();
            }
          } catch (error) {
            console.warn("Error al detener sender:", error);
          }
        });

        // Detener todos los receivers
        existingPeerConnection.getReceivers().forEach(receiver => {
          try {
            if (receiver.track) {
              receiver.track.stop();
            }
          } catch (error) {
            console.warn("Error al detener receiver:", error);
          }
        });

        // Cerrar la conexión si aún no está cerrada
        if (existingPeerConnection.connectionState !== 'closed') {
          existingPeerConnection.close();
        }
      } catch (error) {
        console.warn("Error durante la limpieza de RTCPeerConnection:", error);
      }
      existingPeerConnection = null;
    }
    
    if (existingStream) {
      try {
        existingStream.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (error) {
            console.warn("Error al detener track:", error);
          }
        });
      } catch (error) {
        console.warn("Error durante la limpieza del stream:", error);
      }
      existingStream = null;
    }

    // Dar tiempo para que se complete la limpieza
    setTimeout(resolve, 100);
  });
}
