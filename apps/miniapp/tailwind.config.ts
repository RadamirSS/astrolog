import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
    "../../packages/miniapp-renderer/src/**/*.{js,ts,jsx,tsx}",
    "../../packages/report-renderer/src/**/*.{js,ts,jsx,tsx}",
    "../../packages/theme-engine/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
