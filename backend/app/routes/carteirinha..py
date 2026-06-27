from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pymongo import MongoClient
from bson import ObjectId
from reportlab.pdfgen import canvas


router = APIRouter()
@router.get("/teste")
def teste():
    return {"mensagem": "rota carteirinha funcionando"}

client = MongoClient("mongodb://localhost:27017")

db = client["sgtu"]

estudantes = db["alunos"]


@router.get("/gerar-carteirinha/{id_aluno}")
def gerar_carteirinha(id_aluno: str):

    try:
        estudante = estudantes.find_one({
            "_id": ObjectId(id_aluno)
        })

    except:
        raise HTTPException(
            status_code=400,
            detail="ID inválido"
        )


    if not estudante:
        raise HTTPException(
            status_code=404,
            detail="Aluno não encontrado"
        )


    arquivo = "carteirinha.pdf"


    pdf = canvas.Canvas(arquivo)


    pdf.drawString(
        100,
        750,
        "Carteirinha SGTU"
    )


    pdf.drawString(
        100,
        700,
        f"Nome: {estudante['nome_completo']}"
    )


    pdf.drawString(
        100,
        670,
        f"Curso: {estudante['curso']}"
    )


    pdf.drawString(
        100,
        640,
        f"CPF: {estudante['cpf']}"
    )


    pdf.save()


    return FileResponse(
        arquivo,
        media_type="application/pdf",
        filename="carteirinha.pdf"
    )