import React, { useState } from 'react';

const FileUpload = ({ handleFileChange, handleUpload, selectedFile, appStatus }) => {
    const [isDragging, setIsDragging] = useState(false);

    //wykrywanie stanu na podstawie tekstu z appStatus
    const isUploading = appStatus === "Wysyłanie...";
    const isSuccess = appStatus && appStatus.toLowerCase().includes("pomyślnie");
    const isError = appStatus && (appStatus.toLowerCase().includes("błąd") || appStatus.toLowerCase().includes("wybierz"));

    //formatowanie rozmiaru pliku
    const formatSize = (bytes) => {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    //obsługa zdarzeń przeciągania
    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileChange({ target: { files: e.dataTransfer.files } });
        }
    };

    return (
        <div className="card">
            <h3>Nowa transkrypcja</h3>
            <p className="subtitle text-left">
                Wgraj plik tekstowy (.txt), aby AI wygenerowało podsumowanie.
            </p>

            <div className="upload-container">
                {/*drop zone*/}
                {!selectedFile && (
                    <label 
                        className={`drop-zone ${isDragging ? 'dragging' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <input 
                            type="file" 
                            accept=".txt" 
                            onChange={handleFileChange} 
                            className="hidden-input"
                        />
                        
                        <div className="icon-circle">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="17 8 12 3 7 8"></polyline>
                                <line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                        </div>
                        <div className="drop-text">
                            <p><strong>Kliknij</strong> lub przeciągnij plik tutaj</p>
                            <span>Obsługiwany format: .TXT</span>
                        </div>
                    </label>
                )}

                {/*/karta pliku*/}
                {selectedFile && (
                    <div className={`file-card ${isError ? 'error' : ''} ${isSuccess ? 'success' : ''}`}>
                        <div className="file-icon-wrapper">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                        </div>

                        <div className="file-info">
                            <div className="file-header">
                                <span className="file-name">{selectedFile.name}</span>
                                {/*przycisk usuwania*/}
                                {!isUploading && !isSuccess && (
                                    <button 
                                        className="btn-icon-remove" 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleFileChange({ target: { files: [] } });
                                        }}
                                        title="Usuń plik"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>

                            {/*pasek postępu*/}
                            <div className="progress-bg">
                                <div 
                                    className={`progress-fill ${isUploading ? 'animating' : ''}`} 
                                    style={{ width: isSuccess ? '100%' : (isUploading ? '60%' : '0%') }}
                                ></div>
                            </div>

                            <div className="file-meta">
                                <span>{formatSize(selectedFile.size)}</span>
                                <span className="status-text">
                                    {isUploading ? 'Przetwarzanie...' : 
                                     isSuccess ? 'Gotowe!' : 
                                     isError ? 'Błąd!' : 'Oczekuje na start'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="action-area">
                    {isError && <p className="error-msg">{appStatus}</p>}
                    
                    {selectedFile && !isSuccess && !isUploading && (
                        <button 
                            className="upload-btn-main" 
                            onClick={handleUpload}
                        >
                            Generuj podsumowanie
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default FileUpload;