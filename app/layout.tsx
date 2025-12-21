import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ClientNavbar, Providers } from "@/components";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const jetBrainsMono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Right It Up - AI Argument Settler",
  description: "AI-powered dispute resolution and argument settling",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetBrainsMono.variable}`}>
      <body className="bg-midnight-void text-starlight-white antialiased">
        <Providers>
          <ClientNavbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
