type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

const PATH_TO_KEY: Record<string, string> = {
  "miniApp.publicSlug": "dashboard.validation.publicSlug",
  "brand.displayName": "dashboard.validation.displayName",
  products: "dashboard.validation.products",
  "miniApp.visualPack": "dashboard.validation.visualPack",
  "miniApp.surfaces": "dashboard.validation.surfaces",
  "miniApp.surfaces.telegram": "dashboard.validation.telegramBot",
  "miniApp.surfaces.website": "dashboard.validation.websiteSlug",
  "miniApp.surfaces.mobile": "dashboard.validation.mobileUrl",
};

const MESSAGE_TO_KEY: Record<string, string> = {
  "Public slug is required": "dashboard.validation.publicSlug",
  "Mini app name is required": "dashboard.validation.displayName",
  "Free report must be enabled": "dashboard.validation.freeReport",
  "At least one paid product must be active": "dashboard.validation.paidProduct",
  "Visual pack is required": "dashboard.validation.visualPack",
  "Select a reference visual pack before publishing": "dashboard.validation.visualPack",
  "Select at least one publication surface": "dashboard.validation.surfaces",
  "Connect your Telegram bot before publishing the Telegram surface":
    "dashboard.validation.telegramBot",
  "Website slug is required and must be lowercase alphanumeric with hyphens":
    "dashboard.validation.websiteSlug",
  "Mobile web public URL is required": "dashboard.validation.mobileUrl",
  "Connect Telegram bot before publishing": "dashboard.validation.telegramBot",
};

export function translateValidationError(
  path: string,
  message: string,
  t: TranslateFn
): string {
  const key = PATH_TO_KEY[path] ?? MESSAGE_TO_KEY[message];
  if (key) {
    const translated = t(key);
    if (translated !== key) return translated;
  }
  return message;
}

export function translateValidationErrors(
  errors: Array<{ path: string; message: string }>,
  t: TranslateFn
): string[] {
  return errors.map((e) => translateValidationError(e.path, e.message, t));
}
