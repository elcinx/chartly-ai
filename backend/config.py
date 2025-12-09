
import os
import pathlib
from dotenv import load_dotenv

# Force load .env from the same directory as this config file
# This ensures consistency regardless of where the script is run from
env_path = pathlib.Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

# One-time debug log on import
if GEMINI_API_KEY:
    masked_key = f"{GEMINI_API_KEY[:6]}...{GEMINI_API_KEY[-4:]}" if len(GEMINI_API_KEY) > 10 else "***"
    print(f"[CONFIG] GEMINI_API_KEY loaded: {masked_key}")
else:
    print("[CONFIG] GEMINI_API_KEY NOT FOUND in environment!")
