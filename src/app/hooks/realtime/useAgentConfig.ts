import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AgentConfig } from '@/app/types';
import { allAgentSets, defaultAgentSetKey } from '@/app/tutor-ai/agentConfigs';

interface UseAgentConfigReturn {
  selectedAgentName: string;
  selectedAgentConfigSet: AgentConfig[] | null;
  agentSetKey: string;
  setSelectedAgentName: (name: string) => void;
  handleAgentChange: (newAgentConfig: string) => void;
  handleSelectedAgentChange: (newAgentName: string) => void;
}

export function useAgentConfig(): UseAgentConfigReturn {
  const searchParams = useSearchParams();
  const [selectedAgentName, setSelectedAgentName] = useState<string>("");
  const [selectedAgentConfigSet, setSelectedAgentConfigSet] = useState<AgentConfig[] | null>(null);

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
        const { agentName, timestamp } = JSON.parse(session);
        // Verificar si la sesión no es muy antigua (30 minutos)
        if (Date.now() - timestamp < 30 * 60 * 1000) {
          // Verificar que el agente existe en el conjunto actual
          if (agents.some(a => a.name === agentName)) {
            setSelectedAgentName(agentName);
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

  const handleAgentChange = (newAgentConfig: string) => {
    const url = new URL(window.location.toString());
    url.searchParams.set("agentConfig", newAgentConfig);
    window.location.replace(url.toString());
  };

  const handleSelectedAgentChange = (newAgentName: string) => {
    setSelectedAgentName(newAgentName);
    // Actualizar la sesión en localStorage
    localStorage.setItem("chatSession", JSON.stringify({
      agentName: newAgentName,
      timestamp: Date.now()
    }));
  };

  const agentSetKey = searchParams.get("agentConfig") || defaultAgentSetKey;

  return {
    selectedAgentName,
    selectedAgentConfigSet,
    agentSetKey,
    setSelectedAgentName,
    handleAgentChange,
    handleSelectedAgentChange
  };
}
