import {useState, useEffect} from 'react'
import './App.css'

// Import komponentów
import AuthForm from './components/AuthForm';
import Header from './components/Header';
import NotificationBanner from './components/NotificationBanner';
import GoogleConnect from './components/GoogleConnect';
import FileUpload from './components/FileUpload';
import TranscriptResult from './components/TranscriptResult';
import HistoryList from './components/HistoryList';
import ChatInterface from './components/ChatInterface';

const API_URL = "http://localhost:8000"

// Główny komponent
function App() {
    //Motyw
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "light")

    //Autoryzacja
    const [token, setToken] = useState(localStorage.getItem("token")) //token z pamieci przegladarki
    const [user, setUser] = useState(null) //dane zalogowanego uzytkownika
    const [authMode, setAuthMode] = useState("login")//formularz w trybie login lub register
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    
    //Aplikacja
    const [selectedFile, setSelectedFile] = useState(null) // Plik do wysłania
    const [appStatus, setAppStatus] = useState("")         // Komunikaty dla usera
    const [transcriptResult, setTranscriptResult] = useState(null) //wyniki transkrypcji

    // Historia i Powiadomienia
    const [history, setHistory] = useState([]) //historia
    const [notification, setNotification] = useState(null) //komunikaty

    //zarządzanie motywem
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
        localStorage.setItem("theme", theme)
    }, [theme])

    //sprawdzanie logowania z google
    useEffect(() => {
        //odpalana przy wlaczeniu strony
        const params = new URLSearchParams(window.location.search)
        //szukanie parametru google_code (powrot z logowania google)
        const googleCode = params.get("google_code")
        if (googleCode && token) {
            //jesli znaleziono laczy konta
            connectGoogleAccount(googleCode)
        } else if (token) {
            fetchUserData()
            fetchHistory() // pobieranie historii
        }
    }, [token])

    //motyw
    const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"))
    
    //wyświetlanie powiadomień zamiast alertów
    const showNotification = (message, type = 'error') => {
        setNotification({ message, type })
        setTimeout(() => setNotification(null), 5000)
    }

    //obsluga wylogowania
    const logout = () => {
        localStorage.removeItem("token")
        setToken(null)
        setUser(null)
        setTranscriptResult(null)
        setHistory([])
        setNotification(null)
        setEmail("")
        setPassword("") 
        setSelectedFile(null)
        setAppStatus("")
        setAuthMode("login")
    }

    
    //pobieranie danych usera
    const fetchUserData = async () => {
        //pobiera dane profilu z backendu
        try {
            const res = await fetch(`${API_URL}/users/me`, { headers: {"Authorization": `Bearer ${token}`} })
            if (res.ok) setUser(await res.json()) //zapisuje dane usera
            else logout() //jesli token stracil waznosc logout
        } catch (e) { console.error(e); logout(); }
    }

    // Funkcja pobierania historii
    const fetchHistory = async () => {
        try {
            const res = await fetch(`${API_URL}/transcripts`, { headers: {"Authorization": `Bearer ${token}`} })
            if (res.ok) {
                const data = await res.json()
                const sorted = data.sort((a,b) => b.id - a.id)
                setHistory(sorted)
            }
        } catch (e) { console.error("History error:", e) }
    }

    // Obsluga logowania i rejestracji
    const handleAuth = async (e) => {
        //obsluga formularza logowania lub rejestracji
        e.preventDefault()
        setNotification(null) 
        const endpoint = authMode === "login" ? "/token" : "/register"
        let body, headers = {}

        //konfiguracja w zaleznosci czy lgoowanie czy rejestracja
        if (authMode === "login") {
            //formData dla OAuth2
            const formData = new URLSearchParams()
            formData.append("username", email)
            formData.append("password", password)
            body = formData
            headers = {"Content-Type": "application/x-www-form-urlencoded"}
        } else {
            //rejestracja
            headers = {"Content-Type": "application/json"}
            body = JSON.stringify({email, password})
        }

        //wysylanie zadania i zapisanie tokenow
        try {
            const res = await fetch(`${API_URL}${endpoint}`, { method: "POST", headers, body })
            const data = await res.json()
            if (res.ok) {
                localStorage.setItem("token", data.access_token)
                setToken(data.access_token)
                //po rejestracji automatycznie nastepuje logowanie
                if (authMode === "register") showNotification("Konto utworzone pomyślnie.", "success")
            } else {
                showNotification(`Błąd: ${data.detail}`, "error")
            }
        } catch (err) {
            console.error(err)
            showNotification("Błąd połączenia z serwerem", "error")
        }
    }

    // Laczenie z kontem google
    const connectGoogleAccount = async (code) => {
        //kod autoryzacyjny google wysylany do backendu w celu zamiany na tokeny
        try {
            const res = await fetch(`${API_URL}/auth/google/connect`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({code})
            })
            if (res.ok) {
                showNotification("Pomyślnie połączono konto Google.", "success")
                //czysczenie linku
                window.history.replaceState({}, document.title, "/")
                //odswiezanie danych usera
                await fetchUserData()
                await fetchHistory()
            } else {
                showNotification("Błąd łączenia z Google.", "error")
            }
        } catch (e) {
            console.error(e)
            showNotification("Błąd Google Connect", "error")
        }
    }

    const handleGoogleLinkClick = async () => {
        //pobiera z backendu url do zalogowania uzytkownika w google
        try {
            showNotification("Przekierowywanie do Google...", "success") 

            const res = await fetch(`${API_URL}/auth/google/url`, { headers: {"Authorization": `Bearer ${token}`} })
            const data = await res.json()
            //przekierowanie do google
            window.location.href = data.url
        } catch (e) {
            console.error(e)
            showNotification("Błąd URL Google", "error")
        }
    }

    // Funkcja usuwania
    const handleDelete = async (id, e) => {
        e.stopPropagation() 
        try {
            const res = await fetch(`${API_URL}/transcripts/${id}`, {
                method: "DELETE",
                headers: {"Authorization": `Bearer ${token}`}
            })
            if (res.ok) {
                showNotification("Usunięto pomyślnie", "success")
                fetchHistory() 
                if (transcriptResult?.id === id) setTranscriptResult(null) 
            } else {
                showNotification("Nie udało się usunąć", "error")
            }
        } catch (e) {
            console.error(e)
            showNotification("Błąd połączenia", "error")
        }
    }

    // Obsługa konkretnego eventu
    const addToCalendar = async (index) => {
        //wysyla zadanie utworzenia wydarzenia w kalendarzu
        if (!transcriptResult || !transcriptResult.id) return;

        if (!user || !user.is_google_connected) {
            showNotification("Musisz najpierw połączyć konto z Google! Użyj przycisku na górze.", "error");
            return;
        }

        try {
            const res = await fetch(`${API_URL}/transcripts/${transcriptResult.id}/create_event?event_index=${index}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                // Wysyłamy konkretny obiekt w body
                body: JSON.stringify({})
            })
            const data = await res.json()
            if (res.ok) {
                showNotification("Dodano wydarzenie do kalendarza", "success")
                // jesli da sie dodac wydarzenie to otwieramy kalendarz w nowej karcie
                if(data.link) window.open(data.link, '_blank')
            } else {
                showNotification(`Błąd: ${data.detail || "Nie udało się dodać"}`, "error")
            }
        } catch (e) {
            console.error(e)
            showNotification("Błąd połączenia", "error")
        }
    }

    // Wykonuje upload pliku
    const handleUpload = async () => {
        if (!selectedFile) {
            setAppStatus("Wybierz plik!")
            return
        }
        setAppStatus("Wysyłanie...")
        setNotification(null) // czyszczenie błędów

        const formData = new FormData()
        formData.append("file", selectedFile)

        try {
            // Wywołanie POST do API
            const response = await fetch(`${API_URL}/upload/`, {
                method: "POST",
                headers: {"Authorization": `Bearer ${token}`},
                body: formData,
            })
            if (response.ok) {
                const data = await response.json()
                setTranscriptResult(data) //zapis odpowiedzi z backendu
                setAppStatus("Plik przetworzony pomyślnie!")
                setSelectedFile(null)
                // Czyszczenie inputu
                
                await fetchHistory() // Odśwież historię po uploadzie
            } else {
                const errorData = await response.json().catch(() => ({}));
                setAppStatus(`Błąd serwera: ${errorData.detail || response.statusText}`);
            }
        } catch (error) {
            console.error(error)
            setAppStatus(`Błąd połączenia z backendem`)
        }
    }

    //logowanie
    if (!token) {
        return (
            <AuthForm 
                authMode={authMode} setAuthMode={setAuthMode}
                email={email} setEmail={setEmail}
                password={password} setPassword={setPassword}
                handleAuth={handleAuth}
                notification={notification}
                theme={theme} toggleTheme={toggleTheme}
            />
        )
    }

    //glowna apka po logowaniu
    return (
        <div className="app-root-container">
            <Header 
                user={user} 
                theme={theme} 
                toggleTheme={toggleTheme} 
                logout={logout} 
            />
            
            <NotificationBanner notification={notification} />

            {/* Status Google */}
            <GoogleConnect 
                user={user} 
                handleGoogleLinkClick={handleGoogleLinkClick} 
            />

            {/* Upload */}
            <FileUpload 
                handleFileChange={(e) => { setSelectedFile(e.target.files[0]); setAppStatus(""); }}
                handleUpload={handleUpload}
                selectedFile={selectedFile}
                appStatus={appStatus}
            />

            {/* chatowanie */}
            <ChatInterface token={token} />

            {/* Wynik transkrypcji */}
            <TranscriptResult 
                transcriptResult={transcriptResult}
                user={user}
                handleGoogleLinkClick={handleGoogleLinkClick}
                addToCalendar={addToCalendar}
                closePreview={() => setTranscriptResult(null)}
            />

            {/* Historia Transkrypcji */}
            <HistoryList 
                history={history}
                setTranscriptResult={setTranscriptResult}
                handleDelete={handleDelete}
            />
        </div>
    )
}

export default App