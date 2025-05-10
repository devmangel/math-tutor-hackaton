import { SessionStatus } from '../types';

export interface TutorContentProps {
  sessionStatus: SessionStatus;
  handlePTTStart: () => void;
  handlePTTEnd: () => void;
  handleSendMessage: (text: string) => void;
  isRecording: boolean;
  isProcessing: boolean;
}
