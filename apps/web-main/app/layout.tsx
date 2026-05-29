import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { cookies } from "next/headers";

import { ThemeStyles } from "@gdggye/theme-engine";
import { gdggyeCoreLight, gdggyeCoreDark } from "@gdggye/themes";
import { LANG_COOKIE, getLang } from "@gdggye/i18n";

import { Providers } from "@/components/providers";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { SiteHeader, type SiteHeaderUser } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getCurrentUser } from "@/lib/server/auth";
import { listPublishedEvents } from "@/lib/server/events";
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
  title: "GDG Guayaquil — Plataforma comunitaria",
  description:
    "Comunidad de desarrolladores en Guayaquil, Ecuador. Eventos, talleres y meetups.",
  applicationName: "GDG Guayaquil",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GDG Gye",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1e1e1e" },
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

  // Fetch once at layout level so the footer's event list and any future
  // header-aware menus share the same data without re-querying.
  const [events, currentUser] = await Promise.all([
    listPublishedEvents(),
    getCurrentUser(),
  ]);
  const footerEvents = events.map((e) => ({
    id: e.id,
    slug: e.slug,
    name: e.name,
    year: e.year,
  }));
  const headerUser: SiteHeaderUser | null = currentUser
    ? {
        id: currentUser.id,
        fullName: currentUser.fullName,
        email: currentUser.email,
        photoUrl: currentUser.photoUrl,
      }
    : null;

  return (
    <html
      lang={lang}
      data-theme={theme}
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <ThemeStyles light={gdggyeCoreLight} dark={gdggyeCoreDark} />
      </head>
      <body className="flex min-h-screen flex-col">
        <Providers initialTheme={theme} initialLang={lang}>
          <SiteHeader user={headerUser} />
          <main className="flex-1">{children}</main>
          <SiteFooter events={footerEvents} />
          <ServiceWorkerRegister />
        </Providers>
      </body>
    </html>
  );
}
