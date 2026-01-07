import { useRef, useEffect } from "react";

/**
 * Hook to handle autofocus and keyboard shortcuts for a search input.
 * defaultShortcut: "F3" or "k" (with Ctrl/Cmd)
 */
export function useSearchFocus(autoFocus = true) {
    const inputRef = useRef(null);

    useEffect(() => {
        // 1. Autofocus on mount
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }

        const handleKeyDown = (e) => {
            // 2. Keyboard shortcut: F3 or Ctrl+K / Cmd+K
            const isCtrlK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k";
            const isF3 = e.key === "F3";

            if (isCtrlK || isF3) {
                e.preventDefault();
                if (inputRef.current) {
                    inputRef.current.focus();
                    inputRef.current.select(); // Optional: select all text on shortcut
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [autoFocus]);

    return inputRef;
}
