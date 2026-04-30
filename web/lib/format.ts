import type { FeedJob } from './api'

export function logoChar(company: string) {
  return company.trim()[0]?.toUpperCase() ?? '?'
}

export function logoBg(company: string) {
  const colors = ['#1A1A1A', '#3F6B8C', '#3D7A4E', '#D9663E', '#5E6AD2', '#6B6555', '#3D3056', '#4A4639']
  let hash = 0
  for (let i = 0; i < company.length; i++) hash = company.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

/** Strip HTML tags from a string. */
function stripHtml(s: string) {
  return s.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, ' ').trim()
}

export function salaryLabel(job: FeedJob) {
  if (job.salaryMinUsd && job.salaryMaxUsd)
    return `$${Math.round(job.salaryMinUsd / 1000)}k – $${Math.round(job.salaryMaxUsd / 1000)}k`
  if (job.salaryMinUsd)
    return `$${Math.round(job.salaryMinUsd / 1000)}k+`
  if (job.salaryRaw) {
    const clean = stripHtml(job.salaryRaw)
    if (clean.length > 0 && clean.length < 60) return clean
  }
  return 'Salary unstated'
}

/** Normalize salary mode from DB values (usd_explicit) to UI values (explicit). */
export function salaryMode(raw: string): 'explicit' | 'implied' | 'unstated' {
  if (raw === 'usd_explicit' || raw === 'explicit') return 'explicit'
  if (raw === 'usd_implied'  || raw === 'implied')  return 'implied'
  return 'unstated'
}

export function salaryModeLabel(raw: string) {
  const mode = salaryMode(raw)
  return { explicit: 'USD explicit', implied: 'USD likely', unstated: 'Salary unstated' }[mode]
}

export function postedAgo(postedAt: string | null) {
  if (!postedAt) return ''
  const diff = Date.now() - new Date(postedAt).getTime()
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}

export function locationLabel(job: FeedJob) {
  if (job.location) return job.location
  return job.remote ? 'Remote' : ''
}
