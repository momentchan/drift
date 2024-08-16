import { useEffect, useRef, useState } from "react"
import Typewriter from "./Typewriter";
import GlobalState from "./GlobalState";

export default function AI() {
    const [diaryEntry, setDiaryEntry] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { noted } = GlobalState();
    const writerRef = useRef(null);

    useEffect(() => {
        async function fetchDiaryEntry() {
            const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            const storedDate = localStorage.getItem('diaryDate');
            const storedEntry = localStorage.getItem('diaryEntry');

            if (storedDate === currentDate && storedEntry) {
                // Use stored entry if it matches today's date
                setDiaryEntry(storedEntry);
                setLoading(false);
            } else {
                // Fetch new entry from Render backend
                try {
                    setLoading(true);

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
                } catch (error) {
                    setError('Strange... Some signals are hard to catch in the void. I’ll keep trying until I get through.');
                    setLoading(false);
                }
            }
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