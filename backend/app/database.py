import os
from pymongo import MongoClient, ASCENDING
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

client = MongoClient(MONGO_URI)
db = client.get_database()

db["estudantes"].create_index([("cpf", ASCENDING)], unique=True)

def get_db():
    return db