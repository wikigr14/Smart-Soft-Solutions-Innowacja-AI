from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from . import config
import json

# zakres uprawnien kalendarza (mozliwosc edycji)
SCOPES = ['https://www.googleapis.com/auth/calendar.events']


def get_auth_url():
    # generuje link w ktory musi kliknac uzytkownik by sie zalogowac.
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": config.GOOGLE_CLIENT_ID,
                "client_secret": config.GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=SCOPES,
        redirect_uri=config.GOOGLE_REDIRECT_URI
    )
    auth_url, _ = flow.authorization_url(prompt="consent")
    return auth_url


def get_credentials(code: str):
    # daje stale tokeny dostepu
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": config.GOOGLE_CLIENT_ID,
                "client_secret": config.GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=SCOPES,
        redirect_uri=config.GOOGLE_REDIRECT_URI
    )
    flow.fetch_token(code=code)
    return flow.credentials


def create_calendar_event(cred_json: dict, event_data: dict):
    # glowna funkcja, tworzy wydarzenie w kalendarzu uzytkownika
    try:
        cred = Credentials.from_authorized_user_info(cred_json, SCOPES)
        service = build('calendar', 'v3', credentials=cred)
        event = {
            'summary': event_data.get('summary', 'Spotkanie z transkrypcji'),
            'description': event_data.get('description', 'Opis wygenerowany przez AI'),
            'start': {
                'dateTime': event_data['start_time'],  # format to 'YYYY-MM-DDTHH:MiMi:SS'
                'timeZone': 'Europe/Warsaw',
            },
            'end': {
                'dateTime': event_data['end_time'],
                'timeZone': 'Europe/Warsaw',
            },
        }
        event_final = service.events().insert(calendarId='primary', body=event).execute()
        return event_final.get('htmlLink')
    except Exception as e:
        print(f"Błąd usługi Google Calendar: {e}")
        return None
