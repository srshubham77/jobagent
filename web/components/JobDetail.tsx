'use client'

import { useState } from 'react'
import { Avatar, Button, FitScore, Icon, LogoChip, SalaryBadge, TierBadge } from './Atoms'
import type { AppData, Job, JdBlock, NetworkContact, SalaryMode } from './types'

const SALARY_LABEL: Record<SalaryMode, string> = {
  explicit: 'USD explicit',
  implied:  'USD likely',
  unstated: 'Salary unstated',
}

const TIER_NOTE: Record<number, string> = {
  1: 'Will submit via Greenhouse API. Estimated time: ~3 seconds.',
  2: 'Will submit via automated browser. Estimated time: ~30 seconds — falls back to manual if blocked.',
  3: "Manual submit. Copy the prepared application into the company's portal.",
}

// ---- Resume preview -------------------------------------------------------

const ResumePreview = ({ userName, userEmail }: { userName: string; userEmail: string }) => (
  <div className="resume-card">
    <div className="rc-head">
      <span className="name">{userName}</span>
      <span className="view-changes">View changes ↗</span>
    </div>
    <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginBottom: 4 }}>
      Senior frontend engineer · {userEmail} · Brooklyn, NY
    </div>

    <div className="rc-section">
      <div className="rc-eyebrow">Summary</div>
      <div style={{ fontSize: 11.5, lineHeight: 1.55 }}>
        Senior frontend engineer with 7+ years building production <span className="added">TypeScript</span> and{' '}
        <span className="added">React</span> systems. Strong on developer tooling, design-system stewardship, and shipping{' '}
        <span className="added">Next.js</span> applications at scale.
      </div>
    </div>

    <div className="rc-section">
      <div className="rc-eyebrow">Experience</div>
      <div className="rc-job">Lead frontend engineer · Spline <span className="reorder-mark">↑ moved up</span></div>
      <div className="rc-meta">2022 – present · Remote</div>
      <ul className="rc-bullets">
        <li>Owned the <span className="added">Next.js</span> migration of the marketing surface — cut TTFB by 38%.</li>
        <li>Designed the component API for the editor's panel system; ~120k lines depend on it.</li>
        <li>Mentored four mid-level engineers; led the frontend hiring loop.</li>
      </ul>
      <div className="rc-job" style={{ marginTop: 10 }}>Senior software engineer · Asana</div>
      <div className="rc-meta">2019 – 2022 · NYC</div>
      <ul className="rc-bullets">
        <li>Shipped the rules engine UI used by ~3M weekly active users.</li>
        <li>Co-led the migration from Sass + BEM to a tokenized <span className="added">TypeScript</span>-typed design system.</li>
      </ul>
    </div>

    <div className="rc-section">
      <div className="rc-eyebrow">Selected skills</div>
      <div style={{ fontSize: 11.5, lineHeight: 1.6 }}>
        <span className="added">TypeScript</span>, <span className="added">React</span>,{' '}
        <span className="added">Next.js</span>, Node.js, GraphQL, Postgres, design systems, performance.
      </div>
    </div>
  </div>
)

// ---- Q&A card -------------------------------------------------------------

const QACard = ({ qa, idx }: { qa: { q: string; a: string; source: string }; idx: number }) => {
  const [editing, setEditing] = useState(false)
  return (
    <div className="qa-card">
      <div className="qa-q">{idx + 1}. {qa.q}</div>
      <div
        className="qa-a"
        contentEditable={editing}
        suppressContentEditableWarning
      >
        {qa.a}
      </div>
      <div className="qa-foot">
        <span className="qa-source">
          <Icon name="link-2" size={11} />
          <span className="src-tag">{qa.source}</span>
        </span>
        <span className="qa-edit" onClick={() => setEditing(e => !e)}>
          {editing ? 'Done' : 'Edit'}
        </span>
      </div>
    </div>
  )
}

// ---- Draft preview tab ----------------------------------------------------

const DraftTab = ({ job, userName, userEmail }: { job: Job; userName: string; userEmail: string }) => (
  <>
    <div className="draft-grid">
      <ResumePreview userName={userName} userEmail={userEmail} />
      <div className="qa-list">
        {(job.questions ?? []).map((qa, i) => <QACard key={i} qa={qa} idx={i} />)}
      </div>
    </div>
    <div className="draft-action-bar">
      <div className="submit-note">
        <Icon name="info" size={12} />
        <span>{TIER_NOTE[job.tier]}</span>
      </div>
      <div className="submit-row">
        <Button variant="ghost" size="sm" style={{ color: 'var(--red-700)' }}>
          <Icon name="x" size={12} /> Skip this job
        </Button>
        <span className="grow" />
        <Button variant="secondary" size="sm">Approve with edits</Button>
        <Button variant="primary" size="lg">
          <Icon name="check" size={14} /> Approve and submit
        </Button>
      </div>
    </div>
  </>
)

// ---- JD tab ---------------------------------------------------------------

const JDTab = ({ job, jdBody }: { job: Job; jdBody: JdBlock[] }) => (
  <div className="jd-grid">
    <div className="jd-body">
      {jdBody.map((b, i) => {
        if (b.kind === 'p') return <p key={i}>{b.text}</p>
        if (b.kind === 'h') return <h4 key={i}>{b.text}</h4>
        if (b.kind === 'ul') return <ul key={i}>{b.items?.map((it, j) => <li key={j}>{it}</li>)}</ul>
        return null
      })}
    </div>
    <div className="jd-rail">
      <div className="rail-eyebrow">Required skills</div>
      <div>
        {(job.skills ?? []).map(s => (
          <span key={s.name} className={`skill-chip ${s.have ? 'have' : 'miss'}`}>
            <Icon name={s.have ? 'check' : 'minus'} size={11} />
            {s.name}
          </span>
        ))}
      </div>
      <div className="rail-eyebrow" style={{ marginTop: 22 }}>Source</div>
      <div style={{ fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
        Greenhouse · indexed today<br />
        <a href={job.sourceUrl ?? '#'} style={{ color: 'var(--accent)', fontSize: 11.5 }}>
          View original posting ↗
        </a>
      </div>
    </div>
  </div>
)

// ---- Network tab ----------------------------------------------------------

const ReferralModal = ({ contact, onClose }: { contact: NetworkContact; onClose: () => void }) => (
  <div className="modal-scrim" onClick={onClose}>
    <div className="modal" onClick={e => e.stopPropagation()}>
      <h3>Referral message · {contact.name}</h3>
      <div className="sub">Copy and paste into LinkedIn or email. Tone: warm, brief, specific.</div>
      <div className="msg-box">{`Hi ${contact.name.split(' ')[0]} —

I'm applying for the senior frontend role on Vercel's core platform team and saw you're on the runtime team. I've been building on Next.js since v9 and would love to learn more about how the team thinks about the framework/platform boundary.

Any chance you'd be open to a quick referral, or pointing me to the right person? Happy to send my resume + the role link.

Thanks either way!
Shubham`}</div>
      <div className="modal-foot">
        <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        <Button variant="primary" size="sm"><Icon name="copy" size={12} /> Copy message</Button>
      </div>
    </div>
  </div>
)

const NetworkTab = ({ job }: { job: Job }) => {
  const [openContact, setOpenContact] = useState<NetworkContact | null>(null)
  const network = job.network ?? []
  return (
    <div className="net-pad">
      <div className="net-summary">You have <b>{network.length} connections</b> at {job.company}.</div>
      <div className="net-list">
        {network.map((c, i) => (
          <div key={i} className="net-row">
            <span className="avatar lg" style={{ background: c.avatarBg, color: '#FAF8F3' }}>{c.avatar}</span>
            <div>
              <div className="net-name">
                {c.name}<span className="deg">{c.degree === 1 ? '1st' : '2nd'}</span>
              </div>
              <div className="net-title">{c.title}</div>
              {c.mutual && <div className="net-mutual">{c.mutual}</div>}
            </div>
            <Button variant="secondary" size="sm" onClick={() => setOpenContact(c)}>
              <Icon name="message-square" size={12} /> Draft referral message
            </Button>
          </div>
        ))}
      </div>
      {openContact && <ReferralModal contact={openContact} onClose={() => setOpenContact(null)} />}
    </div>
  )
}

// ---- Activity tab ---------------------------------------------------------

const ActivityTab = ({ job, submitted }: { job: Job; submitted: boolean }) => {
  if (!submitted) {
    return (
      <div className="act-pad">
        <div className="empty-state">
          <div className="es-t">No activity yet.</div>
          <div className="es-s">Once you approve the draft and the agent submits, you'll see the timeline here — confirmation, replies, and state transitions.</div>
        </div>
      </div>
    )
  }
  return (
    <div className="act-pad">
      <div>
        <div className="eyebrow mb-2">Match reasoning</div>
        <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0, color: 'var(--fg)' }}>
          Strong overlap on TypeScript and React. {job.company}&apos;s frontend stack matches three of four of your stated preferences. Compensation is in-range for your floor of $180k. Remote policy aligns with your USD-only constraint.
        </p>
      </div>

      <div>
        <div className="eyebrow mb-2">What the agent did</div>
        <div className="activity-list">
          {(job.activity ?? []).map((a, i) => (
            <div key={i} className="activity-item">
              <Icon name={a.icon} size={14} />
              <span>{a.text}</span>
              <span className="when">{a.when}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="eyebrow mb-2">Submission confirmation</div>
        <div className="confirmation-shot">
          <div className="head">Greenhouse · Today, 14:18</div>
          <div className="b">Application received — Senior frontend engineer at {job.company}</div>
          <div style={{ color: 'var(--fg-muted)', lineHeight: 1.5 }}>
            Thanks for applying. Our team will review your application and reach out if there's a fit.
            Reference: GH-{job.id.toUpperCase()}-{new Date().getFullYear()}.
          </div>
        </div>
      </div>
    </div>
  )
}

// ---- Main drawer ----------------------------------------------------------

const TABS = [
  { id: 'jd',       label: 'Job description' },
  { id: 'draft',    label: 'Draft preview' },
  { id: 'network',  label: 'Network' },
  { id: 'activity', label: 'Activity' },
]

export default function JobDetailDrawer({ job, data, onClose, defaultTab = 'draft', submitted = false }: {
  job: Job
  data: AppData
  onClose: () => void
  defaultTab?: string
  submitted?: boolean
}) {
  const [tab, setTab] = useState(defaultTab)
  const full = (job.questions ? job : data.draftedJob) as Job & Required<Pick<Job, 'fitBreakdown'>>

  return (
    <div className="drawer-scrim" onClick={onClose}>
      <div className="drawer wide" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="drawer-head" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <LogoChip char={full.logoChar} bg={full.logoBg} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)', fontWeight: 500 }}>{full.company}</div>
              <h2 className="h2" style={{ fontSize: 22, marginTop: 2 }}>{full.title}</h2>
              <div className="meta-row">
                <span style={{ whiteSpace: 'nowrap' }}>{full.location}</span>
                <span className="sep">·</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{full.salaryRange}</span>
                <SalaryBadge mode={full.salaryMode} label={SALARY_LABEL[full.salaryMode]} />
                <span className="sep">·</span>
                <a href={full.sourceUrl ?? '#'} style={{ whiteSpace: 'nowrap' }}>Greenhouse posting ↗</a>
                <span className="sep">·</span>
                <span style={{ whiteSpace: 'nowrap' }}>{full.postedAgo}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
              <Button variant="ghost" size="sm" onClick={onClose}><Icon name="x" size={14} /></Button>
              <FitScore value={full.fit} size={56} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <TierBadge tier={full.tier} />
            <span title={`Tier ${full.tier} submission method`} style={{ cursor: 'help', color: 'var(--fg-subtle)' }}>
              <Icon name="help-circle" size={12} />
            </span>
          </div>

          {full.fitBreakdown && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginTop: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--fg-muted)', marginRight: 4 }}>Fit breakdown:</span>
              {full.fitBreakdown.map(f => (
                <span key={f.label} className="fit-chip">
                  <span className="lbl">{f.label}</span>
                  <span className="v">{f.value}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
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

        {/* Tab bodies */}
        {tab === 'draft'    && <DraftTab job={full} userName={data.user.name} userEmail={data.user.email} />}
        {tab === 'jd'       && <JDTab job={full} jdBody={data.jdBody} />}
        {tab === 'network'  && <NetworkTab job={full} />}
        {tab === 'activity' && <ActivityTab job={full} submitted={submitted} />}
      </div>
    </div>
  )
}
