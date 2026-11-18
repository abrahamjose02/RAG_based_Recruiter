import { api } from "./api"
import type { SessionRecruiter } from "./session"

type LoginResult = {
  token: string
  recruiter: SessionRecruiter
}

export function loginRecruiter(email: string, password: string) {
  return api<LoginResult>("/api/v1/recruiters/login", {
    method: "POST",
    body: { email, password },
  })
}

export function getCurrentRecruiter(token: string) {
  return api<SessionRecruiter>("/api/v1/recruiters/me", { token })
}