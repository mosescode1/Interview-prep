"use client";

import React from "react";
import { AuthContext, useAuthProvider } from "@/hooks/useAuth";

export default function Providers({ children }: { children: React.ReactNode }) {
  const auth = useAuthProvider();
  return React.createElement(AuthContext.Provider, { value: auth }, children);
}
