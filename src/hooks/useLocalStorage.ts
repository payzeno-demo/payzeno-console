/**
 * Typed localStorage state.
 *
 * Written for "saved filters" (PAY-1620). That feature shipped as URL state instead — see
 * `hooks/useQueryParamState.ts` — because a saved filter that does not survive being pasted
 * into Slack is not a saved filter.
 *
 * Nothing imports this. It is kept because the settings page is likely to want a real
 * preference store, and because rewriting the storage-event plumbing is more work than it
 * looks.
 *
 * TODO(rrefactor): delete or adopt. PAY-1974.
 */
import { useCallback, useEffect, useState } from 'react';

const NAMESPACE = 'payzeno.console';

function storageKey(key: string): string {
  return `${NAMESPACE}.${key}`;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(storageKey(key));
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    // Private mode, quota, or a value written by an older bundle with a different shape.
    return fallback;
  }
}

export interface LocalStorageState<T> {
  value: T;
  setValue: (next: T) => void;
  remove: () => void;
}

/**
 * `useState`, backed by localStorage and synchronised across tabs via the `storage` event.
 */
export function useLocalStorage<T>(key: string, fallback: T): LocalStorageState<T> {
  const [value, setInternal] = useState<T>(() => read(key, fallback));

  const setValue = useCallback(
    (next: T) => {
      setInternal(next);
      try {
        window.localStorage.setItem(storageKey(key), JSON.stringify(next));
      } catch {
        // Storage full or blocked. The in-memory value still updates; that is the best we can do.
      }
    },
    [key],
  );

  const remove = useCallback(() => {
    setInternal(fallback);
    try {
      window.localStorage.removeItem(storageKey(key));
    } catch {
      // ignore
    }
  }, [key, fallback]);

  useEffect(() => {
    function onStorage(event: StorageEvent): void {
      if (event.key !== storageKey(key)) return;
      setInternal(event.newValue === null ? fallback : (JSON.parse(event.newValue) as T));
    }

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key, fallback]);

  return { value, setValue, remove };
}
