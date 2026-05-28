import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { cookies } from "next/headers";

import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { listPublishedEvents } from "@/lib/server/events";
import type { Lang, ThemeMode } from "@/lib/types";

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
  title: "GDG Guayaquil — Plataforma comunitaria",
  description:
    "Comunidad de desarrolladores en Guayaquil, Ecuador. Eventos, talleres y meetups.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const theme = (cookieStore.get("gdg-theme")?.value as ThemeMode) || "light";
  const lang = (cookieStore.get("gdg-lang")?.value as Lang) || "es";

  // Fetch once at layout level so the footer's event list and any future
  // header-aware menus share the same data without re-querying.
  const events = await listPublishedEvents();
  const footerEvents = events.map((e) => ({
    id: e.id,
    slug: e.slug,
    name: e.name,
    year: e.year,
  }));

  return (
    <html
      lang={lang}
      data-theme={theme}
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="flex min-h-screen flex-col">
        <Providers initialTheme={theme} initialLang={lang}>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter events={footerEvents} />
        </Providers>
      </body>
    </html>
  );
}
