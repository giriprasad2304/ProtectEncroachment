"""App configuration: loads environment variables from .env file."""
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL          = os.getenv("DATABASE_URL", "sqlite:///./bhoomi_rakshak.db")
OLLAMA_BASE_URL       = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL          = os.getenv("OLLAMA_MODEL", "qwen2-vl")
SENTINEL_HUB_CLIENT_ID     = os.getenv("SENTINEL_HUB_CLIENT_ID", "")
SENTINEL_HUB_CLIENT_SECRET = os.getenv("SENTINEL_HUB_CLIENT_SECRET", "")
