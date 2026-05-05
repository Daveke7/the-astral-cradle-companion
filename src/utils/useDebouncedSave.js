import { useEffect, useRef } from "react";

export function useDebouncedSave(value, save, delay = 600) {
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return undefined;
    }

    const timeoutId = window.setTimeout(() => save(value), delay);
    return () => window.clearTimeout(timeoutId);
  }, [delay, save, value]);
}
