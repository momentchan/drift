import { useEffect, useState } from "react";

export default function Typewriter({ text, speed = 50 }) {
    const [displayedText, setDisplayedText] = useState("");

    useEffect(() => {
        if (!text) {
            setDisplayedText(""); // Clear text if none provided
            return;
        }

        let index = 0;
        let currentLine = 0;
        const lines = text.split('\n'); // Split text by line breaks
        let typingTimer;

        const typeLine = () => {
            if (currentLine >= lines.length) {
                return;
            }

            const line = lines[currentLine];
            
            const lineTyping = () => {
                setDisplayedText((prev) => {
                    const newText = prev + (line[index] || '');
                    index += 1;
                    if (index >= line.length) {
                        index = 0;
                        currentLine += 1;
                        setDisplayedText((prev) => prev + '\n'); // Add a newline character after the line is done
                        clearInterval(typingTimer);
                        typeLine(); // Move to the next line
                    }
                    return newText;
                });
            };

            typingTimer = setInterval(lineTyping, speed);
        };

        typeLine();

        return () => clearInterval(typingTimer);
    }, [text, speed]);

    return <pre>{displayedText}</pre>; // Use <pre> to preserve whitespace and line breaks
};
