import { useCallback, useEffect, useRef, useState } from "react";

export function useCopyFeedback(duration = 1200) {
  const [copiedKey, setCopiedKey] = useState("");
  const timerRef = useRef(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const copyWithFeedback = useCallback(
    (value, key = "copy") => {
      navigator.clipboard?.writeText(String(value || ""));
      setCopiedKey(key);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setCopiedKey((current) => (current === key ? "" : current));
      }, duration);
    },
    [duration]
  );

  const isCopied = useCallback((key) => copiedKey === key, [copiedKey]);

  return { copyWithFeedback, isCopied };
}
