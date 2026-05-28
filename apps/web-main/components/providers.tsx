"use client";

import * as React from "react";

import type { Lang, ThemeMode } from "@/lib/types";

interface AppContextValue {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
}

const AppContext = React.createContext<AppContextValue | null>(null);

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; SameSite=Lax`;
}

export function Providers({
  children,
  initialTheme,
  initialLang,
}: {
  children: React.ReactNode;
  initialTheme: ThemeMode;
  initialLang: Lang;
}) {
  const [theme, setThemeState] = React.useState<ThemeMode>(initialTheme);
  const [lang, setLangState] = React.useState<Lang>(initialLang);

  const setTheme = React.useCallback((t: ThemeMode) => {
    setThemeState(t);
    setCookie("gdg-theme", t);
    document.documentElement.setAttribute("data-theme", t);
  }, []);

  const setLang = React.useCallback((l: Lang) => {
    setLangState(l);
    setCookie("gdg-lang", l);
    document.documentElement.setAttribute("lang", l);
  }, []);

  const value = React.useMemo(
    () => ({ theme, setTheme, lang, setLang }),
    [theme, setTheme, lang, setLang],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = React.useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used within Providers");
  }
  return ctx;
}
