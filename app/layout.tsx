import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from 'react-hot-toast';

import { ClientNavbar, Providers } from "@/components";
import "./globals.css";

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
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1E293B',
              color: '#F8FAFC',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            },
            success: {
              iconTheme: { primary: '#10B981', secondary: '#F8FAFC' },
            },
            error: {
              iconTheme: { primary: '#EF4444', secondary: '#F8FAFC' },
            },
          }}
        />
      </body>
    </html>
  );
}
