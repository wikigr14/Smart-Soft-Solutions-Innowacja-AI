import React, { useState, useRef, useEffect } from 'react';

const ChatInterface = ({ token }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            const res = await fetch("http://localhost:8000/chat/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ question: userMsg.content })
            });

            if (res.ok) {
                const data = await res.json();
                const aiMsg = { role: 'ai', content: data.answer };
                setMessages(prev => [...prev, aiMsg]);
            } else {
                setMessages(prev => [...prev, { role: 'ai', content: "Błąd serwera. Spróbuj ponownie." }]);
            }
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'ai', content: "Błąd połączenia." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="card chat-card">
            <h3>Zapytaj AI o swoje spotkania</h3>
            <p className="subtitle">AI odpowiada wyłącznie na podstawie Twoich transkrypcji.</p>
            
            <div className="chat-window">
                {messages.length === 0 && (
                    <div className="chat-placeholder">
                        <p>Przykłady pytań:</p>
                        <ul>
                            <li>"Kiedy mam spotkanie z zespołem marketingu?"</li>
                            <li>"Co ustaliliśmy w sprawie budżetu?"</li>
                            <li>"Jakie są moje zadania na przyszły tydzień?"</li>
                        </ul>
                    </div>
                )}
                
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.role}`}>
                        <div className="message-content">{msg.content}</div>
                    </div>
                ))}
                
                {isLoading && (
                    <div className="message ai">
                        <div className="message-content">...</div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="chat-input-area">
                <input 
                    type="text" 
                    placeholder="Zadaj pytanie..." 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isLoading}
                />
                <button type="submit" disabled={isLoading || !input.trim()}>
                    Wyślij
                </button>
            </form>
        </div>
    );
};

export default ChatInterface;