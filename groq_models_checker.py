from groq import Groq
import os
from dotenv import load_dotenv
import pathlib 
BASE_DIR = pathlib.Path(__file__).resolve().parent
ENV = BASE_DIR / ".env"
load_dotenv(ENV)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

models = client.models.list()

for model in models.data:
    print(model.id)