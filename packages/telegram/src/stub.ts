export interface TelegramWebAppStub {
  ready: () => void;
  expand: () => void;
  close: () => void;
  initData?: string;
  initDataUnsafe?: {
    user?: { id: number; first_name?: string };
    start_param?: string;
  };
}

export const DEV_TELEGRAM_INIT_DATA =
  "dev_mode=1&dev_user_id=123456789&dev_first_name=Dev&dev_last_name=User&dev_username=devuser&dev_language_code=en";

export function getTelegramWebApp(): TelegramWebAppStub | null {
  if (typeof window === "undefined") return null;
  const tg = (window as unknown as { Telegram?: { WebApp?: TelegramWebAppStub } }).Telegram?.WebApp;
  return tg ?? null;
}

export function getTelegramInitData(): string {
  const tg = getTelegramWebApp();
  if (tg?.initData) return tg.initData;
  if (process.env.NODE_ENV === "development") {
    return DEV_TELEGRAM_INIT_DATA;
  }
  return "";
}

export function initTelegramStub(): TelegramWebAppStub {
  return {
    ready: () => undefined,
    expand: () => undefined,
    close: () => undefined,
    initData: process.env.NODE_ENV === "development" ? DEV_TELEGRAM_INIT_DATA : "",
    initDataUnsafe: {},
  };
}
