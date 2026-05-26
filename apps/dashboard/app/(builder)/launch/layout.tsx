"use client";

import { LaunchShell } from "../../../components/LaunchShell";

export default function LaunchLayout({ children }: { children: React.ReactNode }) {
  return <LaunchShell>{children}</LaunchShell>;
}
