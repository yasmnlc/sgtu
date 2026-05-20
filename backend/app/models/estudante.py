import datetime

{
    "nome_completo": str,
    "cpf": str,
    "universidade": str,
    "curso": str,
    "documento_url": str,       # Caminho onde o PDF foi salvo
    "status": "Pendente",       # Começa como pendente para a Secretaria
    "data_envio": datetime,
    "justificativa_recusa": str # Inicialmente vazio
}