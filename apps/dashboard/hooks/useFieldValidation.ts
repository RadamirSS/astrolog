"use client";

import { useMemo } from "react";
import type { TenantConfig } from "@astro/tenant-config";
import { getFieldError, getTenantConfigFieldErrors } from "@astro/tenant-config";

export function useFieldValidation(config: TenantConfig | null) {
  const errors = useMemo(
    () => (config ? getTenantConfigFieldErrors(config) : []),
    [config]
  );

  const getError = (path: string) => getFieldError(errors, path);

  return { errors, getError, hasErrors: errors.length > 0 };
}
