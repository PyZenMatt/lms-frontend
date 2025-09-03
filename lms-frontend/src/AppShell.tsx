// src/AppShell.tsx  (facoltativo: shell con TopProgressBar + ToastHost)
// Usa questo componente come wrapper in App.tsx se non l'hai già fatto.
import React from "react";
import TopProgressBar from "@/components/TopProgressBar";
import ToastHost from "@/components/system/ToastHost";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopProgressBar />
      <ToastHost />
      {children}
    </>
  );
}
