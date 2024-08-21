import { useEffect, useRef, useState } from "react"
import Typewriter from "./Typewriter";
import TypewriterNew from "./TypewriterNew";
import GlobalState from "./GlobalState";

export default function AI() {
    const [diaryEntry, setDiaryEntry] = useState("");
    const [transcription, setTranscription] = useState();
    const [audioUrl, setAudioUrl] = useState();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [noSound, setNoSound] = useState(false);
    const [firstWords, setFirstWords] = useState([])
    const { noted } = GlobalState()
    const writerRef = useRef(null);
    const server = 'https://openai-api-backend.onrender.com'

    useEffect(() => {
        async function fetchDiaryEntry() {
            const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            const storedDate = localStorage.getItem('diaryDate');
            const storedEntry = localStorage.getItem('diaryEntry');
            const storedAudio = localStorage.getItem('diaryAudio');
            const storedTranscription = localStorage.getItem('diaryTranscription');

            if (storedDate === currentDate && storedEntry) {
                handleStoredDiary(storedEntry, storedAudio, storedTranscription);
            } else {
                fetchNewDiary(currentDate);
            }
        }

        async function fetchNewDiary(currentDate) {
            try {
                const response = await fetch(`${server}/api/diary/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ date: currentDate })
                });

                if (!response.ok) throw new Error('Network response was not ok');

                const data = await response.json();
                const lastCompleteSentence = data.diaryEntry;

                // Reset typewriter and update state
                writerRef.current?.reset();
                saveDiaryToLocalStorage(currentDate, lastCompleteSentence);
                setDiaryEntry(lastCompleteSentence);
                setLoading(false);

                // Fetch audio and transcription
                fetchAudioAndTranscription(lastCompleteSentence);
            } catch (error) {
                handleError(error);
            }
        }

        async function fetchAudioAndTranscription(text) {
            try {
                const response = await fetch(`${server}/api/speech-and-transcribe`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Server responded with status ${response.status}: ${errorText}`);
                }

                const data = await response.json();
                const { audioBase64, transcription } = data;

                // Save audio and transcription to local storage
                localStorage.setItem('diaryAudio', audioBase64);
                localStorage.setItem('diaryTranscription', JSON.stringify(transcription));

                // Set audio and transcription in the global state
                setAudioUrl(audioBase64);
                setTranscription(transcription);
            } catch (error) {
                setNoSound(true)
                console.error("Failed to fetch audio and transcription:", error);
            }
        }

        function handleStoredDiary(storedEntry, storedAudio, storedTranscription) {
            setDiaryEntry(storedEntry);
            setLoading(false);

            if (storedAudio) {
                setAudioUrl(storedAudio);
                setTranscription(JSON.parse(storedTranscription));
            } else {
                fetchAudioAndTranscription(storedEntry);
            }
        }

        function saveDiaryToLocalStorage(currentDate, diaryEntry) {
            localStorage.setItem('diaryDate', currentDate);
            localStorage.setItem('diaryEntry', diaryEntry);
        }

        function handleError(error) {
            console.error(error);
            setError(true);
            setLoading(false);
        }

        fetchDiaryEntry();
    }, []);

    const typewriterText = loading ? 'Waiting for cosmic signals... The universe is vast, but we\'ll connect soon.' :
        error ? 'Strange... Some signals are hard to catch in the void. I’ll keep trying until I get through.' : diaryEntry;

    useEffect(() => {
        function parseFirstWords(text) {
            const lines = text.split('\n');

            // Filter out any empty lines, and map each line to its first word
            const firstWords = lines
                .filter(line => line.trim() !== '')  // Ignore empty lines
                .map(line => line.trim().split(' ')[0]); // Split each line into words and take the first one

            return firstWords
        }
        setFirstWords(parseFirstWords(diaryEntry));
    }, [diaryEntry])

    return (
        <>
            {noted &&
                (
                    <div className="diary">
                        {loading || error || noSound ?
                            <Typewriter ref={writerRef} text={typewriterText} /> :
                            <TypewriterNew ref={writerRef} transcription={transcription} audioUrl={audioUrl} firstWords={firstWords} />
                        }
                    </div>
                )
            }
        </>
    );
}