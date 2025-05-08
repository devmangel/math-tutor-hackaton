'use client';

import React from 'react';
import TutorMainView from './TutorMainView';
import './styles/tutor-ai.css';

const TutorAIPage: React.FC = () => {
  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      <TutorMainView />
    </div>
  );
};

export default TutorAIPage;
