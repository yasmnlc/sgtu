import os
import shutil
from bson import ObjectId
from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.security import obter_usuario_atual
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
    db = Depends(get_db),
    usuario_atual: dict = Depends(obter_usuario_atual)
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
    db = Depends(get_db),
    usuario_atual: dict = Depends(obter_usuario_atual)
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

    # Tratamento de Duplicidade
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
async def listar_pendencias(
    usuario_atual: dict = Depends(obter_usuario_atual),
    db = Depends(get_db)
):
    """Rota para a Secretaria listar todos os alunos com cadastro pendente"""
    colecao = db["estudantes"]
    
    estudantes_pendentes = list(colecao.find({"status": "Pendente"}).sort("data_envio", 1))
    
    resposta = []
    for estudante in estudantes_pendentes:
        nome_arquivo = os.path.basename(estudante["documento_url"])

        resposta.append({
            "id": str(estudante["_id"]), 
            "nome_completo": estudante["nome_completo"],
            "cpf": estudante["cpf"],
            "universidade": estudante["universidade"],
            "curso": estudante["curso"],
            "data_envio": estudante["data_envio"].strftime("%d/%m/%Y"),
            "documento_nome": nome_arquivo
        })
        
    return resposta


@router.get("/autorizados")
async def listar_autorizados(
    usuario_atual: dict = Depends(obter_usuario_atual),
    db = Depends(get_db)
):
    """Rota para o Motorista listar apenas os alunos que foram aprovados pela Secretaria"""
    colecao = db["estudantes"]
    
    estudantes_autorizados = list(colecao.find({"status": "Autorizado"}).sort("nome_completo", 1))
    
    resposta = []
    for estudante in estudantes_autorizados:
        resposta.append({
            "id": str(estudante["_id"]),
            "nome_completo": estudante["nome_completo"],
            "universidade": estudante["universidade"],
            "curso": estudante["curso"]
        })
        
    return resposta


@router.get("/secretaria/dashboard")
async def obter_dados_dashboard(
    db = Depends(get_db),
    usuario_atual: dict = Depends(obter_usuario_atual)
):
    """Rota para puxar os indicadores e dados dos gráficos da Visão Geral"""
    colecao = db["estudantes"]
    
    total_cadastrados = colecao.count_documents({})
    pendentes = colecao.count_documents({"status": "Pendente"})
    autorizados = colecao.count_documents({"status": "Autorizado"})
    
    pipeline = [
        {"$group": {"_id": "$universidade", "quantidade": {"$sum": 1}}}
    ]
    resultado_busca = list(colecao.aggregate(pipeline))
    
    por_universidade = {}
    for item in resultado_busca:
        if item["_id"]:
            por_universidade[item["_id"]] = item["quantidade"]
            
    return {
        "total_cadastrados": total_cadastrados,
        "pendentes": pendentes,
        "autorizados": autorizados,
        "por_universidade": por_universidade
    }