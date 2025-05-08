export { default as TutorMainView } from './TutorMainView';
export { default as Avatar } from './components/Avatar';
export { default as AgentDisplay } from './components/AgentDisplay';
export { default as ChatInterface } from './components/ChatInterface';
export { default as CodeBlock } from './components/CodeBlock';
export { default as MessageBubble } from './components/MessageBubble';
export { default as UserInput } from './components/UserInput';

export {
  TutorProvider,
  useTutor,
  tutorActions,
} from './contexts/TutorContext';

export type {
  Message,
  Agent,
  TutorState,
  TutorAction,
} from './contexts/TutorContext';
