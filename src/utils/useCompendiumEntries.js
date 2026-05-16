import { useEffect, useState } from "react";
import { compendiumUpdatedEvent, getCompendiumEntries } from "./compendiumStore.js";

export function useCompendiumEntries(type, includeFallback = true) {
  const [entries, setEntries] = useState(() => getCompendiumEntries(type, includeFallback));

  useEffect(() => {
    function refresh() {
      setEntries(getCompendiumEntries(type, includeFallback));
    }

    window.addEventListener(compendiumUpdatedEvent, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(compendiumUpdatedEvent, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [includeFallback, type]);

  return entries;
}
