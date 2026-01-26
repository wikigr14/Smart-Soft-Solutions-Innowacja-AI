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

    // Historia i Powiadomienia
    const [history, setHistory] = useState([]) //historia
    const [notification, setNotification] = useState(null) //komunikaty

    //wyświetlanie powiadomień zamiast alertów
    const showNotification = (message, type = 'error') => {
        setNotification({ message, type })
        setTimeout(() => {
            setNotification(null)
        }, 5000)
    }

    //komponenty banera
    const NotificationBanner = () => {
        if (!notification) return null;
        const isSuccess = notification.type === 'success';
        const style = {
            padding: '15px', marginBottom: '20px', borderRadius: '8px', textAlign: 'center', fontWeight: '600',
            backgroundColor: isSuccess ? 'var(--success-bg)' : 'var(--error-bg)',
            color: isSuccess ? 'var(--success-text)' : 'var(--error-text)',
            border: `1px solid ${isSuccess ? '#a7f3d0' : '#fecaca'}`, animation: 'fadeIn 0.3s ease'
        };
        return <div style={style}>{notification.message}</div>
    }

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

    // Funkcja pobierania historii
    const fetchHistory = async () => {
        try {
            const res = await fetch(`${API_URL}/transcripts`, {
                headers: {"Authorization": `Bearer ${token}`}
            })
            if (res.ok) {
                const data = await res.json()
                const sorted = Array.isArray(data) ? data.reverse() : [] 
                setHistory(sorted)
            }
        } catch (e) {
            console.error("Błąd pobierania historii:", e)
        }
    }

    // Funkcja usuwania
    const handleDelete = async (id, e) => {
        e.stopPropagation() 
        if (!window.confirm("Czy na pewno chcesz usunąć ten zapis?")) return

        try {
            const res = await fetch(`${API_URL}/transcripts/${id}`, {
                method: "DELETE",
                headers: {"Authorization": `Bearer ${token}`}
            })
            if (res.ok) {
                showNotification("Usunięto pomyślnie", "success")
                fetchHistory() 
                if (transcriptResult?.id === id) {
                    setTranscriptResult(null) 
                }
            } else {
                showNotification("Nie udało się usunąć", "error")
            }
        } catch (e) {
            console.error(e)
            showNotification("Błąd połączenia", "error")
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
                showNotification("Pomyślnie połączono konto Google.", "success")
                //czysczenie linku
                window.history.replaceState({}, document.title, "/")
                //odswiezanie danych usera
                fetchUserData()
            }
        } catch (e) {
            console.error(e)
            showNotification("Błąd podczas łączenia z kontem Google.", "error")
        }
    }

    //obsluga wylogowania
    const logout = () => {
        localStorage.removeItem("token")
        setToken(null)
        setUser(null)
        setTranscriptResult(null)
        setHistory([])
        setNotification(null) 
    }

    //obsluga logowania i rejestracji
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
                    showNotification("Konto utworzone pomyślnie.", "success")
                }
            } else {
                showNotification(`Błąd: ${data.detail}`, "error")
            }
        } catch (err) {
            console.error(err)
            showNotification("Błąd połączenia z serwerem", "error")
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
            showNotification("Nie udało się przełączyć na stronę logowania Google", "error")
        }
    }

    // Obsługa konkretnego eventu
    const addToCalendar = async (eventData) => {
        //wysyla zadanie utworzenia wydarzenia w kalendarzu
        const targetEvent = eventData || transcriptResult.calendar_events;

        if (!transcriptResult || !transcriptResult.id || !targetEvent) {
            return;
        }
        try {
            const res = await fetch(`${API_URL}/transcripts/${transcriptResult.id}/create_event`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json", 
                    "Authorization": `Bearer ${token}`
                },
                // Wysyłamy konkretny obiekt w body
                body: JSON.stringify(targetEvent)
            })
            const data = await res.json()
            if (res.ok) {
                showNotification("Dodano wydarzenie do kalendarza", "success")
                // jesli da sie dodac wydarzenie to otwieramy kalendarz w nowej karcie
                if(data.link) window.open(data.link, '_blank')
            } else {
                showNotification(`Błąd: ${data.detail || "Nie udało się dodać wydarzenia"}`, "error")
            }
        } catch (e) {
            console.error(e)
            showNotification("Błąd połączenia", "error")
        }
    }

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
                setTranscriptResult(data)//zapis odpowiedzi z backendu
                setAppStatus("Plik przetworzony pomyślnie!")
                setSelectedFile(null)
                // Czyszczenie inputu
                document.querySelector('input[type="file"]').value = ""
                fetchHistory() // Odśwież historię po uploadzie
            } else {
                const errorData = await response.json().catch(() => ({}));
                setAppStatus(`Błąd serwera (${response.status}): ${errorData.detail || response.statusText}`);
            }
        } catch (error) {
            console.error("Błąd połączenia:", error)
            setAppStatus(`Błąd połączenia z backendem`)
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
            <div className="app-root-container" style={{justifyContent: 'center', minHeight: '80vh'}}>
                <h1>AI Transcriber</h1>
                <div className="card" style={{maxWidth: '400px', margin: '0 auto', width: '100%'}}>
                    <h2>{authMode === "login" ? "Witaj ponownie" : "Utwórz konto"}</h2>
                    <p className="subtitle" style={{marginBottom: '20px'}}>
                        {authMode === "login" ? "Zaloguj się, aby kontynuować" : "Zarejestruj się, aby korzystać z aplikacji"}
                    </p>
                    
                    <NotificationBanner />

                    <form onSubmit={handleAuth} style={{display: 'flex', flexDirection: 'column', width: '100%'}}>
                        <input type="email" placeholder="Adres e-mail" value={email}
                               onChange={(e) => setEmail(e.target.value)} required/>
                        <input type="password" placeholder="Hasło" value={password}
                               onChange={(e) => setPassword(e.target.value)} required/>
                        <button type="submit" style={{marginTop: '10px'}}>
                            {authMode === "login" ? "Zaloguj się" : "Zarejestruj się"}
                        </button>
                    </form>
                    <p style={{marginTop: '20px', fontSize: '0.9rem'}}>
                        {authMode === "login" ? "Nie masz konta?" : "Masz już konto?"}
                        <span onClick={() => {
                            setAuthMode(authMode === "login" ? "register" : "login")
                            setNotification(null)
                        }}>
                            {authMode === "login" ? "Zarejestruj się" : "Zaloguj się"}
                        </span>
                    </p>
                </div>
            </div>
        )
    }

    //glowna apka po logowaniu
    return (
        <div className="app-root-container">
            <header>
                <h1>AI Transcriber</h1>
                <div>
                    <div>{user?.email}</div>
                    <button onClick={logout} style={{backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db', padding: '8px 16px'}}>
                        Wyloguj
                    </button>
                </div>
            </header>
            
            <NotificationBanner />

            {/*Status Google*/}
            {user && !user.is_google_connected && (
                <div className="card" style={{borderLeft: '4px solid #f59e0b'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '10px'}}>
                        <div>
                            <h3 style={{border: 'none', padding: 0, margin: 0}}>Integracja z Google</h3>
                            <p style={{margin: '5px 0 0 0', color: '#6b7280'}}>Połącz konto, aby automatycznie dodawać wydarzenia do kalendarza.</p>
                        </div>
                        <button onClick={handleGoogleLinkClick}>Połącz z Google</button>
                    </div>
                </div>
            )}

            {/*Upload*/}
            <div className="card">
                <h3>Nowa transkrypcja</h3>
                <p className="subtitle" style={{textAlign: 'left', width: '100%'}}>
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

            {/*wynik transkrypcji*/}
            {transcriptResult && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.5s'}}>
                    
                    {/*sekcja spotkań*/}
                    {transcriptResult.calendar_events && (
                        <div className="meetings-section">
                            <h3 style={{marginBottom: '15px', color: '#374151', textAlign: 'left'}}>
                                Znalezione spotkania
                            </h3>
                            
                            {/*nagłówek tabeli*/}
                            <div className="meetings-header">
                                <div style={{flex: 1}}>DATA</div>
                                <div style={{flex: 1, paddingLeft: '15px'}}>TEMAT</div>
                                <div style={{flex: 1, textAlign: 'right'}}>DODAJ DO KALENDZRZA</div>
                            </div>

                            {/*lista spotkań*/}
                            <div className="meetings-list">
                                {/*mapowanie niezależnie czy to tablica czy pojedynczy obiekt*/}
                                {(Array.isArray(transcriptResult.calendar_events) 
                                    ? transcriptResult.calendar_events 
                                    : [transcriptResult.calendar_events]
                                ).map((evt, index) => (
                                    <div className="meeting-row" key={index}>
                                        {/*data*/}
                                        <div className="col-date">
                                            {formatEventDate(evt)}
                                        </div>

                                        {/*temat*/}
                                        <div className="col-topic">
                                            {evt.summary || "Brak tematu"}
                                        </div>

                                        {/*przycisk*/}
                                        <div className="col-action">
                                            {user?.is_google_connected ? (
                                                <button 
                                                    onClick={() => addToCalendar(evt)} 
                                                    className="btn-accept"
                                                >
                                                    Dodaj do kalendarza
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={handleGoogleLinkClick}
                                                    style={{backgroundColor: '#f59e0b', color: 'white', fontSize: '0.85rem', padding: '8px 12px'}}
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
                            onClick={() => setTranscriptResult(null)}
                        >
                            Zamknij podgląd
                        </button>
                    </div>
                </div>
            )}

            {/* Historia Transkrypcji */}
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
                                    <th style={{textAlign: 'right'}}>Akcje</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.filename || `Transkrypcja #${item.id}`}</td>
                                        <td>
                                            {item.calendar_events ? (
                                                <span style={{color: '#059669', fontWeight: '500'}}>
                                                    {Array.isArray(item.calendar_events) 
                                                        ? `Znaleziono: ${item.calendar_events.length}` 
                                                        : item.calendar_events.summary}
                                                </span>
                                            ) : (
                                                <span style={{color: '#9ca3af'}}>Brak wydarzeń</span>
                                            )}
                                        </td>
                                        <td style={{textAlign: 'right'}}>
                                            <div className="action-buttons" style={{justifyContent: 'flex-end'}}>
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
        </div>
    )
}

export default App