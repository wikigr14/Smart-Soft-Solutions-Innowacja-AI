import React from 'react';

const HistoryList = ({ history, setTranscriptResult, handleDelete }) => {
    return (
        <div className="card">
            <h3>Historia transkrypcji</h3>
            {history.length === 0 ? (
                <p className="subtitle">Brak historii transkrypcji.</p>
            ) : (
                <div className="table-container">
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th>Plik</th>
                                <th>Wykryte wydarzenie</th>
                                <th>Akcje</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.filename || `Transkrypcja #${item.id}`}</td>
                                    <td>
                                        {item.calendar_events ? (
                                            <span style={{color: 'var(--success-text)', fontWeight: '500'}}>
                                                {Array.isArray(item.calendar_events) 
                                                    ? `Znaleziono: ${item.calendar_events.length}` 
                                                    : item.calendar_events.summary}
                                            </span>
                                        ) : (
                                            <span style={{color: 'var(--text-muted)'}}>Brak wydarzeń</span>
                                        )}
                                    </td>
                                    <td style={{textAlign: 'right'}}>
                                        <div className="action-buttons">
                                            <button 
                                                className="btn-small btn-view" 
                                                onClick={() => {
                                                    setTranscriptResult(item)
                                                    window.scrollTo({ top: 0, behavior: 'smooth' })
                                                }}
                                            >
                                                Pokaż
                                            </button>
                                            <button 
                                                className="btn-small btn-delete" 
                                                onClick={(e) => handleDelete(item.id, e)}
                                            >
                                                Usuń
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default HistoryList;