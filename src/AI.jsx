import OpenAI from "openai"
import { useEffect, useState } from "react"
import Typewriter from "./Typewriter";


export default function AI() {
    const [diaryEntry, setDiaryEntry] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const openai = new OpenAI({
            apiKey: import.meta.env.VITE_OPENAI_API_KEY,  // Ensure you use REACT_APP_ prefix for environment variables
            dangerouslyAllowBrowser: true
        });

        async function generateAstronautDiary(date) {
            const prompt = `You are an astronaut lost in space, unable to return to Earth. It is ${date}. Write a diary entry about your day, reflecting on how much you miss your family and friends. The story should be consistent with previous entries. Make sure the diary entry is about 200 words and ends with a complete thought.`;

            try {
                const chatCompletion = await openai.chat.completions.create({
                    model: "gpt-4",
                    messages: [
                        { role: "system", content: "You are an astronaut lost in space, writing daily diary entries." },
                        { role: "user", content: prompt },
                    ],
                    max_tokens: 350,  // Increased token limit for flexibility
                });

                let entry = chatCompletion.choices[0].message.content.trim();

                // Truncate to the last complete sentence
                const lastCompleteSentence = entry.match(/[^.!?]*[.!?]/g)?.slice(0, -1).join(' ') || entry;

                // Save to local storage
                localStorage.setItem('diaryEntry', lastCompleteSentence);
                localStorage.setItem('diaryDate', date);

                setDiaryEntry(lastCompleteSentence);
                setLoading(false);

            } catch (error) {
                setError('Error generating diary entry: ' + error.message);
                setLoading(false);
            }
        }

        function fetchDiaryEntry() {
            const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            const storedDate = localStorage.getItem('diaryDate');
            const storedEntry = localStorage.getItem('diaryEntry');

            if (storedDate === currentDate && storedEntry) {
                // Use stored entry if it matches today's date
                setDiaryEntry(storedEntry);
                setLoading(false);

            } else {
                // Fetch new entry if no matching date or no entry in local storage
                generateAstronautDiary(currentDate);
            }
        }

        fetchDiaryEntry()
    }, []);  // Empty dependency array means this effect runs once on mount

    return (
        <div className="diary">
            {loading ? <p>Loading...</p> : error ? <p>{error}</p> : <Typewriter text={diaryEntry} />}
        </div>
    );
}