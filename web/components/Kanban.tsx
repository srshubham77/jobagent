'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button, ClosedSubTagPill, FitScore, Icon, LogoChip, SalaryBadge } from './Atoms'
import type { ClosedTag, PipelineStatus, SalaryMode } from './types'
import type { FeedJob } from '../lib/api'
import { api } from '../lib/api'
import { logoChar, logoBg, salaryLabel, salaryMode } from '../lib/format'

interface KanbanJob {
  id: string; title: string; company: string; status: PipelineStatus
  closedTag?: ClosedTag; salaryMode: SalaryMode; salaryRange: string
  fit: number; tier: number; logoChar: string; logoBg: string
}

const COL_LABELS: Record<PipelineStatus, string> = {
  discovered: 'Discovered',
  drafted:    'Drafted',
  applied:    'Applied',
  active:     'Active',
  closed:     'Closed',
}
const COLS: PipelineStatus[] = ['discovered', 'drafted', 'applied', 'active', 'closed']
const SUBTAGS: ClosedTag[]   = ['offer', 'rejected', 'withdrawn', 'ghosted']
const SUBTAG_LABEL: Record<ClosedTag, string> = { offer: 'Offer', rejected: 'Rejected', withdrawn: 'Withdrawn', ghosted: 'Ghosted' }
const SALARY_LABEL: Record<SalaryMode, string> = { explicit: 'USD explicit', implied: 'USD likely', unstated: 'Salary unstated' }

interface PendingMove { jobId: string; fromIdx: number; toIdx: number; jobTitle: string; fromLabel: string; toLabel: string }

export default function Kanban({ jobs: feedJobs }: { jobs: FeedJob[] }) {
  const [jobs, setJobs] = useState<KanbanJob[]>([])
  const [loading, setLoading] = useState(true)
  const [closedFilter, setClosedFilter] = useState<'all' | ClosedTag>('all')
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null)

  const fitByJobId = Object.fromEntries(feedJobs.map(j => [j.jobId, j.fitScore]))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const apps = await api.getApplications()
      setJobs(apps.map(app => ({
        id: app.id,
        title: app.jobTitle,
        company: app.jobCompany,
        status: app.status as PipelineStatus,
        closedTag: app.closedTag as ClosedTag | undefined,
        salaryMode: salaryMode(app.jobSalaryMode) as SalaryMode,
        salaryRange: salaryLabel({
          salaryMinUsd: app.jobSalaryMinUsd,
          salaryMaxUsd: app.jobSalaryMaxUsd,
          salaryRaw: app.jobSalaryRaw,
        } as FeedJob),
        fit: fitByJobId[app.jobId] ?? 0,
        tier: app.jobTier,
        logoChar: logoChar(app.jobCompany),
        logoBg: logoBg(app.jobCompany),
      })))
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  const doMove = async (jobId: string, dir: number) => {
    setJobs(js => js.map(j => {
      if (j.id !== jobId) return j
      const idx = COLS.indexOf(j.status)
      const next = Math.max(0, Math.min(COLS.length - 1, idx + dir))
      const newStatus = COLS[next]
      const out = { ...j, status: newStatus }
      if (j.status === 'closed' && newStatus !== 'closed') delete out.closedTag
      if (newStatus === 'closed' && !j.closedTag) out.closedTag = 'rejected'
      return out
    }))

    const job = jobs.find(j => j.id === jobId)
    if (!job) return
    const idx = COLS.indexOf(job.status)
    const toIdx = Math.max(0, Math.min(COLS.length - 1, idx + dir))
    const newStatus = COLS[toIdx]
    const closedTag = newStatus === 'closed' ? (job.closedTag ?? 'rejected') : null
    try {
      await api.updateApplicationStatus(jobId, newStatus, closedTag)
    } catch {
      // Revert on failure
      load()
    }
  }

  const tryMove = (job: KanbanJob, dir: number) => {
    const fromIdx = COLS.indexOf(job.status)
    const toIdx = Math.max(0, Math.min(COLS.length - 1, fromIdx + dir))
    if (toIdx < fromIdx) {
      setPendingMove({ jobId: job.id, fromIdx, toIdx, jobTitle: job.title, fromLabel: COL_LABELS[COLS[fromIdx]], toLabel: COL_LABELS[COLS[toIdx]] })
    } else {
      doMove(job.id, dir)
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">Pipeline</h1>
      <p className="page-sub">Track every application from discovery to close. State transitions usually happen automatically as the agent submits and replies arrive.</p>

      {loading ? (
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--fg-muted)' }}>Loading pipeline…</div>
      ) : (
        <div className="kanban">
          {COLS.map(col => {
            let items = jobs.filter(j => j.status === col)
            if (col === 'closed' && closedFilter !== 'all') items = items.filter(j => j.closedTag === closedFilter)
            return (
              <div key={col} className="kcol">
                <div className="kcol-head">
                  <span className="name">{COL_LABELS[col]}</span>
                  <span className="count">{items.length}</span>
                </div>

                {col === 'closed' && (
                  <div className="kcol-subtabs">
                    <span className={`kcol-subtab ${closedFilter === 'all' ? 'active' : ''}`} onClick={() => setClosedFilter('all')}>All</span>
                    {SUBTAGS.map(t => (
                      <span key={t} className={`kcol-subtab ${closedFilter === t ? 'active' : ''}`} onClick={() => setClosedFilter(t)}>
                        {SUBTAG_LABEL[t]}
                      </span>
                    ))}
                  </div>
                )}

                {items.map(j => (
                  <div key={j.id} className="kcard">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <LogoChip char={j.logoChar} bg={j.logoBg} />
                      <FitScore value={j.fit} size={22} />
                      <span style={{ flex: 1 }} />
                      <span style={{ display: 'flex', gap: 2 }}>
                        <button className="btn ghost sm" style={{ padding: '4px 6px' }} onClick={() => tryMove(j, -1)}>
                          <Icon name="chevron-left" size={12} />
                        </button>
                        <button className="btn ghost sm" style={{ padding: '4px 6px' }} onClick={() => tryMove(j, 1)}>
                          <Icon name="chevron-right" size={12} />
                        </button>
                      </span>
                    </div>
                    <div className="kt">{j.title}</div>
                    <div className="km">{j.company}</div>
                    <div className="kr">
                      <SalaryBadge mode={j.salaryMode} label={SALARY_LABEL[j.salaryMode]} />
                    </div>
                    {col === 'closed' && j.closedTag && (
                      <div className="closed-tag"><ClosedSubTagPill tag={j.closedTag} /></div>
                    )}
                  </div>
                ))}

                {items.length === 0 && (
                  <div style={{ fontSize: 12, color: 'var(--fg-subtle)', padding: 16, textAlign: 'center' }}>
                    Nothing here yet.
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {pendingMove && (
        <div className="modal-scrim" onClick={() => setPendingMove(null)}>
          <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
            <h3>Move backward?</h3>
            <p>State transitions are usually automatic — only override if something went wrong. Move <b>{pendingMove.jobTitle}</b> from <b>{pendingMove.fromLabel}</b> back to <b>{pendingMove.toLabel}</b>?</p>
            <div className="modal-foot">
              <Button variant="ghost" size="sm" onClick={() => setPendingMove(null)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={() => { doMove(pendingMove.jobId, -1); setPendingMove(null) }}>Move backward</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
