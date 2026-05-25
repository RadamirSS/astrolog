import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "./providers";
import { AuthGate } from "./components/AuthGate";

export const metadata: Metadata = {
  title: "Blogger Dashboard",
  description: "Configure your astrology mini app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100">
        <AppProviders>
          <AuthGate>{children}</AuthGate>
        </AppProviders>
      </body>
    </html>
  );
}
