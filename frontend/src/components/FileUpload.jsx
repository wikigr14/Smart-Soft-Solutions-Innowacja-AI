import React from 'react';

const FileUpload = ({ handleFileChange, handleUpload, selectedFile, appStatus }) => {
    return (
        <div className="card">
            <h3>Nowa transkrypcja</h3>
            <p className="subtitle text-left">
                Wgraj plik tekstowy (.txt), aby AI wygenerowało podsumowanie i wykryło wydarzenia.
            </p>
            <input
                type="file"
                accept=".txt"
                onChange={handleFileChange}
            />
            
            <div style={{display: 'flex', justifyContent: 'flex-end', width: '100%', marginTop: '10px', alignItems: 'center', gap: '15px'}}>
                <span className="status">{appStatus}</span>
                <button onClick={handleUpload} disabled={!selectedFile}>
                    Generuj podsumowanie
                </button>
            </div>
        </div>
    );
}

export default FileUpload;