import { zodResponseFormat } from "openai/helpers/zod";
import { GuardrailOutputZod, GuardrailOutput } from "@/app/types";


export async function runGuardrailClassifier(message: string): Promise<GuardrailOutput> {
  const messages = [
    {
      role: "user",
      content: `You are an expert at maintaining a safe and effective educational environment through message classification. You monitor conversations in a math/programming learning platform where tutors help students learn through guided discovery and direct instruction.

      Your task is to analyze the provided message and classify it according to the output_classes. The message will be from either a tutor or a student - you must consider the context and content to determine which, as this affects how you apply the categories.

      Key Classification Rules:
      1. For TUTOR messages:
         - Normal questions about student background, goals, or learning preferences are SAFE_AND_ON_TOPIC
         - Giving direct answers instead of guiding is PEDAGOGICALLY_UNSOUND
         - Confusing explanations or incorrect math/code are PEDAGOGICALLY_UNSOUND
         - Staying on educational topics is expected and good

      2. For STUDENT messages:
         - Short answers to tutor questions are SAFE_AND_ON_TOPIC
         - Signs of frustration/anger are STUDENT_FRUSTRATION_ESCALATION
         - Attempts to get answers without learning are ACADEMIC_HONESTY_VIOLATION_ATTEMPT
         - Non-learning conversation is OFF_TOPIC_STUDENT
         - Platform/technical problems are TECHNICAL_ISSUE_REPORTED
         - Inappropriate language/behavior is INAPPROPRIATE_STUDENT_CONTENT

      3. General Guidelines:
         - Default to SAFE_AND_ON_TOPIC if the message is appropriate and learning-focused
         - Consider the educational context - normal tutoring interactions are SAFE_AND_ON_TOPIC
         - Technical issues should be clearly stated to be classified as TECHNICAL_ISSUE_REPORTED

      Output json following the provided schema. Keep your analysis and reasoning clear but concise, maximum 2 sentences.

      <message>
      ${message}
      </message>

      <output_classes>
      - PEDAGOGICALLY_UNSOUND: Content from the tutor that is mathematically incorrect, uses poor teaching methods (like giving direct answers when should guide), or could confuse students unnecessarily. Should trigger review and possible intervention.
      - OFF_TOPIC_STUDENT: Student attempts to divert conversation away from math/programming learning (e.g. personal questions, unrelated topics). Tutor should gently redirect to learning objectives.
      - STUDENT_FRUSTRATION_ESCALATION: Student shows high frustration, anger, or severe demotivation. Tutor should adapt approach (simplify, offer break) or consider escalation to human support.
      - ACADEMIC_HONESTY_VIOLATION_ATTEMPT: Student tries to get direct answers without effort or seeks ways to bypass learning. Tutor should refuse and refocus on learning process.
      - INAPPROPRIATE_STUDENT_CONTENT: Includes profanity, sexually suggestive content, or other inappropriate behavior for educational setting. May require warning or session termination.
      - TECHNICAL_ISSUE_REPORTED: Student reports platform/agent/content problems. Should be logged and addressed appropriately.
      - SAFE_AND_ON_TOPIC: Message is appropriate and relevant to the math/programming lesson (replaces NONE).
      </output_classes>
      `,
    },
  ];

  const response = await fetch("/api/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      messages,
      response_format: zodResponseFormat(GuardrailOutputZod, "output_format"),
    }),
  });

  if (!response.ok) {
    console.warn("Server returned an error:", response);
    return Promise.reject("Error with runGuardrailClassifier.");
  }

  const data = await response.json();

  try {
    // Parse the message content as JSON and validate it using the GuardrailOutput schema.
    const parsedContent = JSON.parse(data.choices[0].message.content);
    const output = GuardrailOutputZod.parse(parsedContent);
    return output;
  } catch (error) {
    console.error("Error parsing the message content as GuardrailOutput:", error);
    return Promise.reject("Failed to parse guardrail output.");
  }
}
