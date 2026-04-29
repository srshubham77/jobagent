'use client'

import { useState } from 'react'
import { Button, ClosedSubTagPill, FitScore, Icon, Input, LogoChip, PipelineStatusPill, SalaryBadge, TierBadge } from './Atoms'
import type { AppData, Job, SalaryMode } from './types'

const SALARY_LABEL: Record<SalaryMode, string> = {
  explicit: 'USD explicit',
  implied:  'USD likely',
  unstated: 'Salary unstated',
}

export default function JobsFeed({ data, onOpen }: { data: AppData; onOpen: (j: Job) => void }) {
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const [activeId, setActiveId] = useState('jb_01')

  const filters = [
    { id: 'all',  label: 'All' },
    { id: 'usd',  label: 'USD only' },
    { id: 'high', label: 'Strong fit' },
    { id: 'new',  label: 'New today' },
  ]

  const filtered = data.jobs.filter(j => {
    if (filter === 'usd'  && j.salaryMode === 'unstated') return false
    if (filter === 'high' && j.fit < 80) return false
    if (filter === 'new'  && !j.postedAgo.includes('h')) return false
    if (q && !(`${j.title} ${j.company}`.toLowerCase().includes(q.toLowerCase()))) return false
    return true
  })

  return (
    <div className="page">
      <h1 className="page-title">Jobs</h1>
      <p className="page-sub">{filtered.length} matches · sorted by fit score</p>

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

      <div className="row-list">
        {filtered.map(j => (
          <div
            key={j.id}
            className={`job-row ${activeId === j.id ? 'active' : ''}`}
            onClick={() => { setActiveId(j.id); onOpen(j) }}
          >
            <FitScore value={j.fit} size={28} />
            <LogoChip char={j.logoChar} bg={j.logoBg} />
            <div>
              <div className="title">{j.title}</div>
              <div className="meta">{j.company} · {j.location}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                {j.salaryRange}
              </span>
              <SalaryBadge mode={j.salaryMode} label={SALARY_LABEL[j.salaryMode]} />
            </div>
            <TierBadge tier={j.tier} />
            {j.status === 'closed'
              ? <span style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}>
                  <PipelineStatusPill status={j.status} />
                  {j.closedTag && <ClosedSubTagPill tag={j.closedTag} />}
                </span>
              : <PipelineStatusPill status={j.status} />}
            <span className="when">{j.postedAgo}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
