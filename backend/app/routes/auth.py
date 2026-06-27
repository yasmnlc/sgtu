from fastapi import Depends
from app.security import obter_usuario_atual
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, status
from ..models.usuario import UsuarioCriar, UsuarioLogin, UsuarioNoBanco
from app.database import colecao_usuarios
from app.security import gerar_hash_senha, verificar_senha, criar_token_acesso

router = APIRouter()

class NovaSenha(BaseModel):
    nova_senha: str

@router.post("/cadastrar", status_code=status.HTTP_201_CREATED)
async def cadastrar_usuario(usuario: UsuarioCriar):
    if colecao_usuarios.find_one({"cpf": usuario.cpf}):
        raise HTTPException(status_code=400, detail="CPF já cadastrado no sistema.")
    
    senha_criptografada = gerar_hash_senha(usuario.senha)
    
    novo_usuario = UsuarioNoBanco(
        nome_completo=usuario.nome_completo,
        cpf=usuario.cpf,
        senha_hash=senha_criptografada,
        perfil=usuario.perfil,
        primeiro_acesso=False if usuario.perfil == "estudante" else True
    )
    
    colecao_usuarios.insert_one(novo_usuario.dict())
    return {"mensagem": f"Conta criada com sucesso para {usuario.nome_completo}!"}

@router.post("/login")
async def login(credenciais: UsuarioLogin):
    usuario_db = colecao_usuarios.find_one({"cpf": credenciais.cpf})
    
    if not usuario_db or not verificar_senha(credenciais.senha, usuario_db["senha_hash"]) or usuario_db["perfil"] != credenciais.perfil:
        raise HTTPException(status_code=401, detail="Credenciais ou perfil inválidos.")
    
    token = criar_token_acesso(dados={"cpf": usuario_db["cpf"], "perfil": usuario_db["perfil"]})
    
    return {
        "mensagem": "Login bem-sucedido",
        "token_acesso": token,
        "perfil": usuario_db["perfil"],
        "primeiro_acesso": usuario_db["primeiro_acesso"],
        "nome": usuario_db["nome_completo"]
    }

@router.patch("/atualizar-senha")
async def atualizar_senha_primeiro_acesso(
    dados: NovaSenha,
    usuario_atual: dict = Depends(obter_usuario_atual)
):
    senha_criptografada = gerar_hash_senha(dados.nova_senha)
    
    resultado = colecao_usuarios.update_one(
        {"cpf": usuario_atual["cpf"]},
        {"$set": {
            "senha_hash": senha_criptografada, 
            "primeiro_acesso": False
        }}
    )
    
    if resultado.modified_count == 0:
        raise HTTPException(status_code=400, detail="Não foi possível atualizar a senha.")
        
    return {"mensagem": "Senha atualizada com sucesso!"}