import { AuthContext } from "@/contexts/AuthContext";
import { useContext } from "react";

// src/hooks/useAuth.ts
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
