'use client'

import { Button, FitScore, Icon, LogoChip, SalaryBadge } from './Atoms'
import type { AppData, Job, SalaryMode } from './types'

const SalaryClassBadge = ({ mode }: { mode: SalaryMode }) => (
  <SalaryBadge mode={mode} label={{ explicit: 'USD explicit', implied: 'USD implied', unstated: 'unstated' }[mode]} />
)

const HighFitRow = ({ job }: { job: Job & { source: string } }) => (
  <div className="hf-row">
    <LogoChip char={job.logoChar} bg={job.logoBg} />
    <div className="hf-main">
      <div className="hf-title">{job.title}</div>
      <div className="hf-meta">{job.company} · {job.source} · {job.postedAgo}</div>
    </div>
    <div className="hf-salary">
      <span className="hf-range">{job.salaryRange}</span>
      <SalaryClassBadge mode={job.salaryMode} />
    </div>
    <FitScore value={job.fit} size={36} />
    <Button variant="secondary" size="sm">Review</Button>
  </div>
)

const PendingRow = ({ job, draftedAgo }: { job: Job; draftedAgo: string }) => (
  <div className="pr-row">
    <LogoChip char={job.logoChar} bg={job.logoBg} />
    <div className="pr-main">
      <div className="pr-title">{job.title}</div>
      <div className="pr-meta">{job.company} · waiting {draftedAgo}</div>
    </div>
    <Button variant="secondary" size="sm">Review draft</Button>
  </div>
)

const FunnelBar = ({ funnel }: { funnel: AppData['funnel'] }) => {
  const steps = [
    { key: 'discovered', label: 'Discovered', n: funnel.discovered },
    { key: 'drafted',    label: 'Drafted',    n: funnel.drafted },
    { key: 'applied',    label: 'Applied',    n: funnel.applied },
    { key: 'active',     label: 'Active',     n: funnel.active },
    { key: 'offer',      label: 'Offer',      n: funnel.offer },
  ]
  const max = steps[0].n
  return (
    <div className="funnel">
      {steps.map((s, i) => {
        const w = (s.n / max) * 100
        const conv = i === 0 ? null : Math.round((s.n / steps[i - 1].n) * 100)
        return (
          <div className="funnel-row" key={s.key}>
            <div className="funnel-label">{s.label}</div>
            <div className="funnel-track">
              <div className="funnel-fill" style={{ width: `${w}%` }} />
              <span className="funnel-n">{s.n}</span>
            </div>
            <div className="funnel-conv">
              {conv != null ? `${conv}%` : <span className="funnel-base">base</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function Dashboard({ data, agentRunning }: { data: AppData; agentRunning: boolean }) {
  const { agent, jobs, pipelineCounts, funnel, user } = data

  const highFit = [...jobs].sort((a, b) => b.fit - a.fit).slice(0, 5).map(j => ({
    ...j,
    source: j.tier === 1 ? 'Greenhouse' : j.tier === 2 ? 'Lever' : 'Wellfound',
  }))

  const draftedAgos = ['8m ago', '23m ago', '1h ago']
  const pending = jobs.filter(j => j.status === 'drafted').slice(0, 3)

  const firstName = user.name.split(' ')[0]

  return (
    <div className="page">
      <h1 className="page-title">Good afternoon, {firstName}.</h1>
      <p className="page-sub">
        {agentRunning
          ? `The agent is looking. Last sync ${agent.lastSync}.`
          : 'The agent is paused. Resume it to keep looking.'}
      </p>

      <div className="stat-grid stat-grid-5 mb-6">
        {(['discovered', 'drafted', 'applied', 'active', 'closed'] as const).map(s => (
          <div className="stat-card" key={s}>
            <div className="stat-label" style={{ textTransform: 'capitalize' }}>{s}</div>
            <div className={`stat-num ${s === 'applied' ? 'stat-accent' : ''}`}>{pipelineCounts[s]}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 16, marginBottom: 16 }}>
        <section className="card">
          <div className="row-between mb-4">
            <h2 className="h2">Today's high-fit discoveries</h2>
            <Button variant="ghost" size="sm">View all</Button>
          </div>
          <div className="hf-list">
            {highFit.map(j => <HighFitRow key={j.id} job={j} />)}
          </div>
        </section>

        <section className="card">
          <div className="row-between mb-4">
            <h2 className="h2">Pending reviews</h2>
            <Button variant="ghost" size="sm">View all</Button>
          </div>
          <div className="pr-list">
            {pending.map((j, i) => <PendingRow key={j.id} job={j} draftedAgo={draftedAgos[i] ?? '2h ago'} />)}
          </div>
        </section>
      </div>

      <section className="card mb-4" style={{ marginBottom: 16 }}>
        <div className="row-between mb-4">
          <h2 className="h2">Funnel snapshot</h2>
          <span className="eyebrow" style={{ textTransform: 'none', fontWeight: 500 }}>last 30 days</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 28, alignItems: 'center' }}>
          <FunnelBar funnel={funnel} />
          <div className="funnel-foot" style={{ marginTop: 0, paddingTop: 0, borderTop: 0 }}>
            <div><div className="ff-label">Response rate</div><div className="ff-num">{funnel.responseRate}%</div></div>
            <div><div className="ff-label">Time to apply</div><div className="ff-num">2.3 <span className="ff-unit">min</span></div></div>
          </div>
        </div>
      </section>

      <section className="card">
        <h2 className="h2 mb-4">Today's activity</h2>
        <div className="activity-list">
          <div className="activity-item"><Icon name="search" size={14} /><span>Scanned <b>312 new postings</b> across 6 boards</span><span className="when">14:02</span></div>
          <div className="activity-item"><Icon name="filter" size={14} /><span>Matched <b>14 jobs</b> against your preferences</span><span className="when">14:05</span></div>
          <div className="activity-item"><Icon name="send" size={14} /><span>Submitted <b>8 applications</b></span><span className="when">14:18</span></div>
          <div className="activity-item"><Icon name="mail" size={14} /><span>Received <b>2 responses</b></span><span className="when">15:32</span></div>
        </div>
      </section>
    </div>
  )
}
