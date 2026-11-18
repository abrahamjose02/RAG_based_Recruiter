export type SessionRecruiter = {
    id: string
    email: string
    firstName: string
    lastName: string
    organizationId: string
    role: string
  }
  
  export type Session = {
    token: string
    recruiter: SessionRecruiter
  }
  
  const STORAGE_KEY = "recruiter.session"
  
  export function readSession(): Session | null {
    if (typeof window === "undefined") return null
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
  
    try {
      return JSON.parse(raw) as Session
    } catch {
      return null
    }
  }
  
  export function writeSession(session: Session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  }
  
  export function clearSession() {
    localStorage.removeItem(STORAGE_KEY)
  }