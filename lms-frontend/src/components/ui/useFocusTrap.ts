import { useEffect } from "react";

// Minimal focus trap hook: given a container ref and an onClose callback,
// it keeps focus inside the container while mounted and closes on Escape.
export function useFocusTrap(
  container: HTMLElement | null,
  { onClose }: { onClose?: () => void } = {}
) {
  useEffect(() => {
    if (!container) return;

    const focusableSelector = [
      'a[href]',
      'area[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'button:not([disabled])',
      'iframe',
      'object',
      'embed',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable]'
    ].join(',');

    const nodes = Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
      (n) => n.offsetWidth > 0 || n.offsetHeight > 0 || n.getClientRects().length
    );

    const first = nodes[0];
    const last = nodes[nodes.length - 1];

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose?.();
        return;
      }

      if (e.key === "Tab") {
        if (!first || !last) return;
        if (e.shiftKey) {
          // shift + tab
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }

    // Remember previously focused element to restore on cleanup
    const previousActive = document.activeElement as HTMLElement | null;
    // Focus first element
    if (first) first.focus();

    document.addEventListener("keydown", handleKey, true);
    return () => {
      document.removeEventListener("keydown", handleKey, true);
      try {
        previousActive?.focus();
      } catch {
        // ignore
      }
    };
  }, [container, onClose]);
}
