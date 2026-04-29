'use client'

import { Button, Icon, LogoChip, PipelineStatusPill } from './Atoms'
import type { AppData } from './types'

const FunnelWide = ({ funnel }: { funnel: AppData['funnel'] }) => {
  const steps = [
    { label: 'Discovered', n: funnel.discovered },
    { label: 'Drafted',    n: funnel.drafted },
    { label: 'Applied',    n: funnel.applied },
    { label: 'Active',     n: funnel.active },
    { label: 'Offer',      n: funnel.offer },
  ]
  return (
    <div className="funnel-wide">
      {steps.map((s, i) => {
        const conv = i === 0 ? null : Math.round((s.n / steps[i - 1].n) * 100)
        return (
          <div className="funnel-step" key={s.label}>
            <div className="lbl">{s.label}</div>
            <div className="num">{s.n}</div>
            <div className="conv">{conv != null ? `↘ ${conv}% from ${steps[i - 1].label.toLowerCase()}` : 'base stage'}</div>
            {i < steps.length - 1 && (
              <span className="arrow"><Icon name="chevron-right" size={14} /></span>
            )}
          </div>
        )
      })}
    </div>
  )
}

const ReplyBar = ({ row, max, isLeader, isWeak }: {
  row: { source?: string; variant?: string; rate: number; applied: number; leader?: boolean }
  max: number; isLeader: boolean; isWeak: boolean
}) => {
  const w = (row.rate / max) * 100
  const label = row.source ?? row.variant ?? ''
  return (
    <div className="bl-row">
      <div className="bl-l">
        <div>{label}{isLeader && <span className="leader">leader</span>}</div>
        <div className="bl-sub">{row.applied} applied</div>
      </div>
      <span className="bl-track">
        <span className={`bl-fill ${isLeader ? 'leader' : ''} ${isWeak ? 'weak' : ''}`} style={{ width: `${w}%` }} />
      </span>
      <span className="bl-v">{row.rate.toFixed(1)}%</span>
    </div>
  )
}

export default function Analytics({ data }: { data: AppData }) {
  const max = Math.max(...data.weekly.map(w => w.applied))
  const sourceMax = Math.max(...data.replyBySource.map(r => r.rate))
  const variantMax = Math.max(...data.replyByVariant.map(r => r.rate))

  return (
    <div className="page">
      <h1 className="page-title">Analytics</h1>
      <p className="page-sub">How the agent performed for you this week.</p>

      <div className="stat-grid mb-6">
        <div className="stat-card"><div className="stat-label">Applications</div><div className="stat-num">47</div><div className="stat-delta up">↑ 12 vs last week</div></div>
        <div className="stat-card"><div className="stat-label">Responses</div><div className="stat-num">11</div><div className="stat-delta up">↑ 4</div></div>
        <div className="stat-card"><div className="stat-label">Response rate</div><div className="stat-num">23%</div><div className="stat-delta down">↓ 4pp</div></div>
        <div className="stat-card"><div className="stat-label">Interviews</div><div className="stat-num">3</div><div className="stat-delta up">↑ 1</div></div>
      </div>

      <section className="card mb-6">
        <div className="row-between mb-4">
          <h2 className="h2">Funnel</h2>
          <span className="eyebrow" style={{ textTransform: 'none', fontWeight: 500 }}>last 30 days</span>
        </div>
        <FunnelWide funnel={data.funnel} />
      </section>

      <section className="mb-6">
        <h2 className="h2 mb-4">Actionable callouts</h2>
        <div>
          <div className="callout-card">
            <span className="ic"><Icon name="alert-triangle" size={16} /></span>
            <div className="ct"><b>RemoteOK has a 0.5% reply rate over the last 30 days</b> — the lowest of any source. Consider deprioritizing it so the agent spends more time on Wellfound and We Work Remotely.</div>
            <Button variant="secondary" size="sm">Apply suggestion</Button>
          </div>
          <div className="callout-card">
            <span className="ic"><Icon name="trending-up" size={16} /></span>
            <div className="ct"><b>Resume variant A converts 2× better for backend roles</b> than your current default (variant B). Make variant A the default for backend + infra roles?</div>
            <Button variant="secondary" size="sm">Apply suggestion</Button>
          </div>
          <div className="callout-card">
            <span className="ic"><Icon name="lightbulb" size={16} /></span>
            <div className="ct"><b>Your fit-score threshold of 80 is filtering out roles that converted at 14%</b> last cycle. Lowering it to 75 would surface ~8 more matches per week.</div>
            <Button variant="secondary" size="sm">Apply suggestion</Button>
          </div>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <section className="card">
          <div className="row-between mb-4">
            <h2 className="h2">Reply rate by source</h2>
            <span className="eyebrow" style={{ textTransform: 'none', fontWeight: 500 }}>Applied → Active</span>
          </div>
          <div className="bar-list">
            {data.replyBySource.map((r, i) => (
              <ReplyBar key={r.source} row={r} max={sourceMax} isLeader={i === 0} isWeak={r.rate < 1} />
            ))}
          </div>
        </section>

        <section className="card">
          <div className="row-between mb-4">
            <h2 className="h2">Reply rate by resume variant</h2>
            <span className="eyebrow" style={{ textTransform: 'none', fontWeight: 500 }}>Applied → Active</span>
          </div>
          <div className="bar-list">
            {data.replyByVariant.map(r => (
              <ReplyBar key={r.variant} row={r} max={variantMax} isLeader={!!r.leader} isWeak={false} />
            ))}
          </div>
        </section>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        <section className="card">
          <div className="row-between mb-4">
            <h2 className="h2">Weekly cadence</h2>
            <span className="eyebrow">Apr 20 – 26</span>
          </div>
          <div className="barchart">
            {data.weekly.map(w => (
              <div className="col" key={w.day}>
                <div className="bar-wrap">
                  <div className="bar r" style={{ height: `${(w.responses / max) * 170 * 0.6}px` }} />
                  <div className="bar" style={{ height: `${((w.applied - w.responses) / max) * 170}px` }} />
                </div>
                <span className="lbl">{w.day}</span>
                <span className="lbl" style={{ color: 'var(--fg)' }}>{w.applied}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 18, marginTop: 16, fontSize: 12, color: 'var(--fg-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, background: 'var(--stone-300)', borderRadius: 2 }} />Applied</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, background: 'var(--accent)', borderRadius: 2 }} />Responses</span>
          </div>
        </section>

        <section className="card">
          <h2 className="h2 mb-4">Top responders</h2>
          <div className="activity-list">
            {[
              { c: 'Linear',    logo: 'L', bg: '#5E6AD2', s: 'active'   as const },
              { c: 'Modal',     logo: 'M', bg: '#3D7A4E', s: 'active'   as const },
              { c: 'Vercel',    logo: 'V', bg: '#000000', s: 'applied'  as const },
              { c: 'Anthropic', logo: 'A', bg: '#D9663E', s: 'drafted'  as const },
            ].map(r => (
              <div key={r.c} className="activity-item">
                <LogoChip char={r.logo} bg={r.bg} />
                <span><b>{r.c}</b></span>
                <PipelineStatusPill status={r.s} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
