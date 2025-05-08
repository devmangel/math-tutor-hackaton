# AI Math Tutor: Aprendizaje de Matemáticas con Agentes Inteligentes en Tiempo Real

Este proyecto es una demostración de un sistema de tutoría de matemáticas impulsado por Inteligencia Artificial (IA). Utiliza un conjunto de agentes especializados para ofrecer una experiencia de aprendizaje personalizada e interactiva, combinando conceptos matemáticos con programación en Python. La metodología se inspira en los principios STEM (Science, Technology, Engineering, Maths) y la resolución de problemas contextualizados en la Cuarta Revolución Industrial (4RI).

## Características Principales

*   **Aprendizaje Basado en Competencias para la 4RI:** Enfocado en desarrollar habilidades matemáticas y de programación directamente aplicables en el entorno profesional actual.
*   **Integración de Matemáticas y Programación:** Enseña conceptos matemáticos fundamentales a través de su implementación práctica en Python desde el inicio.
*   **Metodología de Enseñanza Activa:** Promueve la resolución de problemas reales y la participación activa del estudiante en su proceso de aprendizaje.
*   **Sistema de Agentes IA:**
    *   **Agente Onboarding:** Conoce al estudiante, recopilando información sobre sus motivaciones, experiencia previa y estilo de aprendizaje.
    *   **Sensei Pitagórico:** Actúa como un maestro clásico, guiando al estudiante a través de mini-proyectos, explicando conceptos matemáticos y su codificación en Python, y ofreciendo feedback formativo.
    *   **Guía Mayéutico:** Inspirado en el método socrático y las etapas de George Pólya, formula preguntas estratégicas para ayudar al estudiante a descubrir soluciones por sí mismo.
*   **Enfoque en la Comprensión Fundamental:** Prioriza el entendimiento profundo de los conceptos sobre el aprendizaje empírico o memorístico.

## Arquitectura de Agentes

El sistema se basa en una coreografía de agentes inteligentes que interactúan para personalizar la experiencia de aprendizaje:

1.  **Agente Onboarding:** Inicia la interacción, creando un perfil detallado del estudiante.
2.  **Sensei Pitagórico:** Toma el relevo para la instrucción directa, explicando temas, mostrando ejemplos de código y evaluando el progreso en mini-proyectos.
3.  **Guía Mayéutico:** Interviene para fomentar el pensamiento crítico, guiando al estudiante a través de preguntas para que construya su propio conocimiento y resuelva problemas de forma autónoma.

Estos agentes pueden transferirse el control entre sí según las necesidades del estudiante y la etapa del proceso de aprendizaje, asegurando una tutoría adaptativa y dinámica.

## Setup

*   Este es un proyecto Next.js desarrollado en TypeScript.
*   Instala las dependencias con `npm i`.
*   Añade tu `OPENAI_API_KEY` a tus variables de entorno. Puedes añadirla a tu archivo `.bash_profile` (o equivalente) o copiar `.env.sample` a `.env` y añadirla allí.
*   Inicia el servidor de desarrollo con `npm run dev`.
*   Abre tu navegador en [http://localhost:3000](http://localhost:3000) para ver la aplicación. Por defecto, se conectará al conjunto de agentes `mathTutors`.

## Configuración de Agentes

La configuración principal de los agentes para el tutor de matemáticas se encuentra en `src/app/tutor-ai/agentConfigs/mathTutors/`.

A continuación, un extracto de cómo se define un agente (ejemplo simplificado de `onboardingAgent.ts`):

```typescript
import { AgentConfig } from "@/app/types";

const onboardingAgentConfig: AgentConfig = {
  name: "onboardingAgent",
  publicDescription: "Agente que realiza el perfilamiento inicial del estudiante.",
  instructions: `
# Personality and Tone
## Identidad
Eres el Agente Onboarding, un facilitador empático y observador cuya misión es conocer al estudiante en profundidad.
// ... (más instrucciones de personalidad y tono)

# Instructions
- Inicia con un saludo cálido y explica el propósito de conocerse mejor.
- Haz preguntas abiertas para explorar:
  1. Antecedentes y experiencia previa en programación/matemáticas.
  // ... (más instrucciones específicas)
`,
  tools: [], // Herramientas específicas para este agente
  // downstreamAgents: [/* otros agentes a los que puede transferir */], // Agentes a los que puede pasar el control
  conversationStates: [ // Máquina de estados para guiar la conversación
    {
      "id": "1_saludo_introduccion",
      "description": "Saludar y explicar el objetivo de la sesión de perfilamiento.",
      "instructions": [
        "Dar la bienvenida al estudiante.",
        "Explicar que harás preguntas para conocer sus necesidades y expectativas."
      ],
      "examples": [
        "¡Hola! Soy tu Agente Onboarding. Me gustaría conocer más sobre ti para personalizar tu aprendizaje. ¿Te parece bien?"
      ],
      "transitions": [
        { "next_step": "2_antecedentes_experiencia", "condition": "Después del saludo y aceptación del estudiante." }
      ]
    },
    // ... (más estados de conversación)
  ]
};

export default onboardingAgentConfig;
```

El archivo `src/app/tutor-ai/agentConfigs/mathTutors/index.ts` ensambla estos agentes en el conjunto `mathTutors`.

## Explorando las Configuraciones de Agentes del Tutor de Matemáticas

Te invitamos a explorar el directorio `src/app/tutor-ai/agentConfigs/mathTutors/` para entender en detalle cómo están configurados los agentes:

*   `onboardingAgent.ts`: Define la personalidad, el flujo conversacional (estados) y las instrucciones para el agente de perfilamiento.
*   `senseiAgent.ts`: Contiene la configuración del agente instructor, incluyendo su enfoque pedagógico y cómo maneja la explicación de conceptos y código.
*   `mayeuticAgent.ts`: Especifica cómo el agente guía utiliza preguntas socráticas para fomentar el descubrimiento.
*   `index.ts`: Orquesta cómo estos agentes trabajan juntos como un conjunto.

## Definiendo tus Propios Agentes

Puedes usar las configuraciones existentes como plantilla para crear tus propios agentes o conjuntos de agentes.

*   **Lógica de Herramientas y Personalidad:** Revisa `src/app/tutor-ai/agentConfigs/mathTutors/senseiAgent.ts` o `src/app/tutor-ai/agentConfigs/mathTutors/mayeuticAgent.ts` para ejemplos de cómo definir la identidad y las capacidades de un agente.
*   **Estados Conversacionales y Flujo:** El archivo `src/app/tutor-ai/agentConfigs/mathTutors/onboardingAgent.ts` es un buen ejemplo de cómo estructurar una conversación basada en estados.
*   **Ensamblaje de un Conjunto de Agentes:** Consulta `src/app/tutor-ai/agentConfigs/mathTutors/index.ts` para ver cómo se integran múltiples agentes.
*   **Metaprompt para Agentes de Voz:** Si necesitas ayuda para crear prompts para agentes de voz siguiendo estas convenciones, puedes usar el metaprompt ubicado en `src/app/tutor-ai/agentConfigs/voiceAgentMetaprompt.txt`.

## Personalización de Guardrails de Salida

Los mensajes del asistente son verificados para seguridad y cumplimiento usando una función de guardrail antes de ser finalizados en la transcripción. Esto se implementa en `src/app/hooks/useHandleServerEvent.ts` a través de la función `processGuardrail`, la cual se invoca en cada mensaje del asistente para ejecutar una verificación de moderación/clasificación. Puedes revisar o personalizar esta lógica editando la definición de la función `processGuardrail` y su invocación dentro de `useHandleServerEvent`.

## UI

*   Puedes seleccionar escenarios de agentes en el desplegable "Scenario", y cambiar automáticamente a un agente específico con el desplegable "Agent".
*   La transcripción de la conversación está a la izquierda, incluyendo llamadas a herramientas, respuestas de llamadas a herramientas y cambios de agente. Haz clic para expandir elementos que no son mensajes.
*   El registro de eventos está a la derecha, mostrando eventos tanto del cliente como del servidor. Haz clic para ver el payload completo.
*   En la parte inferior, puedes desconectar, alternar entre detección de actividad de voz automatizada o PTT (Pulsar para Hablar), desactivar la reproducción de audio y alternar los registros.

## Filosofía del Proyecto

Este proyecto se fundamenta en la creencia de que el aprendizaje de las matemáticas y la programación es más efectivo cuando:

*   Se conecta directamente con **problemas y contextos del mundo real**, especialmente aquellos relevantes para la Cuarta Revolución Industrial.
*   Se prioriza la **comprensión profunda de los fundamentos** sobre la memorización de fórmulas o la escritura de código de forma empírica.
*   Se fomenta un **aprendizaje activo**, donde el estudiante es protagonista de su propio descubrimiento.
*   Se ofrece una **guía personalizada y adaptativa**, capaz de ajustarse al ritmo y estilo de cada estudiante.

Buscamos democratizar el acceso a una educación técnica de alta calidad, preparando a los estudiantes con las competencias necesarias para innovar y prosperar en la era digital.

## Colaboradores Principales

*   Miguel Oviedo
*   Marlon Arcila
*   Marlon Arcila Jr.
