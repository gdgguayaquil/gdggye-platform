import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { cookies } from "next/headers";

import { ThemeStyles } from "@gdggye/theme-engine";
import { gdggyeCoreLight, gdggyeCoreDark } from "@gdggye/themes";
import { LANG_COOKIE, getLang } from "@gdggye/i18n";

import { AdminHeader } from "@/components/admin-header";
import { Providers } from "@/components/providers";
import { getCurrentUser } from "@/lib/server/auth";
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
  title: "GDG Admin",
  description: "GDG Guayaquil platform admin (operators only).",
  robots: { index: false, follow: false },
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

  const user = await getCurrentUser();
  const headerUser = user
    ? {
        fullName: user.fullName,
        email: user.email,
        systemRole: user.systemRole,
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
          <AdminHeader user={headerUser} />
          <main className="flex-1">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
