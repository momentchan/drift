import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import * as THREE from 'three';
import GlobalState from "./GlobalState";

const Typewriter = forwardRef(({ transcription, audioUrl }, ref) => {
    const { noted } = GlobalState();
    const [displayedText, setDisplayedText] = useState("");
    const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
    const listener = useRef(new THREE.AudioListener()).current;
    const [currentChar, setCurrentChar] = useState(-1);
    const audio = useRef()

    const data = useRef([])

    useImperativeHandle(ref, () => ({
        reset() {
            setDisplayedText("");
            setCurrentPlaybackTime(0);
            setCurrentChar(-1)
        }
    }));

    // set Audio
    useEffect(() => {
        if (!audio.current && audioUrl) {
            audio.current = new Audio(audioUrl);
            audio.current.loop = false;
            audio.current.volume = 0.5;
        } else if (audioUrl && audio.current.src !== audioUrl) {
            audio.current.src = audioUrl;
        }
    }, [audioUrl])


    useEffect(() => {
        if (transcription) {
            data.current = []

            transcription.segments.forEach(segment => {
                const start = segment.start
                const end = segment.end
                const duration = end - start
                const sid = segment.id

                // change line
                if (sid == 1) {
                    data.current.push({
                        char: '\n\n',
                        t: start
                    })
                }

                Array.from(segment.text).forEach((char, cid) => {
                    data.current.push({
                        char: char,
                        t: start + duration / (segment.text.length - 1) * cid,
                    })
                })

            })
        }
    }, [transcription])

    useEffect(() => {
        if (transcription) {
            const t = currentPlaybackTime

            if (currentChar < data.current.length - 1) {
                const char = data.current[currentChar + 1]

                if (t > char.t - 0.5) {
                    setDisplayedText(prev => prev + char.char)
                    setCurrentChar(currentChar + 1)
                }
            }
        }

    }, [currentPlaybackTime])

    useEffect(() => {
        if (noted) {
            audio.current.play();

            const updatePlaybackTime = () => {
                setCurrentPlaybackTime(audio.current.currentTime);
                requestAnimationFrame(updatePlaybackTime);
            };

            const frameId = requestAnimationFrame(updatePlaybackTime);

            return () => {
                if (audio.current) {
                    audio.current.pause();
                    audio.current.currentTime = 0;
                }
                setDisplayedText('')
                cancelAnimationFrame(frameId);
                setCurrentChar(-1)
            };
        }
    }, [noted, transcription, listener]);


    return <pre>{displayedText}</pre>;
});

export default Typewriter;
