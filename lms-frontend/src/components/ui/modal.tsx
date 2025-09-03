// src/components/ui/modal.tsx
import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type ModalCtx = { open: boolean; setOpen: React.Dispatch<React.SetStateAction<boolean>> };
const Ctx = React.createContext<ModalCtx | null>(null);
function useModal() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("Modal.* must be used within <Modal>");
  return ctx;
}

export function Modal({ open: cOpen, defaultOpen, onOpenChange, children }:{
  open?: boolean; defaultOpen?: boolean; onOpenChange?: (o:boolean)=>void; children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(!!defaultOpen);
  React.useEffect(() => { if (cOpen !== undefined) setOpen(!!cOpen); }, [cOpen]);
  const api = React.useMemo<ModalCtx>(() => ({
    open,
    setOpen: (v) => {
      if (cOpen === undefined) setOpen(typeof v === "function" ? (v as any)(open) : v);
      onOpenChange?.(typeof v === "function" ? (v as any)(open) : v);
    },
  }), [open, cOpen, onOpenChange]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function ModalTrigger({ children }: { children: React.ReactNode }) {
  const { setOpen } = useModal();
  if (!React.isValidElement(children)) return null;
  const el = children as React.ReactElement;
  return React.cloneElement(el, ({ onClick: () => setOpen(true) } as any));
}

export function ModalContent({
  children,
  className,
  overlayClassName,
}: {
  children: React.ReactNode;
  className?: string;
  overlayClassName?: string;
}) {
  const { open, setOpen } = useModal();
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  if (typeof document === "undefined") return null;
  if (!open) return null;
  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-4",
        overlayClassName
      )}
      onClick={() => setOpen(false)}
      aria-modal
      role="dialog"
    >
      <div
        className="absolute inset-0 bg-overlay/40 backdrop-blur-[1px]"
        aria-hidden
      />
      <div
        className={cn(
          "relative z-10 max-h-[85vh] w-full max-w-lg overflow-auto rounded-lg border border-border bg-card p-5 shadow-card",
          "dark:border-border dark:bg-card",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

export function ModalHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-3", className)} {...props} />;
}
export function ModalFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-4 flex justify-end gap-2", className)} {...props} />;
}
