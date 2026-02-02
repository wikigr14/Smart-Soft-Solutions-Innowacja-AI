import React from 'react';

const GoogleConnect = ({ user, handleGoogleLinkClick }) => {
    if (user && user.is_google_connected) return null;

    return (
        <div className="card card-google">
            <div className="google-connect-wrapper">
                <div>
                    <h3 style={{border: 'none', padding: 0, margin: 0}}>Integracja z Google</h3>
                    <p style={{margin: '5px 0 0 0', color: 'var(--text-muted)'}}>
                        Połącz konto, aby automatycznie dodawać wydarzenia do kalendarza.
                    </p>
                </div>
                <button onClick={handleGoogleLinkClick}>Połącz z Google</button>
            </div>
        </div>
    );
}

export default GoogleConnect;