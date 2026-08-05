/** Coordinates post-login modals so the app tour waits for background-location disclosure. */

type Listener = () => void;

let blocking = false;
const listeners = new Set<Listener>();

export function isBackgroundLocationDisclosureBlocking(): boolean {
  return blocking;
}

export function setBackgroundLocationDisclosureBlocking(next: boolean): void {
  if (blocking === next) return;
  blocking = next;
  listeners.forEach((listener) => listener());
}

export function subscribeBackgroundLocationDisclosureGate(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
