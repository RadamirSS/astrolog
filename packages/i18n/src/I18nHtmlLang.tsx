"use client";

import { useEffect } from "react";
import { useI18n } from "./context";

export function I18nHtmlLang() {
  const { locale } = useI18n();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
