from pydantic import BaseModel, Field
from typing import Optional

class UsuarioCriar(BaseModel):
    nome_completo: str
    cpf: str
    email: str
    senha: str
    perfil: str = "estudante"  # Pode ser: estudante, motorista, secretaria

class UsuarioLogin(BaseModel):
    cpf: str
    senha: str
    perfil: str

class UsuarioNoBanco(BaseModel):
    nome_completo: str
    cpf: str
    email: str
    senha_hash: str
    perfil: str
    primeiro_acesso: bool = False 