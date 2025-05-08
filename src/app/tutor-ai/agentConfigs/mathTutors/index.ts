import { AgentConfig } from "@/app/types";
import { injectTransferTools } from "../utils";

import onboardingAgentConfig from "./onboardingAgent";
import routerAgentConfig from "./routerAgent";
import senseiAgentConfig from "./senseiAgent";
import mayeuticAgentConfig from "./mayeuticAgent";

// Configurar las relaciones downstream entre agentes
onboardingAgentConfig.downstreamAgents = [senseiAgentConfig];
senseiAgentConfig.downstreamAgents = [mayeuticAgentConfig];
mayeuticAgentConfig.downstreamAgents = [senseiAgentConfig];

// Lista de todos los agentes en este conjunto
// El orden es importante:
// 1. onboardingAgent debe ser el primero ya que es el punto de entrada
// 2. senseiAgent y mayeuticAgent son los agentes finales que pueden transferir entre sí
let agents: AgentConfig[] = [
  onboardingAgentConfig,
  senseiAgentConfig,
  mayeuticAgentConfig,
];

// Inyectar la herramienta de transferencia a todos los agentes que tienen downstreamAgents
agents = injectTransferTools(agents);

export default agents;
