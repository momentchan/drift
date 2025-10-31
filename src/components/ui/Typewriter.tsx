import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

interface TypewriterProps {
  text: string;
  /** milliseconds per character (default: 60ms) */
  speed?: number;
}

export interface TypewriterRef {
  /** Clear the rendered text immediately */
  reset: () => void;
}

const Typewriter = forwardRef<TypewriterRef, TypewriterProps>(
  ({ text, speed = 60 }, ref) => {
    const [displayedText, setDisplayedText] = useState("");
    const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Expose reset() to parent
    useImperativeHandle(ref, () => ({
      reset() {
        // Clear any pending timers and reset content
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }
        setDisplayedText("");
      },
    }));

    useEffect(() => {
      // Guard: empty text -> clear and exit
      if (!text) {
        setDisplayedText("");
        return;
      }

      let lineIdx = 0;
      let charIdx = 0;
      const lines = text.split("\n");
      let aborted = false;

      // Utility: update pointer-events for .diary without jQuery
      const updateDiaryPointerEvents = () => {
        // Skip on server
        if (typeof document === "undefined") return;
        const diary = document.querySelector<HTMLElement>(".diary");
        if (!diary) return;
        const scrollable = diary.scrollHeight > diary.clientHeight;
        diary.style.pointerEvents = scrollable ? "auto" : "none";
      };

      // Typing loop
      const tick = () => {
        if (aborted) return;
        if (lineIdx >= lines.length) return;

        const line = lines[lineIdx];

        if (charIdx < line.length) {
          // Append next char
          const nextChar = line.charAt(charIdx);
          charIdx += 1;
          setDisplayedText((prev) => prev + nextChar);
          timeoutIdRef.current = setTimeout(tick, speed);
        } else {
          // End of line: add newline unless it's the last line
          const shouldAppendNewline = lineIdx < lines.length - 1;
          if (shouldAppendNewline) {
            setDisplayedText((prev) => prev + "\n");
          }
          lineIdx += 1;
          charIdx = 0;
          timeoutIdRef.current = setTimeout(tick, speed);
        }

        // Keep pointer-events in sync
        updateDiaryPointerEvents();
      };

      // Reset displayed text whenever text/speed changes, then start
      setDisplayedText("");
      timeoutIdRef.current = setTimeout(tick, speed);

      return () => {
        // Cleanup on unmount or when deps change
        aborted = true;
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }
      };
    }, [text, speed]);

    return <pre>{displayedText}</pre>;
  }
);

export default Typewriter;
