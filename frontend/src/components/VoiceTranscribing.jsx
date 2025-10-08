// src/VoiceInput.jsx
import React, { useState, useEffect } from "react";

const VoiceInput = ({ onResult }) => {
    const [listening, setListening] = useState(false);
    const [transcript, setTranscript] = useState("");

    useEffect(() => {
        if (
            !(
                "webkitSpeechRecognition" in window ||
                "SpeechRecognition" in window
            )
        ) {
            alert("Your browser does not support Speech Recognition");
            return;
        }

        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event) => {
            let interimTranscript = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    setTranscript(result[0].transcript);
                    if (onResult) onResult(result[0].transcript);
                } else {
                    interimTranscript += result[0].transcript;
                }
            }
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error", event.error);
            setListening(false);
        };

        recognition.onend = () => {
            console.log(transcript)
            console.log("Speech recognition ended");
            setListening(false);
        };

        if (listening) recognition.start();
        else recognition.stop();

        return () => recognition.abort();
    }, [listening, onResult]);

    return (
        <div>
            <button onClick={() => setListening((prev) => !prev)}>
                {listening ? "Stop Listening" : "Start Listening"}
            </button>
            <p>Transcript: {transcript}</p>
        </div>
    );
};

export default VoiceInput;
