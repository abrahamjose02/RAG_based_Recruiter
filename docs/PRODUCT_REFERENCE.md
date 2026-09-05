# Recruiter AI Talent Platform — Product Reference

Living architecture and product source of truth for this repository.

Update this file whenever a capability, entity, API, pipeline, or scope decision changes. Do not treat the original planning chat as current once this document diverges.

| Field | Value |
| --- | --- |
| Last updated | 2026-09-05 |
| Status | MVP in progress |
| Primary user | Recruiter (not candidate-facing) |
| Goal | Recruiter-owned talent database + grounded Recruiter AI search |

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

---

## 5. Resume entity

Source document uploaded by the recruiter. A candidate may have multiple resumes over time.

### Target fields (product plan)

```json
{
  "_id": "resume_456",
  "organizationId": "org_123",
  "recruiterId": "rec_123",
  "candidateProfileId": "candidate_123",
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
  recruiter/
  organization/
  resume/
  candidate-profile/   # current code uses candidate/
  job/
  shortlist/
  recruiter-chat/
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

MVP may run this synchronously. Async queues, retries, and DLQ are deferred.

---

## 11. Chunking, embeddings, Qdrant

Do not embed an entire resume as one vector.

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

1. Recruiter authentication
2. PDF and DOCX selection
3. Browser text extraction
4. S3 direct upload
5. Document manifest submission
6. Resume metadata creation
7. Structured candidate extraction
8. Candidate Profile creation
9. Candidate deduplication
10. Chunk creation
11. Embeddings
12. Qdrant indexing
13. Recruiter semantic search
14. Metadata filtering
15. Top-K candidate retrieval
16. Candidate-level aggregation
17. Basic ranking
18. Recruiter AI response

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

Update this section when the repo changes. Snapshot date: **2026-09-05**.

### Exists today

| Area | Location | Notes |
| --- | --- | --- |
| Node Express app | `backend/src/app.ts` | Helmet, CORS, JSON 1mb, health + candidates |
| Env validation | `backend/src/config/env.ts` | `NODE_ENV`, `PORT`, `MONGODB_URI`, `CORS_ORIGIN` |
| MongoDB connection | `backend/src/config/database.ts` | Mongoose |
| Health module | `backend/src/modules/health/` | `GET /api/v1/health` |
| Candidate CRUD | `backend/src/modules/candidate/` | Routes, Zod (including list filters), controller, service, repository, model |
| Resume manifest ingestion | `backend/src/modules/resume/` | Mounted at `/api/v1/resumes`; accepts JSON document manifests from the client, persists client-extracted text, and rejects multipart resume binaries |

Candidate HTTP API currently mounted:

- `POST /api/v1/candidates`
- `GET /api/v1/candidates`
- `GET /api/v1/candidates/:id`
- `PATCH /api/v1/candidates/:id`
- `DELETE /api/v1/candidates/:id`

### Extra fields already on Candidate (beyond the original JSON example)

- `currentSalary`
- `expectedSalary`
- `noticePeriod` (`immediate` \| `15_days` \| `30_days` \| `45_days` \| `60_days` \| `90_days` \| `serving`, with `lastWorkingDay` required when `serving`)

These are recruiter-ops fields. Keep them in MongoDB; they are not a substitute for semantic retrieval.

### Not started

- Next.js frontend
- Recruiter / Organization modules and authentication
- Python AI service
- Qdrant
- S3 + presigned uploads
- Recruiter chat / search session
- Jobs, shortlists
- Chunking, embeddings, ranking, RAG

### Known deviations from the original plan

| Plan | Current code | Decision |
| --- | --- | --- |
| Module name `candidate-profile` | `candidate` | Keep `candidate` unless we rename later |
| `organizationId` / `recruiterId` on every record | Optional on Candidate and Resume models; not accepted on create/update APIs | Auth will populate these; clients must not send tenant IDs |
| `sourceResumeIds` on profile | Present on Candidate (`source` defaults to `manual`) | Ingestion will append resume IDs |
| S3 presigned upload | Document manifest schema exists; presigned URL generation not implemented | Backend should not accept multipart resume binaries |
| `originalFileName` / `fileSize` / `failureReason` | `originalFilename` / `sizeBytes` / `errorMessage` | Keep current names unless we standardize |
| Resume HTTP module | Manifest create/list/read routes mounted | Backend accepts JSON manifests only; PDF/DOCX parsing stays in the client |
| Unique candidate email globally | Still unique on `email`; org+email index added | Switch uniqueness to per-organization when auth exists |

---

## 17. Capability status

| Capability | Status |
| --- | --- |
| Recruiter authentication | `planned` |
| Organization tenancy | `planned` |
| Candidate CRUD (manual) | `in progress` |
| Resume metadata model | `in progress` |
| PDF/DOCX MIME allow-list | `in progress` |
| Browser text extraction | `planned` |
| S3 presigned upload | `planned` |
| Document manifest API | `in progress` |
| Python structured parse | `planned` |
| Candidate deduplication | `planned` |
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
