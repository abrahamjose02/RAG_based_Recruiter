# Recruiter AI Talent Platform — Product Reference

Living architecture and product source of truth for this repository.

This product is **YMinds.ai’s Recruiter AI service**: one shared talent pool loaded by in-house recruiters. Recruiter AI search (later) is public and returns about five people to view without login.

| Field | Value |
| --- | --- |
| Last updated | 2026-09-21 |
| Status | MVP in progress |
| Operator | YMinds.ai |
| Primary users | In-house recruiters (JWT: upload / edit / list). Anonymous users (later Recruiter AI top-5) |
| Goal | Shared talent database + grounded Recruiter AI search |
| Current slice | Global candidate by email; dual vectors; login is in-house only. No client accounts. `GET /candidates` stays authenticated. |

---

## How to maintain this document

When application behavior changes, update:

1. **Implementation snapshot**
2. **Capability status**
3. **Domain objects**
4. **Pipelines**
5. **Deviations**
6. **Changelog**

Status values: `planned` / `in progress` / `done` / `deferred`.

---

## 1. Product vision

YMinds.ai in-house recruiters load the talent pool (login required). Recruiter AI is **open**: anyone can search and see about **five** matching candidates without credentials. The full candidate list API is **not** public.

```text
In-house recruiter (JWT)
  → Upload resumes / edit candidate fields
  → Parse (TypeScript AI)
  → Create or attach Candidate by email
  → Chunk resume + candidate profile
  → Embed + Qdrant (one global index)
Anyone (no login)
  → Recruiter AI search (later)
  → Top ~5 candidates + those profiles
```

The differentiator is the **Recruiter AI search experience** over YMinds’ indexed pool.

Target queries (same as before): Node.js in Bangalore with 5+ years, AWS/Kafka, fintech, previous employers, GenAI, employment stability, product companies, compare top five, backend architecture, company switches, SaaS domain.

Recruiter AI must use **only facts from the indexed YMinds talent pool**.

---

## 2. Actors

### In-house recruiter

JWT login. Can upload resumes, create/edit/delete candidates, list the full pool, list source resumes, and use Recruiter AI.

### Anonymous Recruiter AI user

No account, no session. When the search API exists: natural-language search and **view of those top ~5 results only**. Cannot call `GET /candidates` to browse the pool. Cannot upload or edit.

### Candidate

No candidate login. `Candidate` is an internal person record in the YMinds pool.

---

## 3. Domain objects

| Entity | Role | Store |
| --- | --- | --- |
| Recruiter | In-house authenticated user | MongoDB |
| Organization | Optional login grouping for in-house staff. **Not** a talent tenant | MongoDB |
| Resume | Source document uploaded by a YMinds recruiter | MongoDB metadata + S3 (planned) |
| Candidate | Global person, unique by email | MongoDB |
| Job / Shortlist / Conversation | Later | MongoDB |

Talent (Candidate, Resume content, Qdrant) is **one pool**. Organization does not partition people or vectors.

### Ownership

| Entity | `organizationId` | `recruiterId` | `candidateId` |
| --- | --- | --- | --- |
| Recruiter | Login org for in-house staff | N/A | N/A |
| Resume | Audit: uploader’s org. Not a search tenant | Who uploaded | Set after parse when name+email exist |
| Candidate | **None** | None | Unique `email`. `sourceResumeIds` grows with resumes |
| Qdrant point | **None** as search tenant | Optional `uploaded_by_recruiter_id` | Required `candidate_profile_id` |

No client recruiter records or sessions. Write and full-list APIs require an in-house JWT. Recruiter AI search (later) has no auth.

---

## 4. Candidate Profile

One person in the pool. Identity = **email**.

No `organizationId`. Do not append org IDs when another resume arrives.

```json
{
  "_id": "candidate_123",
  "name": "Rahul Sharma",
  "email": "rahul@example.com",
  "phone": "+91...",
  "location": { "city": "Bangalore", "state": "Karnataka", "country": "India" },
  "skills": ["Node.js", "AWS", "Kafka", "MongoDB"],
  "totalExperienceYears": 6.5,
  "currentRole": "Senior Backend Engineer",
  "professionalSummary": "...",
  "experience": [],
  "education": [],
  "source": "resume_upload",
  "sourceResumeIds": ["resume_456"],
  "createdAt": "...",
  "updatedAt": "..."
}
```

Dedup: match email. If missing → create. If present → `$addToSet` `sourceResumeIds` and refresh profile from the latest parse.

---

## 5. Resume

YMinds in-house upload. Manifest API (extracted text + storage key). Status: `uploaded` → `processing` → `parsed` → `indexing` → `ready` | `failed`.

Storage key layout may use `organizations/{ymindsOrgId}/resumes/...` as S3 prefix for the operator. That is not client tenancy.

---

## 6. System architecture

```text
     In-house portal (JWT)              Recruiter AI (public, later)
     upload / edit / full list          search → top 5 view
            \                            /
             \                          /
                    Express API
                 ┌─────────┼─────────┐
                 ▼         ▼         ▼
             MongoDB    JWT auth    src/ai
             (pool)     (writes)    parse / chunk / embed
                                         ▼
                                   Qdrant (one index)
                                         ▼
                              Recruiter AI retrieval
```

### Responsibility split

| Layer | Owns | Must not own |
| --- | --- | --- |
| In-house portal | Login, upload, candidate edit, full list | Embeddings, ranking |
| Recruiter AI UI | Public search + those 5 profiles | Resume upload, `GET /candidates` list |
| Node domain | Auth for in-house staff, candidate/resume CRUD, ingest | Vector internals |
| Node `src/ai` | Hybrid parse, resume+candidate chunking, embed, index, search helper | Auth, Mongo SoT |
| MongoDB | People and resume metadata | Dense vectors |
| Qdrant | Chunks and embeddings | Recruiter accounts |
| S3 | Original files | Parsed profiles |

---

## 7. Frontend

Stack: **Next.js** (not started). One staff app (login, ingest, edit). Recruiter AI UI is public (search + top-5 view), no client login.

---

## 8. Node.js backend

Stack: Node.js, TypeScript, Express, MongoDB, Mongoose, Zod.

```text
src/modules/
  recruiter/        # register/login JWT (in-house staff)
  organization/     # optional staff grouping
  resume/           # JWT manifest + ingest
  candidate/        # all routes JWT (including GET list)
src/ai/             # parse, chunk, embed, Qdrant
```

All candidate and resume routes use `authMiddleware`. Recruiter AI search (later) will be unauthenticated and return ~5 people.

---

## 9. TypeScript AI layer

```text
backend/src/ai/
  providers/openai.ts, llm.ts, embeddings.ts
  infrastructure/qdrant.ts
  services/contactExtract.ts, resumeParser.ts, chunking.ts, indexing.ts
  repositories/vector.repository.ts
```

Hybrid parse: regex owns email/phone; LLM fills the rest; Zod validates `parsedResumeResultSchema`.

Do not use LangChain.

---

## 10. Resume ingestion

```text
YMinds selects resumes
        ↓
Frontend extracts text, uploads original (S3 later)
        ↓
POST /api/v1/resumes (in-house JWT)
        ↓
parseResumeText
        ↓
email missing in Mongo → create Candidate + sourceResumeIds
email exists → attach resumeId, refresh profile
        ↓
chunk resume fields + chunk candidate profile
        ↓
embed + Qdrant upsert
        ↓
status ready
```

No name+email → stay `parsed`, no candidate, no index.

---

## 11. Chunking, embeddings, Qdrant

One collection (`resume_chunks`), 1536-d cosine, `text-embedding-3-small`. Local: `docker compose up -d`.

**Resume chunks:** `PROFILE_SUMMARY`, `SKILLS`, `EXPERIENCE_*`, `EDUCATION_*`. Payload `source: resume`.

**Candidate chunks:** `CANDIDATE_PROFILE`, `CANDIDATE_SKILLS`, `CANDIDATE_EXPERIENCE_*`, `CANDIDATE_EDUCATION_*`. Payload `source: candidate`.

Re-index: delete resume points by `resume_id` + `source=resume`; delete candidate points by `candidate_profile_id` + `source=candidate`; upsert both.

Payload (no org tenant): `source`, `candidate_profile_id`, `resume_id`, `chunk_type`, `text`, `city`, `total_experience_years`, `skills`, `current_role`, `companies`, `embedding_version`, optional `uploaded_by_recruiter_id`.

`vectorRepository.search()` is global (optional city / skills / experience / source filters). Not org-scoped.

---

## 12. Recruiter AI search pipeline

Planned HTTP API. Helper already exists.

```text
Query understanding (LLM → filters + semantic query)
        ↓
Qdrant ANN + payload filters (Top-K chunks)
        ↓
Aggregate by candidate
        ↓
Business ranking → later rerank
        ↓
Grounded LLM answer from retrieved facts only
```

Exact filters: city, `total_experience_years >= N`, company equality. Not org. Not LLM for `6.5 >= 5`.

Ranking weights: semantic 30%, skills 30%, experience 15%, role 10%, company/domain 10%, preferred skills 5%.

Grounding: no invented skills/companies/years; if missing from context, say unavailable.

---

## 13. MVP vs later

| # | Item | Status |
| --- | --- | --- |
| 1 | In-house recruiter JWT | `done` |
| 2 | Organization as staff grouping | `done` |
| 3 | Public Recruiter AI top-5 (no login) | `planned` |
| 4 | Staff Next.js app | `planned` |
| 5 | Browser extract + S3 | `planned` |
| 6 | Manifest + ingest | `done` |
| 7 | Global candidate by email | `done` |
| 8 | Resume + candidate vectors | `done` |
| 9 | Recruiter AI search HTTP | `planned` |

Deferred: hybrid/RRF, jobs, queues, OCR, LangGraph.

---

## 14. Engineering principles

Incremental, explicit modules, no framework soup. Scale ingest later with a job queue, not a second AI HTTP service.

---

## 15. Implementation snapshot

Snapshot date: **2026-09-21**.

| Area | Location | Notes |
| --- | --- | --- |
| Express app | `backend/src/app.ts` | Health, candidates, resumes, organization, recruiters |
| Env | `backend/src/config/env.ts` | Mongo, JWT, OpenAI, Qdrant |
| Recruiter | `backend/src/modules/recruiter/` | JWT for in-house staff. No `accountType` |
| Auth | `auth.middleware.ts` | JWT on candidate and resume routes. No `requireYminds` |
| Candidate | `backend/src/modules/candidate/` | No `organizationId`; unique email; GET list requires JWT |
| Resume | `backend/src/modules/resume/` | JWT; ingest create-or-attach by email |
| AI | `backend/src/ai/` | Hybrid parse; resume+candidate chunks; global Qdrant search helper |
| Qdrant | `docker-compose.yml` | Collection ensured on bootstrap |

**APIs**

- Recruiters: `POST /register`, `POST /login`, `GET /me`, list/deactivate
- Candidates: all JWT — `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id`
- Resumes: all JWT — `POST /`, `GET /`, `GET /:id`

### Next slice

Public Recruiter AI search HTTP API (`vectorRepository.search()`), returning about five candidates to view without login. Do not open `GET /candidates`.

### Known deviations

| Earlier plan | Current product |
| --- | --- |
| Every candidate/resume/vector belongs to an organization | One YMinds pool. Org is login account only |
| Unique `{ organizationId, email }` | Unique email globally |
| Clients upload their own talent | Only in-house recruiters upload |
| Client login + `accountType` | Removed. Recruiter AI (later) is public top-5; full list stays JWT |
| Qdrant filter `organization_id` | Global search; optional `uploaded_by_recruiter_id` |

---

## 16. Capability status

| Capability | Status |
| --- | --- |
| Recruiter authentication | `done` (in-house JWT) |
| Operator vs client `accountType` | `deferred` / removed |
| Client sessions | `deferred` |
| Organization grouping | `done` |
| Staff frontend | `planned` |
| Candidate CRUD | `done` (all JWT, including GET list) |
| Resume ingest | `done` through `ready` |
| Structured parse | `done` |
| Candidate dedup by email | `done` |
| Resume + candidate embeddings | `done` |
| Qdrant global index | `done` |
| Semantic search HTTP (public top-5) | `planned` |
| Grounded Recruiter AI | `planned` |
| S3 / OCR / queues / jobs | `deferred` or `planned` as above |

---

## 17. Changelog

- **2026-09-05** — Created this reference.
- **2026-09-18** — JWT, org module, resume manifest, Python parse client (later removed).
- **2026-09-21** — TypeScript AI in Express; Qdrant ingest.
- **2026-09-21** — Product model: YMinds operator vs client consumers. Candidate is a global person (email). Organization is not a talent tenant. Resume and candidate chunks share one Qdrant index. `accountType` gates write APIs.
- **2026-09-21** — Removed `accountType` and client sessions. Login is in-house recruiters only. `GET /candidates` stays JWT. Recruiter AI (later) is unauthenticated and shows about five search results.
