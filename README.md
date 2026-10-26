# Document RAG — Chat with your PDFs

Document RAG is a Retrieval-Augmented Generation (RAG) app. Upload PDF documents, let the app process them into searchable embeddings, then ask questions and get answers grounded in the documents you select.

## Features

- Register and log in (JWT access + refresh tokens)
- Upload PDF document
- Track embedding status per document (`pending`, `ready`, `failed`) and retry failed jobs
- Select one or many ready documents to query
- Chat history: browse, rename and delete conversations
- Responsive UI for desktop, tablet and mobile

## Tech stack

| Layer    | Technology                                                                 |
| -------- | -------------------------------------------------------------------------- |
| Frontend | React, Vite, JavaScript, Tailwind CSS, React Router, Axios, React Markdown |
| Backend  | NestJS, Drizzle ORM, LangChain                                             |
| Database | PostgreSQL with the `pgvector` extension                                   |
| AI       | Ollama (chat + embedding models), or a hosted provider (see below)         |
| Storage  | S3-compatible object storage (Cloudflare R2, AWS S3, MinIO, ...)           |

## How it works

1. A PDF is uploaded and stored in S3-compatible storage.
2. The backend splits it into chunks, creates an embedding for each chunk and saves them in PostgreSQL (`pgvector`). The document's status moves from `pending` to `ready` (or `failed`).
3. When you ask a question, the question is embedded and the most similar chunks (cosine similarity) are retrieved from the selected documents.
4. The chunks are sent to the chat model as context, and the answer is streamed back to the browser over Server-Sent Events.

## Project structure

```
.
├── backend/    # NestJS API
└── frontend/   # React + Vite app
```

## Prerequisites

- **Node.js 20.19+** (or 22.12+) and npm
- **PostgreSQL 15+** with the [`pgvector`](https://github.com/pgvector/pgvector) extension available
- **Ollama** installed on your machine or server (see [AI setup](#ai-setup)), or an API key for a hosted provider
- An **S3-compatible bucket** and its access credentials

## Getting started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd <your-repo-folder>
```

### 2. Set up the database

Create a database and enable `pgvector`:

```sql
CREATE DATABASE documentDb;
\c documentDb
CREATE EXTENSION IF NOT EXISTS vector;
```

### 3. Set up AI models

See [AI setup](#ai-setup) below, then come back to configure the environment variables.

### 4. Configure and start the backend

```bash
cd backend
npm i
```

Create a `backend/.env` file (see [Environment variables](#environment-variables)), then apply the database schema with your Drizzle migration command, for example:

```bash
npx drizzle-kit migrate
# or, for a quick local setup:
npx drizzle-kit push
```

Start the API in development mode:

```bash
npm run start:dev
```

The API runs on the port set in `PORT`.

### 5. Configure and start the frontend

In a new terminal:

```bash
cd frontend
npm i
```

Create a `frontend/.env` file, then start the dev server:

```bash
npm run dev
```

Open the URL Vite prints (by default <http://localhost:5173>), register an account, upload a PDF, wait for its status to become **Ready**, then start chatting.

## Environment variables

### Backend (`backend/.env`)

```dotenv
DATABASE_URL=postgresql://postgres:password@localhost:5432/documentDb
PORT=3000

JWT_SECRET=replace-with-a-long-random-string
JWT_SECRET_REFRESH=replace-with-a-different-long-random-string

EMBEDDING_DIMENSIONS=768

AI_CHAT_MODEL=llama3.2
AI_EMBBEDING_MODEL=nomic-embed-text

S3_ENPOINT=https://<account-id>.r2.cloudflarestorage.com
ACCESS_KEY_ID=your-access-key-id
SECRET_ACCESS_KEY=your-secret-access-key
S3_BUCKET=your-bucket-name
```

| Variable               | Description                                                                                         |
| ---------------------- | --------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`         | PostgreSQL connection string. The database must have the `vector` extension enabled.                |
| `PORT`                 | Port the API listens on. The frontend's `VITE_API_BASE_URL` must point to it.                       |
| `JWT_SECRET`           | Secret used to sign access tokens.                                                                  |
| `JWT_SECRET_REFRESH`   | Secret used to sign refresh tokens. Use a different value from `JWT_SECRET`.                        |
| `EMBEDDING_DIMENSIONS` | Vector size produced by your embedding model. It **must match** the model (see the table below).    |
| `AI_CHAT_MODEL`        | Name of the chat model used to generate answers (for Ollama, e.g. `llama3.2`).                      |
| `AI_EMBBEDING_MODEL`   | Name of the embedding model used for documents and questions (for Ollama, e.g. `nomic-embed-text`). |
| `S3_ENPOINT`           | Endpoint URL of your S3-compatible storage.                                                         |
| `ACCESS_KEY_ID`        | Access key for the bucket.                                                                          |
| `SECRET_ACCESS_KEY`    | Secret key for the bucket.                                                                          |
| `S3_BUCKET`            | Name of the bucket where uploaded PDFs are stored.                                                  |

> **Note:** `S3_ENPOINT` and `AI_EMBBEDING_MODEL` are spelled exactly as the backend reads them. Don't "fix" the spelling in your `.env` unless you also change it in the code.

Generate strong JWT secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Frontend (`frontend/.env`)

```dotenv
VITE_API_BASE_URL=http://localhost:3000
VITE_MAX_UPLOAD_MB=10
```

| Variable             | Description                                                                     |
| -------------------- | ------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`  | Base URL of the backend API, without a trailing slash.                          |
| `VITE_MAX_UPLOAD_MB` | Maximum PDF size (in MB) accepted by the uploader. Defaults to `10` if not set. |

Restart `npm run dev` after changing `.env` values, since Vite reads them at startup.

## AI setup

### Option A: Ollama (default)

1. Install Ollama on the machine or server that runs the backend: <https://ollama.com/download>
2. Make sure it is running (it listens on `http://localhost:11434` by default).
3. Pull a chat model and an embedding model, then use their names in `AI_CHAT_MODEL` and `AI_EMBBEDING_MODEL`:

```bash
ollama pull llama3.2
ollama pull nomic-embed-text
```

4. Set `EMBEDDING_DIMENSIONS` to the output size of your embedding model:

| Embedding model     | Dimensions |
| ------------------- | ---------- |
| `nomic-embed-text`  | 768        |
| `mxbai-embed-large` | 1024       |
| `all-minilm`        | 384        |

Check your model's page for the exact value if you use a different one.

> **Important:** the vector column size is fixed when the schema is created. If you change the embedding model or `EMBEDDING_DIMENSIONS` later, recreate the column and re-embed your documents.

If Ollama runs on a different machine, update the `baseUrl` where the backend creates the Ollama clients (it defaults to `http://localhost:11434`).

### Option B: a hosted provider with an API key

If you would rather use a hosted provider than run Ollama:

1. Install the matching LangChain package (for example `@langchain/openai`).
2. Replace `ChatOllama` and `OllamaEmbeddings` with that provider's chat and embedding classes where the backend creates them.
3. Add the provider's API key to `backend/.env` and pass it to those classes.
4. Set `AI_CHAT_MODEL`, `AI_EMBBEDING_MODEL` and `EMBEDDING_DIMENSIONS` to match the provider's models.

## Production build

```bash
# Backend
cd backend
npm run build
npm run start:prod

# Frontend
cd frontend
npm run build      # outputs static files to frontend/dist
npm run preview    # optional: preview the production build locally
```

Notes for deployment:

- Set `VITE_API_BASE_URL` to your public API URL **before** building the frontend, since Vite bakes it into the bundle.
- Enable CORS on the backend for your frontend's origin.
- If the API is behind nginx or another proxy, turn off response buffering for `/chats/ask-stream` (for nginx, `proxy_buffering off;`), otherwise streamed answers arrive all at once.
- Use HTTPS and strong, unique JWT secrets in production.

## Troubleshooting

**A document stays on "Processing" or turns "Failed"**
Check that Ollama is running, that both models are pulled and match `AI_CHAT_MODEL` / `AI_EMBBEDING_MODEL`, and that `EMBEDDING_DIMENSIONS` matches the embedding model. The backend logs show the underlying error. Use **Retry** on the Documents page after fixing it.

**`type "vector" does not exist` or `extension "vector" is not available`**
`pgvector` isn't installed or enabled. Install it for your PostgreSQL version and run `CREATE EXTENSION IF NOT EXISTS vector;` in your database.

**Uploads fail**
Check `S3_ENPOINT`, the credentials and `S3_BUCKET`, and confirm the bucket exists and the keys can write to it. Also check the file is a PDF and under `VITE_MAX_UPLOAD_MB`.

**Browser shows CORS errors or "Cannot reach the server"**
Confirm the backend is running, `VITE_API_BASE_URL` matches its address and port, and the backend allows your frontend's origin (for example `http://localhost:5173`).

**Logged out on every refresh**
Make sure `JWT_SECRET` and `JWT_SECRET_REFRESH` stay the same between restarts of the backend.

**Answers appear all at once instead of streaming**
A proxy, CDN or compression middleware is buffering the response. See the deployment notes above.
