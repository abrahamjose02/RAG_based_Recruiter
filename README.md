# Recruiter AI

Shared talent pool for in-house recruiters, with a public search that answers from indexed resumes only.

Recruiters sign in, submit resume text, and the API parses each resume, creates or updates a candidate by email, and stores embeddings in Qdrant. Anyone can then ask a natural-language question. Search returns a short grounded answer and up to five matching resumes. It does not invent skills, employers, or years that are missing from the indexed pool.

The staff UI is still a Next.js starter. API clients for auth, candidates, resumes, and search already live in `frontend/lib`.

## Stack

| Piece | Choice |
| --- | --- |
| API | Node.js, TypeScript, Express 5, Zod, Mongoose |
| Auth | JWT for recruiters. Search is public. |
| Records | MongoDB (candidates, resumes, recruiters, organizations) |
| Vectors | Qdrant, cosine, 1536 dimensions (`text-embedding-3-small`) |
| Models | OpenAI for parsing, query understanding, embeddings, and the grounded answer |
| Web | Next.js 16, React 19, Tailwind CSS, TanStack Query |

Deeper product rules live in [`docs/PRODUCT_REFERENCE.md`](docs/PRODUCT_REFERENCE.md). This README is the setup guide for the code as it runs today.

## How a resume becomes searchable

```text
Recruiter (JWT)
  POST /api/v1/resumes          JSON manifest + extracted text
        │
        ├─ parse (contact fields + LLM, Zod-validated)
        ├─ create or refresh Candidate by email
        ├─ chunk resume and candidate profile
        └─ embed and upsert into Qdrant
              status: uploaded → processing → parsed → indexing → ready | failed

Anyone
  POST /api/v1/search           { "query": "Node.js in Bangalore, 5+ years" }
        │
        ├─ turn the question into filters + a semantic query
        ├─ nearest resume chunks (city, skills, minimum years)
        ├─ rank, keep the top 5
        └─ write an answer from those resumes only
```

The API does not accept multipart resume files. The client extracts the text and sends a JSON manifest. Original file storage (S3) is not wired up yet; the request still includes a storage key for the planned object path.

## Prerequisites

- Node.js 20 or newer
- Docker, for local Qdrant
- A MongoDB connection string
- An OpenAI API key

## Run it locally

From the repo root, start Qdrant:

```bash
docker compose up -d
```

Qdrant listens on `http://localhost:6333`. The API creates the `resume_chunks` collection on startup if it does not exist.

### API

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

The API listens on port `5000`. Check it with:

```bash
curl http://localhost:5000/api/v1/health
```

`npm run dev` restarts on file changes. `npm run build` compiles to `dist/`, and `npm start` runs that build. `npm run typecheck` type-checks without emitting files.

### Web app

```bash
cd frontend
npm install
npm run dev
```

The app listens on `http://localhost:3000`. Point it at the API with `NEXT_PUBLIC_API_URL` if the API is not on `http://localhost:5000`.

## Environment

Copy `backend/.env.example` to `backend/.env`.

| Variable | Purpose |
| --- | --- |
| `PORT` | API port. Default `5000`. |
| `MONGODB_URI` | MongoDB connection string. Must start with `mongodb://` or `mongodb+srv://`. |
| `CORS_ORIGIN` | Allowed browser origin. Default `http://localhost:3000`. |
| `JWT_SECRET` | Signing secret for recruiter tokens. |
| `JWT_EXPIRES_IN` | Token lifetime in seconds. Default 7 days. |
| `BCRYPT_ROUNDS` | Password hash cost. Default `10`. |
| `OPENAI_API_KEY` | Required. Used for parse, embeddings, and answers. |
| `RESUME_PARSER_MODEL` | Default `gpt-4o-mini`. |
| `EMBEDDING_MODEL` | Default `text-embedding-3-small`. |
| `EMBEDDING_VERSION` | Stored on each vector so re-embeds stay identifiable. |
| `QDRANT_URL` | Default `http://localhost:6333`. |
| `QDRANT_API_KEY` | Optional. Leave empty for local Qdrant. |
| `QDRANT_COLLECTION` | Default `resume_chunks`. |

Do not commit `.env`.

## API

Base path: `/api/v1`. Successful responses use `{ "success": true, "data": ... }`.

| Method | Path | Auth | What it does |
| --- | --- | --- | --- |
| `GET` | `/health` | No | Process health. |
| `POST` | `/organization` | No | Create a staff organization. |
| `GET` | `/organization` | No | List organizations. |
| `GET` | `/organization/:id` | No | Read one organization. |
| `PATCH` | `/organization/:id` | No | Update an organization. |
| `DELETE` | `/organization/:id` | No | Delete an organization. |
| `POST` | `/recruiters/register` | No | Create an in-house recruiter. Needs an organization id. |
| `POST` | `/recruiters/login` | No | Returns a JWT and the recruiter. |
| `GET` | `/recruiters/me` | JWT | Current recruiter. |
| `GET` | `/recruiters` | JWT | List recruiters. |
| `DELETE` | `/recruiters/:id` | JWT | Deactivate a recruiter. |
| `GET` | `/candidates` | JWT | Paginated candidate list. |
| `GET` | `/candidates/:id` | JWT | One candidate. |
| `POST` | `/candidates` | JWT | Create a candidate by hand. |
| `PATCH` | `/candidates/:id` | JWT | Update a candidate. |
| `DELETE` | `/candidates/:id` | JWT | Delete a candidate. |
| `POST` | `/resumes` | JWT | Ingest one to 25 resume manifests. |
| `GET` | `/resumes` | JWT | List resumes. `mine=true` limits the list to the caller. |
| `GET` | `/resumes/:id` | JWT | One resume. |
| `POST` | `/search` | No | Natural-language search. Body: `{ "query": "..." }` (3–2000 characters). |

Send the token as `Authorization: Bearer <token>`.

A first local account looks like this:

```bash
# 1. Organization
curl -s http://localhost:5000/api/v1/organization \
  -H 'Content-Type: application/json' \
  -d '{"name":"YMinds","website":"https://yminds.ai"}'

# 2. Recruiter (use the organization _id from the previous response)
curl -s http://localhost:5000/api/v1/recruiters/register \
  -H 'Content-Type: application/json' \
  -d '{
    "organizationId":"<organizationId>",
    "email":"recruiter@example.com",
    "firstName":"Ada",
    "lastName":"Lovelace",
    "password":"Password1",
    "role":"admin"
  }'

# 3. Login
curl -s http://localhost:5000/api/v1/recruiters/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"recruiter@example.com","password":"Password1"}'
```

Passwords need at least 8 characters, one uppercase letter, and one number.

Resume ingest expects extracted text, not a file upload. PDF and DOCX mime types are accepted, each file up to 10 MB, and each batch up to 25 documents. A resume without both a name and an email stays `parsed` and is not indexed.

```bash
curl -s http://localhost:5000/api/v1/resumes \
  -H "Authorization: Bearer <token>" \
  -H 'Content-Type: application/json' \
  -d '{
    "documents": [{
      "clientDocumentId": "doc-1",
      "file": {
        "name": "rahul-sharma.pdf",
        "mimeType": "application/pdf",
        "size": 12000
      },
      "storage": {
        "key": "organizations/<organizationId>/resumes/<uuid>/original.pdf"
      },
      "extractedText": "Rahul Sharma\nrahul@example.com\nSenior Backend Engineer, Bangalore..."
    }]
  }'
```

Search:

```bash
curl -s http://localhost:5000/api/v1/search \
  -H 'Content-Type: application/json' \
  -d '{"query":"Node.js engineers in Bangalore with 5+ years and AWS"}'
```

The response `data` object has `answer` and `resumes` (at most five), each with a `score`.

## Repository layout

```text
backend/src
  app.ts, server.ts          Express app and startup
  modules/recruiter          Register, login, JWT
  modules/organization       Staff grouping (not a talent tenant)
  modules/candidate          People, unique by email
  modules/resume             Manifest ingest and resume records
  modules/search             Public search HTTP API
  ai/                        Parse, chunk, embed, rank, grounded answers, Qdrant
frontend
  app/                       Next.js routes (starter page today)
  lib/                       Typed API clients
docker-compose.yml           Local Qdrant only
docs/PRODUCT_REFERENCE.md    Product and architecture notes
```

Talent is one pool. An organization groups in-house staff for login. It does not partition candidates or vectors.

## What is not built yet

- Staff and public search screens (the Next.js app is still the starter page)
- Uploading original resume bytes to object storage
- OCR, background job queues, and job or shortlist records
