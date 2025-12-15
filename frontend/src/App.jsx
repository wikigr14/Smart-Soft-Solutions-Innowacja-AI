import { useState } from 'react'
import './App.css'

const API_URL = "http://localhost:8000" 

// Główny komponent
function App() {
  const [selectedFile, setSelectedFile] = useState(null) // Plik do wysłania
  const [appStatus, setAppStatus] = useState("")         // Komunikaty dla usera

  
  // Zapisuje wybrany plik do stanu
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0])
    setAppStatus("")
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
          Wyślij do Bazy
        </button>
        <p className="status">{appStatus}</p>
      </div>
    </div>
  )
}

export default App