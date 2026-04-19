export type ToastPayload = {
  id?: string;
  message: string;
};

type Listener = (payload: ToastPayload) => void;

const listeners = new Set<Listener>();

export function subscribeToToasts(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function pushToast(payload: ToastPayload) {
  listeners.forEach((listener) => listener({ id: crypto.randomUUID(), ...payload }));
}
