import { useEffect, useRef, useState } from "react"
import Typewriter from "./Typewriter";
import GlobalState from "./GlobalState";

export default function AI() {
    const [diaryEntry, setDiaryEntry] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { noted, setAudioUrl } = GlobalState();
    const writerRef = useRef(null);

    useEffect(() => {
        async function fetchDiaryEntry() {
            const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            const storedDate = localStorage.getItem('diaryDate');
            const storedEntry = localStorage.getItem('diaryEntry');
            const storedAudio = localStorage.getItem('diaryAudio');

            if (storedDate === currentDate && storedEntry) {
                // Use stored entry if it matches today's date
                setDiaryEntry(storedEntry);
                setLoading(false);

                if (storedAudio) {
                    const audioUrl = `data:audio/mp3;base64,${storedAudio}`;
                    setAudioUrl(audioUrl);
                } else {
                    // Fetch new audio if not available
                    fetchAudioFile(storedEntry);
                }
            } else {
                // Fetch new entry from Render backend
                try {
                    const response = await fetch('https://openai-api-backend.onrender.com/api/diary/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ date: currentDate })
                    });

                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    } else {
                        if (writerRef.current) {
                            writerRef.current.reset();
                        }
                    }

                    const data = await response.json();
                    const lastCompleteSentence = data.diaryEntry;

                    // Save to local storage
                    localStorage.setItem('diaryEntry', lastCompleteSentence);
                    localStorage.setItem('diaryDate', currentDate);

                    setDiaryEntry(lastCompleteSentence);
                    setLoading(false);

                    // Fetch audio for the new diary entry
                    fetchAudioFile(lastCompleteSentence);
                } catch (error) {
                    setError('Strange... Some signals are hard to catch in the void. I’ll keep trying until I get through.');
                    setLoading(false);
                }
            }
        }

        async function fetchAudioFile(text) {
            try {
                const response = await fetch(`http://localhost:3000/api/speech?text=${encodeURIComponent(text)}`, {
                // const response = await fetch(`https://openai-api-backend.onrender.com/api/speech?text=${encodeURIComponent(text)}`, {
                    method: 'GET',
                });

                if (!response.ok) throw new Error('Network response was not ok');

                const audioBlob = await response.blob();
                const base64String = await blobToBase64(audioBlob);

                // Save to local storage
                localStorage.setItem('diaryAudio', base64String);

                // Store the audio URL in state
                const audioUrl = URL.createObjectURL(audioBlob);
                setAudioUrl(audioUrl);

                // Download audio file
                downloadAudioFile(audioUrl);
            } catch (error) {
                console.error(error);
            }
        }

        function blobToBase64(blob) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result.split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        }

        function downloadAudioFile(url) {
            const link = document.createElement('a');
            link.href = url;
            link.download = 'speech.mp3'; // Specify the filename for download
            document.body.appendChild(link);
            link.click();
            link.remove();
        }

        fetchDiaryEntry();

    }, []);  // Empty dependency array means this effect runs once on mount

    const typewriterText = loading ?
        'Waiting for cosmic signals... The universe is vast, but we\'ll connect soon.' :
        error || diaryEntry;

    return (
        <>
            {noted &&
                <div className="diary">
                    <Typewriter ref={writerRef} text={typewriterText} />
                </div>
            }
        </>
    );
}