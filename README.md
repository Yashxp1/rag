# Architecture

<img width="4911" height="2340" alt="MultiModal RAG - v1" src="https://github.com/user-attachments/assets/5c842f8b-fb55-40fb-b2d7-dbba8b3214a3" />


# Multimodal RAG Server

A high-performance **Multimodal Retrieval-Augmented Generation (RAG)** backend server built with **Bun**, **Express**, **TypeScript**, **Prisma (PostgreSQL)**, **BullMQ (Redis)**, **Pinecone**, **Google Gemini**, and **Ollama (Gemma 3)**. 

This server handles ingestion, parsing, vector embedding, and context-aware chatting across diverse file types including **Documents (PDF, DOCX, PPTX, XLSX, TXT, MD)**, **Audio (WAV)**, and **Video (MP4, AVI, etc.)**.

---

## Key Features

- **Multimodal Document Processing**: Extracts and chunks content from PDFs, Microsoft Office files (`.docx`, `.pptx`, `.xlsx`), Markdown, and plain text with OCR support via `officeparser`.
- **Audio Transcription**: Asynchronous background audio transcription using local `whisper.cpp` execution.
- **Video Vision & Audio Analysis**: Frame extraction (`ffmpeg`) combined with multimodal vision processing via **Ollama (Gemma 3:4B)** and audio transcription to produce holistic video vector context.
- **Asynchronous Background Processing**: Reliable job queue architecture using **BullMQ** & **Redis** to prevent request timeouts and high memory usage during heavy media/document ingestion.
- **Vector Search with Pinecone**: Generates 1024-dimensional embeddings via Google's `gemini-embedding-2` model and queries Pinecone with document-level metadata filtering.
- **Context-Aware Chat Engine**: State-managed conversation threads persisted in PostgreSQL, feeding retrieved vector context and recent message history to Ollama `gemma3:4b` with extended context windows (16k tokens).
- **Container & Storage Ready**: Docker support (`oven/bun`) and cloud object storage integration via Supabase Storage.

---

## Architecture & Ingestion Flow

```mermaid
flowchart TD
    Client[Client / Frontend] -->|POST /api/upload| UploadAPI[Upload Controller]
    UploadAPI -->|Store Raw File| Supabase[Supabase Storage]
    UploadAPI -->|Record Document & Link Chat| Postgres[(PostgreSQL / Prisma)]
    
    UploadAPI -->|Enqueue Document / Audio| DocQueue[BullMQ: uploads]
    UploadAPI -->|Enqueue Video| VideoQueue[BullMQ: extract-frames]
    
    subgraph Background Workers
        DocQueue --> DocWorker[Document Worker]
        VideoQueue --> VideoWorker[Video Worker]
        
        DocWorker -->|Office/PDF| Parser[officeparser + OCR]
        DocWorker -->|Audio WAV| Whisper[whisper.cpp]
        
        VideoWorker -->|FFmpeg| AudioExtract[Extract Audio WAV]
        AudioExtract --> Whisper
        VideoWorker -->|FFmpeg| FrameExtract[Extract Frames]
        FrameExtract --> OllamaVision[Ollama Gemma3 Vision]
        
        Parser --> Chunking[LangChain Text Splitter]
        Whisper --> Chunking
        OllamaVision --> Chunking
        
        Chunking --> GeminiEmbed[Gemini gemini-embedding-2]
        GeminiEmbed --> Pinecone[(Pinecone Vector DB)]
        DocWorker -->|Update Status: DONE| Postgres
        VideoWorker -->|Update Status: DONE| Postgres
    end

    Client -->|POST /api/chat/:chatId| ChatAPI[Chat Controller]
    ChatAPI -->|Fetch History & Linked Docs| Postgres
    ChatAPI -->|Embed Query| GeminiEmbed
    GeminiEmbed -->|Vector Query| Pinecone
    Pinecone -->|Relevant Context| ChatAPI
    ChatAPI -->|Prompt + Context + History| OllamaLLM[Ollama Gemma3 LLM]
    OllamaLLM -->|Response| Client
```

---

## Technology Stack

| Component | Technology / Library |
| :--- | :--- |
| **Runtime** | [Bun](https://bun.sh) (v1.2+) |
| **Framework** | Express v5, TypeScript |
| **Database & ORM** | PostgreSQL, Prisma ORM v7 |
| **Queue / Cache** | BullMQ, Redis (ioredis) |
| **Vector DB** | Pinecone (`@pinecone-database/pinecone`) |
| **Object Storage** | Supabase Storage (`@supabase/supabase-js`) |
| **Embedding Model** | Google Gemini `gemini-embedding-2` (1024 dimensions) |
| **LLM & Vision** | Ollama `gemma3:4b` |
| **Speech-to-Text** | Local `whisper.cpp` (`ggml-base.bin`) |
| **Media Processing** | FFmpeg |
| **Document Parsers** | `officeparser`, `@langchain/textsplitters` |

---

## Repository Structure

```
.
├── prisma/
│   ├── schema.prisma       # Prisma DB Schema (Document, Chunk, Chat, Message, ChatDocument)
│   └── migrations/         # PostgreSQL database migrations
├── src/
│   ├── config/             # Connection configurations (Prisma, Redis, Supabase)
│   ├── controller/         # API business logic (upload, chat)
│   ├── lib/                # Media & Vector utilities (Pinecone, FFmpeg, Whisper, Search)
│   ├── middleware/         # Express middleware (Multer file upload handling)
│   ├── queues/             # BullMQ queue definitions
│   ├── routes/             # Express API routes (/api/upload, /api/chats, /api/chat)
│   ├── services/
│   │   ├── ai/             # AI integrations (Google Gemini embeddings, Ollama, Chunking)
│   │   └── parsers/        # Document text extraction wrappers
│   ├── workers/            # Asynchronous background workers (Document & Video workers)
│   └── index.ts            # Application entry point & server start
├── compose.yml             # Docker Compose configuration
├── dockerfile              # Bun production Dockerfile
├── package.json            # Scripts & dependencies
└── tsconfig.json           # TypeScript configuration
```

---

## Environment Variables

Create a `.env` file in the root directory and configure the following variables:

```env
# Server Configuration
PORT=4001

# Database & Redis
DATABASE_URL="postgresql://user:password@localhost:5432/rag_db?schema=public"
REDIS_HOST="127.0.0.1"
REDIS_PORT=6379

# Supabase Storage
SUPABASE_URL="https://your-supabase-project.supabase.co"
SUPABASE_KEY="your-supabase-service-role-or-anon-key"
SUPABASE_BUCKET_NAME="your-bucket-name"

# Google Gemini API
GEMINI_API_KEY="your-google-gemini-api-key"

# Pinecone Vector DB
PINECONE_API_KEY="your-pinecone-api-key"
PINECONE_INDEX_NAME="rag-app"

# Ollama LLM
OLLAMA_URI="http://127.0.0.1:11434"

# External Binaries / Models
WHISPER_PATH="C:/path/to/whisper.cpp/main.exe" # Path to whisper executable
```

---

## Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- [Bun](https://bun.sh) (v1.2+)
- [PostgreSQL](https://www.postgresql.org/)
- [Redis](https://redis.io/)
- [FFmpeg](https://ffmpeg.org/) (added to system `PATH`)
- [Ollama](https://ollama.com/) with `gemma3:4b` pulled (`ollama pull gemma3:4b`)
- [Whisper.cpp](https://github.com/ggerganov/whisper.cpp) binary & GGML model file

### 1. Installation

```bash
bun install
```

### 2. Database Migration

Generate Prisma client and run database migrations:

```bash
bunx prisma db push
# or
bunx prisma migrate dev
```

### 3. Run Development Server

```bash
bun run dev
```

The server will start at `http://localhost:4001`.

---

## API Endpoints

### File Upload & Processing

- **`POST /api/upload`**
  - **Type**: `multipart/form-data`
  - **Body**: `document` (File), `chatId` (Optional string)
  - **Description**: Uploads file to Supabase storage, creates DB entry, links to chat, and triggers asynchronous background processing.
  - **Returns**: `{ success: true, documentId, chatId }`

---

### Chat Management & Messaging

- **`POST /api/chats`**
  - **Body**: `{ "title": "Optional Chat Title" }`
  - **Description**: Creates a new chat session.

- **`GET /api/chats`**
  - **Description**: Fetches list of all chat sessions sorted by creation date.

- **`GET /api/chats/:chatId`**
  - **Description**: Retrieves a chat session with all messages in chronological order.

- **`POST /api/chats/:chatId/documents`**
  - **Body**: `{ "documentId": "target-document-id" }`
  - **Description**: Explicitly links an existing document to a chat session for scoped RAG context queries.

- **`POST /api/chat`**
  - **Body**: `{ "message": "User query", "chatId": "optional-chat-id" }`
  - **Description**: Sends a query. Auto-creates chat if `chatId` is missing, performs vector similarity query against Pinecone, retrieves context, and streams answer from Ollama `gemma3:4b`.

- **`POST /api/chat/:chatId`**
  - **Body**: `{ "message": "User query" }`
  - **Description**: Sends a query within an existing chat session incorporating conversational history.

---

## Docker Deployment

Build and run using Docker:

```bash
# Build Docker image
docker build -t rag-server .

# Run container
docker run -p 4001:4001 --env-file .env rag-server
```

---

## License

This project is open-source and available under the [MIT License](LICENSE).
