import { api } from "./api"
import type { Candidate, CandidateFilters, CandidateList } from "./types"

type CandidateDocument = Omit<Candidate, "id"> & { _id: string }

function toCandidate(document: CandidateDocument): Candidate {
  const { _id, ...rest } = document
  return { id: _id, ...rest }
}

export function listCandidates(filters: CandidateFilters, token: string) {
  return api<{ items: CandidateDocument[]; total: number }>(
    "/api/v1/candidates",
    { token, query: filters }
  ).then((data) => ({
    items: data.items.map(toCandidate),
    total: data.total,
  }))
}

export function getCandidate(id: string, token: string) {
  return api<CandidateDocument>(`/api/v1/candidates/${id}`, { token }).then(
    toCandidate
  )
}

export function saveCandidate(
  id: string | null,
  input: Partial<Candidate>,
  token: string
) {
  const path = id ? `/api/v1/candidates/${id}` : "/api/v1/candidates"
  return api<CandidateDocument>(path, {
    method: id ? "PATCH" : "POST",
    token,
    body: input,
  }).then(toCandidate)
}

export function deleteCandidate(id: string, token: string) {
  return api<{ id: string }>(`/api/v1/candidates/${id}`, {
    method: "DELETE",
    token,
  })
}