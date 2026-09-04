#!/usr/bin/env bash
set -e

echo "========================================================"
echo " 🛡️  Bhoomi-Rakshak On-Prem Agentic AI Deployment"
echo "========================================================"

echo "[1/4] Launching Docker Compose containers..."
docker compose up -d --build

echo "[2/4] Waiting for Ollama local service to initialize..."
until curl -s http://localhost:11434/api/tags > /dev/null; do
    echo "      Waiting for Ollama API at http://localhost:11434..."
    sleep 3
done
echo "✓ Ollama service is active!"

echo "[3/4] Checking local Ollama multimodal vision model..."
if docker compose exec ollama ollama list | grep -q "llava\|qwen"; then
    echo "✓ Multimodal model is ready in Ollama!"
else
    echo "📥 Pulling vision model into Ollama container..."
    docker compose exec ollama ollama pull llava || true
fi

echo "========================================================"
echo " 🎉 Bhoomi-Rakshak is fully operational!"
echo " 🌐 Frontend Dashboard: http://localhost"
echo " ⚙️  FastAPI Backend API: http://localhost:8000"
echo " 🤖 Local Ollama LLM:   http://localhost:11434"
echo "========================================================"
