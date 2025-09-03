// src/components/ui/dropdown.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

type Ctx = { open: boolean; setOpen: React.Dispatch<React.SetStateAction<boolean>> };
const DropdownCtx = React.createContext<Ctx | null>(null);
function useD() {
  const c = React.useContext(DropdownCtx);
  if (!c) throw new Error("Dropdown.* must be used within <Dropdown>");
  return c;
}

export function Dropdown({ children }:{ children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    function onDoc(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target?.closest?.("[data-dd-root]")) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);
  return (
    <DropdownCtx.Provider value={{ open, setOpen }}>
      <div data-dd-root className="relative inline-block">{children}</div>
    </DropdownCtx.Provider>
  );
}

export function DropdownTrigger({ children }:{ children: React.ReactNode }) {
  const { setOpen } = useD();
  // Ensure child is a valid React element before cloning
  if (!React.isValidElement(children)) return null;
  const el = children as React.ReactElement;
  const injectedProps: React.DOMAttributes<HTMLElement> = {
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      setOpen((v: boolean) => !v);
    },
  };

  return React.cloneElement(el, injectedProps as unknown as Record<string, unknown>);
}

export function DropdownContent({ className, children }:{ className?: string; children: React.ReactNode }) {
  const { open } = useD();
  if (!open) return null;
  return (
    <div
      role="menu"
  className={cn(
  "absolute right-0 mt-2 w-56 rounded-lg border border-border bg-popover text-popover-foreground p-1.5 shadow-card",
    "dark:border-border",
    className
  )}
    >
      {children}
    </div>
  );
}

export function DropdownItem({
  children,
  onSelect,
  className,
}: {
  children: React.ReactNode;
  onSelect?: () => void;
  className?: string;
}) {
  const { setOpen } = useD();
  return (
    <button
      type="button"
      role="menuitem"
      onClick={() => { onSelect?.(); setOpen(false); }}
      className={cn(
  "w-full rounded-sm px-3 py-2 text-left text-sm text-popover-foreground hover:bg-muted/70 focus-ring",
  "dark:hover:bg-muted/60",
        className
      )}
    >
      {children}
    </button>
  );
}
