'use client'

import { useState } from 'react'
import { Button, FitScore, Icon, Input, LogoChip, SalaryBadge, TierBadge } from './Atoms'
import type { FeedJob } from '../lib/api'
import { logoChar, logoBg, salaryLabel, salaryMode, salaryModeLabel, postedAgo, locationLabel } from '../lib/format'

export default function JobsFeed({
  jobs,
  loading,
  onOpen,
}: {
  jobs: FeedJob[]
  loading: boolean
  onOpen: (j: FeedJob) => void
}) {
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)

  const filters = [
    { id: 'all',  label: 'All' },
    { id: 'usd',  label: 'USD only' },
    { id: 'high', label: 'Strong fit (≥70)' },
    { id: 'new',  label: 'New today' },
  ]

  const filtered = jobs.filter(j => {
    if (filter === 'usd'  && salaryMode(j.salaryMode) === 'unstated') return false
    if (filter === 'high' && j.fitScore < 70) return false
    if (filter === 'new'  && j.postedAt && Date.now() - new Date(j.postedAt).getTime() > 86_400_000) return false
    if (q && !(`${j.title} ${j.company}`.toLowerCase().includes(q.toLowerCase()))) return false
    return true
  })

  return (
    <div className="page">
      <h1 className="page-title">Jobs</h1>
      <p className="page-sub">
        {loading ? 'Loading…' : `${filtered.length} matches · sorted by fit score`}
      </p>

      <div className="filter-bar">
        <Input
          placeholder="Search title or company"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        {filters.map(f => (
          <span
            key={f.id}
            className={`chip ${filter === f.id ? 'active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </span>
        ))}
        <span style={{ flex: 1 }} />
        <Button variant="secondary" size="sm"><Icon name="sliders" size={12} /> More filters</Button>
      </div>

      {loading ? (
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--fg-muted)' }}>Loading jobs…</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--fg-muted)' }}>
          No jobs match your filters.
        </div>
      ) : (
        <div className="row-list">
          {filtered.map(j => (
            <div
              key={j.scoreId}
              className={`job-row ${activeId === j.scoreId ? 'active' : ''}`}
              onClick={() => { setActiveId(j.scoreId); onOpen(j) }}
            >
              <FitScore value={j.fitScore} size={28} />
              <LogoChip char={logoChar(j.company)} bg={logoBg(j.company)} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.title}</div>
                <div className="meta">{j.company} · {locationLabel(j)}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start', flexShrink: 0 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                  {salaryLabel(j)}
                </span>
                <SalaryBadge mode={salaryMode(j.salaryMode)} label={salaryModeLabel(j.salaryMode)} />
              </div>
              <TierBadge tier={j.tier as 1 | 2 | 3} />
              <span className="when">{postedAgo(j.postedAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
