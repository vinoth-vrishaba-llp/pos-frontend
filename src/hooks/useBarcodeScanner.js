import { useEffect, useRef } from "react";

export function useBarcodeScanner(onScan) {
  const buffer = useRef("");
  const lastTime = useRef(0);

  useEffect(() => {
    function handleKeyDown(e) {
      const now = Date.now();

      // reset buffer if delay suggests human typing
      if (now - lastTime.current > 60) {
        buffer.current = "";
      }

      lastTime.current = now;

      if (e.key === "Enter") {
        if (buffer.current.length >= 6) {
          onScan(buffer.current.trim());
        }
        buffer.current = "";
        return;
      }

      if (e.key.length === 1) {
        buffer.current += e.key;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onScan]);
}
