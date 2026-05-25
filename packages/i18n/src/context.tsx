"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  type AppLocale,
  type Dictionary,
  persistLocale,
  resolveClientLocalePreference,
  resolveInitialLocale,
  resolveLocaleFromSearchParams,
  t,
} from "./core";
import { getDictionary } from "./dictionaries";

interface I18nContextValue {
  locale: AppLocale;
  dictionary: Dictionary;
  setLocale: (locale: AppLocale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export interface I18nProviderProps {
  children: ReactNode;
  initialLocale?: AppLocale;
  syncUrl?: boolean;
}

export function I18nProvider({
  children,
  initialLocale,
  syncUrl = true,
}: I18nProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [locale, setLocaleState] = useState<AppLocale>(
    () => initialLocale ?? resolveInitialLocale(searchParams)
  );

  useEffect(() => {
    const fromUrl = resolveLocaleFromSearchParams(searchParams);
    if (fromUrl) {
      setLocaleState(fromUrl);
      return;
    }
    if (initialLocale) {
      setLocaleState(initialLocale);
      return;
    }
    setLocaleState(resolveClientLocalePreference());
  }, [searchParams, initialLocale]);

  const setLocale = useCallback(
    (next: AppLocale) => {
      setLocaleState(next);
      persistLocale(next);
      if (!syncUrl || typeof window === "undefined") return;
      const params = new URLSearchParams(searchParams.toString());
      params.set("lang", next);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams, syncUrl]
  );

  const dictionary = useMemo(() => getDictionary(locale), [locale]);

  const translate = useCallback(
    (key: string, params?: Record<string, string | number>) => t(dictionary, key, params),
    [dictionary]
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, dictionary, setLocale, t: translate }),
    [locale, dictionary, setLocale, translate]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export function useT() {
  const { t: translate } = useI18n();
  return translate;
}
