import type { Metadata } from "next";
import { Unbounded, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Unbounded({ subsets: ["latin"], variable: "--f-display", weight: ["300", "500", "700"] });
const sans = Inter({ subsets: ["latin"], variable: "--f-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--f-mono" });

export const metadata: Metadata = {
  title: "Flame in Freefall · Atlas de inflamabilidad",
  description: "Qué sabe NASA sobre incendios en microgravedad y dónde faltan datos para la Luna y Marte.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${display.variable} ${sans.variable} ${mono.variable}`}>{children}</body>
    </html>
  );
}
