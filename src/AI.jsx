import { useEffect, useState } from "react"
import Typewriter from "./Typewriter";
import GlobalState from "./GlobalState";

export default function AI() {
    const [diaryEntry, setDiaryEntry] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { noted } = GlobalState();

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
                    const response = await fetch('https://openai-api-backend.onrender.com/api/diary/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ date: currentDate })
                    });

                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }

                    const data = await response.json();
                    const lastCompleteSentence = data.diaryEntry;

                    // Save to local storage
                    localStorage.setItem('diaryEntry', lastCompleteSentence);
                    localStorage.setItem('diaryDate', currentDate);

                    setDiaryEntry(lastCompleteSentence);
                    setLoading(false);
                } catch (error) {
                    setError('Error generating diary entry: ' + error.message);
                    setLoading(false);
                }
            }
        }

        fetchDiaryEntry();
    }, []);  // Empty dependency array means this effect runs once on mount

    return (<>
        {noted &&
            <div className="diary">
                {loading ? <p>Loading...</p> : error ? <p>{error}</p> : <Typewriter text={diaryEntry} />}
            </div>
        }
    </>
    );
}