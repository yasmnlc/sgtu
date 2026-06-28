import os
from pymongo import MongoClient, ASCENDING
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

client = MongoClient(MONGO_URI)
db = client["sgtu_db"]

colecao_estudantes = db["estudantes"]
colecao_usuarios = db["usuarios"]

colecao_estudantes.create_index([("cpf", ASCENDING)], unique=True)
colecao_usuarios.create_index([("cpf", ASCENDING)], unique=True)

def get_db():
    try:
        yield db
    finally:
        pass