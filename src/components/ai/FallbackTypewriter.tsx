import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

interface FallbackTypewriterProps {
  text: string;
  /** milliseconds per character (default: 60ms) */
  speed?: number;
  /** start typing only when this flag is true */
  active?: boolean;
}

export interface FallbackTypewriterRef {
  /** Clear the rendered text immediately */
  reset: () => void;
}

const FallbackTypewriter = forwardRef<FallbackTypewriterRef, FallbackTypewriterProps>(
  ({ text, speed = 60, active = true }, ref) => {
    const [displayedText, setDisplayedText] = useState("");
    const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      setDisplayedText("");
    }, []);

    useImperativeHandle(ref, () => ({
      reset() {
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }
        setDisplayedText("");
      },
    }));

    useEffect(() => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }

      if (!active || !text) {
        setDisplayedText("");
        return;
      }

      let lineIdx = 0;
      let charIdx = 0;
      const lines = text.split("\n");
      let aborted = false;

      const updateDiaryPointerEvents = () => {
        if (typeof document === "undefined") return;
        const diary = document.querySelector<HTMLElement>(".diary");
        if (!diary) return;
        const scrollable = diary.scrollHeight > diary.clientHeight;
        diary.style.pointerEvents = scrollable ? "auto" : "none";
      };

      const tick = () => {
        if (aborted) return;
        if (lineIdx >= lines.length) return;

        const line = lines[lineIdx];

        if (charIdx < line.length) {
          const nextChar = line.charAt(charIdx);
          charIdx += 1;
          setDisplayedText((prev) => prev + nextChar);
          timeoutIdRef.current = setTimeout(tick, speed);
        } else {
          const shouldAppendNewline = lineIdx < lines.length - 1;
          if (shouldAppendNewline) {
            setDisplayedText((prev) => prev + "\n");
          }
          lineIdx += 1;
          charIdx = 0;
          timeoutIdRef.current = setTimeout(tick, speed);
        }

        updateDiaryPointerEvents();
      };

      setDisplayedText("");
      timeoutIdRef.current = setTimeout(tick, speed);

      return () => {
        aborted = true;
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }
      };
    }, [text, speed, active]);

    return <pre>{displayedText}</pre>;
  }
);

FallbackTypewriter.displayName = "FallbackTypewriter";

export default FallbackTypewriter;

