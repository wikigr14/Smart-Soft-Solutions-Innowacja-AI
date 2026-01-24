import {useState, useEffect} from 'react'
import './App.css'

const API_URL = "http://localhost:8000"

// Główny komponent
function App() {
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
        }
    }, [token])

    //pobieranie danych usera
    const fetchUserData = async () => {
        //pobiera dane profilu z backendu
        try {
            const res = await fetch(`${API_URL}/users/me`, {
                headers: {"Authorization": `Bearer ${token}`}
            })
            if (res.ok) {
                const data = await res.json()
                setUser(data)//zapisuje dane usera
            } else {
                logout()//jesli token stracil waznosc logout
            }
        } catch (e) {
            console.error(e)
            logout()
        }
    }

    //laczenie z kontem google
    const connectGoogleAccount = async (code) => {
        //kod autoryzacyjny google wysylany do backendu w celu zamiany na tokeny
        try {
            const res = await fetch(`${API_URL}/auth/google/connect`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({code})
            })
            if (res.ok) {
                alert("Pomyślnie połączono konto Google.")
                //czysczenie linku
                window.history.replaceState({}, document.title, "/")
                //odswiezanie danych usera
                fetchUserData()
            }
        } catch (e) {
            console.error(e)
            alert("Błąd podczas łączenia z kontem Google.")
        }
    }

    //obsluga wylogowania
    const logout = () => {
        localStorage.removeItem("token")
        setToken(null)
        setUser(null)
        setTranscriptResult(null)
    }

    //obsluga logowania i rejestracji

    const handleAuth = async (e) => {
        //obsluga formularza logowania lub rejestracji
        e.preventDefault()
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
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: "POST",
                headers: headers,
                body: body
            })
            const data = await res.json()
            if (res.ok) {
                localStorage.setItem("token", data.access_token)
                setToken(data.access_token)
                //po rejestracji automatycznie nastepuje logowanie
                if (authMode === "register") {
                    alert("Konto utworzone.")
                }
            } else {
                alert(`Błąd: ${data.detail}`)
            }
        } catch (err) {
            console.error(err)
            alert("Błąd połaczenia z serwerem")
        }
    }

    const handleGoogleLinkClick = async () => {
        //pobiera z backendu url do zalogowania uzytkownika w google
        try {
            const res = await fetch(`${API_URL}/auth/google/url`, {
                headers: {"Authorization": `Bearer ${token}`}
            })
            const data = await res.json()
            //przekierowanie do google
            window.location.href = data.url
        } catch (e) {
            console.error(e)
            alert("Nie udało się przełączyć na stronę logowanie Google")
        }
    }

    const addToCalendar = async () => {
        //wysyla zadanie utworzenia wydarzenia w kalendarzu
        if (!transcriptResult || !transcriptResult.id) {
            return;
        }
        try {
            const res = await fetch(`${API_URL}/transcripts/${transcriptResult.id}/create_event`, {
                method: "POST",
                headers: {"Authorization": `Bearer ${token}`}
            })
            const data = await res.json()
            if (res.ok) {
                alert("Dodano wydarzenie")
                // jesli da sie dodac wydarzenie to otwieramy kalendarz w nowej karcie
                window.open(data.link, '_blank')
            } else {
                alert("Wystąpił błąd podczas dodawania wydarzenia")
            }
        } catch (e) {
            console.error(e)
            alert("Błąd połączenia")
        }
    }

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
                headers: {"Authorization": `Bearer ${token}`},
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

    const formatEventDate = (event) => {
        if (!event) {
            return;
        }
        //pobieranie stringu z data
        const dateString = event.start_date || event.start_time;
        if (!dateString) {
            return "Brak daty";
        }
        const dateObj = new Date(dateString)
        //sprawdzenie czy wydarzenie calodniowe (sprawdzenie stringa w razie gdyby ai go zwrocilo zamiast boola)
        const isAllDay = event.is_all_day === true || event.is_all_day === "true"
        if (isAllDay) {
            return dateObj.toLocaleString('pl-PL', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } else {
            return dateObj.toLocaleString('pl-PL', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    //logowanie/rejestracja
    if (!token) {
        return (
            <div className="container app-root-container">
                <h1>AI Transcriber</h1>
                <div className="card">
                    <h2>{authMode === "login" ? "Logowanie" : "Rejestracja"}</h2>
                    <form onSubmit={handleAuth} style={{display: 'flex', flexDirection: 'column'}}>
                        <input type="email" placeholder="test@gmail.com" value={email}
                               onChange={(e) => setEmail(e.target.value)} required/>
                        <input type="password" placeholder="******" value={password}
                               onChange={(e) => setPassword(e.target.value)} required/>
                        <button type="submit">
                            {authMode === "login" ? "Zaloguj się" : "Zarejestruj się"}
                        </button>
                    </form>
                    <p>
                        {authMode === "login" ? "Nie masz konta?" : "Masz już konto?"}
                        <span onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>
                            {authMode === "login" ? "Zarejestruj się" : "Zaloguj się"}
                        </span>
                    </p>
                </div>
            </div>
        )
    }

    //glowna apka po logowaniu
    return (
        <div className="container app-root-container">
            <header>
                <h1>AI Transcriber</h1>
                <div>
                    <div>Zalogowany jako: {user?.email}</div>
                    <button onClick={logout}>Wyloguj</button>
                </div>
            </header>
            {/*sekcja na status polaczenia z google*/}
            {user && !user.is_google_connected && (
                <div className="card">
                    <p>Brak połączenia z Google</p>
                    <button onClick={handleGoogleLinkClick}>Połącz z Google</button>
                </div>
            )}
            {/*sekcja na upload pliku*/}
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
            {/* sekcja na wyswietlenie podsumowania i spoktania*/}
            {transcriptResult && (
                <div>
                    {/* sekcja na wyswietlenie spotkan*/}
                    {transcriptResult.calendar_events && (
                        <div className="card">
                            <h3>Wykryto spotkanie</h3>
                            <div>
                                <p>Temat: {transcriptResult.calendar_events.summary}</p>
                                <p>Data: {formatEventDate(transcriptResult.calendar_events)}</p>
                            </div>
                            {user?.is_google_connected ? (
                                <button onClick={addToCalendar}>Dodaj spotkanie do kalendarza Google</button>
                            ) : (
                                <p>Połącz swoje konto z kontem Google by móc dodać wydarzenie do swojego kalendarza.</p>
                            )}
                        </div>
                    )}
                    {/* sekcja na wyswietlenie podsumowania*/}
                    <div className="card" style={{marginTop: '20px', textAlign: 'left'}}>
                        {}
                        <h3>Wynik podsumowania:</h3>
                        <p><strong>Plik:</strong>{transcriptResult.filename}</p>
                        <div style={{backgroundColor: "#f0f0f0", padding: '15px', borderRadius: '8px'}}>
                            <h4>Podsumowanie wygenerowane przez AI:</h4>
                            <div style={{whiteSpace: 'pre-wrap'}}>
                                {transcriptResult.summary || "Nie wygenerowano podsumowania"}
                            </div>
                        </div>
                    </div>
                </div>
            )
            }
        </div>
    )
}

export default App