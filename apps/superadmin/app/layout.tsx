import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "./providers";
import { AuthGate } from "./components/AuthGate";

export const metadata: Metadata = {
  title: "Superadmin",
  description: "Platform administration",
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
