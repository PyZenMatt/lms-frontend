// Lightweight global event bus for UI signals (loading, errors, toasts, etc.)
class EventBus extends EventTarget {
  emit(type: string, detail?: unknown) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }
  on(type: string, handler: (e: CustomEvent) => void) {
    const listener = handler as EventListener;
    this.addEventListener(type, listener);
    return () => {
      this.removeEventListener(type, listener);
    };
  }
}

const eventBus = new EventBus();
export default eventBus;

/**
 * Events:
 * - "api:loading"  detail: { delta: +1 | -1, key?: string }
 * - "api:error"    detail: { status: number, message: string, url?: string }
 * - "toast"        detail: { title?: string, description?: string, variant?: string }
 */
