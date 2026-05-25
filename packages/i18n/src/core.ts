export type AppLocale = "en" | "ru";

export const SUPPORTED_LOCALES: AppLocale[] = ["en", "ru"];

export const LOCALE_STORAGE_KEY = "astro_locale";

export const DEFAULT_LOCALE: AppLocale =
  (typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_DEFAULT_LOCALE === "ru" &&
    "ru") ||
  "en";

export function normalizeLocale(input: string | null | undefined): AppLocale {
  if (!input) return "en";
  const lower = input.toLowerCase().trim();
  if (lower === "ru" || lower.startsWith("ru-")) return "ru";
  if (lower === "en" || lower.startsWith("en-")) return "en";
  return "en";
}

export type SearchParamsLike =
  | URLSearchParams
  | Record<string, string | string[] | undefined>
  | null
  | undefined;

function readParam(params: SearchParamsLike, key: string): string | null {
  if (!params) return null;
  if (params instanceof URLSearchParams) return params.get(key);
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

/** SSR-safe: URL query only, no browser storage. */
export function resolveLocaleFromSearchParams(
  searchParams?: SearchParamsLike
): AppLocale | null {
  const fromQuery =
    readParam(searchParams, "lang") ?? readParam(searchParams, "locale");
  return fromQuery ? normalizeLocale(fromQuery) : null;
}

/** Client-only: localStorage and browser language preference. */
export function resolveClientLocalePreference(): AppLocale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored) return normalizeLocale(stored);
  } catch {
    /* ignore */
  }
  if (typeof navigator !== "undefined" && navigator.language) {
    const browser = normalizeLocale(navigator.language);
    if (SUPPORTED_LOCALES.includes(browser)) return browser;
  }
  return DEFAULT_LOCALE;
}

/** SSR-safe initial locale — must match the first client render. */
export function resolveInitialLocale(searchParams?: SearchParamsLike): AppLocale {
  return resolveLocaleFromSearchParams(searchParams) ?? DEFAULT_LOCALE;
}

export function persistLocale(locale: AppLocale): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
}

type DictValue = string | Dictionary;
export type Dictionary = { [key: string]: DictValue };

function getNestedValue(obj: Dictionary, path: string): string | undefined {
  const parts = path.split(".");
  let current: DictValue | undefined = obj;
  for (const part of parts) {
    if (current == null || typeof current === "string") return undefined;
    current = current[part];
  }
  return typeof current === "string" ? current : undefined;
}

export function t(
  dictionary: Dictionary,
  key: string,
  params?: Record<string, string | number>
): string {
  const raw = getNestedValue(dictionary, key);
  if (!raw) return key;
  if (!params) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = params[name];
    return value !== undefined ? String(value) : `{${name}}`;
  });
}

export function mergeDictionaries(base: Dictionary, overlay: Dictionary): Dictionary {
  const result: Dictionary = { ...base };
  for (const key of Object.keys(overlay)) {
    const baseVal = result[key];
    const overlayVal = overlay[key];
    if (
      baseVal &&
      typeof baseVal === "object" &&
      overlayVal &&
      typeof overlayVal === "object"
    ) {
      result[key] = mergeDictionaries(baseVal as Dictionary, overlayVal as Dictionary);
    } else if (overlayVal !== undefined) {
      result[key] = overlayVal;
    }
  }
  return result;
}
