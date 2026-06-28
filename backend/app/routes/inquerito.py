from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from pydantic import BaseModel

from ..database import get_db
from ..security import obter_usuario_atual

router = APIRouter(
    prefix="/inquerito",
    tags=["Inquérito"]
)

# ============================
# PASSO 4 - Modelo da requisição
# ============================

class NovoInquerito(BaseModel):
    data: str
    tipo: str


# ============================
# PASSO 5 - Primeira rota
# ============================

@router.post("")
async def criar_inquerito(
    dados: NovoInquerito,
    db=Depends(get_db),
    usuario=Depends(obter_usuario_atual)
):

    if usuario["perfil"] != "secretaria":
        raise HTTPException(
            status_code=403,
            detail="Apenas a secretaria pode criar dias especiais."
        )

    colecao = db["inqueritos"]

    existe = colecao.find_one({"data": dados.data})

    if existe:
        raise HTTPException(
            status_code=400,
            detail="Já existe um inquérito para esta data."
        )

    colecao.insert_one({
        "data": dados.data,
        "tipo": dados.tipo,
        "status": "aberto",
        "criado_em": datetime.now()
    })

    return {
        "mensagem": "Dia especial criado com sucesso!"
    }

@router.get("")
async def listar_inqueritos(
    db=Depends(get_db),
    usuario=Depends(obter_usuario_atual)
):

    colecao = db["inqueritos"]

    inqueritos = list(
        colecao.find(
            {},
            {
                "_id": 0
            }
        ).sort("data", 1)
    )

    return inqueritos