import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Northstar — voice agent lab", description: "A local-model voice concierge powered by Ollama and Moss retrieval." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
