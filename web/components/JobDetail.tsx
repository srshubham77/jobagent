'use client'

import { useState } from 'react'
import { Button, FitScore, Icon, LogoChip, SalaryBadge, TierBadge } from './Atoms'
import type { FeedJob } from '../lib/api'
import { logoChar, logoBg, salaryLabel, salaryMode, locationLabel } from '../lib/format'

const TIER_NOTE: Record<number, string> = {
  1: 'Will submit via Greenhouse API. Estimated time: ~3 seconds.',
  2: 'Will submit via automated browser. Estimated time: ~30 seconds — falls back to manual if blocked.',
  3: "Manual submit. Copy the prepared application into the company's portal.",
}

const JDTab = ({ job }: { job: FeedJob }) => {
  const matched: string[] = (job.breakdown?.skills_matched as string[] | undefined) ?? []
  const missing: string[] = (job.breakdown?.skills_missing as string[] | undefined) ?? []

  return (
    <div className="jd-grid">
      <div className="jd-body" style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.65 }}>
        {/* Show raw jd text isn't available from feed — show breakdown summary */}
        <p style={{ color: 'var(--fg-muted)', fontStyle: 'italic' }}>
          Full job description available at the source link above.
        </p>
        <h4>Fit breakdown</h4>
        <ul>
          <li>Skill overlap: {job.skillOverlap ?? 0}%</li>
          <li>Seniority match: {job.seniorityMatch ?? 0}%</li>
          <li>Salary fit: {job.salaryFit ?? 0}%</li>
          {job.breakdown?.seniority_gap && <li>Seniority gap: {String(job.breakdown.seniority_gap)}</li>}
          {job.breakdown?.salary_note && <li>Salary: {String(job.breakdown.salary_note)}</li>}
        </ul>
      </div>
      <div className="jd-rail">
        {matched.length > 0 && (
          <>
            <div className="rail-eyebrow">Matched skills</div>
            <div>
              {matched.map(s => (
                <span key={s} className="skill-chip have">
                  <Icon name="check" size={11} />{s}
                </span>
              ))}
            </div>
          </>
        )}
        {missing.length > 0 && (
          <>
            <div className="rail-eyebrow" style={{ marginTop: 16 }}>Skills to note</div>
            <div>
              {missing.slice(0, 8).map(s => (
                <span key={s} className="skill-chip miss">
                  <Icon name="minus" size={11} />{s}
                </span>
              ))}
            </div>
          </>
        )}
        <div className="rail-eyebrow" style={{ marginTop: 22 }}>Source</div>
        <div style={{ fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
          {job.source}<br />
          {job.applyUrl && (
            <a href={job.applyUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontSize: 11.5 }}>
              View original posting ↗
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

const DraftTab = ({ job }: { job: FeedJob }) => (
  <>
    <div style={{ padding: '32px 24px', color: 'var(--fg-muted)', textAlign: 'center' }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Draft not generated yet</div>
      <div style={{ fontSize: 13, maxWidth: 400, margin: '0 auto' }}>
        Approve this job to have the agent generate a tailored resume and application answers.
      </div>
    </div>
    <div className="draft-action-bar">
      <div className="submit-note">
        <Icon name="info" size={12} />
        <span>{TIER_NOTE[job.tier] ?? 'Submission method not determined.'}</span>
      </div>
      <div className="submit-row">
        <Button variant="ghost" size="sm" style={{ color: 'var(--red-700)' }}>
          <Icon name="x" size={12} /> Skip this job
        </Button>
        <span className="grow" />
        <Button variant="primary" size="lg">
          <Icon name="check" size={14} /> Approve and draft
        </Button>
      </div>
    </div>
  </>
)

const NetworkTab = () => (
  <div className="net-pad">
    <div className="empty-state">
      <div className="es-t">Network lookup not yet available</div>
      <div className="es-s">Phase 3 will surface LinkedIn connections at this company once you upload a LinkedIn export.</div>
    </div>
  </div>
)

const ActivityTab = () => (
  <div className="act-pad">
    <div className="empty-state">
      <div className="es-t">No activity yet.</div>
      <div className="es-s">Once you approve the draft and the agent submits, the timeline will appear here.</div>
    </div>
  </div>
)

const TABS = [
  { id: 'jd',       label: 'Job description' },
  { id: 'draft',    label: 'Draft preview' },
  { id: 'network',  label: 'Network' },
  { id: 'activity', label: 'Activity' },
]

export default function JobDetailDrawer({ job, onClose }: {
  job: FeedJob
  onClose: () => void
}) {
  const [tab, setTab] = useState('jd')

  return (
    <div className="drawer-scrim" onClick={onClose}>
      <div className="drawer wide" onClick={e => e.stopPropagation()}>

        <div className="drawer-head" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <LogoChip char={logoChar(job.company)} bg={logoBg(job.company)} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)', fontWeight: 500 }}>{job.company}</div>
              <h2 className="h2" style={{ fontSize: 22, marginTop: 2 }}>{job.title}</h2>
              <div className="meta-row">
                <span style={{ whiteSpace: 'nowrap' }}>{locationLabel(job)}</span>
                <span className="sep">·</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                  {salaryLabel(job)}
                </span>
                <SalaryBadge mode={salaryMode(job.salaryMode)} label={salaryMode(job.salaryMode)} />
                {job.applyUrl && (
                  <>
                    <span className="sep">·</span>
                    <a href={job.applyUrl} target="_blank" rel="noreferrer" style={{ whiteSpace: 'nowrap' }}>
                      Original posting ↗
                    </a>
                  </>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
              <Button variant="ghost" size="sm" onClick={onClose}><Icon name="x" size={14} /></Button>
              <FitScore value={job.fitScore} size={56} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <TierBadge tier={job.tier as 1 | 2 | 3} />
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: 'var(--fg-muted)', marginRight: 4 }}>Fit breakdown:</span>
              {[
                { label: 'Skills', value: job.skillOverlap ?? 0 },
                { label: 'Seniority', value: job.seniorityMatch ?? 0 },
                { label: 'Salary', value: job.salaryFit ?? 0 },
              ].map(f => (
                <span key={f.label} className="fit-chip">
                  <span className="lbl">{f.label}</span>
                  <span className="v">{f.value}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="drawer-tabs">
          {TABS.map(t => (
            <span
              key={t.id}
              className={`drawer-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </span>
          ))}
        </div>

        {tab === 'jd'       && <JDTab job={job} />}
        {tab === 'draft'    && <DraftTab job={job} />}
        {tab === 'network'  && <NetworkTab />}
        {tab === 'activity' && <ActivityTab />}
      </div>
    </div>
  )
}
