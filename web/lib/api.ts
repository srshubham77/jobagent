export interface Preferences {
  agentEnabled: boolean
  targetTitle: string | null
  targetStack: string[] | null
  minSalary: number | null
  location: string | null
  autoApplyThreshold: number
  usdOnly: boolean
}

export interface Profile {
  id: string
  userId: string
  contact: {
    name: string | null
    email: string | null
    phone: string | null
    location: string | null
    linkedin: string | null
  }
  summary: string | null
  skills: string[]
  experience: {
    company: string
    title: string
    startDate: string | null
    endDate: string | null
    bullets: string[]
  }[]
  education: {
    institution: string
    degree: string | null
    field: string | null
    graduationDate: string | null
  }[]
}

export interface FeedJob {
  scoreId: string
  jobId: string
  title: string
  company: string
  location: string | null
  remote: boolean
  source: string
  salaryMode: 'explicit' | 'implied' | 'unstated'
  salaryMinUsd: number | null
  salaryMaxUsd: number | null
  salaryRaw: string | null
  applyUrl: string | null
  tier: number
  postedAt: string | null
  fitScore: number
  skillOverlap: number | null
  seniorityMatch: number | null
  salaryFit: number | null
  breakdown: {
    skills_matched?: string[]
    skills_missing?: string[]
    seniority_gap?: string
    salary_note?: string
    recency?: number
    [key: string]: unknown
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } })
  if (!res.ok) throw new Error(`API ${path} returned ${res.status}`)
  return res.json() as Promise<T>
}

export const api = {
  getProfile:     () => apiFetch<Profile | null>('/api/profile'),
  getPreferences: () => apiFetch<Preferences>('/api/preferences'),
  setPreferences: (patch: Partial<Preferences>) =>
    apiFetch<Preferences>('/api/preferences', { method: 'PUT', body: JSON.stringify(patch) }),
  getJobs: () => apiFetch<FeedJob[]>('/api/jobs'),
}
