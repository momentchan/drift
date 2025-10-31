import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import GlobalState from "../GlobalState";

interface TranscriptionSegment {
  id: number;
  start: number; // seconds
  end: number;   // seconds
  text: string;
}
interface Transcription {
  segments: TranscriptionSegment[];
}
interface TypewriterNewProps {
  transcription?: Transcription;
  audioUrl?: string;        // blob: ObjectURL (NOT data:)
  firstWords: string[];     // line leaders to insert line breaks
}
export interface TypewriterNewRef {
  reset: () => void;
}

interface CharData {
  char: string;
  t: number; // reveal time in seconds
}

function waitCanPlay(el: HTMLAudioElement) {
  return new Promise<void>((resolve) => {
    if (el.readyState >= 2) return resolve(); // HAVE_CURRENT_DATA
    const on = () => { el.removeEventListener("canplay", on); resolve(); };
    el.addEventListener("canplay", on, { once: true });
  });
}

const TypewriterNew = forwardRef<TypewriterNewRef, TypewriterNewProps>(
  ({ transcription, audioUrl, firstWords }, ref) => {

    const { noted } = GlobalState();

    // --- Audio element/loop bookkeeping ---
    const audio = useRef<HTMLAudioElement | null>(null);
    const rafId = useRef<number | null>(null);

    // --- Timed characters & pointers (use refs to avoid render churn) ---
    const timedCharsRef = useRef<CharData[]>([]);
    const idxRef = useRef<number>(0);
    const textRef = useRef<string>("");

    // --- UI state (rendered string + UX) ---
    const [displayedText, setDisplayedText] = useState("");
    const [needUserGesture, setNeedUserGesture] = useState(false);

    // Expose manual reset to parent
    useImperativeHandle(ref, () => ({
      reset() {
        stopLoopAndAudio();
        idxRef.current = 0;
        textRef.current = "";
        setDisplayedText("");
        setNeedUserGesture(false);
      }
    }));

    // 1) Build timed char list whenever transcription/firstWords changes
    useEffect(() => {
      timedCharsRef.current = [];
      idxRef.current = 0;
      textRef.current = "";
      setDisplayedText("");

      if (!transcription || !transcription.segments?.length) return;

      // Make a safe copy of firstWords and normalize them
      const leaders = firstWords
        .map(w => (w ?? "").trim())
        .filter(w => w.length > 0);

      const chars: CharData[] = [];
      transcription.segments.forEach((seg, segIdx) => {
        const start = Math.max(0, seg.start ?? 0);
        const end = Math.max(start, seg.end ?? start);
        const duration = end - start;
        let text = (seg.text ?? "").replace(/\s+/g, " ").trim();

        if (!text) return;

        // Insert paragraph break when the segment begins with the next leader word
        const firstWord = text.split(" ")[0] ?? "";
        if (leaders.length > 0 && firstWord === leaders[0]) {
          if (segIdx !== 0) {
            chars.push({ char: "\n\n", t: start });
          }
          leaders.shift();
        }

        const arr = Array.from(text);
        const len = arr.length;
        if (len === 1) {
          chars.push({ char: arr[0], t: start });
          return;
        }
        if (len > 1) {
          for (let i = 0; i < len; i++) {
            const r = i / (len - 1);
            const t = start + duration * r; // uniform distribution in segment
            chars.push({ char: arr[i], t });
          }
        }
      });

      // Sort by time to be safe
      chars.sort((a, b) => a.t - b.t);
      timedCharsRef.current = chars;
    }, [transcription, firstWords]);

    // 2) Prepare / update audio element when audioUrl changes
    useEffect(() => {
      if (!audioUrl) return;

      if (!audio.current) {
        audio.current = new Audio();
        audio.current.preload = "auto";
        audio.current.crossOrigin = "anonymous";
        audio.current.loop = false;
        audio.current.volume = 0.5;
      }
      audio.current.src = audioUrl;

      // do not auto play here; the main effect below handles it
    }, [audioUrl]);

    // 3) Main loop: start once when we have everything and user enabled (noted)
    useEffect(() => {
      // Guard conditions
      const el = audio.current;
      const haveChars = timedCharsRef.current.length > 0;
      if (!noted || !el || !audioUrl || !haveChars) {
        stopLoopAndAudio();
        return;
      }

      let canceled = false;
      const OFFSET = 0.20; // seconds: reveal a bit earlier than exact timestamps
      let lastCommit = 0;  // reduce setState frequency

      const loop = (ts: number) => {
        if (canceled) return;

        const t = el.currentTime;
        // Advance index while the target time is reached (or audio ended)
        const arr = timedCharsRef.current;
        let advanced = false;
        while (idxRef.current < arr.length) {
          const next = arr[idxRef.current];
          if (t >= next.t - OFFSET || el.ended) {
            textRef.current += next.char;
            idxRef.current += 1;
            advanced = true;
          } else {
            break;
          }
        }

        // Commit to React state at most ~60fps; throttle to ~15ms
        if (advanced && ts - lastCommit > 15) {
          setDisplayedText(textRef.current);
          lastCommit = ts;
        }

        rafId.current = requestAnimationFrame(loop);
      };

      (async () => {
        try {
          await waitCanPlay(el);
          await el.play().catch(() => {
            // Autoplay blocked by browser policy -> show a manual start button
            setNeedUserGesture(true);
          });
          if (!canceled) rafId.current = requestAnimationFrame(loop);
        } catch {
          // Ignore; user gesture might be needed
          setNeedUserGesture(true);
        }
      })();

      return () => {
        canceled = true;
        if (rafId.current) {
          cancelAnimationFrame(rafId.current);
          rafId.current = null;
        }
      };
    }, [noted, audioUrl, transcription]); // <- do NOT include displayedText/current index here

    useEffect(() => {
      if (!noted) {
        // Stop audio & animation loop
        stopLoopAndAudio();
    
        // Reset all state for a clean restart next time
        setDisplayedText("");
        textRef.current = "";
        idxRef.current = 0;
      }
    }, [noted]);

    function stopLoopAndAudio() {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      if (audio.current) {
        try {
          audio.current.pause();
          audio.current.currentTime = 0;
        } catch {}
      }
    }

    async function handleUserStart() {
      if (!audio.current) return;
      setNeedUserGesture(false);
      try {
        await waitCanPlay(audio.current);
        await audio.current.play();
      } catch {
        // If still blocked, keep button visible
        setNeedUserGesture(true);
      }
    }

    return (
      <div style={{ position: "relative" }}>
        {needUserGesture && (
          <button
            onClick={handleUserStart}
            style={{
              position: "absolute",
              top: 0, left: 0, right: 0, bottom: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(0,0,0,0.4)", color: "white",
              border: "none", cursor: "pointer"
            }}
            aria-label="Start audio"
          >
            Tap to start audio
          </button>
        )}
        <pre style={{ whiteSpace: "pre-wrap" }}>{displayedText}</pre>
      </div>
    );
  }
);

export default TypewriterNew;
