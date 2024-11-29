// ErrorBoundaryWrapper.tsx

import { ErrorBoundary } from "./ErrorBoundary";

// Ein funktionaler Wrapper für spezifische Bereiche
export function ErrorBoundaryWrapper({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
