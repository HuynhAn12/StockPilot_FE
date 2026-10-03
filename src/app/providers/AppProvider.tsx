import type { ReactNode } from "react";

import { QueryProvider } from "./QueryProvider";

export function AppProvider({ children }: { children: ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
