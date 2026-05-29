import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { cookies } from "next/headers";

import { ThemeStyles } from "@gdggye/theme-engine";
import { bwai2026Light, bwai2026Dark } from "@gdggye/themes";
import { LANG_COOKIE, getLang } from "@gdggye/i18n";

import { Providers } from "@/components/providers";
import type { ThemeMode } from "@/lib/types";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Build with AI 2026 · GDG Guayaquil",
  description:
    "Un día construyendo con modelos generativos: Gemini, fine-tuning, agentes y producción.",
  applicationName: "BWAI 2026",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BWAI 2026",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1320" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const theme = (cookieStore.get("gdg-theme")?.value as ThemeMode) || "light";
  const lang = getLang(cookieStore.get(LANG_COOKIE)?.value);

  return (
    <html
      lang={lang}
      data-theme={theme}
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <ThemeStyles light={bwai2026Light} dark={bwai2026Dark} />
      </head>
      <body className="flex min-h-screen flex-col">
        <Providers initialTheme={theme} initialLang={lang}>
          <main className="flex-1">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
