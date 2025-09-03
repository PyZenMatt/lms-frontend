import * as React from "react";
import { Outlet } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
// no explicit items here; AppLayout will build a role-aware menu

// Definisci qui gli items di navigazione principali.
// Adatta le "to" ai tuoi path reali.
// Intentionally leave items undefined so AppLayout composes a role-aware list

export default function AppLayoutRoute() {
  return (
    <AppLayout footer={<div className="text-xs text-muted-foreground">v1.0 • beta</div>}>
      <Outlet />
    </AppLayout>
  );
}
