import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { LanguageProvider } from "@/lib/i18n";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "CyberLab-ID | Learn. Build. Analyze. Secure.",
  description:
    "Ekosistem dan platform pembelajaran cybersecurity open-source untuk komunitas Indonesia. Dilengkapi materi kurikulum terstruktur, tools interaktif berbasis browser, dan CTF challenges.",
  keywords: [
    "cybersecurity",
    "keamanan siber",
    "belajar ctf",
    "cyberlab-id",
    "ethical hacking",
    "indonesia",
    "tools keamanan",
    "network security",
    "web security",
    "cryptography",
  ],
  authors: [{ name: "CyberLab-ID Contributors" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)] selection:bg-[var(--color-accent)] selection:text-black">
        <LanguageProvider>
          <Navbar />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
