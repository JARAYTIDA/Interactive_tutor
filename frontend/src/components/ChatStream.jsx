import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    SendHorizonal,
    Sparkles,
    User,
    RotateCcw,
    ChevronDown,
    X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";

export default function BotChat() {
    const [messages, setMessages] = useState([
        {
            id: 0,
            role: "assistant",
            content:
                "Hello! I'm your AI tutor. I'm here to help you learn anything you're curious about. What would you like to explore today?",
        },
    ]);
    const [input, setInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const abortRef = useRef(null);
    const chatRef = useRef(null);
    const inputRef = useRef(null);

    const audioQueue = [];
    let isPlayingAudio = false;

    const playAudioChunk = (audioUrl, label = "") => {
        audioQueue.push({ audioUrl, label });
        processAudioQueue();
    };

    const processAudioQueue = () => {
        if (isPlayingAudio || audioQueue.length === 0) return;

        isPlayingAudio = true;
        const { audioUrl, label } = audioQueue.shift();
        const audio = new Audio(audioUrl);

        console.log(`🎧 Playing ${label}`);
        audio
            .play()
            .then(() => {
                audio.onended = () => {
                    console.log(`✅ Finished ${label}`);
                    isPlayingAudio = false;
                    processAudioQueue(); // Play next in queue
                };
            })
            .catch((err) => {
                console.error("Audio playback error:", err);
                isPlayingAudio = false;
                processAudioQueue(); // Skip to next
            });
    };

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const scrollToBottom = (smooth = true) => {
        chatRef.current?.scrollTo({
            top: chatRef.current.scrollHeight,
            behavior: smooth ? "smooth" : "auto",
        });
    };

    const addMessage = (role, content) => {
        setMessages((prev) => [...prev, { id: Date.now(), role, content }]);
        // setTimeout(() => scrollToBottom(), 100);
    };

    const updateLastMessage = (chunk) => {
        setMessages((prev) => {
            const copy = [...prev];
            const last = copy.length - 1;
            copy[last].content += chunk;
            return copy;
        });
        // scrollToBottom();
    };

    const sendMessage = async () => {
        const query = input.trim();
        if (!query || isStreaming) return;

        setInput("");
        addMessage("user", query);
        addMessage("assistant", "");
        setIsStreaming(true);
        abortRef.current = new AbortController();

        try {
            const res = await fetch("http://localhost:5000", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topic: query }),
                signal: abortRef.current.signal,
            });

            if (!res.ok) {
                updateLastMessage(
                    `I apologize, but I encountered an error (${res.status}). Please try again.`
                );
                setIsStreaming(false);
                return;
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });

                // Split stream into JSON lines
                const lines = chunk
                    .split("\n")
                    .filter((line) => line.trim() !== "");

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);

                        if (data.type === "text") {
                            // Append generated text to chat
                            updateLastMessage(data.content);
                        } else if (data.type === "audio") {
                            // Unit finished -> play TTS
                            // playAudioChunk(data.audio_url, data.unit);
                            if (data.audio_url) {
                                // Scroll to the chunk
                                // const element = document.getElementById(chunkId);
                                // if (element) {
                                //     element.scrollIntoView({
                                //         behavior: "smooth",
                                //         block: "center",
                                //     });
                                // }

                                // Play audio

                                playAudioChunk(data.audio_url, `${data.unit} - part ${data.chunk_index || 1}`);

                                // const audio = new Audio(data.audio_url);
                                // // setPlayingChunk(chunkId);
                                // audio.play();
                                // audio.onended = () => setPlayingChunk(null);
                            }
                        } else if (data.type === "error") {
                            updateLastMessage(`⚠️ ${data.content}`);
                        }
                    } catch (err) {
                        // Fallback: if not JSON, just treat it as raw text
                        updateLastMessage(chunk);
                    }
                }
            }
        } catch (err) {
            if (err.name !== "AbortError") {
                updateLastMessage(
                    "I'm having trouble connecting right now. Please check your connection and try again."
                );
            }
        } finally {
            setIsStreaming(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const stopStreaming = () => {
        abortRef.current?.abort();
        setIsStreaming(false);
    };

    const resetChat = () => {
        setMessages([
            {
                id: Date.now(),
                role: "assistant",
                content:
                    "Hello! I'm your AI tutor. I'm here to help you learn anything you're curious about. What would you like to explore today?",
            },
        ]);
        setInput("");
        setIsStreaming(false);
    };

    const [playingChunk, setPlayingChunk] = useState(null);

    const playTTS = async (text, chunkId) => {
        try {
            const response = await fetch("http://localhost:5000/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });

            const data = await response.json();
            if (data.audio_url) {
                // Scroll to the chunk
                // const element = document.getElementById(chunkId);
                // if (element) {
                //     element.scrollIntoView({
                //         behavior: "smooth",
                //         block: "center",
                //     });
                // }

                // Play audio
                const audio = new Audio(data.audio_url);
                // setPlayingChunk(chunkId);
                audio.play();
                audio.onended = () => setPlayingChunk(null);
            }
        } catch (err) {
            console.error("TTS Error:", err);
        }
    };

    return (
        <div className="w-screen h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between bg-indigo-600 text-white px-6 py-4 shadow-md">
                <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="font-semibold text-lg">AI Tutor</h1>
                        <p className="text-sm text-indigo-100">
                            Always here to help you learn
                        </p>
                    </div>
                </div>

                <button onClick={playTTS}>Speak</button>
                <button
                    onClick={resetChat}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                    <RotateCcw className="w-5 h-5" />
                </button>
            </header>

            {/* Messages Area */}
            <div
                ref={chatRef}
                className="flex-1 overflow-y-auto px-4 py-6 space-y-3 bg-slate-50"
            >
                <AnimatePresence initial={false}>
                    {messages.map((m, idx) => (
                        <ChatMessage
                            key={m.id}
                            id = {m.id}
                            message={m}
                            isLatest={idx === messages.length - 1}
                            isStreaming={isStreaming}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {/* Input Area */}
            <footer className="border-t border-slate-300 px-4 py-4 bg-white/90 flex items-center gap-2">
                <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask me anything..."
                    rows={1}
                    className="flex-1 px-4 py-2 rounded-xl border border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none outline-none"
                    disabled={isStreaming}
                    style={{ maxHeight: "120px" }}
                />
                {isStreaming ? (
                    <button
                        onClick={stopStreaming}
                        className="bg-red-500 text-white p-3 rounded-xl hover:bg-red-600"
                    >
                        <X size={20} />
                    </button>
                ) : (
                    <button
                        onClick={sendMessage}
                        disabled={!input.trim()}
                        className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                    >
                        <SendHorizonal size={20} />
                    </button>
                )}
            </footer>
        </div>
    );
}

// ChatMessage component with better Markdown styling
function ChatMessage({ message, isLatest, isStreaming }) {
    const isUser = message.role === "user";
    const Icon = isUser ? User : Sparkles;

    const markdownStyling = {
        h1: ({ node, ...props }) => (
            <h1
                className="text-2xl font-bold mt-6 mb-3 first:mt-0 text-slate-900"
                {...props}
            />
        ),
        h2: ({ node, ...props }) => (
            <h2
                className="text-xl font-bold mt-5 mb-2 first:mt-0 text-slate-900"
                {...props}
            />
        ),
        h3: ({ node, ...props }) => (
            <h3
                className="text-lg font-semibold mt-4 mb-2 first:mt-0 text-slate-900"
                {...props}
            />
        ),
        h4: ({ node, ...props }) => (
            <h4
                className="text-base font-semibold mt-3 mb-1 first:mt-0 text-slate-900"
                {...props}
            />
        ),
        h5: ({ node, ...props }) => (
            <h5
                className="text-sm font-semibold mt-3 mb-1 first:mt-0 text-slate-900"
                {...props}
            />
        ),
        h6: ({ node, ...props }) => (
            <h6
                className="text-sm font-semibold mt-3 mb-1 first:mt-0 text-slate-700"
                {...props}
            />
        ),
        p: ({ node, ...props }) => (
            <p className="mb-3 last:mb-0 leading-7 text-slate-800" {...props} />
        ),
        a: ({ node, href, ...props }) => (
            <a
                href={href}
                className="text-indigo-600 hover:text-indigo-800 underline decoration-indigo-300 hover:decoration-indigo-500 transition-colors break-words font-medium"
                target="_blank"
                rel="noopener noreferrer"
                {...props}
            />
        ),
        ul: ({ node, ...props }) => (
            <ul
                className="list-disc ml-6 mb-3 last:mb-0 space-y-1.5 marker:text-slate-400"
                {...props}
            />
        ),
        ol: ({ node, ...props }) => (
            <ol
                className="list-decimal ml-6 mb-3 last:mb-0 space-y-1.5 marker:text-slate-400"
                {...props}
            />
        ),
        li: ({ node, ...props }) => (
            <li className="leading-7 text-slate-800 pl-1" {...props} />
        ),
        blockquote: ({ node, ...props }) => (
            <blockquote
                className="border-l-4 border-indigo-300 bg-indigo-50/50 pl-4 pr-4 py-2 my-3 italic text-slate-700 rounded-r"
                {...props}
            />
        ),
        pre: ({ node, ...props }) => (
            <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto my-3 text-sm leading-relaxed shadow-inner border border-slate-700">
                {props.children}
            </pre>
        ),
        code: ({ node, inline, className, children, ...props }) => {
            if (inline) {
                return (
                    <code
                        className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[0.9em] font-mono border border-slate-200"
                        {...props}
                    >
                        {children}
                    </code>
                );
            }
            return (
                <code
                    className={`block font-mono text-sm ${className || ""}`}
                    {...props}
                >
                    {children}
                </code>
            );
        },
        table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-3">
                <table
                    className="min-w-full border-collapse border border-slate-300"
                    {...props}
                />
            </div>
        ),
        thead: ({ node, ...props }) => (
            <thead className="bg-slate-100" {...props} />
        ),
        tbody: ({ node, ...props }) => <tbody {...props} />,
        tr: ({ node, ...props }) => (
            <tr
                className="border-b border-slate-200 last:border-b-0"
                {...props}
            />
        ),
        th: ({ node, ...props }) => (
            <th
                className="px-4 py-2 text-left font-semibold text-slate-900 border border-slate-300"
                {...props}
            />
        ),
        td: ({ node, ...props }) => (
            <td
                className="px-4 py-2 text-slate-800 border border-slate-300"
                {...props}
            />
        ),
        hr: ({ node, ...props }) => (
            <hr className="my-6 border-t-2 border-slate-200" {...props} />
        ),
        strong: ({ node, ...props }) => (
            <strong className="font-bold text-slate-900" {...props} />
        ),
        em: ({ node, ...props }) => <em className="italic" {...props} />,
        del: ({ node, ...props }) => (
            <del className="line-through text-slate-500" {...props} />
        ),
        img: ({ node, alt, src, ...props }) => (
            <img
                src={src}
                alt={alt || ""}
                className="max-w-full h-auto rounded-lg my-3 shadow-md"
                loading="lazy"
                {...props}
            />
        ),
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`flex gap-3 ${
                isUser ? "flex-row-reverse" : "flex-row"
            } items-start`}
        >
            <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    isUser
                        ? "bg-indigo-500"
                        : "bg-indigo-100 border border-indigo-200"
                }`}
            >
                <Icon
                    className={`${
                        isUser ? "text-white" : "text-indigo-600"
                    } w-4 h-4`}
                />
            </div>

            <div
                className={`flex-1 max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                    isUser
                        ? "bg-indigo-600 text-white"
                        : "bg-white border border-slate-200"
                }`}
            >
                {message.content ? (
                    <>
                        <ReactMarkdown components={markdownStyling}>
                            {message.content}
                        </ReactMarkdown>
                    </>
                ) : (
                    isLatest && isStreaming && <TypingIndicator />
                )}
            </div>
        </motion.div>
    );
}

function TypingIndicator() {
    return (
        <div className="flex space-x-1.5 py-1">
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    className="w-2 h-2 bg-slate-400 rounded-full"
                    animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }}
                    transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: i * 0.15,
                    }}
                />
            ))}
        </div>
    );
}
