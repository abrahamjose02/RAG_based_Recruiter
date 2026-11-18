import type { CandidateFilters } from "./types"

export const queryKeys = {
  candidates: (filters: CandidateFilters) =>
    ["candidates", filters] as const,
  candidate: (id: string) => ["candidate", id] as const,
  resumes: (page: number) => ["resumes", page] as const,
}