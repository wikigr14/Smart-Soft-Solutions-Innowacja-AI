from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from . import database, models, config

AUTH_KEY = config.AUTH_KEY
AUTH_ALGORITHM = config.AUTH_ALGORITHM
ACCESS_TOKEN_EXPIRE_TIME_MINUTES = config.ACCESS_TOKEN_EXPIRE_TIME_MINUTES

# do hashowania hasel
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# do autoryzacji oauth2 (api czeka na token)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def verify_password(plain_password, hashed_password):
    # sprawdza czy podane haslo jest takie samo jak w bazie
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    # zmienia haslo z tekstu na hash
    return pwd_context.hash(password)


def create_access_token(data: dict):
    # generuje czasowy token dla zalogowanego uzytkownika
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_TIME_MINUTES)
    # dodanie daty wygasniecia
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, AUTH_KEY, algorithm=AUTH_ALGORITHM)
    return encoded_jwt


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    # dekoduje token z zadania http, sprawdza waznosc i pobiera dane uzytkownika
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, AUTH_KEY, algorithms=[AUTH_ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user
