from fastapi import APIRouter
from app.database import dias_especiais

router = APIRouter()


@router.get("/secretaria/dias-especiais")
def listar_dias_especiais():

    dias = list(
        dias_especiais.find({}, {"_id": 0})
    )

    return {
        "dias_especiais": dias
    }