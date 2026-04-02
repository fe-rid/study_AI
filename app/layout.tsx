import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "StudyAI — Your Intelligent Study Companion",
  description:
    "StudyAI is an AI-powered student assistant that helps you learn faster. Ask questions about math, science, history, literature and more.",
  keywords: ["AI tutor", "student assistant", "study helper", "ChatGPT for students"],
  authors: [{ name: "StudyAI" }],
  openGraph: {
    title: "StudyAI — Your Intelligent Study Companion",
    description: "AI-powered student assistant. Ask anything, learn everything.",
    type: "website",
  },
};

import AuthProvider from "@/components/AuthProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" className={`${inter.variable} h-full antialiased`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y=\'.9em\' font-size=\'90\'>🎓</text></svg>" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css" />
      </head>
      <body style={{ height: "100%" }}>
        <AuthProvider>{children}</AuthProvider>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/markdown-it/13.0.1/markdown-it.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
      </body>
    </html>
  );
}
