import { useCallback, useEffect, useRef, useState } from 'react';
import { create } from 'zustand';

interface AudioState {
  isActive: boolean;
  isProcessing: boolean;
  audioLevel: number;
  error: string | null;
  permissionStatus: 'granted' | 'denied' | 'prompt' | null;
}

interface AudioStore {
  state: AudioState;
  setState: (state: Partial<AudioState>) => void;
  mediaStream: MediaStream | null;
  setMediaStream: (stream: MediaStream | null) => void;
}

const useAudioStore = create<AudioStore>((set: any) => ({
  state: {
    isActive: false,
    isProcessing: false,
    audioLevel: 0,
    error: null,
    permissionStatus: null,
  },
  setState: (newState: Partial<AudioState>) => set((prev: AudioStore) => ({ 
    state: { ...prev.state, ...newState } 
  })),
  mediaStream: null,
  setMediaStream: (stream: MediaStream | null) => set({ mediaStream: stream }),
}));

export const useAudioInput = () => {
  const {
    state,
    setState,
    mediaStream,
    setMediaStream,
  } = useAudioStore();

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Función para actualizar el nivel de audio
  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calcular el promedio del nivel de audio
    const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
    const normalizedLevel = Math.min(average / 128, 1);

    setState({ audioLevel: normalizedLevel });

    animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
  }, [setState]);

  // Inicializar el análisis de audio
  const initializeAudioAnalysis = useCallback((stream: MediaStream) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    const source = audioContextRef.current.createMediaStreamSource(stream);
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 256;
    source.connect(analyserRef.current);

    updateAudioLevel();
  }, [updateAudioLevel]);

  // Comprobar y solicitar permisos
  const checkPermissions = useCallback(async () => {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      setState({ permissionStatus: result.state as AudioState['permissionStatus'] });

      result.addEventListener('change', () => {
        setState({ permissionStatus: result.state as AudioState['permissionStatus'] });
      });
    } catch (error) {
      console.warn('No se pudo consultar el estado del permiso:', error);
    }
  }, [setState]);

  // Iniciar grabación
  const startRecording = useCallback(async () => {
    try {
      setState({ error: null });

      // Solicitar permisos si es necesario
      if (state.permissionStatus !== 'granted') {
        await checkPermissions();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });

      setMediaStream(stream);
      initializeAudioAnalysis(stream);
      setState({ isActive: true });
    } catch (error) {
      console.error('Error al iniciar la grabación:', error);
      setState({ 
        error: 'No se pudo acceder al micrófono',
        isActive: false 
      });
    }
  }, [state.permissionStatus, setState, setMediaStream, initializeAudioAnalysis, checkPermissions]);

  // Detener grabación
  const stopRecording = useCallback(() => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      setMediaStream(null);
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setState({ 
      isActive: false,
      audioLevel: 0
    });
  }, [mediaStream, setMediaStream, setState]);

  // Limpiar recursos al desmontar
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  // Comprobar permisos iniciales
  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  return {
    ...state,
    startRecording,
    stopRecording,
    mediaStream,
  };
};
