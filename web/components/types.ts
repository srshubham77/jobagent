export type SalaryMode = 'explicit' | 'implied' | 'unstated'
export type PipelineStatus = 'discovered' | 'drafted' | 'applied' | 'active' | 'closed'
export type ClosedTag = 'offer' | 'rejected' | 'withdrawn' | 'ghosted'
export type Tier = 1 | 2 | 3

export interface NetworkContact {
  name: string
  title: string
  degree: number
  mutual: string | null
  avatar: string
  avatarBg: string
}

export interface ActivityItem {
  kind: string
  icon: string
  text: string
  when: string
}

export interface Job {
  id: string
  title: string
  company: string
  logoChar: string
  logoBg: string
  location: string
  postedAgo: string
  salaryMode: SalaryMode
  salaryRange: string
  fit: number
  status: PipelineStatus
  closedTag?: ClosedTag
  tier: Tier
  stack: string[]
  // extended (job detail drawer)
  sourceUrl?: string
  fitBreakdown?: { label: string; value: number }[]
  skills?: { name: string; have: boolean }[]
  questions?: { q: string; a: string; source: string }[]
  network?: NetworkContact[]
  activity?: ActivityItem[]
}

export interface User {
  name: string
  email: string
  avatarMonogram: string
}

export interface JdBlock {
  kind: 'p' | 'h' | 'ul'
  text?: string
  items?: string[]
}

export interface AppData {
  user: User
  agent: {
    running: boolean
    lastSync: string
    appliedToday: number
    appliedThisWeek: number
    costMonth: number
    costCap: number
  }
  pipelineCounts: Record<PipelineStatus, number>
  funnel: {
    discovered: number
    drafted: number
    applied: number
    active: number
    offer: number
    responseRate: number
  }
  jobs: Job[]
  weekly: { day: string; applied: number; responses: number }[]
  pipeline: PipelineStatus[]
  closedSubTags: ClosedTag[]
  replyBySource: { source: string; rate: number; applied: number }[]
  replyByVariant: { variant: string; rate: number; applied: number; leader?: boolean }[]
  draftedJob: Job
  jdBody: JdBlock[]
}
