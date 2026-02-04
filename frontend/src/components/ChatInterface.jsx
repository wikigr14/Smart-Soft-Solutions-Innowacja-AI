import React, { useState, useRef, useEffect } from 'react';

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

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
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ question: userMsg.content })
            });
            if (res.ok) {
                const data = await res.json();
                const aiMsg = { role: 'ai', content: data.answer };
                setMessages(prev => [...prev, aiMsg]);
            } else {
                setMessages(prev => [...prev, { role: 'ai', content: "Błąd serwera." }]);
            }
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'ai', content: "Błąd połączenia." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Accordion 
            sx={{ 
                backgroundColor: 'var(--card-bg)', 
                color: 'var(--text-main)',
                borderRadius: '16px !important',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                border: '1px solid var(--border-color)',
                '&:before': { display: 'none' }
            }}
        >
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'var(--primary-color)' }} />}>
                <Typography variant="h6" component="h3">Zapytaj AI o swoje spotkania</Typography>
            </AccordionSummary>

            <AccordionDetails>
                <Typography sx={{ color: 'var(--text-muted)', mb: 2, textAlign: 'left' }}>
                    AI odpowiada wyłącznie na podstawie Twoich transkrypcji.
                </Typography>
                
                <div className="chat-window">
                    {messages.length === 0 && (
                        <div className="chat-placeholder">
                            <Typography>Zadaj pytanie dotyczące treści Twoich plików...</Typography>
                        </div>
                    )}
                    {messages.map((msg, index) => (
                        <div key={index} className={`message ${msg.role}`}>
                            <div className="message-content">{msg.content}</div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="message ai"><div className="message-content">...</div></div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Zadaj pytanie..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: 'var(--input-bg)',
                                borderRadius: '20px', 
                                overflow: 'hidden',   

                                '&.Mui-focused': {
                                    boxShadow: 'none !important',
                                    outline: 'none !important',
                                    backgroundColor: 'var(--input-focus-bg)',
                                },
                            
                                '& fieldset': { 
                                    borderColor: 'var(--border-color)',
                                    borderRadius: '20px !important', 
                                },
                                '&:hover fieldset': { 
                                    borderColor: 'var(--primary-color)',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: 'var(--primary-color) !important',
                                    borderWidth: '1.5px !important',
                                },
                            },
                        
                            '& .MuiOutlinedInput-input': {
                                color: 'var(--text-main) !important',
                                WebkitTextFillColor: 'var(--text-main) !important',
                                paddingLeft: '20px',
                                outline: 'none !important',
                                boxShadow: 'none !important',
                            },
                        
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderRadius: '20px !important',
                                outline: 'none !important',
                                boxShadow: 'none !important',
                            },
                        
                            '& .Mui-focused': {
                                outline: 'none !important',
                                boxShadow: 'none !important',
                            }
                        }}
                    />
                    <Button 
                        variant="contained" 
                        type="submit" 
                        disabled={isLoading || !input.trim()}
                        sx={{ flexShrink: 0,
                            minWidth: '100px',
                            borderRadius: '20px'
                        }}
                    >
                        {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Wyślij'}
                    </Button>
                </form>
            </AccordionDetails>
        </Accordion>
    );
};

export default ChatInterface;