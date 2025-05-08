import type { Metadata } from "next";
import "./globals.css";
import "./lib/envSetup";
import "./tutor-ai/styles/tutor-ai.css";

export const metadata: Metadata = {
  title: "Tutor de Matemáticas IA",
  description: "Tutor de matemáticas personalizado con IA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased`}>{children}</body>
    </html>
  );
}
