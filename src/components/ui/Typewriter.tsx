import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

interface TypewriterProps {
  text: string;
  speed?: number; // ms per char
}

interface TypewriterRef {
  reset: () => void;
}

// Simple declaration: keep if you actually use jQuery; otherwise remove it
declare const $: undefined | ((selector: string) => {
  length: number;
  [index: number]: HTMLElement;
  css: (prop: string, value: string | number) => void;
});

const Typewriter = forwardRef<TypewriterRef, TypewriterProps>(
  ({ text, speed = 60 }, ref) => {
    const [displayedText, setDisplayedText] = useState("");

    useImperativeHandle(ref, () => ({
      reset() {
        setDisplayedText("");
      },
    }));

    useEffect(() => {
      if (!text) {
        setDisplayedText("");
        return;
      }

      let lineIdx = 0;
      let charIdx = 0;
      const lines = text.split("\n");
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      let aborted = false;

      const tick = () => {
        if (aborted) return;
        if (lineIdx >= lines.length) return;

        const line = lines[lineIdx];

        // Fetch the next character to output (or move to the newline case)
        if (charIdx < line.length) {
          const nextChar = line.charAt(charIdx);
          charIdx += 1;

          setDisplayedText((prev) => prev + nextChar);

          // Schedule the next character
          timeoutId = setTimeout(tick, speed);
        } else {
          // End of line: append a newline unless this is the final line
          const shouldAppendNewline = lineIdx < lines.length - 1;
          if (shouldAppendNewline) {
            setDisplayedText((prev) => prev + "\n");
          }

          // Move to the next line, reset the character index, and queue another tick
          lineIdx += 1;
          charIdx = 0;
          timeoutId = setTimeout(tick, speed);
        }

        // Optional: safely update the pointer-events state for .diary
        if ($) {
          const diary = $(".diary");
          if (diary && diary.length > 0 && diary[0]) {
            const el = diary[0];
            const scrollable = el.scrollHeight > el.clientHeight;
            diary.css("pointer-events", scrollable ? "auto" : "none");
          }
        }
      };

      // Start the typing loop
      setDisplayedText(""); // Reset output whenever text or speed changes
      timeoutId = setTimeout(tick, speed);

      return () => {
        aborted = true;
        if (timeoutId) clearTimeout(timeoutId);
      };
    }, [text, speed]);

    return <pre>{displayedText}</pre>;
  }
);

export default Typewriter;
