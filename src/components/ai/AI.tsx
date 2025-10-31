import { useEffect, useRef, useState } from "react";
import Typewriter from "../ui/Typewriter";
import TypewriterNew from "../ui/TypewriterNew";
import GlobalState from "../GlobalState";

// ============================
// Type definitions
// ============================
interface TranscriptionSegment {
  id: number;
  start: number; // seconds
  end: number;   // seconds
  text: string;
}

interface Transcription {
  segments: TranscriptionSegment[];
}

interface TypewriterRef {
  reset: () => void;
}

// ============================
// Helpers
// ============================

/**
 * Convert a base64 (no data: prefix) into a Blob URL (ObjectURL).
 * This avoids CSP blocking (media-src 'self' https:) because we use blob: instead of data:.
 * NOTE: ObjectURLs are memory-backed and become invalid after reload; do not store them in localStorage.
 */
function base64ToObjectUrl(b64: string, mime = "audio/mpeg") {
  const byteStr = atob(b64);
  const buf = new Uint8Array(byteStr.length);
  for (let i = 0; i < byteStr.length; i++) buf[i] = byteStr.charCodeAt(i);
  const blob = new Blob([buf], { type: mime });
  return URL.createObjectURL(blob);
}

/**
 * Pick API base depending on environment.
 * - Dev: localhost:3000
 * - Prod: (replace with your Render URL if different)
 */
function getServerBase() {
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    // Add your production hostnames here if you want auto-switch
    if (origin.includes("mingjyunhung.com")) {
      // Example: your Render backend host
      return "https://openai-api-backend.onrender.com";
    }
  }
  return "https://openai-api-backend.onrender.com";
  // return "http://localhost:3000";
}

const server = getServerBase();

// ============================
// LocalStorage Keys
// ============================
const LS_DATE = "diaryDate";
const LS_ENTRY = "diaryEntry";
const LS_AUDIO_B64 = "diaryAudioBase64";  // store pure base64 only
const LS_AUDIO_MIME = "diaryAudioMime";   // e.g., "audio/mpeg"
const LS_TRANS = "diaryTranscription";    // JSON string

// ============================
// Component
// ============================
export default function AI() {
  const [diaryEntry, setDiaryEntry] = useState<string>("");
  const [transcription, setTranscription] = useState<Transcription | undefined>();
  const [audioUrl, setAudioUrl] = useState<string | undefined>(); // ObjectURL for <audio>
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [firstWords, setFirstWords] = useState<string[]>([]);
  const { noted } = GlobalState();
  const writerRef = useRef<TypewriterRef | null>(null);

  // Keep the latest ObjectURL to revoke and avoid memory leaks
  const objectUrlRef = useRef<string | null>(null);

  // Compute a human-readable date used as the "per-day" cache key.
  function getTodayHumanDate() {
    return new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  }

  // Derive a "first word per line" array for your UI
  function parseFirstWords(text: string): string[] {
    return text
      .split("\n")
      .filter(line => line.trim() !== "")
      .map(line => line.trim().split(" ")[0]);
  }

  // Load diary (and audio/transcription) on mount
  useEffect(() => {
    async function boot() {
      try {
        const today = getTodayHumanDate();
        const storedDate = localStorage.getItem(LS_DATE);
        const storedEntry = localStorage.getItem(LS_ENTRY);
        const storedB64 = localStorage.getItem(LS_AUDIO_B64);
        const storedMime = localStorage.getItem(LS_AUDIO_MIME) || "audio/mpeg";
        const storedTrans = localStorage.getItem(LS_TRANS);

        if (storedDate === today && storedEntry) {
          // Use cached text immediately
          setDiaryEntry(storedEntry);
          setFirstWords(parseFirstWords(storedEntry));

          // Use cached audio (pure base64) if available -> convert to ObjectURL
          if (storedB64) {
            const url = base64ToObjectUrl(storedB64, storedMime);
            // Revoke previous url if any
            if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = url;
            setAudioUrl(url);
          } else {
            // No cached audio for today -> generate once (costs money only first time of the day)
            await fetchAudioAndTranscription(storedEntry);
          }

          // Use cached transcription if available
          if (storedTrans) {
            try {
              setTranscription(JSON.parse(storedTrans));
            } catch {
              // Bad JSON; ignore
            }
          }
          setLoading(false);
        } else {
          // No cache or old day -> generate new diary entry (cheap) and later TTS (costly)
          await fetchNewDiary(today);
        }
      } catch (e) {
        console.error(e);
        setError(true);
        setLoading(false);
      }
    }

    boot();

    // Cleanup any previously created ObjectURL when component unmounts
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================
  // Network calls
  // ============================

  /**
   * Fetch a new diary entry (text only). This is cheaper than TTS.
   * After text is ready, we also trigger the audio+transcription fetch.
   */
  async function fetchNewDiary(currentDate: string) {
    setLoading(true);
    setError(false);

    try {
      const resp = await fetch(`${server}/api/diary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: currentDate }),
      });

      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(`generate diary failed: ${resp.status} ${t}`);
      }

      const data = await resp.json();
      const entry: string = data.diaryEntry;

      // Persist basic text cache for the day
      localStorage.setItem(LS_DATE, currentDate);
      localStorage.setItem(LS_ENTRY, entry);

      setDiaryEntry(entry);
      setFirstWords(parseFirstWords(entry));
      setLoading(false);

      // Fetch audio and transcription once per day, then cache base64 (to avoid repeated cost)
      await fetchAudioAndTranscription(entry);
    } catch (e) {
      console.error(e);
      setError(true);
      setLoading(false);
    }
  }

  /**
   * Fetch audio (base64 only, no data: prefix) + transcription.
   * We then convert base64 -> Blob -> ObjectURL for playback.
   * We persist only base64 + mime + transcription to localStorage to avoid repeated TTS cost.
   */
  async function fetchAudioAndTranscription(text: string) {
    try {
      const resp = await fetch(`${server}/api/speech-and-transcribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(`speech+transcribe failed: ${resp.status} ${t}`);
      }

      const data = await resp.json();
      let { audioBase64, mime = "audio/mpeg", transcription } = data;

      // Safety: if backend accidentally returns a 'data:audio/...;base64,...', strip the prefix
      const comma = audioBase64.indexOf(",");
      if (comma !== -1) audioBase64 = audioBase64.slice(comma + 1);

      // Convert to ObjectURL for <audio> src (CSP-safe)
      const url = base64ToObjectUrl(audioBase64, mime);

      // Revoke previous ObjectURL, then use new one
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = url;

      setAudioUrl(url);
      setTranscription(transcription);

      // Persist minimal cache to avoid repeated TTS cost on reloads
      localStorage.setItem(LS_AUDIO_B64, audioBase64);
      localStorage.setItem(LS_AUDIO_MIME, mime);
      localStorage.setItem(LS_TRANS, JSON.stringify(transcription));

      // Optional: reset typewriter if your component exposes it
      writerRef.current?.reset?.();
    } catch (e) {
      console.error("Failed to fetch audio and transcription:", e);
      // We keep the text visible; user can retry or trigger via a button if desired
    }
  }

  // ============================
  // Render
  // ============================

  const typewriterText =
    loading || !audioUrl
      ? "Waiting for cosmic signals... The universe is vast, but we'll connect soon."
      : "Strange... Some signals are hard to catch in the void. I'll keep trying until I get through.";

  return (
    <>
      <div className="diary" style={{ display: noted ? 'block' : 'none' }}>
        {loading || error || !audioUrl ? (
          <Typewriter ref={writerRef} text={typewriterText} />
        ) : (
          <TypewriterNew
            ref={writerRef}
            transcription={transcription}
            audioUrl={audioUrl}
            firstWords={firstWords}
          />
        )}
      </div>
    </>
  );
}
