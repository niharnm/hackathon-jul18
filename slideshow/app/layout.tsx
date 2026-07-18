import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Amari — Local intelligence, spoken",
  description: "A fast, local voice agent that can browse the web and explain what it finds.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
