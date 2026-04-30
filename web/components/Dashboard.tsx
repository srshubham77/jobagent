'use client'

import { Button, FitScore, Icon, LogoChip, SalaryBadge } from './Atoms'
import type { FeedJob } from '../lib/api'
import { logoChar, logoBg, salaryLabel, salaryMode, locationLabel } from '../lib/format'

export default function Dashboard({
  jobs,
  agentRunning,
  userName,
  loading,
}: {
  jobs: FeedJob[]
  agentRunning: boolean
  userName: string
  loading: boolean
}) {
  const firstName = userName.split(' ')[0]
  const topJobs = jobs.slice(0, 5)
  const totalJobs = jobs.length
  const strongFit = jobs.filter(j => j.fitScore >= 70).length

  return (
    <div className="page">
      <h1 className="page-title">Good afternoon, {firstName}.</h1>
      <p className="page-sub">
        {agentRunning
          ? 'The agent is looking. Check back soon for new matches.'
          : 'The agent is paused. Resume it to keep looking.'}
      </p>

      <div className="stat-grid stat-grid-5 mb-6">
        <div className="stat-card">
          <div className="stat-label">Discovered</div>
          <div className="stat-num">{loading ? '–' : totalJobs}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Strong fit</div>
          <div className="stat-num stat-accent">{loading ? '–' : strongFit}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Drafted</div>
          <div className="stat-num">0</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Applied</div>
          <div className="stat-num">0</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active</div>
          <div className="stat-num">0</div>
        </div>
      </div>

      <section className="card">
        <div className="row-between mb-4">
          <h2 className="h2">Top matches</h2>
          <Button variant="ghost" size="sm">View all</Button>
        </div>

        {loading ? (
          <div style={{ padding: '24px 0', color: 'var(--fg-muted)', textAlign: 'center' }}>Loading…</div>
        ) : topJobs.length === 0 ? (
          <div style={{ padding: '24px 0', color: 'var(--fg-muted)', textAlign: 'center' }}>
            No jobs yet — trigger a crawl to populate the feed.
          </div>
        ) : (
          <div className="hf-list">
            {topJobs.map(j => (
              <div key={j.scoreId} className="hf-row">
                <LogoChip char={logoChar(j.company)} bg={logoBg(j.company)} />
                <div className="hf-main" style={{ minWidth: 0, flex: 1 }}>
                  <div className="hf-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {j.title}
                  </div>
                  <div className="hf-meta">{j.company} · {j.source} · {locationLabel(j)}</div>
                </div>
                <div className="hf-salary" style={{ flexShrink: 0 }}>
                  <span className="hf-range">{salaryLabel(j)}</span>
                  <SalaryBadge mode={salaryMode(j.salaryMode)} label={salaryMode(j.salaryMode)} />
                </div>
                <FitScore value={j.fitScore} size={36} />
                <Button variant="secondary" size="sm">Review</Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2 className="h2 mb-4">Activity</h2>
        <div className="activity-list">
          <div className="activity-item">
            <Icon name="search" size={14} />
            <span>Crawled <b>{totalJobs} jobs</b> across 3 boards</span>
            <span className="when">last run</span>
          </div>
          <div className="activity-item">
            <Icon name="filter" size={14} />
            <span>Scored <b>{totalJobs} jobs</b> against your profile</span>
            <span className="when">last run</span>
          </div>
          {strongFit > 0 && (
            <div className="activity-item">
              <Icon name="check" size={14} />
              <span><b>{strongFit} jobs</b> scored ≥ 70 fit</span>
              <span className="when">now</span>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
