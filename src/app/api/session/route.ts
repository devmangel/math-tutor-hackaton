import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Verificar que la clave API esté configurada
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY no está configurada");
      return NextResponse.json(
        { error: "API key no configurada" },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini-realtime-preview-2024-12-17",
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Error en la respuesta de OpenAI:", response.status, errorData);
      return NextResponse.json(
        { error: "Error al obtener la sesión" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Verificar que la respuesta contenga la clave efímera
    if (!data.client_secret?.value) {
      console.error("Respuesta inválida de OpenAI:", data);
      return NextResponse.json(
        { error: "Respuesta inválida del servidor" },
        { status: 500 }
      );
    }

    // Devolver solo la información necesaria
    return NextResponse.json({
      client_secret: {
        value: data.client_secret.value,
        expires_at: data.client_secret.expires_at
      }
    });
  } catch (error) {
    console.error("Error en /session:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
