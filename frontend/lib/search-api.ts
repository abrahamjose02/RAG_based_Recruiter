import { api } from "./api"
import type { SearchResponse } from "./types"

export function searchResumes(query: string): Promise<SearchResponse> {
  return api<SearchResponse>("/api/v1/search", {
    method: "POST",
    body: { query },
  })
}