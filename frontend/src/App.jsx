import {useState} from 'react'
import './App.css'

const API_URL = "http://localhost:8000"

// Główny komponent
function App() {
    const [selectedFile, setSelectedFile] = useState(null) // Plik do wysłania
    const [appStatus, setAppStatus] = useState("")         // Komunikaty dla usera
    const [transcriptResult, setTranscriptResult] = useState(null) //wyniki transkrypcji


    // Zapisuje wybrany plik do stanu
    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0])
        setAppStatus("")
        setTranscriptResult(null)
    }

    // Wykonuje upload pliku
    const handleUpload = async () => {
        if (!selectedFile) {
            setAppStatus("Wybierz plik!")
            return
        }

        setAppStatus("Wysyłanie...")

        const formData = new FormData()
        formData.append("file", selectedFile)

        try {
            // Wywołanie POST do API
            const response = await fetch(`${API_URL}/upload/`, {
                method: "POST",
                body: formData,
            })

            if (response.ok) {
                const data = await response.json()
                setTranscriptResult(data)//zapis odpowiedzi z backendu
                setAppStatus("Plik zapisany w bazie!")
                setSelectedFile(null)
                // Czyszczenie inputu
                document.querySelector('input[type="file"]').value = ""
            } else {
                const errorData = await response.json().catch(() => ({}));
                setAppStatus(`Błąd serwera (${response.status}): ${errorData.detail || response.statusText}`);
            }
        } catch (error) {
            console.error("Błąd połączenia:", error)
            setAppStatus(`Błąd połączenia (Sprawdź, czy backend działa na ${API_URL})`)
        }
    }

    // TO WIDZI USER
    return (
        <div className="container app-root-container">
            <h1>AI Transcriber</h1>
            <p className="subtitle">Wgraj przykładowy plik tekstowy (.txt), aby symulować transkrypcję.</p>

            <div className="card">
                <input
                    type="file"
                    accept=".txt"
                    onChange={handleFileChange}
                />
                <br/>
                <button onClick={handleUpload} disabled={!selectedFile}>
                    Wyślij i generuj podsumowanie
                </button>
                <p className="status">{appStatus}</p>
            </div>
            {/* sekcja na wyswietlenie podsumowania*/}
            {
                transcriptResult && (
                    <div className="card" style={{marginTop: '20px', textAlign: 'left'}}>
                        <h3>Wynik podsumowania:</h3>
                        <p><strong>Plik:</strong>{transcriptResult.filename}</p>
                        <div style={{backgroundColor: "#f0f0f0", padding: '15px', borderRadius: '8px'}}>
                            <h4>Podsumowanie wygenerowane przez AI:</h4>
                            <div style={{whiteSpace: 'pre-wrap'}}>
                                {transcriptResult.summary || "Nie wygenerowano podsumowania"}
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    )
}

export default App