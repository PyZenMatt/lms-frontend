import { useEffect, useRef, useState } from "react";
import eventBus from "../lib/eventBus";

/**
 * Global top progress bar driven by "api:loading" events.
 * Uses the new eventBus when available and falls back to window CustomEvent for compatibility.
 * Include this near your App root.
 */
export default function TopProgressBar() {
  const [active, setActive] = useState(0);
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const incTimer = useRef<number | null>(null);
  const showTimer = useRef<number | null>(null);

  useEffect(() => {
    // handler for eventBus
    const off = eventBus.on("api:loading", (e: CustomEvent<{ delta: number }>) => {
      const delta = e?.detail?.delta ?? 0;
      setActive((n) => Math.max(0, n + (Number.isFinite(delta) ? delta : 0)));
    });

    // fallback to window events for backward compatibility
    function onWindowLoading(e: Event) {
      const { delta } = ((e as CustomEvent<{ delta: number }>).detail || { delta: 0 });
      setActive((n) => Math.max(0, n + (Number.isFinite(delta) ? delta : 0)));
    }
    window.addEventListener("api:loading", onWindowLoading as EventListener);

    return () => {
      off();
      window.removeEventListener("api:loading", onWindowLoading as EventListener);
    };
  }, []);

  useEffect(() => {
    // helpers
    const stopInc = () => {
      if (incTimer.current) {
        window.clearInterval(incTimer.current);
        incTimer.current = null;
      }
    };
    const stopShowDelay = () => {
      if (showTimer.current) {
        window.clearTimeout(showTimer.current);
        showTimer.current = null;
      }
    };

    if (active > 0) {
      if (!visible && !showTimer.current) {
        showTimer.current = window.setTimeout(() => {
          setVisible(true);
          setWidth(10);
        }, 120);
      }
      if (!incTimer.current) {
        incTimer.current = window.setInterval(() => {
          setWidth((w) => (w < 90 ? Math.min(90, w + 8 + Math.random() * 10) : w));
        }, 200) as unknown as number;
      }
    } else {
      stopShowDelay();
      stopInc();
      if (visible) {
        setWidth(100);
        const t = window.setTimeout(() => {
          setVisible(false);
          setWidth(0);
        }, 250);
        return () => window.clearTimeout(t);
      } else {
        setWidth(0);
      }
    }

    return () => {
      stopShowDelay();
    };
  }, [active, visible]);

  return (
    <div style={{ pointerEvents: "none", position: "fixed", left: 0, right: 0, top: 0, zIndex: 9999, height: 0 }}>
      <div
        style={{
          transition: "width 200ms ease, opacity 200ms ease",
          height: 2,
          background: "var(--color-primary, #06b6d4)",
          boxShadow: "0 0 8px rgba(0,0,0,0.08)",
          width: `${width}%`,
          opacity: visible ? 1 : 0,
        }}
      />
    </div>
  );
}
