import os
import shutil
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from pymongo.errors import DuplicateKeyError
from ..database import get_db

router = APIRouter()

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/cadastro")
async def cadastrar_estudante(
    nome_completo: str = Form(...),
    cpf: str = Form(...), 
    universidade: str = Form(...),
    curso: str = Form(...),
    arquivo: UploadFile = File(...),
    db = Depends(get_db)
):

    # Validação do CPF: Remove caracteres não numéricos e verifica se tem 11 dígitos
    cpf_limpo = "".join(filter(str.isdigit, cpf))
    
    if len(cpf_limpo) != 11:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O CPF deve conter exatamente 11 dígitos numéricos."
        )

    # Restringe tipo de arquivo para APENAS .PDF
    extensao = os.path.splitext(arquivo.filename)[1].lower()
    
    if extensao != ".pdf" or arquivo.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipo de arquivo inválido. Apenas documentos em formato .PDF são permitidos."
        )

    # Fluxo de Salvamento
    caminho_arquivo = os.path.join(UPLOAD_DIR, f"{cpf_limpo}_{arquivo.filename}")
    with open(caminho_arquivo, "wb") as buffer:
        shutil.copyfileobj(arquivo.file, buffer)

    novo_estudante = {
        "nome_completo": nome_completo,
        "cpf": cpf_limpo,
        "universidade": universidade,
        "curso": curso,
        "documento_url": caminho_arquivo,
        "status": "Pendente",
        "data_envio": datetime.now(),
        "justificativa_recusa": ""
    }

    # Tratamento de Duplicidade: O CPF é único, então se já existir um cadastro com o mesmo CPF, o MongoDB lançará uma exceção de chave duplicada
    try:
        colecao = db["estudantes"]
        colecao.insert_one(novo_estudante)

        with open(caminho_arquivo, "wb") as buffer:
            shutil.copyfileobj(arquivo.file, buffer)
            
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este CPF já possui um cadastro em andamento no sistema."
        )

    return {"status": "Sucesso", "mensagem": "Cadastro e declaração em PDF recebidos com sucesso!"}