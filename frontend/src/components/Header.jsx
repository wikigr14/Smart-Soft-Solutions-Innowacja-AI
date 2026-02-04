import React from 'react';

const Header = ({ user, theme, toggleTheme, logout }) => {
    return (
        <header>
            <h1>AI Transcriber</h1>
            <div className="header-user-info">
                <div>{user?.email}</div>
                <button 
                    onClick={toggleTheme}
                    className="btn-icon-small"
                    title="Zmień motyw"
                >
                    {theme === 'light' ? '🌙' : '☀️'}
                </button>

                <button onClick={logout} className="btn-outline">
                    Wyloguj
                </button>
            </div>
        </header>
    );
}

export default Header;