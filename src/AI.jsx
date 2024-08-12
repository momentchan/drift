import OpenAI from "openai"
import { useEffect, useState } from "react"
import Typewriter from "./Typewriter";
import GlobalState from "./GlobalState";


export default function AI() {
    const [diaryEntry, setDiaryEntry] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { noted } = GlobalState();


    useEffect(() => {
        const openai = new OpenAI({
            apiKey: import.meta.env.VITE_OPENAI_API_KEY,  // Ensure you use REACT_APP_ prefix for environment variables
            dangerouslyAllowBrowser: true
        });

        async function generateAstronautDiary(date) {
            const prompt = `You are Captain Alex Reynolds, an astronaut who has been lost in the vast expanse of space for several months. With no hope of returning to Earth, you find solace in your daily diary entries. Today is ${date}, and as you float alone in your spacecraft, you reflect on the countless days you’ve spent away from your loved ones. Describe your day in detail, including any small triumphs or struggles you faced. Emphasize the sense of isolation and longing you feel, missing your family, friends, and the simple comforts of Earth. Your entry should convey the emotional weight of your situation, revealing how you cope with loneliness and the passage of time. Ensure that your writing is consistent with your previous entries, capturing the ongoing challenges and the hope that sustains you. Aim for about 200 words and end with a complete thought that leaves a lasting impression of your emotional state.`;

            try {
                const chatCompletion = await openai.chat.completions.create({
                    model: "gpt-4",
                    messages: [
                        { role: "system", content: "You are an astronaut lost in space, writing daily diary entries." },
                        { role: "user", content: prompt },
                    ],
                    max_tokens: 200,  // Increased token limit for flexibility
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

    return (<>
        {noted &&
            <div className="diary">
                {loading ? <p>Loading...</p> : error ? <p>{error}</p> : <Typewriter text={diaryEntry} />}
            </div>
        }
    </>
    );
}