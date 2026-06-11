import os
import shutil
from bson import ObjectId
from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from pymongo.errors import DuplicateKeyError

from ..database import get_db


router = APIRouter()

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)


class AtualizacaoStatus(BaseModel):
    status: str 
    justificativa_recusa: str = ""

@router.patch("/estudantes/{estudante_id}/status")
async def atualizar_status_estudante(
    estudante_id: str, 
    dados: AtualizacaoStatus, 
    db = Depends(get_db)
):
    """Rota para a Secretaria aprovar ou recusar a matrícula de um estudante"""
    colecao = db["estudantes"]
    
    if dados.status not in ["Autorizado", "Recusado"]:
        raise HTTPException(
            status_code=400, 
            detail="Status inválido. Use 'Autorizado' ou 'Recusado'."
        )
    
    resultado = colecao.update_one(
        {"_id": ObjectId(estudante_id)},
        {"$set": {
            "status": dados.status,
            "justificativa_recusa": dados.justificativa_recusa,
            "data_auditoria": datetime.now()
        }}
    )
    
    if resultado.matched_count == 0:
        raise HTTPException(status_code=404, detail="Estudante não encontrado.")
        
    return {"status": "Sucesso", "mensagem": f"O estudante foi {dados.status} com sucesso!"}


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


@router.get("/pendencias")
async def listar_pendencias(db = Depends(get_db)):
    """Rota para a Secretaria listar todos os alunos com cadastro pendente"""
    colecao = db["estudantes"]
    
    # Busca apenas os registros onde o status é 'Pendente' e ordena por data de envio (do mais antigo para o mais recente)
    estudantes_pendentes = list(colecao.find({"status": "Pendente"}).sort("data_envio", 1))
    
    resposta = []
    for estudante in estudantes_pendentes:
        resposta.append({
            "id": str(estudante["_id"]), 
            "nome_completo": estudante["nome_completo"],
            "cpf": estudante["cpf"],
            "universidade": estudante["universidade"],
            "curso": estudante["curso"],
            "data_envio": estudante["data_envio"].strftime("%d/%m/%Y") # Formata a data para o BR
        })
        
    return resposta