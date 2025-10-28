# 🧠 SmartDocs - Standalone AI Document Management System

<div align="center">

![SmartDocs](https://img.shields.io/badge/SmartDocs-v1.0.0-blue)
![Docker](https://img.shields.io/badge/Docker-Ready-green)
![Node](https://img.shields.io/badge/Node.js-20+-brightgreen)
![License](https://img.shields.io/badge/License-MIT-yellow)

**Production-Ready AI-Powered Document Management with RAG**

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [Admin Panel](#-admin-panel) • [API Docs](#-api-documentation)

</div>

---

## 🎯 Features

- ✅ **AI-Powered RAG** - Retrieval Augmented Generation with OpenAI
- ✅ **Vector Search** - pgvector + Qdrant for semantic search
- ✅ **Document Processing** - PDF, DOCX, XLSX, TXT support
- ✅ **Auto-Sync Worker** - Background job processing
- ✅ **S3-Compatible Storage** - MinIO for file storage
- ✅ **Multi-Container** - Isolated document spaces
- ✅ **Admin UI** - Standalone management panel
- ✅ **Docker Compose** - One-command deployment
- ✅ **Health Monitoring** - Built-in system checks
- ✅ **API Keys Management** - Secure configuration

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)
- OpenAI API Key

### 1. Clone & Configure

```bash
cd smartdocs
cp .env.example .env
```

Edit `.env`:
```env
OPENAI_API_KEY=sk-your-key-here
ENCRYPTION_KEY=your-32-char-encryption-key
```

### 2. Start All Services

```bash
# Start Docker services (database, redis, etc)
docker-compose up -d

# Start SmartDocs API (in one terminal)
npm run dev

# Start Worker (in another terminal)
npm run worker &

# Start Admin UI (in another terminal)
npm run admin
```

This starts:
- **SmartDocs API** - http://localhost:3500
- **Admin UI** - http://localhost:3501
- **PostgreSQL** (pgvector) - localhost:5433
- **Redis** - localhost:6380
- **Qdrant** - localhost:6333
- **MinIO** - http://localhost:9000 (Console: 9001)
- **Sync Worker** - Background processor

### 3. Access Admin Panel

Open **http://localhost:3501** in your browser.

![Admin Panel](docs/images/admin-panel.png)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SMARTDOCS ECOSYSTEM                       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Admin UI    │  │ SmartDocs API│  │ Sync Worker  │     │
│  │  :3501       │  │  :3500       │  │  Background  │     │
│  │  Web Panel   │  │  REST API    │  │  Processor   │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│  ┌──────▼──────────────────▼──────────────────▼───────┐    │
│  │           PostgreSQL + pgvector (:5433)             │    │
│  └──────┬──────────────────┬──────────────────┬───────┘    │
│         │                  │                  │              │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐     │
│  │    Redis     │  │   Qdrant     │  │    MinIO     │     │
│  │    :6380     │  │  Vector DB   │  │   Storage    │     │
│  │    Cache     │  │  :6333-6334  │  │  :9000-9001  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Admin Panel

The standalone admin UI provides:

### 📊 Dashboard
- Real-time service health monitoring
- System stats (containers, jobs, health)
- Recent sync jobs overview

### 🔑 API Keys Management
- OpenAI API key configuration
- Encryption key setup
- Connection testing

### 📦 Container Management
- View all document containers
- Container statistics
- Access control

### 🔄 Sync Jobs Monitor
- View all sync jobs
- Filter by status/type
- Job details and logs

### 🖥️ System Status
- Service health checks
- Docker command reference
- Logs viewer

---

## 📡 API Documentation

### Base URL
```
http://localhost:3500/api
```

### Endpoints

#### Health Check
```bash
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "services": {
    "api": "healthy",
    "database": "healthy",
    "redis": "healthy",
    "vector": "healthy"
  }
}
```

#### Containers

```bash
# List all containers
GET /container-instances

# Create container
POST /container-instances
{
  "name": "my-docs",
  "description": "My documents"
}

# Get container stats
GET /sync/stats/:container_id
```

#### Sync Jobs

```bash
# List jobs
GET /sync/jobs?status=pending&limit=50

# Ingest document
POST /sync/ingest
{
  "container_id": "uuid",
  "source_app": "my-app",
  "entity_type": "document",
  "entity_id": "123",
  "title": "Document Title",
  "content": "Document content..."
}

# Delete entity
DELETE /sync/entity/:container_id/:entity_type/:entity_id
```

---

## 🛠️ Development

### Local Development (without Docker)

#### 1. Install Dependencies
```bash
npm install
```

#### 2. Setup Database
```bash
# Start only database services
docker-compose up -d smartdocs-db smartdocs-redis

# Initialize schema
npm run db:init
```

#### 3. Start API
```bash
npm run dev
```

#### 4. Start Worker (separate terminal)
```bash
npm run worker
```

#### 5. Start Admin UI (separate terminal)
```bash
cd admin-ui
npm install
npm run dev
```

---

## 🐳 Docker Commands

### Manage Services

```bash
# Start all
docker-compose up -d

# Stop all
docker-compose down

# Restart specific service
docker-compose restart smartdocs-api

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f smartdocs-worker

# Rebuild and start
docker-compose up -d --build

# Check status
docker-compose ps
```

### Individual Services

```bash
# Start only database
docker-compose up -d smartdocs-db

# Start API + dependencies
docker-compose up -d smartdocs-api

# Start worker
docker-compose up -d smartdocs-worker

# Start admin UI
docker-compose up -d smartdocs-admin
```

---

## 🔧 Configuration

### Environment Variables

Create `.env` file:

```env
# OpenAI
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Security
ENCRYPTION_KEY=your-32-character-encryption-key-here

# CORS (optional)
CORS_ORIGIN=http://localhost:5193,http://localhost:3000

# Worker (optional)
WORKER_POLL_INTERVAL=5000

# MinIO (optional, defaults shown)
MINIO_ACCESS_KEY=smartdocs
MINIO_SECRET_KEY=smartdocs_minio_password
MINIO_BUCKET=documents
```

---

## 📊 Monitoring

### Health Checks

```bash
# API Health
curl http://localhost:3500/health

# Database
psql postgresql://smartdocs:smartdocs_secure_pwd@localhost:5433/smartdocs -c "SELECT 1"

# Redis
docker exec -it smartdocs-redis redis-cli ping

# MinIO
curl http://localhost:9000/minio/health/live
```

### Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f smartdocs-api
docker-compose logs -f smartdocs-worker

# Last 100 lines
docker-compose logs --tail=100 smartdocs-api
```

---

## 🔒 Security

- **Isolated Network**: All services run on private `smartdocs-network`
- **Encryption**: Data encrypted at rest with `ENCRYPTION_KEY`
- **CORS**: Configurable origin whitelist
- **Health Checks**: Automatic service monitoring
- **Secrets**: Use `.env` file (never commit!)

---

## 📂 Project Structure

```
smartdocs/
├── admin-ui/              # Standalone Admin Panel
│   ├── src/
│   │   └── main.js       # Admin UI app
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── src/                   # API Source
│   ├── api/
│   │   └── routes/       # API routes
│   ├── services/         # Business logic
│   ├── database/         # DB client
│   ├── utils/            # Utilities
│   ├── index.ts          # API entry point
│   └── worker.ts         # Sync worker
├── scripts/
│   ├── init-db.sql       # Database schema
│   └── seed-data.sql     # Sample data
├── docker-compose.yml    # Docker orchestration
├── Dockerfile            # API container
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🧪 Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm test -- --coverage
```

---

## 🚨 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3500
lsof -ti:3500 | xargs kill -9

# Or use different ports in docker-compose.yml
ports:
  - "3600:3500"  # Changed from 3500
```

### Worker Not Processing Jobs

```bash
# Check worker logs
docker-compose logs -f smartdocs-worker

# Restart worker
docker-compose restart smartdocs-worker

# Check database connection
docker-compose exec smartdocs-db psql -U smartdocs -c "SELECT * FROM smartdocs.sync_jobs LIMIT 5"
```

### Database Connection Failed

```bash
# Check database is running
docker-compose ps smartdocs-db

# Check logs
docker-compose logs smartdocs-db

# Restart database
docker-compose restart smartdocs-db
```

### OpenAI API Errors

```bash
# Verify API key
echo $OPENAI_API_KEY

# Test directly
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

---

## 📈 Performance Tips

1. **Use Redis Caching**: Enable for embedding cache
2. **Optimize Chunk Size**: Default 1000 chars, adjust based on content
3. **Batch Processing**: Use worker for large ingestions
4. **Index Tuning**: Optimize PostgreSQL indexes for your queries
5. **Connection Pooling**: Configured in `database/client.ts`

---

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 📞 Support

- **Documentation**: [Full API Docs](docs/API.md)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Email**: support@smartdocs.example

---

<div align="center">

**Built with ❤️ using Node.js, PostgreSQL, OpenAI, and Docker**

[⬆ back to top](#-smartdocs---standalone-ai-document-management-system)

</div>
