import os
import smtplib
import jwt
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pydantic import EmailStr
from fastapi import Depends
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, status

from ..models.usuario import UsuarioCriar, UsuarioLogin, UsuarioNoBanco
from app.database import colecao_usuarios, get_db
from app.security import obter_usuario_atual, gerar_hash_senha, verificar_senha, criar_token_acesso

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY", "sua-chave-secreta-padrao")
ALGORITHM = "HS256"


class SolicitarRecuperacao(BaseModel):
    cpf: str

class RedefinirSenhaInput(BaseModel):
    token: str
    nova_senha: str

class NovaSenha(BaseModel):
    nova_senha: str
    email: str

@router.post("/cadastrar", status_code=status.HTTP_201_CREATED)
async def cadastrar_usuario(usuario: UsuarioCriar):
    if colecao_usuarios.find_one({"cpf": usuario.cpf}):
        raise HTTPException(status_code=400, detail="CPF já cadastrado no sistema.")
    
    senha_criptografada = gerar_hash_senha(usuario.senha)
    
    novo_usuario = UsuarioNoBanco(
        nome_completo=usuario.nome_completo,
        cpf=usuario.cpf,
        email=usuario.email,
        senha_hash=senha_criptografada,
        perfil=usuario.perfil,
        primeiro_acesso=False if usuario.perfil == "estudante" else True
    )
    
    colecao_usuarios.insert_one(novo_usuario.model_dump())
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
    usuario_atual: dict = Depends(obter_usuario_atual),
    db = Depends(get_db)
):
    colecao_usuarios = db["usuarios"]
    senha_criptografada = gerar_hash_senha(dados.nova_senha)
    
    resultado = colecao_usuarios.update_one(
        {"cpf": usuario_atual["cpf"]},
        {"$set": {
            "senha_hash": senha_criptografada, 
            "email": dados.email,
            "primeiro_acesso": False
        }}
    )
    
    if resultado.modified_count == 0:
        raise HTTPException(status_code=400, detail="Não foi possível atualizar a senha.")
        
    return {"mensagem": "Senha atualizada com sucesso!"}


@router.post("/solicitar-recuperacao")
async def solicitar_recuperacao(dados: SolicitarRecuperacao, db = Depends(get_db)):
    colecao_usuarios = db["usuarios"]
    usuario = colecao_usuarios.find_one({"cpf": dados.cpf})
    
    if not usuario:
        return {"mensagem": "Se o CPF estiver cadastrado, um e-mail de recuperação será enviado."}
        
    email_destino = usuario.get("email")
    if not email_destino:
        raise HTTPException(status_code=400, detail="Este utilizador não possui um e-mail de recuperação cadastrado. Contacte a Secretaria.")

    tempo_expiracao = datetime.utcnow() + timedelta(minutes=15)
    token_recuperacao = jwt.encode(
        {"cpf": usuario["cpf"], "exp": tempo_expiracao, "escopo": "recuperacao"}, 
        SECRET_KEY, 
        algorithm=ALGORITHM
    )

    link_recuperacao = f"http://127.0.0.1:5500/frontend/redefinir-senha.html?token={token_recuperacao}"
    
    mensagem = MIMEMultipart()
    mensagem["From"] = os.getenv("SMTP_USERNAME")
    mensagem["To"] = email_destino
    mensagem["Subject"] = "SGTU - Recuperação de Senha"

    corpo_html = f"""
    <html>
        <body style="font-family: sans-serif; color: #333;">
            <h2>Olá, {usuario['nome_completo']}!</h2>
            <p>Recebemos um pedido para redefinir a sua senha no SGTU (Sistema de Gestão de Transporte Universitário).</p>
            <p>Clique no botão abaixo para escolher uma nova senha. Este link é válido por 15 minutos.</p>
            <a href="{link_recuperacao}" style="background-color: #0b0e4f; color: white; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin: 15px 0;">Redefinir Minha Senha</a>
            <p style="font-size: 11px; color: #777;">Se não solicitou esta alteração, pode ignorar este e-mail em segurança.</p>
        </body>
    </html>
    """
    mensagem.attach(MIMEText(corpo_html, "html"))


    try:
        with smtplib.SMTP(os.getenv("SMTP_SERVER"), int(os.getenv("SMTP_PORT"))) as server:
            server.starttls()
            server.login(os.getenv("SMTP_USERNAME"), os.getenv("SMTP_PASSWORD"))
            server.sendmail(os.getenv("SMTP_USERNAME"), email_destino, mensagem.as_string())
    except Exception as e:
        print(f"Erro ao enviar e-mail: {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao tentar enviar o e-mail de recuperação.")

    return {"mensagem": "Se o CPF estiver cadastrado, um e-mail de recuperação será enviado."}


@router.post("/redefinir-senha")
async def redefinir_senha(dados: RedefinirSenhaInput, db = Depends(get_db)):
    try:
        payload = jwt.decode(dados.token, SECRET_KEY, algorithms=[ALGORITHM])
        
        if payload.get("escopo") != "recuperacao":
            raise HTTPException(status_code=400, detail="Token inválido para esta operação.")
            
        cpf_utilizador = payload.get("cpf")
        
        senha_criptografada = gerar_hash_senha(dados.nova_senha)
        
        colecao_usuarios = db["usuarios"]
        resultado = colecao_usuarios.update_one(
            {"cpf": cpf_utilizador},
            {"$set": {"senha_hash": senha_criptografada}}
        )
        
        if resultado.modified_count == 0:
            raise HTTPException(status_code=400, detail="Não foi possível atualizar a senha.")
            
        return {"mensagem": "Senha redefinida com sucesso! Já pode fazer login."}
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="O link de recuperação expirou. Solicite um novo.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Link de recuperação inválido ou corrompido.")