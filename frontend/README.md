# Document RAG — AI PDF Assistant Frontend

A modern, responsive React frontend for the Document RAG PDF Retrieval-Augmented Generation (RAG) application.

## Tech Stack

| Tool                                | Version                     |
| ----------------------------------- | --------------------------- |
| React                               | 19                          |
| Vite                                | 8                           |
| Tailwind CSS                        | 4 (via `@tailwindcss/vite`) |
| React Router DOM                    | 7                           |
| Axios                               | —                           |
| Lucide React                        | —                           |
| React Hot Toast                     | —                           |
| React Markdown + Syntax Highlighter | —                           |

## Setup & Running

### 1. Prerequisites

- Node.js 18+ (20+ recommended)
- Backend running on port **5000** (see backend `.env`)

### 2. Install dependencies

```bash
cd frontend
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

The default `.env` points to `http://localhost:5000`. Adjust if your backend runs on a different port.

### 4. Start the dev server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### 5. Production build

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build locally
```

## Application Routes

| Route            | Page                | Auth      |
| ---------------- | ------------------- | --------- |
| `/login`         | Login               | Public    |
| `/register`      | Registration        | Public    |
| `/app`           | Chat interface      | Protected |
| `/app/documents` | Document management | Protected |

## Authentication Flow

- `POST /auth/register` → creates user, redirects to login
- `POST /auth/login` → stores `access_token` + `refresh_token` in `localStorage`
- All subsequent requests include `Authorization: Bearer <access_token>`
- On 401, Axios interceptor calls `POST /auth/refresh` with `{ refresh_token }` body
- A queuing mechanism prevents duplicate refresh calls from concurrent requests

> **Security note:** Tokens are stored in `localStorage`. The backend does not use HttpOnly cookies. For enhanced security, the backend could be updated to issue refresh tokens as HttpOnly cookies.

## Backend API Integration

All API calls use the centralized Axios client at `src/api/axios.js`.

| Service   | File                       |
| --------- | -------------------------- |
| Auth      | `src/api/auth.api.js`      |
| Documents | `src/api/documents.api.js` |
| Chats     | `src/api/chats.api.js`     |

## Known Limitations / Backend Dependencies

### ⚠️ Missing: GET /documents endpoint

The backend **does not** expose a document listing endpoint. As a result:

- The Documents page only shows documents uploaded **in the current session**
- Past uploads from previous sessions cannot be displayed
- The Document Selector in the chat interface cannot pre-populate previously uploaded documents

**To fix this, add to the backend:**

```typescript
// documents.controller.ts
@Get('get-documents')
@UseGuards(AuthGuard('jwt'))
async getDocuments(@Req() request: Request) {
  return await this.documentsService.getDocuments(request);
}
```

```typescript
// documents.service.ts
async getDocuments(request: any) {
  const userId = request?.user?.id;
  const docs = await this.db.select().from(documents)
    .where(eq(documents.userId, userId))
    .orderBy(desc(documents.createdAt));
  return { status: true, data: docs };
}
```

Once this endpoint exists, update `documents.api.js` to call it and wire it into both `DocumentsPage` and `ChatPage`.

## CORS

CORS has been enabled in `backend/src/main.ts` to allow:

- `http://localhost:5173` (Vite dev server)
- `http://localhost:4173` (Vite preview)

Adjust the `origin` array in `main.ts` for your production domain.
