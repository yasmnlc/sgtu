from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from reportlab.pdfgen import canvas

from app.security import obter_usuario_atual
from app.database import get_db


router = APIRouter()


@router.get("/teste")
def teste():
    return {
        "mensagem": "rota carteirinha funcionando"
    }


@router.get("/gerar-carteirinha")
def gerar_carteirinha(
    usuario_atual: dict = Depends(obter_usuario_atual),
    db = Depends(get_db)
):

    cpf = usuario_atual["cpf"]


    estudante = db["estudantes"].find_one({
        "cpf": cpf
    })


    if not estudante:
        raise HTTPException(
            status_code=404,
            detail="Cadastro de estudante não encontrado."
        )


    if estudante["status"] != "Autorizado":
        raise HTTPException(
            status_code=403,
            detail="Sua matrícula ainda não foi aprovada."
        )


    arquivo = f"carteirinha_{cpf}.pdf"


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