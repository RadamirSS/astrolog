import type { AppLocale, Dictionary } from "../core";
import { mergeDictionaries } from "../core";
import { enDictionary } from "./en";
import { ruDictionary } from "./ru";

const cache = new Map<AppLocale, Dictionary>();

export function getDictionary(locale: AppLocale): Dictionary {
  if (locale === "en") return enDictionary;
  const cached = cache.get(locale);
  if (cached) return cached;
  const merged = mergeDictionaries(enDictionary, ruDictionary);
  cache.set(locale, merged);
  return merged;
}

export { enDictionary, ruDictionary };
