import os
import google.generativeai as genai
from dotenv import load_dotenv
import pathlib

# Load env
env_path = pathlib.Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

api_key = os.environ.get("GEMINI_API_KEY")

if not api_key:
    print("NO API KEY FOUND")
    exit(1)

genai.configure(api_key=api_key)

print("--- WRITING MODELS TO FILE ---")
try:
    with open("models_clean.txt", "w", encoding="utf-8") as f:
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                f.write(f"{m.name}\n")
    print("Done.")
except Exception as e:
    print(f"Error listing models: {e}")
