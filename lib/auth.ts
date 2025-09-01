export interface VoterSession {
  id: number
  ldap_nickname: string
  team_id: number
  voter_group: "A" | "B" | "C"
  has_voted_idea: boolean
  has_voted_implementation: boolean
  created_at: string
}

export function getVoterSession(): VoterSession | null {
  if (typeof window === "undefined") return null

  try {
    const session = sessionStorage.getItem("voterSession")
    return session ? JSON.parse(session) : null
  } catch {
    return null
  }
}

export function updateVoterSession(updates: Partial<VoterSession>): void {
  if (typeof window === "undefined") return

  const currentSession = getVoterSession()
  if (!currentSession) return

  const updatedSession = { ...currentSession, ...updates }
  sessionStorage.setItem("voterSession", JSON.stringify(updatedSession))
}

export function clearVoterSession(): void {
  if (typeof window === "undefined") return
  sessionStorage.removeItem("voterSession")
}
