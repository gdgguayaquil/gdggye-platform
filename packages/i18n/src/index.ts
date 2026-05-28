export { COPY } from "./copy";

export type Lang = "es" | "en";

export const DEFAULT_LANG: Lang = "es";
export const SUPPORTED_LANGS: readonly Lang[] = ["es", "en"] as const;
export const LANG_COOKIE = "gdg-lang";

export function isLang(value: unknown): value is Lang {
  return value === "es" || value === "en";
}

export function getLang(value: unknown): Lang {
  return isLang(value) ? value : DEFAULT_LANG;
}
