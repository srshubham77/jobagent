export interface Preferences {
  agentEnabled: boolean
  targetTitle: string | null
  targetStack: string[] | null
  minSalary: number | null
  location: string | null
  autoApplyThreshold: number
  usdOnly: boolean
}

export interface ScoredJob {
  id: string
  title: string
  company: string
  location: string | null
  remote: boolean
  salaryMode: string
  salaryMinUsd: number | null
  salaryMaxUsd: number | null
  salaryRaw: string | null
  applyUrl: string | null
  tier: number
  postedAt: string | null
  fitScore: number
  breakdown: Record<string, unknown>
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } })
  if (!res.ok) throw new Error(`API ${path} returned ${res.status}`)
  return res.json() as Promise<T>
}

export const api = {
  getPreferences: () => apiFetch<Preferences>('/api/preferences'),
  setPreferences: (patch: Partial<Preferences>) =>
    apiFetch<Preferences>('/api/preferences', { method: 'PUT', body: JSON.stringify(patch) }),
  getJobs: (page = 0) => apiFetch<ScoredJob[]>(`/api/jobs?page=${page}`),
}
