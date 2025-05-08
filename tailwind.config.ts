import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores Primarios
        primary: "#4A90E2",      // Azul educativo
        secondary: "#2ECC71",    // Verde fresco
        
        // Fondos y Contenido
        background: "#F5F7FA",   // Gris muy claro
        "content-background": "#FFFFFF", // Blanco puro
        surface: "#E8F0FE",     // Azul muy claro
        
        // Acentos
        "accent-1": "#FF7F50",  // Coral (Ana)
        "accent-2": "#9B59B6",  // Púrpura (Takeshi)
        "accent-3": "#3498DB",  // Azul claro (Sócrates)
        
        // Estados
        success: "#27AE60",     // Verde
        warning: "#F1C40F",     // Amarillo
        error: "#E74C3C",       // Rojo
        
        // Texto
        "text-primary": "#2C3E50",    // Azul oscuro
        "text-secondary": "#7F8C8D",   // Gris
        "text-on-primary": "#FFFFFF",  // Blanco
        
        // Colores Específicos de Agentes
        "agent-ana": "#FF7F50",      // Coral suave
        "agent-takeshi": "#9B59B6",  // Púrpura
        "agent-socrates": "#3498DB", // Azul claro
        
        // Utilidades
        "light-gray": "#ECF0F1",
        "medium-gray": "#95A5A6",
        "dark-gray": "#34495E",
      },
    },
  },
  plugins: [],
} satisfies Config;
