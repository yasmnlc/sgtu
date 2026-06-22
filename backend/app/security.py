import os
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import bcrypt
import jwt
from datetime import datetime, timedelta

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "chave_padrao_secreta")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def obter_usuario_atual(token: str = Depends(oauth2_scheme)):
    credenciais_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais. Faça login novamente.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        cpf: str = payload.get("cpf")
        perfil: str = payload.get("perfil")
        
        if cpf is None:
            raise credenciais_exception
            
        return {"cpf": cpf, "perfil": perfil}
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sessão expirada. Faça login novamente.")
    except jwt.InvalidTokenError:
        raise credenciais_exception

def gerar_hash_senha(senha: str) -> str:
    # O bcrypt exige que a senha seja convertida para bytes (encode)
    salt = bcrypt.gensalt()
    senha_criptografada = bcrypt.hashpw(senha.encode('utf-8'), salt)
    # Retornamos como texto normal (decode) para o MongoDB conseguir salvar
    return senha_criptografada.decode('utf-8')

def verificar_senha(senha_plana: str, senha_hash: str) -> bool:
    # Converte ambas para bytes e verifica se batem
    return bcrypt.checkpw(senha_plana.encode('utf-8'), senha_hash.encode('utf-8'))

def criar_token_acesso(dados: dict):
    to_encode = dados.copy()
    expiracao = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expiracao})
    
    token_codificado = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return token_codificado