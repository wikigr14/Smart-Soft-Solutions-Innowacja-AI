import React from 'react';

const TranscriptResult = ({ 
    transcriptResult, 
    user, 
    handleGoogleLinkClick, 
    addToCalendar, 
    closePreview 
}) => {
    
    if (!transcriptResult) return null;

    const formatEventDate = (event) => {
        if (!event) return;
        const dateString = event.start_date || event.start_time;
        if (!dateString) return "Brak daty";
        const dateObj = new Date(dateString)
        const isAllDay = event.is_all_day === true || event.is_all_day === "true"
        
        if (isAllDay) {
            return dateObj.toLocaleString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        } else {
            return dateObj.toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        }
    }

    return (
        <div style={{display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.5s'}}>
            {/* Sekcja spotkań */}
            {transcriptResult.calendar_events && (
                <div className="meetings-section">
                    <h3 style={{marginBottom: '15px', color: 'var(--text-main)', textAlign: 'left'}}>
                        Znalezione spotkania
                    </h3>
                    
                    <div className="meetings-header">
                        <div style={{flex: 1}}>DATA</div>
                        <div style={{flex: 1, paddingLeft: '15px'}}>TEMAT</div>
                        <div style={{flex: 1, textAlign: 'right'}}>DODAJ DO KALENDARZA</div>
                    </div>

                    <div className="meetings-list">
                        {(Array.isArray(transcriptResult.calendar_events) 
                            ? transcriptResult.calendar_events 
                            : [transcriptResult.calendar_events]
                        ).map((evt, index) => (
                            <div className="meeting-row" key={index}>
                                <div className="col-date">{formatEventDate(evt)}</div>
                                <div className="col-topic">{evt.summary || "Brak tematu"}</div>
                                <div className="col-action">
                                    {user?.is_google_connected ? (
                                        <button 
                                            onClick={() => addToCalendar(index)} 
                                            className="btn-accept"
                                        >
                                            Dodaj do kalendarza
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={handleGoogleLinkClick}
                                            className="btn-google"
                                        >
                                            Połącz z Google
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Podsumowanie */}
            <div className="card">
                <h3>Podsumowanie: {transcriptResult.filename}</h3>
                <div className="summary-box">
                    {transcriptResult.summary || "Nie wygenerowano podsumowania"}
                </div>
                <button 
                    className="btn-small btn-view" 
                    style={{marginTop: '15px', alignSelf: 'flex-start'}}
                    onClick={closePreview}
                >
                    Zamknij podgląd
                </button>
            </div>
        </div>
    );
}

export default TranscriptResult;