'use client'

import { useState } from 'react'
import { Button, Icon, Input, KillSwitch, Toggle } from './Atoms'
import type { Preferences } from '../lib/api'

const SETTINGS_NAV = [
  { id: 'profile',    label: 'Profile' },
  { id: 'stories',    label: 'Story bank' },
  { id: 'targets',    label: 'Target roles & filters' },
  { id: 'accounts',   label: 'Connected accounts' },
  { id: 'automation', label: 'Automation' },
  { id: 'cost',       label: 'Cost & usage' },
  { id: 'account',    label: 'Account' },
]

const ProfileSection = () => (
  <div className="settings-section">
    <h2>Profile</h2>
    <div className="sec-sub">The agent uses these fields to draft applications and assess fit. Keep them current.</div>
    <section className="card mb-4">
      <div className="set-row">
        <div className="set-l"><div className="t">Full name</div><div className="d">Used on resumes and cover letters.</div></div>
        <div><Input defaultValue="Shubham Patel" /></div>
      </div>
      <div className="set-row">
        <div className="set-l"><div className="t">Email</div><div className="d">Where the agent sends summaries and reply notifications.</div></div>
        <div><Input defaultValue="shubham@example.com" /></div>
      </div>
      <div className="set-row">
        <div className="set-l"><div className="t">Headline</div><div className="d">One-line summary used as a fallback when a story isn't a fit.</div></div>
        <div><Input defaultValue="Senior frontend engineer · TypeScript, React, design systems" /></div>
      </div>
      <div className="set-row">
        <div className="set-l"><div className="t">Resume</div><div className="d">Base resume the agent tailors per role. Last upload Apr 18.</div></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" size="sm"><Icon name="download" size={12} /> Download current</Button>
          <Button variant="primary" size="sm"><Icon name="upload" size={12} /> Upload new resume</Button>
        </div>
      </div>
    </section>

    <section className="card">
      <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Profile version history</h3>
      <div className="activity-list">
        <div className="activity-item"><Icon name="file-text" size={14} /><span><b>v4</b> · added "growth + experimentation" focus</span><span className="when">Apr 18</span></div>
        <div className="activity-item"><Icon name="file-text" size={14} /><span><b>v3</b> · expanded Spline bullets</span><span className="when">Apr 02</span></div>
        <div className="activity-item"><Icon name="file-text" size={14} /><span><b>v2</b> · onboarding import</span><span className="when">Mar 28</span></div>
      </div>
    </section>
  </div>
)

const StoryBankSection = () => (
  <div className="settings-section">
    <h2>Story bank</h2>
    <div className="sec-sub">Reusable stories the agent draws from when answering application questions. Tag each story so the agent can match it to the right prompt.</div>

    <div className="story-quality">
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Theme coverage</div>
        <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 2 }}>You're missing stories tagged <i>conflict</i> and <i>failure</i> — common interview themes.</div>
      </div>
      <div className="sq-bar"><span style={{ width: '64%' }} /></div>
      <div className="sq-num">7 / 11 themes</div>
    </div>

    <section className="card">
      <div className="row-between mb-3">
        <span className="eyebrow">8 stories</span>
        <Button variant="primary" size="sm"><Icon name="plus" size={12} /> Add story</Button>
      </div>
      {[
        { t: 'Analytics migration',       tags: ['leadership', 'technical', 'scale'] },
        { t: 'Asana rules engine launch', tags: ['leadership', 'shipping'] },
        { t: 'Hiring loop redesign',      tags: ['process', 'collaboration'] },
        { t: 'Performance regression saga', tags: ['debugging', 'persistence'] },
        { t: 'Design system rollout',     tags: ['cross-functional', 'systems'] },
      ].map((s, i) => (
        <div key={i} className="story-row">
          <div>
            <div className="st-t">{s.t}</div>
            <div className="st-tags">{s.tags.map(t => <span key={t} className="theme-tag">{t}</span>)}</div>
          </div>
          <Button variant="ghost" size="sm">Edit</Button>
        </div>
      ))}
    </section>
  </div>
)

const TargetsSection = () => {
  const [usdOnly, setUsdOnly] = useState(true)
  const [includeImplied, setII] = useState(false)
  const [minSalary, setMin] = useState('180000')
  const [stack, setStack] = useState('TypeScript, React, Node.js')
  return (
    <div className="settings-section">
      <h2>Target roles & filters</h2>
      <div className="sec-sub">Hard rules that decide whether a job enters your pipeline at all.</div>
      <section className="card">
        <div className="set-row">
          <div className="set-l"><div className="t">USD-paying only</div><div className="d">Skip roles paid in other currencies, regardless of remote eligibility.</div></div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}><Toggle on={usdOnly} onChange={setUsdOnly} /></div>
        </div>
        <div className="set-row">
          <div className="set-l"><div className="t">Include USD-implied roles</div><div className="d">Apply when the salary is unstated but the company typically pays in USD.</div></div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}><Toggle on={includeImplied} onChange={setII} /></div>
        </div>
        <div className="set-row">
          <div className="set-l"><div className="t">Minimum salary</div><div className="d">The agent skips roles below this floor.</div></div>
          <div><Input value={minSalary} onChange={e => setMin(e.target.value)} style={{ maxWidth: 180 }} /></div>
        </div>
        <div className="set-row">
          <div className="set-l"><div className="t">Stack preferences</div><div className="d">Comma-separated. Used for the fit score and match reasoning.</div></div>
          <div><Input value={stack} onChange={e => setStack(e.target.value)} /></div>
        </div>
        <div className="set-row">
          <div className="set-l"><div className="t">Seniority</div><div className="d">The agent only surfaces roles at or above your floor.</div></div>
          <div><Input defaultValue="Senior, Staff" /></div>
        </div>
        <div className="set-row">
          <div className="set-l"><div className="t">Hard exclusions</div><div className="d">Companies the agent will never apply to. One per line.</div></div>
          <div><Input defaultValue="Meta, Oracle" /></div>
        </div>
      </section>
    </div>
  )
}

const AccountsSection = () => (
  <div className="settings-section">
    <h2>Connected accounts</h2>
    <div className="sec-sub">The agent only reads what it needs. You can disconnect at any time.</div>
    <section className="card">
      <div className="acct-row">
        <span className="logo-chip" style={{ background: '#D9663E' }}>G</span>
        <div>
          <div className="acct-t">Gmail</div>
          <div className="acct-d">Reads recruiter replies to update pipeline state. Never sends mail or accesses personal threads. Last sync 4 minutes ago.</div>
          <div style={{ marginTop: 4 }}><span className="acct-status"><span className="dot" /> Connected</span></div>
        </div>
        <Button variant="secondary" size="sm">Disconnect</Button>
      </div>
      <div className="acct-row">
        <span className="logo-chip" style={{ background: '#0A66C2' }}>in</span>
        <div>
          <div className="acct-t">LinkedIn export</div>
          <div className="acct-d">Static export used to find connections at target companies. Read-only. Last upload Apr 12 (14 days ago).</div>
        </div>
        <Button variant="secondary" size="sm"><Icon name="upload" size={12} /> Upload new export</Button>
      </div>
    </section>
  </div>
)

const AutomationSection = ({ agentRunning, onToggleAgent }: { agentRunning: boolean; onToggleAgent: () => void }) => {
  const [autoApply, setAutoApply] = useState(false)
  const [emailSummary, setES] = useState(true)
  return (
    <div className="settings-section">
      <h2>Automation</h2>
      <div className="sec-sub">Control what the agent does on its own.</div>

      <section className="card mb-4">
        <div className="row-between">
          <div>
            <div className="eyebrow">Agent control</div>
            <div className="h2 mt-2">{agentRunning ? 'The agent is running.' : 'The agent is paused.'}</div>
            <div className="muted mt-2" style={{ fontSize: 13, maxWidth: 420 }}>
              {agentRunning
                ? "It's looking for matches and drafting applications based on your rules."
                : "It won't draft or apply to anything until you start it again."}
            </div>
          </div>
          <KillSwitch running={agentRunning} onToggle={onToggleAgent} />
        </div>
      </section>

      <section className="card mb-4">
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>Auto-apply</h3>
        <div className="set-row">
          <div className="set-l">
            <div className="t">Submit applications without approval</div>
            <div className="d">When on, the agent submits automatically when fit ≥ 80 and all hard rules pass. When off, every application requires your approval (recommended).</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}><Toggle on={autoApply} onChange={setAutoApply} /></div>
        </div>
        <div className="set-row">
          <div className="set-l"><div className="t">Daily email summary</div><div className="d">A single email at 9pm with what the agent did and what's next.</div></div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}><Toggle on={emailSummary} onChange={setES} /></div>
        </div>
      </section>

      <section className="card mb-4">
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>Per-source toggles</h3>
        <div className="sec-sub" style={{ marginBottom: 8 }}>Disable sources that are wasting the agent's time.</div>
        {[
          { name: 'RemoteOK',          on: false, last: '12 minutes ago', d: 'Reply rate 0.5% — recommended off.' },
          { name: 'We Work Remotely',  on: true,  last: '6 minutes ago',  d: 'Reply rate 8.2% — strong source.' },
          { name: 'Wellfound',         on: true,  last: '4 minutes ago',  d: 'Reply rate 6.4%.' },
          { name: 'Greenhouse direct', on: true,  last: '8 minutes ago',  d: 'Crawls company boards directly.' },
        ].map(s => (
          <div key={s.name} className="src-row">
            <div>
              <div className="src-t">{s.name}</div>
              <div className="src-d">{s.d}</div>
            </div>
            <div className="src-last">crawled {s.last}</div>
            <Toggle on={s.on} />
          </div>
        ))}
      </section>

      <section className="card">
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>Per-domain throttle</h3>
        <div className="set-row">
          <div className="set-l"><div className="t">Max applications per company per week</div><div className="d">Prevents the agent from over-applying to the same company.</div></div>
          <div><Input defaultValue="2" style={{ maxWidth: 100 }} /></div>
        </div>
        <div className="set-row">
          <div className="set-l"><div className="t">Max applications per day</div><div className="d">Hard cap on daily submissions.</div></div>
          <div><Input defaultValue="15" style={{ maxWidth: 100 }} /></div>
        </div>
      </section>
    </div>
  )
}

const CostSection = () => (
  <div className="settings-section">
    <h2>Cost & usage</h2>
    <div className="sec-sub">LLM spend across drafting, classification, and tailoring.</div>

    <section className="card mb-4">
      <div className="row-between mb-4">
        <div>
          <div className="eyebrow">This month</div>
          <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.025em', marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>
            $23.40 <span style={{ fontSize: 14, color: 'var(--fg-muted)', fontWeight: 500 }}>of $50.00</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <span className="eyebrow">Monthly budget</span>
          <Input defaultValue="50" style={{ maxWidth: 100, textAlign: 'right' }} />
        </div>
      </div>
      <div style={{ height: 8, background: 'var(--bg-2)', borderRadius: 9999, overflow: 'hidden', marginBottom: 18 }}>
        <span style={{ display: 'block', height: '100%', width: '47%', background: 'var(--accent)' }} />
      </div>
      <h3 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 10px' }}>Breakdown by service</h3>
      <div className="cost-breakdown">
        {[
          { l: 'Drafting',       v: 12.80, w: 55 },
          { l: 'Classification', v:  6.20, w: 27 },
          { l: 'Tailoring',      v:  3.40, w: 15 },
          { l: 'Other',          v:  1.00, w:  3 },
        ].map(r => (
          <div key={r.l} className="cb-row">
            <div className="cb-l">{r.l}</div>
            <div className="cb-track"><span className="cb-fill" style={{ width: `${r.w}%` }} /></div>
            <div className="cb-v">${r.v.toFixed(2)}</div>
          </div>
        ))}
      </div>
    </section>

    <section className="card">
      <h3 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>Last 6 months</h3>
      <div className="sec-sub" style={{ marginBottom: 0 }}>Monthly spend trend.</div>
      <div className="cost-history">
        {[18, 22, 31, 28, 19, 23.40].map((v, i) => (
          <span key={i} className="ch-bar" style={{ height: `${(v / 35) * 100}%` }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-muted)' }}>
        {['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'].map(m => <span key={m}>{m}</span>)}
      </div>
    </section>
  </div>
)

const AccountSection = () => (
  <div className="settings-section">
    <h2>Account</h2>
    <div className="sec-sub">Login, password, and account deletion.</div>
    <section className="card">
      <div className="set-row">
        <div className="set-l"><div className="t">Email</div><div className="d">Used to sign in and receive notifications.</div></div>
        <div><Input defaultValue="shubham@example.com" /></div>
      </div>
      <div className="set-row">
        <div className="set-l"><div className="t">Password</div><div className="d">Last changed 47 days ago.</div></div>
        <div><Button variant="secondary" size="sm">Change password</Button></div>
      </div>
      <div className="set-row">
        <div className="set-l"><div className="t">Sign out</div><div className="d">Sign out of this browser. The agent keeps running.</div></div>
        <div><Button variant="secondary" size="sm">Sign out</Button></div>
      </div>
      <div className="set-row">
        <div className="set-l"><div className="t" style={{ color: 'var(--red-700)' }}>Delete account</div><div className="d">Stops the agent and deletes your profile, stories, and history. Irreversible.</div></div>
        <div><Button variant="danger" size="sm">Delete account</Button></div>
      </div>
    </section>
  </div>
)

export default function Settings({ prefs: _prefs, agentRunning, onToggleAgent }: {
  prefs: Preferences | null; agentRunning: boolean; onToggleAgent: () => void
}) {
  const [section, setSection] = useState('automation')

  const renderSection = () => {
    switch (section) {
      case 'profile':    return <ProfileSection />
      case 'stories':    return <StoryBankSection />
      case 'targets':    return <TargetsSection />
      case 'accounts':   return <AccountsSection />
      case 'automation': return <AutomationSection agentRunning={agentRunning} onToggleAgent={onToggleAgent} />
      case 'cost':       return <CostSection />
      case 'account':    return <AccountSection />
      default:           return null
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">Settings</h1>
      <p className="page-sub">Tune the agent. Changes apply on the next sync.</p>
      <div className="settings-shell">
        <nav className="settings-nav">
          {SETTINGS_NAV.map(n => (
            <span
              key={n.id}
              className={`sn-item ${section === n.id ? 'active' : ''}`}
              onClick={() => setSection(n.id)}
            >
              {n.label}
            </span>
          ))}
        </nav>
        <div>{renderSection()}</div>
      </div>
    </div>
  )
}
