import React from 'react';
import NotificationBanner from './NotificationBanner';

const AuthForm = ({ 
    authMode, setAuthMode, 
    email, setEmail, 
    password, setPassword, 
    handleAuth, 
    notification, 
    theme, toggleTheme 
}) => {
    return (
        <>
            <div className="theme-toggle-fixed">
                <button onClick={toggleTheme} className="btn-icon" title="Zmień motyw">
                    {theme === 'light' ? '🌙' : '☀️'}
                </button>
            </div>

            <div className="app-root-container auth-container">
                <h1 className="auth-title">AI Transcriber</h1>
                <div className="card auth-card">
                    <h2>{authMode === "login" ? "Witaj ponownie" : "Utwórz konto"}</h2>
                    <p className="subtitle" style={{marginBottom: '20px'}}>
                        {authMode === "login" ? "Zaloguj się, aby kontynuować" : "Zarejestruj się, aby korzystać z aplikacji"}
                    </p>
                    
                    <NotificationBanner notification={notification} />

                    <form onSubmit={handleAuth} className="auth-form">
                        <input 
                            type="email" 
                            placeholder="Adres e-mail" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)} 
                            required
                        />
                        <input 
                            type="password" 
                            placeholder="Hasło" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)} 
                            required
                        />
                        <button type="submit" style={{marginTop: '10px'}}>
                            {authMode === "login" ? "Zaloguj się" : "Zarejestruj się"}
                        </button>
                    </form>
                    <p className="footer-text">
                        {authMode === "login" ? "Nie masz konta?" : "Masz już konto?"}
                        <span className="link-text" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>
                            {authMode === "login" ? "Zarejestruj się" : "Zaloguj się"}
                        </span>
                    </p>
                </div>
            </div>
        </>
    );
}

export default AuthForm;