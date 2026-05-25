"use client";

import { Suspense, type ReactNode } from "react";
import { I18nHtmlLang, I18nProvider } from "@astro/i18n";

function I18nBoundary({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <I18nHtmlLang />
      {children}
    </I18nProvider>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <I18nBoundary>{children}</I18nBoundary>
    </Suspense>
  );
}
