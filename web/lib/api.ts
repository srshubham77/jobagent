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
  versionNumber?: number
  createdAt?: string
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

export interface ApplicationItem {
  id: string
  jobId: string
  jobTitle: string
  jobCompany: string
  jobLocation: string | null
  jobApplyUrl: string | null
  jobSalaryMode: string
  jobSalaryMinUsd: number | null
  jobSalaryMaxUsd: number | null
  jobSalaryRaw: string | null
  jobTier: number
  jobPostedAt: string | null
  status: string
  closedTag: string | null
  submittedAt: string | null
  createdAt: string
}

export interface Story {
  id: string
  title: string
  situation: string
  action: string
  result: string
  metrics: string | null
  themes: string[]
  createdAt: string
  updatedAt: string
}

export interface StoryInput {
  title: string
  situation: string
  action: string
  result: string
  metrics?: string
  themes: string[]
}

export interface TrackerStatus {
  connected: boolean
  lastEventAt: string | null
  totalEvents: number
}

export interface DraftSummary {
  id: string
  jobId: string
  status: string
  coverLetterPreview: string | null
  answerCount: number
  createdAt: string
}

// Snake-case version returned by the apply service
interface DraftSummaryRaw {
  id: string
  job_id: string
  status: string
  cover_letter_preview: string | null
  answer_count: number
  created_at: string
}

// Snake-case ApplicationItem returned by the apply service
interface ApplicationItemRaw {
  id: string
  job_id: string
  job_title: string
  job_company: string
  job_location: string | null
  job_apply_url: string | null
  job_salary_mode: string
  job_salary_min_usd: number | null
  job_salary_max_usd: number | null
  job_salary_raw: string | null
  job_tier: number
  job_posted_at: string | null
  status: string
  closed_tag: string | null
  submitted_at: string | null
  created_at: string
}

function toCamelApp(raw: ApplicationItemRaw): ApplicationItem {
  return {
    id: raw.id,
    jobId: raw.job_id,
    jobTitle: raw.job_title,
    jobCompany: raw.job_company,
    jobLocation: raw.job_location,
    jobApplyUrl: raw.job_apply_url,
    jobSalaryMode: raw.job_salary_mode,
    jobSalaryMinUsd: raw.job_salary_min_usd,
    jobSalaryMaxUsd: raw.job_salary_max_usd,
    jobSalaryRaw: raw.job_salary_raw,
    jobTier: raw.job_tier,
    jobPostedAt: raw.job_posted_at,
    status: raw.status,
    closedTag: raw.closed_tag,
    submittedAt: raw.submitted_at,
    createdAt: raw.created_at,
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } })
  if (!res.ok) throw new Error(`API ${path} returned ${res.status}`)
  return res.json() as Promise<T>
}

export const api = {
  // Profile
  getProfile:     () => apiFetch<Profile | null>('/api/profile'),
  uploadResume:   (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return fetch('/api/resume', { method: 'POST', body: form })
      .then(r => { if (!r.ok) throw new Error(`Resume upload failed: ${r.status}`); return r.json() as Promise<Profile> })
  },

  // Preferences
  getPreferences: () => apiFetch<Preferences>('/api/preferences'),
  setPreferences: (patch: Partial<Preferences>) =>
    apiFetch<Preferences>('/api/preferences', { method: 'PUT', body: JSON.stringify(patch) }),

  // Jobs feed
  getJobs: () => apiFetch<FeedJob[]>('/api/jobs'),

  // Applications (kanban)
  getApplications: () =>
    fetch('/api/applications', { cache: 'no-store' })
      .then(r => r.ok ? r.json() as Promise<ApplicationItemRaw[]> : Promise.resolve([]))
      .then(raw => raw.map(toCamelApp)),
  updateApplicationStatus: (id: string, status: string, closedTag?: string | null) =>
    fetch(`/api/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, closed_tag: closedTag ?? null }),
    }).then(r => r.json() as Promise<ApplicationItemRaw>).then(toCamelApp),

  // Drafts
  createDraft: (jobId: string) =>
    apiFetch<DraftSummaryRaw>('/api/drafts', {
      method: 'POST',
      body: JSON.stringify({ job_id: jobId }),
    }).then(raw => ({
      id: raw.id,
      jobId: raw.job_id,
      status: raw.status,
      coverLetterPreview: raw.cover_letter_preview,
      answerCount: raw.answer_count,
      createdAt: raw.created_at,
    } as DraftSummary)),

  // Stories
  getStories:    () => apiFetch<Story[]>('/api/stories'),
  createStory:   (data: StoryInput) => apiFetch<Story>('/api/stories', { method: 'POST', body: JSON.stringify(data) }),
  updateStory:   (id: string, data: Partial<StoryInput>) =>
    apiFetch<Story>(`/api/stories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStory:   (id: string) =>
    fetch(`/api/stories/${id}`, { method: 'DELETE' }).then(r => { if (!r.ok && r.status !== 204) throw new Error(`Delete failed: ${r.status}`) }),

  // Tracker / Gmail
  getTrackerStatus: () => apiFetch<TrackerStatus>('/api/tracker/status'),
  disconnectGmail:  () => apiFetch<void>('/api/tracker/auth', { method: 'DELETE' }),
  syncGmail:        () => apiFetch<{ processed: number }>('/api/tracker/sync', { method: 'POST' }),

  // Discovery
  triggerCrawl: () => apiFetch<unknown>('/api/crawl', { method: 'POST' }),
}
