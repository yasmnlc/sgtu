from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor

from app.security import obter_usuario_atual, obter_usuario_para_pdf
from app.database import get_db



router = APIRouter()


@router.get("/teste")
def teste():
    return {
        "mensagem": "rota carteirinha funcionando"
    }


@router.get("/gerar-carteirinha")
def gerar_carteirinha(
    usuario_atual: dict = Depends(obter_usuario_para_pdf),
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


# Configuração do Canvas
    pdf = canvas.Canvas(arquivo)
    pdf.setTitle(f"Carteirinha SGTU - {estudante['nome_completo']}")

    # --- DEFINIÇÃO DE CORES ---
    cor_primaria = HexColor("#005b96")
    cor_texto = HexColor("#333333")
    cor_fundo = HexColor("#f4f6f8")

    # --- ESTRUTURA DO CARTÃO ---
    x_inicial = 50
    y_inicial = 550
    largura = 500
    altura = 250

    # Desenhar o fundo do cartão 
    pdf.setFillColor(cor_fundo)
    pdf.setStrokeColor(cor_primaria)
    pdf.setLineWidth(2)
    pdf.rect(x_inicial, y_inicial, largura, altura, fill=True, stroke=True)

    # Desenhar o Cabeçalho (Faixa Azul)
    pdf.setFillColor(cor_primaria)
    pdf.rect(x_inicial, y_inicial + 190, largura, 60, fill=True, stroke=False)

    # --- TIPOGRAFIA E TEXTOS ---
    
    # Título no Cabeçalho (Texto Branco)
    pdf.setFillColor(HexColor("#ffffff"))
    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawString(x_inicial + 20, y_inicial + 215, "SGTU - SISTEMA DE GESTÃO DE TRANSPORTE")

    # Dados do Estudante
    pdf.setFillColor(cor_texto)
    linha_y = y_inicial + 140
    espacamento = 35

    # Nome
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(x_inicial + 20, linha_y, "NOME:")
    pdf.setFont("Helvetica", 12)
    pdf.drawString(x_inicial + 70, linha_y, estudante['nome_completo'].upper())

    # Curso
    linha_y -= espacamento
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(x_inicial + 20, linha_y, "CURSO:")
    pdf.setFont("Helvetica", 12)
    pdf.drawString(x_inicial + 75, linha_y, estudante['curso'].upper())

    # CPF
    linha_y -= espacamento
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(x_inicial + 20, linha_y, "CPF:")
    pdf.setFont("Helvetica", 12)
    pdf.drawString(x_inicial + 55, linha_y, estudante['cpf'])

    # Status (Marca d'água ou Destaque)
    pdf.setFillColor(HexColor("#28a745"))
    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(x_inicial + 20, y_inicial + 20, "VÍNCULO ATIVO E AUTORIZADO")

    pdf.save()


    return FileResponse(
        arquivo,
        media_type="application/pdf",
        filename="carteirinha.pdf"
    )