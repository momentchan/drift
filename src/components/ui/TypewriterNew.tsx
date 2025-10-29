import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import GlobalState from "../GlobalState";

interface TranscriptionSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

interface Transcription {
  segments: TranscriptionSegment[];
}

interface TypewriterNewProps {
  transcription?: Transcription;
  audioUrl?: string;
  firstWords: string[];
}

interface TypewriterNewRef {
  reset: () => void;
}

interface CharData {
  char: string;
  t: number;
}

const TypewriterNew = forwardRef<TypewriterNewRef, TypewriterNewProps>(({ transcription, audioUrl, firstWords }, ref) => {
  const { noted } = GlobalState();
  const [displayedText, setDisplayedText] = useState("");
  const [currentChar, setCurrentChar] = useState(0);
  const audio = useRef<HTMLAudioElement | null>(null);
  const data = useRef<CharData[]>([]);
  const [timer, setTimer] = useState(0);

  // set Audio
  useEffect(() => {
    if (!audio.current && audioUrl) {
      audio.current = new Audio(audioUrl);
      audio.current.loop = false;
      audio.current.volume = 0.5;
    } else if (audioUrl && audio.current && audio.current.src !== audioUrl) {
      audio.current.src = audioUrl;
    }
  }, [audioUrl]);

  useEffect(() => {
    if (transcription) {
      data.current = [];

      let firstWordsArray = Array.from(firstWords);

      transcription.segments.forEach(segment => {
        const start = segment.start;
        const end = segment.end;
        const duration = end - start;
        const sid = segment.id;

        let text = segment.text;
        const firstWord = segment.text.trim().split(' ')[0];

        if (firstWordsArray.length !== 0) {
          if (firstWord === firstWordsArray[0]) {
            // new line
            if (sid !== 0) {
              data.current.push({
                char: '\n\n',
                t: start
              });
            }
            firstWordsArray.shift();

            text = text.trim();
          }
        }

        Array.from(text).forEach((char, cid) => {
          data.current.push({
            char: char,
            t: start + duration / (text.length - 1) * cid,
          });
        });
      });
    }
  }, [transcription, firstWords]);

  const offset = 0.2;

  function printOneWord(char: CharData): void {
    setDisplayedText(prev => prev + char.char);
    setCurrentChar(currentChar + 1);
  }

  useEffect(() => {
    if (transcription && audio.current) {
      const t = audio.current.currentTime;
      if (currentChar < data.current.length) {
        const char = data.current[currentChar];
        if (t > char.t - offset || audio.current.ended) {
          printOneWord(char);
        }
      }
    }
  }, [timer, transcription, currentChar]);

  useEffect(() => {
    if (noted && audio.current) {
      audio.current.play();

      const updatePlaybackTime = () => {
        setTimer(prev => prev + 1);
        requestAnimationFrame(updatePlaybackTime);
      };

      const frameId = requestAnimationFrame(updatePlaybackTime);

      return () => {
        if (audio.current) {
          audio.current.pause();
          audio.current.currentTime = 0;
        }
        setDisplayedText('');
        cancelAnimationFrame(frameId);
        setCurrentChar(0);
        setTimer(0);
      };
    }
  }, [noted, transcription]);

  return <pre>{displayedText}</pre>;
});

export default TypewriterNew;


