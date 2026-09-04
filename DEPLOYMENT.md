# Bhoomi-Rakshak 🛡️ — Production & On-Premise Deployment Guide

This document provides a complete, step-by-step deployment guide for **Bhoomi-Rakshak**. It covers cloud servers (AWS, GCP, Azure, DigitalOcean), on-premise government servers, air-gapped offline environments, and managed cloud platforms.

---

## 📑 Table of Contents
1. [Architecture Overview & Ports](#1-architecture-overview--ports)
2. [Prerequisites](#2-prerequisites)
3. [Method A: Cloud Server Deployment (AWS / GCP / Azure / DigitalOcean)](#3-method-a-cloud-server-deployment-aws--gcp--azure--digitalocean)
4. [Method B: Local / Development Machine Deployment](#4-method-b-local--development-machine-deployment)
5. [Method C: 100% Air-Gapped / Offline Government Server](#5-method-c-100-air-gapped--offline-government-server)
6. [Method D: Managed PaaS Deployment (Render / Railway)](#6-method-d-managed-paas-deployment-render--railway)
7. [Environment Configuration & API Keys](#7-environment-configuration--api-keys)
8. [Production Maintenance, Logs & Backups](#8-production-maintenance-logs--backups)

---

## 1. Architecture Overview & Ports

Bhoomi-Rakshak runs 3 unified microservices orchestrated via Docker Compose:

| Service | Container Name | Internal Port | Host Port | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | `bhoomi_frontend` | `80` | `80` | Nginx + React GIS Map, Comparison Slider, Dossier UI |
| **Backend** | `bhoomi_backend` | `8000` | `8000` | FastAPI, LangGraph AI Graph, OpenCV, Shapely GIS Engine |
| **Ollama** | `bhoomi_ollama` | `11434` | `11434` | On-premise local multimodal vision model (`qwen2-vl`) |

---

## 2. Prerequisites

- **Operating System**: Ubuntu 22.04 LTS / 24.04 LTS, Debian 12, RHEL 9, macOS, or Windows (WSL2).
- **Hardware Recommended**:
  - Minimum: 2 vCPU, 4 GB RAM, 20 GB Disk
  - Recommended (with local LLM): 4 vCPU, 8–16 GB RAM (or NVIDIA GPU with CUDA for faster LLM inference).
- **Software**:
  - Docker Engine >= 24.0
  - Docker Compose >= v2.20
  - Git

---

## 3. Method A: Cloud Server Deployment (AWS / GCP / Azure / DigitalOcean)

### Step 1: Provision your Cloud Virtual Machine
Create an **Ubuntu 22.04 LTS** instance (e.g. AWS EC2 `t3.large`, GCP `e2-standard-4`, or DigitalOcean Droplet with 8GB RAM).

**Open Inbound Firewall Ports (Security Group)**:
- `22` (SSH)
- `80` (HTTP)
- `443` (HTTPS - optional for SSL)
- `8000` (FastAPI REST API)

---

### Step 2: Connect to your Server & Install Docker
```bash
# SSH into your VM
ssh -i your-key.pem ubuntu@YOUR_SERVER_PUBLIC_IP

# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add current user to Docker group (avoids needing sudo for docker commands)
sudo usermod -aG docker $USER
newgrp docker

# Verify Docker installation
docker --version
docker compose version
```

---

### Step 3: Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/bhoomi-rakshak.git
cd bhoomi-rakshak
```

---

### Step 4: Configure Environment Variables
```bash
# Copy template
cp backend/.env.example backend/.env

# Edit configuration (optional)
nano backend/.env
```
*(Note: Sentinel Hub credentials are optional. If not set, Bhoomi-Rakshak automatically uses the high-resolution dynamic satellite imagery engine).*

---

### Step 5: Launch the Application
Run the automated startup script:
```bash
chmod +x start.sh
./start.sh
```

Or run Docker Compose directly in detached mode:
```bash
docker compose up -d --build
```

---

### Step 6: Verify Deployment
Check running containers:
```bash
docker compose ps
```
You should see:
```text
NAME              IMAGE                     STATUS          PORTS
bhoomi_backend    bhoomi-rakshak-backend    Up              0.0.0.0:8000->8000/tcp
bhoomi_frontend   bhoomi-rakshak-frontend   Up              0.0.0.0:80->80/tcp
bhoomi_ollama     ollama/ollama:latest      Up              0.0.0.0:11434->11434/tcp
```

**Access Your System**:
- 🌐 **Frontend UI**: `http://YOUR_SERVER_PUBLIC_IP`
- ⚙️ **FastAPI Docs**: `http://YOUR_SERVER_PUBLIC_IP:8000/docs`

---

### Step 7: Setup Domain Name & HTTPS / SSL (Optional)
If you have a domain name (e.g. `bhoomi.yourdomain.com`):

1. Point your domain's **A Record** in DNS to `YOUR_SERVER_PUBLIC_IP`.
2. Install Certbot and Nginx reverse proxy:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d bhoomi.yourdomain.com
```

---

## 4. Method B: Local / Development Machine Deployment

To run Bhoomi-Rakshak on your local machine (Mac / Linux / Windows WSL2):

```bash
# 1. Navigate to the project root
cd /path/to/bhoomi-rakshak

# 2. Start all services
chmod +x start.sh
./start.sh
```

Open your browser at:
- Dashboard: [http://localhost](http://localhost)
- API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 5. Method C: 100% Air-Gapped / Offline Government Server

For high-security government facilities with **zero internet connectivity**:

### Phase 1: Preparation on an Internet-Connected Machine
```bash
# 1. Build and run locally once to download dependencies & model weights
./start.sh

# 2. Export all built Docker images into a single portable TAR archive
docker save \
  bhoomi-rakshak-frontend:latest \
  bhoomi-rakshak-backend:latest \
  ollama/ollama:latest \
  -o bhoomi_offline_bundle.tar

# 3. Copy bhoomi_offline_bundle.tar and the repository code to a USB Drive
```

### Phase 2: Deployment on the Air-Gapped Server
```bash
# 1. Copy files from USB to target server
cd /opt/bhoomi-rakshak

# 2. Load the Docker images
docker load -i bhoomi_offline_bundle.tar

# 3. Start containers in air-gapped mode
docker compose up -d
```
All GIS satellite analysis, difference calculations, boundary checks, and reports will execute 100% locally on-device.

---

## 6. Method D: Managed PaaS Deployment (Render / Railway)

### Backend Deployment (FastAPI)
1. Go to [Render](https://render.com) or [Railway](https://railway.app).
2. Click **New +** -> **Web Service**.
3. Select your GitHub repository.
4. Set **Root Directory**: `backend`
5. Select **Environment**: `Docker`
6. Add Environment Variables:
   - `DATABASE_URL`: `sqlite:///./bhoomi_rakshak.db`
   - `OLLAMA_BASE_URL`: `http://localhost:11434`
7. Click **Deploy**.

### Frontend Deployment (React)
1. In Render/Railway, create another service pointing to `frontend`.
2. Select **Static Site** or **Docker**.
3. Build Command: `npm install && npm run build`
4. Publish Directory: `dist`
5. Click **Deploy**.

---

## 7. Environment Configuration & API Keys

Configuration file: `backend/.env`

```ini
# Database configuration
DATABASE_URL=sqlite:///./bhoomi_rakshak.db

# Ollama Local LLM configuration
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=qwen2-vl

# Sentinel Hub API (Optional - leave blank to use high-res dynamic tile engine)
SENTINEL_HUB_CLIENT_ID=
SENTINEL_HUB_CLIENT_SECRET=
```

---

## 8. Production Maintenance, Logs & Backups

### Viewing Live Logs
```bash
# View logs from all services in real-time
docker compose logs -f

# View backend only
docker compose logs -f backend

# View frontend only
docker compose logs -f frontend
```

### Restarting Services
```bash
# Restart entire stack
docker compose restart

# Rebuild after pulling latest code changes
docker compose up -d --build
```

### Database Backup
The SQLite database is stored in a named Docker volume (`sqlite_data`) and inside the container at `/app/bhoomi_rakshak.db`.
```bash
# Backup database to host
docker cp bhoomi_backend:/app/bhoomi_rakshak.db ./backup_$(date +%Y%m%d).db

# Restore database
docker cp ./backup_20260904.db bhoomi_backend:/app/bhoomi_rakshak.db
```

### Stopping Services
```bash
docker compose down
```
*(Data in database volume `sqlite_data` and Ollama model weights `ollama_data` are persisted).*
