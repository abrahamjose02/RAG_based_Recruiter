# Recruiter AI Talent Platform — Product Reference

Living architecture and product source of truth for this repository.

Update this file whenever a capability, entity, API, pipeline, or scope decision changes. Do not treat the original planning chat as current once this document diverges.

| Field | Value |
| --- | --- |
| Last updated | 2026-09-18 |
| Status | MVP in progress |
| Primary user | Recruiter (not candidate-facing) |
| Goal | Recruiter-owned talent database + grounded Recruiter AI search |
| Current slice | Resume ingest stops at `parsed` + optional candidate attach. Next: Python AI parse service, then chunk / embed / Qdrant indexing (`indexing` → `ready`). |

Related documents (not source of truth): [PYTHON_AI_SERVICE_STUDY_GUIDE.md](./PYTHON_AI_SERVICE_STUDY_GUIDE.md) — venv, uvicorn, FastAPI, Pydantic, and the Node parse contract.

---

## How to maintain this document

When application behavior changes, update:

1. **Implementation snapshot** — what exists in the repo today.
2. **Capability status** — `planned` / `in progress` / `done` / `deferred`.
3. **Domain objects** — fields, ownership, and indexes if they changed.
4. **Pipelines** — ingestion and Recruiter AI search steps if they changed.
5. **Deviations from the original plan** — keep an explicit note instead of silently rewriting history.
6. **Changelog** — one dated bullet at the bottom.

Status values used in this file:

| Status | Meaning |
| --- | --- |
| `planned` | Agreed for MVP or V1, not started |
| `in progress` | Code exists, incomplete |
| `done` | Works for the current MVP slice |
| `deferred` | Explicitly out of current MVP |

---

## 1. Product vision

The platform is an **AI-powered recruiter talent intelligence system**.

Main workflow:

```text
Recruiter
  → Upload resumes (single or batch)
  → Extract resume text (browser, lightweight)
  → Store original resume (S3)
  → Parse structured candidate information (Python AI)
  → Create/update Candidate Profile (Node + MongoDB)
  → Chunk relevant resume content
  → Generate embeddings
  → Store vectors in Qdrant
  → Recruiter searches with natural language
  → Retrieve candidate profiles
  → Apply deterministic filters
  → Rank / later rerank
  → Grounded Recruiter AI response
```

The differentiator is the **Recruiter AI search experience**, not generic resume storage.

Target query examples:

- Find Node.js developers in Bangalore with 5+ years of experience.
- Find candidates with AWS, Kafka, and microservices experience.
- Show me candidates who have worked in fintech companies.
- Find candidates who previously worked at Accenture or Deloitte.
- Find people with Snowflake and GenAI experience.
- Show candidates with stable employment history.
- Find candidates with experience in product companies.
- Compare the top five candidates for this job.
- Who among these candidates has the strongest backend architecture experience?
- Show only candidates with less than three company switches in the last five years.
- Find candidates who have worked at companies in the SaaS domain.

Recruiter AI must retrieve, rank, explain why they match, and use **only facts from the recruiter’s indexed candidate database**.

---

## 2. Actors

### Recruiter (primary)

Can:

- Log in
- Upload one or many resumes
- View candidate profiles
- Search talent with natural language
- Filter, compare, and shortlist
- Search by skill, location, experience, company history, role history, industry/domain, and job fit
- Ask conversational follow-up questions

### Candidate

No candidate login or candidate account in the initial product.

`CandidateProfile` is an **internal recruiter-side entity**.

---

## 3. Domain objects

Canonical entities:

| Entity | Role | Store |
| --- | --- | --- |
| Recruiter | Authenticated user | MongoDB |
| Organization | Tenant boundary | MongoDB |
| Resume | Source document uploaded by recruiter | MongoDB metadata + S3 object |
| CandidateProfile | Person discovered from one or more resumes | MongoDB |
| Job | Recruiter job description for matching | MongoDB |
| Shortlist | Recruiter-owned candidate set | MongoDB |
| RecruiterConversation | Chat history | MongoDB |
| SearchSession | Structured search state for follow-ups | MongoDB |

Every resume, candidate, and vector **must belong to an organization**. Recruiter A must never retrieve Recruiter B’s talent data.

### Ownership rules (current product decision)

| Entity | `organizationId` | `recruiterId` | `candidateId` |
| --- | --- | --- | --- |
| Resume | Required for recruiter-upload API. Tenant boundary for list/get. | Who uploaded. Stored for audit and optional `mine` filter. **Not** the access lock: any recruiter in the org can read org resumes. | Optional. Resume can exist unattached if parse has no name/email. |
| Candidate | Required (product). Unique with email per org. | Optional / not used as access lock. | N/A. Candidate stores `sourceResumeIds`. |
| Qdrant point | Always in payload; always injected from JWT via Node. | Optional metadata. | Required. Do not index orphan chunks with no candidate. |

Clients **must not** send `organizationId` or `recruiterId` on create/list bodies. Node stamps them from the authenticated recruiter JWT.

Candidate self-serve upload and candidate login remain **out of MVP**.

---

## 4. Candidate Profile

Represents a person discovered from one or more recruiter-uploaded resumes.

### Target fields (product plan)

```json
{
  "_id": "candidate_123",
  "organizationId": "org_123",
  "recruiterId": "rec_123",
  "name": "Rahul Sharma",
  "email": "rahul@example.com",
  "phone": "+91...",
  "location": {
    "city": "Bangalore",
    "state": "Karnataka",
    "country": "India"
  },
  "skills": ["Node.js", "AWS", "Kafka", "MongoDB"],
  "totalExperienceYears": 6.5,
  "currentRole": "Senior Backend Engineer",
  "professionalSummary": "...",
  "experience": [
    {
      "company": "ABC Technologies",
      "role": "Backend Engineer",
      "startDate": "2022-01-01",
      "endDate": null,
      "isCurrent": true,
      "description": "..."
    }
  ],
  "education": [],
  "source": "resume_upload",
  "sourceResumeIds": ["resume_456"],
  "createdAt": "...",
  "updatedAt": "..."
}
```

Must be searchable by:

- skills
- total experience
- current role
- previous roles
- location
- previous companies
- education
- project experience
- technologies
- domains
- employment history
- semantic experience

### Deduplication (MVP, keep simple)

Match order:

1. email
2. phone
3. LinkedIn URL later
4. normalized name + supporting signals later

If match: update profile and link the new resume.  
If no match: create a new profile.

Email uniqueness is **per organization**, not global. Two companies may independently hold the same candidate email.

### Code vs plan (Candidate)

- Module name in code: `candidate/` (not `candidate-profile/`).
- Extra recruiter-ops fields already on the model: `currentSalary`, `expectedSalary`, `noticePeriod`.
- `organizationId` is **agreed required** but **not yet** on the Candidate Mongoose schema. Email is still globally unique (`{ email: 1 }`). Candidate list/get/update/delete are auth-gated but not org-scoped.
- Ingest upserts by email via `upsertFromParsedResume` (global). Must pass `organizationId` once Candidate tenancy lands.

---

## 5. Resume entity

Source document uploaded by the recruiter. A candidate may have multiple resumes over time.

### Target fields (product plan)

```json
{
  "_id": "resume_456",
  "organizationId": "org_123",
  "recruiterId": "rec_123",
  "candidateId": "candidate_123",
  "originalFileName": "rahul-sharma.pdf",
  "mimeType": "application/pdf",
  "fileSize": 245220,
  "storageKey": "organizations/org_123/resumes/.../original.pdf",
  "status": "ready",
  "indexedChunks": 7,
  "failureReason": null,
  "createdAt": "...",
  "updatedAt": "..."
}
```

Initial file types: **PDF**, **DOCX**.  
OCR / scanned PDFs: deferred.

### Resume status machine (current code)

`uploaded` → `processing` → `parsed` → `indexing` → `ready`  
Any step may go to `failed`.

Ingest today: `uploaded` → `processing` → `parsed` (and candidate attach when name+email exist). **`indexing` and `ready` are not written yet.**

### Code vs plan (Resume)

- Field names in code: `originalFilename`, `sizeBytes`, `errorMessage`, `candidateId` (not `candidateProfileId` / `failureReason`).
- Also stored: `clientDocumentId`, `extractedText`, optional `parsed` blob.
- Create stamps `organizationId` + `recruiterId` from JWT. Storage key must start with `organizations/{organizationId}/resumes/`.
- List is org-scoped. Optional query: `candidateId`, `recruiterId`, `mine=true` (current recruiter’s uploads).
- Get-by-id is `findOne({ _id, organizationId })`.
- `candidateId` on POST is optional; if sent, candidate must exist (should also be same-org once Candidate is tenant-scoped).
- Multipart resume binaries are rejected (`415`). JSON document manifests only.

---

## 6. System architecture

```text
                         Recruiter
                            │
                            ▼
                        Next.js
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
   Extract Resume Text                   Upload Original
   PDF / DOCX locally                       to S3
        │                                       │
        └───────────────────┬───────────────────┘
                            │
                    Document Manifest
                            │
                            ▼
                    Node.js Backend
                            │
               ┌────────────┼────────────┐
               │            │            │
               ▼            ▼            ▼
           MongoDB      Authorization   Business Logic
                            │
                            ▼
                    Python AI Service
          ┌─────────────────┼─────────────────┐
       Parsing          Chunking         Embeddings
          └─────────────────┼─────────────────┘
                            ▼
                          Qdrant
                            ▼
                    Recruiter Retrieval
              Filters + ANN + Top-K
                            ▼
                 Candidate Aggregation
                            ▼
                    Ranking / Reranking
                            ▼
                    Context Builder + LLM
                            ▼
                    Grounded Recruiter AI Response
```

### Responsibility split

| Layer | Owns | Must not own |
| --- | --- | --- |
| Next.js | Auth UI, file pick, client text extraction, S3 upload, talent UI, Recruiter AI chat | Skill normalization, embeddings, ranking, LLM parsing |
| Node.js | Auth, orgs, recruiters, resume metadata, candidate profiles, jobs, shortlists, authorization, MongoDB, orchestration | Vector search internals, embedding generation |
| Python AI | Structured parse, normalize, chunk, embed, index, retrieve, rank, RAG generation | Recruiter auth, tenant authorization, MongoDB source of truth |
| MongoDB | Business source of truth | Dense vectors |
| Qdrant | Chunks, embeddings, retrieval metadata | Recruiter accounts, jobs, shortlists |
| S3 | Original resume files | Parsed candidate records |

---

## 7. Frontend

Stack: **Next.js, React, TypeScript**.

Preferred feature layout:

```text
features/
  resume-upload/
    components/
    hooks/
    services/
    types/
  recruiter-search/
    components/
    hooks/
    services/
    types/
  candidate-profile/
    components/
    hooks/
    services/
components/
  ui/
    Button, Input, Dialog, Tabs, Card, Badge, Table
```

Do not put major business logic in large React components.

### Client text extraction

Browser extracts **raw text only**.

```text
PDF / DOCX → raw text
```

Frontend must not:

- normalize skills
- match candidates
- generate embeddings
- run vector search
- rank
- LLM-parse resumes

### S3 upload (presigned)

Browser must not contain AWS credentials.

```text
Frontend → request upload URL from Node
Node authenticates recruiter
Node generates safe S3 key
Node returns presigned URL
Frontend uploads file directly to S3
```

Backend-generated key shape:

```text
organizations/{orgId}/resumes/{uuid}/original.pdf
```

### Document manifest

After extraction + S3 upload, frontend POSTs a JSON manifest:

```json
{
  "documents": [
    {
      "clientDocumentId": "uuid-from-browser",
      "file": {
        "name": "rahul.pdf",
        "mimeType": "application/pdf",
        "size": 245220
      },
      "storage": {
        "key": "organizations/org_123/resumes/.../original.pdf"
      },
      "extractedText": "Rahul Sharma Senior Backend Engineer..."
    }
  ]
}
```

Multiple documents must be supported.

### Search result card (target UX)

Show:

- name, current role, experience, location
- key skills
- previous companies
- relevance score
- match explanation
- evidence snippets
- resume link
- shortlist action

---

## 8. Node.js backend

Stack: **Node.js, TypeScript, Express, MongoDB Atlas, Mongoose, Zod**.

Domain-oriented modules:

```text
src/modules/
  recruiter/        # exists: register, login, JWT, me, list, deactivate
  organization/     # exists: CRUD
  resume/           # exists: manifest create/list/get + ingest orchestration
  candidate/        # exists: CRUD + ingest upsert (org scope still incomplete)
  job/              # deferred
  shortlist/        # deferred
  recruiter-chat/   # deferred
```

Per-module flow:

```text
route → Zod validation → controller → service → repository → model → MongoDB
```

| Layer | Responsibility |
| --- | --- |
| Route | HTTP method + URL |
| Validation | Zod at the API boundary |
| Controller | HTTP translation only |
| Service | Business logic and orchestration |
| Repository | Database access |
| Model | MongoDB representation |

Do not create giant controllers.

---

## 9. Python AI service

Stack: **Python, FastAPI, Pydantic, sentence-transformers, qdrant-client, Hugging Face**. Rerankers later.

Suggested layout:

```text
ai-service/
  app/
    main.py
    api/routes/          # resumes, retrieval, recruiter
    schemas/             # resume, candidate, retrieval, recruiter
    services/
      resume_parser.py
      resume_normalizer.py
      chunking_service.py
      embedding_service.py
      indexing_service.py
      retrieval_service.py
      ranking_service.py
      reranking_service.py
      rag_service.py
    repositories/vector_repository.py
    providers/           # embeddings, llm, reranker
    infrastructure/qdrant.py
```

Separate:

- text extraction (frontend)
- entity extraction (parser)
- normalization (normalizer)

Do not combine all AI functions into one large service.  
Do not start with LangChain/LangGraph unless they solve a concrete orchestration problem.

There is **no `ai-service/` in the repo yet**. Node already calls:

| Method | Path | When | Status |
| --- | --- | --- | --- |
| POST | `/v1/parse-resume` | After resume row is created; body `{ text }` | Client exists (`python-ai.client.ts`). Python service missing. Contract: `{ success: true, data: ParsedResumeResult }`. |
| POST | `/v1/index-resume` | After candidate attach; chunk + embed + Qdrant | **Not started.** Must include `organization_id`, `candidate_profile_id`, `resume_id`. |

Do not index a resume that has no candidate (no name/email). Recruiters search people, not orphan chunks.

---

## 10. Resume ingestion pipeline

```text
Recruiter selects resumes
        ↓
Frontend extracts text
        ↓
Frontend requests S3 presigned URLs
        ↓
Frontend uploads original files to S3
        ↓
Frontend builds document manifests
        ↓
Node validates org/recruiter ownership
        ↓
Node creates Resume records
        ↓
Node sends extracted text to Python AI
        ↓
Python structured parse + normalize
        ↓
Node creates/updates Candidate Profile
        ↓
Python chunks + embeds + indexes in Qdrant
        ↓
Resume status = ready
```

**Implemented through Node today:** auth, org/recruiter stamp, storage-key org check, Resume create, fire-and-forget `scheduleResumeIngest`, Python parse HTTP client, Candidate upsert/attach when parse has name+email.

**Not implemented:** Python process, Qdrant index call, status `indexing` / `ready`, `indexedChunks` write after vectors.

If parse has no name/email, status stays `parsed` and `candidateId` stays unset. That is valid.

MVP may run this synchronously. Async queues, retries, and DLQ are deferred.

---

## 11. Chunking, embeddings, Qdrant

**Not started in the repo.** Do not embed an entire resume as one vector. Only index after a Candidate exists.

Preferred chunk types:

```text
PROFILE_SUMMARY
SKILLS
EXPERIENCE_1 … EXPERIENCE_N
PROJECT_1 … PROJECT_N
EDUCATION
CERTIFICATIONS
```

Each chunk / Qdrant point payload should include:

- `organization_id`, `recruiter_id`
- `candidate_profile_id`, `resume_id`
- `chunk_type`, `text`
- filter metadata: `city`, `total_experience_years`, `skills`, `current_role`, `companies`
- `embedding_version`

### EmbeddingService

```text
embed(text)
embed_many(texts)
```

MVP: sentence-transformers.  
Later: OpenAI, Azure OpenAI, Cohere, Voyage, etc.

Store embedding model and version. Never silently mix incompatible embedding spaces.

### Qdrant point (target)

```json
{
  "id": "unique-point-id",
  "vector": "...",
  "payload": {
    "organization_id": "org_123",
    "recruiter_id": "rec_123",
    "candidate_profile_id": "candidate_123",
    "resume_id": "resume_456",
    "chunk_type": "experience",
    "text": "Built Node.js microservices using AWS and Kafka.",
    "city": "bangalore",
    "total_experience_years": 6.5,
    "skills": ["node.js", "aws", "kafka"],
    "current_role": "senior backend engineer",
    "companies": ["ABC Technologies"],
    "embedding_version": "v1"
  }
}
```

MongoDB = business source of truth.  
Qdrant = vector/search database only.

---

## 12. Recruiter AI search pipeline

```text
Recruiter message
        ↓
Query understanding (LLM → structured filters + semantic query)
        ↓
Always inject organization_id from the logged-in recruiter
        ↓
Qdrant ANN + payload filters (Top-K chunks, e.g. 50)
        ↓
Candidate-level aggregation (recruiters want people, not chunks)
        ↓
Business ranking
        ↓
Reranking later (top 20–50 → top 5–10)
        ↓
Context builder
        ↓
LLM grounded answer
```

### Query understanding example

Input: `Find Node.js developers in Bangalore with 5+ years of experience.`

```json
{
  "skills": ["Node.js"],
  "city": "Bangalore",
  "minimumExperience": 5,
  "semanticQuery": "experienced Node.js backend developer"
}
```

### Deterministic vs semantic

Use **exact filters** for:

- `organization_id`
- city
- `total_experience_years >= N`
- company name equality when requested as exact

Do **not** use an LLM to decide `6.5 >= 5`.

Use **embeddings / ANN** for meaning:

- “experienced building scalable distributed backend systems”
- matching “event-driven microservices using Kafka”

ANN, HNSW, and cosine similarity run in Qdrant. Do not loop all candidates in application code to compute similarity.

### Candidate aggregation

50 chunks may belong to 18 candidates. Group by candidate, keep evidence and scores, return one record per person.

### Ranking weights (visible / configurable)

| Signal | Weight |
| --- | --- |
| Semantic relevance | 30% |
| Required skills | 30% |
| Experience | 15% |
| Role relevance | 10% |
| Company / domain | 10% |
| Preferred skills | 5% |

Retrieval score is not the final recruiter ranking.

### Conversational search state

Follow-ups accumulate structured filters, for example:

```json
{
  "skills": ["Node.js", "AWS", "Kafka"],
  "city": "Bangalore",
  "minimumExperience": 7
}
```

### Grounding rules

The LLM is the final reasoning layer, not the database.

May:

- understand natural language queries
- extract recruiter requirements
- explain matches, compare, summarize, follow up

Must not:

- invent skills, companies, years, or projects
- apply numeric/org/location authorization filters
- answer from general knowledge about a candidate

If a fact is missing from retrieved context, say it is unavailable. Keep candidate IDs and source resume IDs internally traceable.

### Hybrid search (after MVP)

Dense semantic + sparse/keyword + metadata filters, fused with Reciprocal Rank Fusion (or another explicit fusion).  
Keyword helps for exact tokens such as `Node.js`, `Snowflake Cortex Analyst`, `Kafka`.

---

## 13. Company history and jobs

Preserve on profile and in Qdrant metadata:

- current company
- previous companies
- role
- tenure
- domain
- company type later

Job-based search reuses the same retrieval stack:

```text
Job → structured requirements → retrieval → ranking → recommendations
```

Company enrichment is deferred.

---

## 14. MVP vs later

### MVP (do this)

| # | Item | Status |
| --- | --- | --- |
| 1 | Recruiter authentication | `done` (JWT; recruiter belongs to an organization) |
| 2 | PDF and DOCX selection | `planned` (frontend) |
| 3 | Browser text extraction | `planned` (frontend) |
| 4 | S3 direct upload | `planned` (presign API not built; key shape is already validated) |
| 5 | Document manifest submission | `done` for the Node API |
| 6 | Resume metadata creation | `done` (org-scoped) |
| 7 | Structured candidate extraction | `in progress` (Node client; Python `/v1/parse-resume` missing) |
| 8 | Candidate Profile creation | `in progress` (manual CRUD + ingest upsert; not org-unique yet) |
| 9 | Candidate deduplication | `in progress` (email upsert; must become org+email) |
| 10–12 | Chunk + embeddings + Qdrant | `planned` — **next backend slice after parse service** |
| 13–18 | Recruiter semantic search, filters, aggregation, ranking, grounded AI | `planned` — after vectors exist |

Do not start Recruiter chat collections, jobs, or hybrid/RRF until retrieval returns real people.

### Do not block MVP on

OCR, agents, LangGraph, complex queues, knowledge graphs, advanced reranking, complex company enrichment.

### After MVP is stable

Hybrid dense/sparse, BM25, RRF, cross-encoder reranking, job matching, recruiter conversations, query rewriting, company enrichment, batch ingestion, async processing, Redis, evaluation (Precision@K, Recall@K, MRR, NDCG), observability.

### Production (later, not all at once)

Async ingestion, workers, retries, DLQ, S3 lifecycle, embedding versioning, re-indexing, vector deletion sync, tracing, AI latency, cost tracking, API security, rate limiting.

---

## 15. Engineering principles

- Build incrementally: smallest correct version → test → inspect → improve.
- Keep retrieval understandable; avoid framework soup.
- Prefer explicit, testable modules.
- Comments should explain architectural/business relevance.
- When adding a file, it should be obvious: why it exists, inputs, outputs, how it connects, and what must not live there.

Teaching concepts this project should implement over time: RAG, embeddings, Qdrant, dense/sparse vectors, cosine similarity, ANN, HNSW, Top-K, metadata filtering, semantic vs keyword retrieval, hybrid search, chunking/overlap/structural chunks, ranking, reranking, RRF, cross-encoders, query understanding, structured outputs, context building, grounding, hallucination prevention, retrieval evaluation, embedding versioning, re-indexing, multi-tenancy, observability.

---

## 16. Implementation snapshot

Update this section when the repo changes. Snapshot date: **2026-09-18**.

### Exists today

| Area | Location | Notes |
| --- | --- | --- |
| Node Express app | `backend/src/app.ts` | Helmet, CORS, JSON 5mb (manifests), health, candidates, resumes, organization, recruiters |
| Env validation | `backend/src/config/env.ts` | `NODE_ENV`, `PORT`, `MONGODB_URI`, `CORS_ORIGIN`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `BCRYPT_ROUNDS`, `PYTHON_AI_BASE_URL` (default `http://localhost:8000`) |
| MongoDB connection | `backend/src/config/database.ts` | Mongoose |
| Health | `backend/src/modules/health/` | `GET /api/v1/health` |
| Organization | `backend/src/modules/organization/` | CRUD at `/api/v1/organization` |
| Recruiter auth | `backend/src/modules/recruiter/` + `auth.middleware.ts` | Register, login, JWT payload `{ recruiterId, organizationId, email, role }`, `GET /me`, list, deactivate |
| Candidate CRUD | `backend/src/modules/candidate/` | Auth required. Manual CRUD + ingest upsert by email. **Not org-scoped in queries/indexes yet.** |
| Resume module | `backend/src/modules/resume/` | Auth required. Manifest create (stamps org/recruiter, storage-key check, schedules ingest), org-scoped list/get |
| Python AI client | `backend/src/services/python-ai.client.ts` | `POST /v1/parse-resume` only |

Mounted HTTP APIs:

**Recruiters** (`/api/v1/recruiters`)

- `POST /register`, `POST /login`
- `GET /me`, `GET /`, `DELETE /:id` (auth)

**Organization** (`/api/v1/organization`)

- `POST /`, `GET /`, `GET /:id`, `PATCH /:id`, `DELETE /:id`

**Resumes** (`/api/v1/resumes`, auth)

- `POST /` — JSON manifest, 1–25 documents, optional `candidateId`
- `GET /` — org list; query `candidateId`, `recruiterId`, `mine`, `page`, `limit`
- `GET /:id` — org-scoped

**Candidates** (`/api/v1/candidates`, auth)

- `POST /`, `GET /`, `GET /:id`, `PATCH /:id`, `DELETE /:id`

### Extra fields already on Candidate (beyond the original JSON example)

- `currentSalary`
- `expectedSalary`
- `noticePeriod` (`immediate` \| `15_days` \| `30_days` \| `45_days` \| `60_days` \| `90_days` \| `serving`, with `lastWorkingDay` required when `serving`)

These are recruiter-ops fields. Keep them in MongoDB; they are not a substitute for semantic retrieval.

### Not started

- Next.js frontend (auth UI, file pick, client text extraction, S3 upload, talent UI, Recruiter AI chat)
- Python AI service (`ai-service/`)
- Qdrant collection, chunking, embeddings, indexing
- Node `index-resume` client and ingest statuses `indexing` / `ready`
- S3 + presigned upload generation
- Recruiter chat / search session
- Jobs, shortlists
- Ranking, RAG generation

### Next implementation slice (agreed)

1. FastAPI `POST /v1/parse-resume` matching Node’s `resumeAiResponseSchema`.
2. Candidate `organizationId` + unique `{ organizationId, email }`; stamp org from JWT; scope candidate CRUD and ingest upsert.
3. FastAPI `POST /v1/index-resume`: structural chunks, sentence-transformers, Qdrant points with `organization_id`.
4. Node ingest: after candidate attach → `indexing` → index call → `ready` + `indexedChunks`. Skip index when there is no candidate.
5. Only then: org-scoped semantic search (section 12).

### Known deviations from the original plan

| Plan | Current code | Decision |
| --- | --- | --- |
| Module name `candidate-profile` | `candidate` | Keep `candidate` unless we rename later |
| `organizationId` / `recruiterId` on every record | Resume create/list/get stamp and filter org from JWT. Candidate still lacks org field/index | Finish Candidate tenancy before Qdrant payloads; clients never send tenant IDs |
| Resume access = uploader only | Org-wide list; optional `mine` / `recruiterId` | Recruiter ID is attribution, not the tenant lock |
| Resume always linked to a candidate | `candidateId` optional; ingest skips profile create without name/email | Allowed. Do not vector-index unattached resumes |
| `sourceResumeIds` on profile | Present; ingest appends on upsert/attach | Keep |
| S3 presigned upload | Manifest + key regex exist; presign API not implemented | Backend must not accept multipart resume binaries |
| `originalFileName` / `fileSize` / `failureReason` / `candidateProfileId` | `originalFilename` / `sizeBytes` / `errorMessage` / `candidateId` | Keep current names |
| Unique candidate email globally | Still `{ email: 1 }` unique | Switch to `{ organizationId, email }` unique |
| JSON body size 1mb | `express.json({ limit: "5mb" })` | Needed for extracted-text manifests |

---

## 17. Capability status

| Capability | Status |
| --- | --- |
| Recruiter authentication | `done` |
| Organization tenancy | `in progress` (org + recruiter + resume scoped; candidate/Qdrant not yet) |
| Candidate CRUD (manual) | `in progress` (auth on; not org-filtered) |
| Resume metadata model | `done` for recruiter-upload metadata |
| PDF/DOCX MIME allow-list | `done` on manifest schema |
| Browser text extraction | `planned` |
| S3 presigned upload | `planned` |
| Document manifest API | `done` |
| Resume ingest orchestration | `in progress` (parse + candidate attach; no index) |
| Python structured parse | `in progress` (Node client; no FastAPI service) |
| Candidate deduplication | `in progress` (global email; must be per-org) |
| Chunking + embeddings | `planned` |
| Qdrant indexing | `planned` |
| Semantic search + filters | `planned` |
| Candidate aggregation | `planned` |
| Basic ranking | `planned` |
| Recruiter AI grounded response | `planned` |
| Conversational search state | `deferred` (post-MVP conversation polish; structured state still MVP-intent) |
| Hybrid / RRF / rerankers | `deferred` |
| Jobs / shortlists | `deferred` |
| OCR | `deferred` |
| Async queues | `deferred` |

---

## 18. Changelog

- **2026-09-05** — Created this reference from the product plan. Recorded current backend snapshot (health + candidate CRUD, resume model not routed, no frontend/AI/Qdrant/S3).
- **2026-09-05** — Aligned existing backend models: optional `organizationId`/`recruiterId`, candidate `source`/`sourceResumeIds`, ObjectId lookup bugfix, list-candidate query wiring. Auth, S3, Python, and Qdrant remain unstarted.
- **2026-09-18** — Synced with repo: JWT recruiter auth, organization module, org-scoped resume manifest API, ingest to `parsed` + optional candidate link, Python parse client only. Recorded ownership (resume is org-owned; `candidateId` optional; `recruiterId` is uploader). Next slice: FastAPI parse, candidate org uniqueness, Qdrant indexing, then Recruiter AI search. Frontend, S3 presign, jobs, and chat remain unstarted.
- **2026-09-18** — Pointed to `docs/PYTHON_AI_SERVICE_STUDY_GUIDE.md` from Related documents (not from the Python AI architecture section).
