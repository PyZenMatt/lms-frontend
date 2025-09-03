import * as React from "react";
import { cn } from "@/lib/utils";

type TabsContext = {
  value: string;
  setValue: (v: string) => void;
};
const Ctx = React.createContext<TabsContext | null>(null);
function useTabs() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("Tabs.* must be used within <Tabs>");
  return ctx;
}

export function Tabs({ value: v, defaultValue, onValueChange, className, children }:{
  value?: string; defaultValue?: string; onValueChange?: (v: string)=>void; className?: string; children: React.ReactNode;
}) {
  const [value, setValue] = React.useState(v ?? defaultValue ?? "");
  React.useEffect(() => { if (v !== undefined) setValue(v); }, [v]);
  const api = React.useMemo<TabsContext>(() => ({
    value, setValue: (nv) => { if (v === undefined) setValue(nv); onValueChange?.(nv); }
  }), [value, v, onValueChange]);
  return <Ctx.Provider value={api}><div className={cn("w-full", className)}>{children}</div></Ctx.Provider>;
}

export function TabsList({ className, children }:{ className?: string; children: React.ReactNode }) {
  return <div role="tablist" className={cn("inline-flex rounded-md bg-muted p-1 gap-1", className)}>{children}</div>;
}

export function TabsTrigger({ value, className, children }:{
  value: string; className?: string; children: React.ReactNode;
}) {
  const { value: current, setValue } = useTabs();
  const active = current === value;
  return (
    <button
      role="tab"
      aria-selected={active}
      className={cn(
        "px-3 py-1.5 rounded-md text-sm transition",
        active ? "bg-primary text-primary-foreground" : "bg-transparent hover:bg-muted/60",
      className)}
      onClick={() => setValue(value)}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className, children }:{
  value: string; className?: string; children: React.ReactNode;
}) {
  const { value: current } = useTabs();
  if (current !== value) return null;
  return <div role="tabpanel" className={cn("mt-3", className)}>{children}</div>;
}
