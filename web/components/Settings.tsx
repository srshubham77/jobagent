'use client'

import { useState, useEffect, useRef } from 'react'
import { Button, Icon, Input, KillSwitch, Toggle } from './Atoms'
import type { Preferences, Profile, Story, StoryInput } from '../lib/api'
import { api } from '../lib/api'

const SETTINGS_NAV = [
  { id: 'profile',    label: 'Profile' },
  { id: 'stories',    label: 'Story bank' },
  { id: 'targets',    label: 'Target roles & filters' },
  { id: 'accounts',   label: 'Connected accounts' },
  { id: 'automation', label: 'Automation' },
]

// ── Profile section ──────────────────────────────────────────────────────────

const ProfileSection = ({ profile }: { profile: Profile | null }) => {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadMsg('')
    try {
      await api.uploadResume(file)
      setUploadMsg('Resume uploaded successfully. Refresh to see updated profile.')
    } catch {
      setUploadMsg('Upload failed. Check that the profile service is running.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="settings-section">
      <h2>Profile</h2>
      <div className="sec-sub">The agent uses these fields to draft applications and assess fit. Keep them current.</div>
      <section className="card mb-4">
        <div className="set-row">
          <div className="set-l"><div className="t">Full name</div><div className="d">Used on resumes and cover letters.</div></div>
          <div><Input defaultValue={profile?.contact?.name ?? ''} readOnly /></div>
        </div>
        <div className="set-row">
          <div className="set-l"><div className="t">Email</div><div className="d">Where the agent sends summaries.</div></div>
          <div><Input defaultValue={profile?.contact?.email ?? ''} readOnly /></div>
        </div>
        {profile?.contact?.location && (
          <div className="set-row">
            <div className="set-l"><div className="t">Location</div></div>
            <div><Input defaultValue={profile.contact.location} readOnly /></div>
          </div>
        )}
        <div className="set-row">
          <div className="set-l">
            <div className="t">Resume</div>
            <div className="d">Base resume the agent tailors per role.{profile?.versionNumber ? ` Version ${profile.versionNumber} on file.` : ''}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button variant="primary" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Icon name="upload" size={12} /> {uploading ? 'Uploading…' : 'Upload new resume'}
            </Button>
            <input ref={fileRef} type="file" accept=".pdf,.docx" style={{ display: 'none' }} onChange={upload} />
            {uploadMsg && <span style={{ fontSize: 12, color: uploadMsg.includes('failed') ? 'var(--red-700)' : 'var(--green-700)' }}>{uploadMsg}</span>}
          </div>
        </div>
      </section>

      {profile?.skills && profile.skills.length > 0 && (
        <section className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Skills ({profile.skills.length})</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {profile.skills.slice(0, 30).map(s => (
              <span key={s} className="skill-chip have" style={{ fontSize: 11 }}>{s}</span>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

// ── Story bank section ───────────────────────────────────────────────────────

const BLANK_STORY: StoryInput = { title: '', situation: '', action: '', result: '', metrics: '', themes: [] }

const StoryModal = ({ story, onSave, onClose }: {
  story: Partial<StoryInput> & { id?: string }
  onSave: (data: StoryInput, id?: string) => Promise<void>
  onClose: () => void
}) => {
  const [form, setForm] = useState<StoryInput>({
    title:     story.title     ?? '',
    situation: story.situation ?? '',
    action:    story.action    ?? '',
    result:    story.result    ?? '',
    metrics:   story.metrics   ?? '',
    themes:    story.themes    ?? [],
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const set = (k: keyof StoryInput, v: string) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.title || !form.situation || !form.action || !form.result) {
      setErr('Title, situation, action, and result are required.')
      return
    }
    setSaving(true)
    try {
      const themes = (form.themes as unknown as string)
        .toString().split(',').map(s => s.trim()).filter(Boolean)
      await onSave({ ...form, themes }, story.id)
      onClose()
    } catch {
      setErr('Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const Field = ({ label, k, multiline }: { label: string; k: keyof StoryInput; multiline?: boolean }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-muted)' }}>{label}</label>
      {multiline ? (
        <textarea
          value={form[k] as string}
          onChange={e => set(k, e.target.value)}
          style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, resize: 'vertical', minHeight: 80, fontSize: 13, fontFamily: 'var(--font-sans)', background: 'var(--bg-1)', color: 'var(--fg-1)' }}
        />
      ) : (
        <Input value={form[k] as string} onChange={e => set(k, e.target.value)} />
      )}
    </div>
  )

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560, width: '90vw' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 16px' }}>{story.id ? 'Edit story' : 'Add story'}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Title" k="title" />
          <Field label="Situation" k="situation" multiline />
          <Field label="Action" k="action" multiline />
          <Field label="Result" k="result" multiline />
          <Field label="Metrics (optional)" k="metrics" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-muted)' }}>Themes (comma-separated)</label>
            <Input
              value={(form.themes as unknown as string[]).join(', ')}
              onChange={e => set('themes', e.target.value as unknown as string)}
              placeholder="leadership, technical, shipping"
            />
          </div>
        </div>
        {err && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--red-700)' }}>{err}</div>}
        <div className="modal-foot" style={{ marginTop: 16 }}>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : 'Save story'}
          </Button>
        </div>
      </div>
    </div>
  )
}

const StoryBankSection = () => {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<(Partial<StoryInput> & { id?: string }) | null>(null)

  useEffect(() => {
    api.getStories()
      .then(setStories)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const save = async (data: StoryInput, id?: string) => {
    if (id) {
      const updated = await api.updateStory(id, data)
      setStories(s => s.map(x => x.id === id ? updated : x))
    } else {
      const created = await api.createStory(data)
      setStories(s => [created, ...s])
    }
  }

  const del = async (id: string) => {
    await api.deleteStory(id)
    setStories(s => s.filter(x => x.id !== id))
  }

  return (
    <div className="settings-section">
      <h2>Story bank</h2>
      <div className="sec-sub">Reusable STAR stories the agent draws from when answering application questions.</div>

      {loading ? (
        <div style={{ color: 'var(--fg-muted)', fontSize: 13 }}>Loading…</div>
      ) : (
        <section className="card">
          <div className="row-between mb-3">
            <span className="eyebrow">{stories.length} {stories.length === 1 ? 'story' : 'stories'}</span>
            <Button variant="primary" size="sm" onClick={() => setEditing(BLANK_STORY)}>
              <Icon name="plus" size={12} /> Add story
            </Button>
          </div>
          {stories.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--fg-muted)', fontSize: 13 }}>
              No stories yet. Add your first one to help the agent answer behavioral questions.
            </div>
          ) : (
            stories.map(s => (
              <div key={s.id} className="story-row">
                <div>
                  <div className="st-t">{s.title}</div>
                  <div className="st-tags">
                    {(s.themes ?? []).map(t => <span key={t} className="theme-tag">{t}</span>)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button variant="ghost" size="sm" onClick={() => setEditing({ ...s, metrics: s.metrics ?? undefined })}>Edit</Button>
                  <Button variant="ghost" size="sm" style={{ color: 'var(--red-700)' }} onClick={() => del(s.id)}>Delete</Button>
                </div>
              </div>
            ))
          )}
        </section>
      )}

      {editing !== null && (
        <StoryModal story={editing} onSave={save} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}

// ── Targets section ──────────────────────────────────────────────────────────

const TargetsSection = ({ prefs, onSave }: { prefs: Preferences | null; onSave: (p: Partial<Preferences>) => Promise<void> }) => {
  const [usdOnly,       setUsdOnly]    = useState(prefs?.usdOnly ?? true)
  const [minSalary,     setMinSalary]  = useState(String(prefs?.minSalary ?? ''))
  const [targetTitle,   setTitle]      = useState(prefs?.targetTitle ?? '')
  const [stack,         setStack]      = useState((prefs?.targetStack ?? []).join(', '))
  const [saving,        setSaving]     = useState(false)
  const [saved,         setSaved]      = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await onSave({
        usdOnly,
        minSalary: minSalary ? Number(minSalary) : null,
        targetTitle: targetTitle || null,
        targetStack: stack ? stack.split(',').map(s => s.trim()).filter(Boolean) : [],
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="settings-section">
      <h2>Target roles & filters</h2>
      <div className="sec-sub">Hard rules that decide whether a job enters your pipeline at all.</div>
      <section className="card">
        <div className="set-row">
          <div className="set-l"><div className="t">USD-paying only</div><div className="d">Skip roles paid in other currencies.</div></div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}><Toggle on={usdOnly} onChange={setUsdOnly} /></div>
        </div>
        <div className="set-row">
          <div className="set-l"><div className="t">Target title</div><div className="d">The agent prioritises roles matching this title.</div></div>
          <div><Input value={targetTitle} onChange={e => setTitle(e.target.value)} placeholder="e.g. Software Engineer" /></div>
        </div>
        <div className="set-row">
          <div className="set-l"><div className="t">Minimum salary (USD)</div><div className="d">The agent skips roles below this floor.</div></div>
          <div><Input value={minSalary} onChange={e => setMinSalary(e.target.value)} style={{ maxWidth: 180 }} placeholder="e.g. 80000" /></div>
        </div>
        <div className="set-row">
          <div className="set-l"><div className="t">Stack preferences</div><div className="d">Comma-separated. Used for fit scoring.</div></div>
          <div><Input value={stack} onChange={e => setStack(e.target.value)} placeholder="TypeScript, Go, Postgres" /></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8, gap: 8, alignItems: 'center' }}>
          {saved && <span style={{ fontSize: 12, color: 'var(--green-700)' }}>Saved</span>}
          <Button variant="primary" size="sm" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </section>
    </div>
  )
}

// ── Connected accounts section ───────────────────────────────────────────────

const AccountsSection = () => {
  const [status, setStatus] = useState<{ connected: boolean; lastEventAt: string | null; totalEvents: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

  useEffect(() => {
    api.getTrackerStatus()
      .then(setStatus)
      .catch(() => setStatus({ connected: false, lastEventAt: null, totalEvents: 0 }))
      .finally(() => setLoading(false))
  }, [])

  const disconnect = async () => {
    setDisconnecting(true)
    try {
      await api.disconnectGmail()
      setStatus(s => s ? { ...s, connected: false } : s)
    } finally {
      setDisconnecting(false)
    }
  }

  const sync = async () => {
    setSyncing(true)
    setSyncMsg('')
    try {
      const result = await api.syncGmail()
      setSyncMsg(`Synced — ${result.processed} email${result.processed !== 1 ? 's' : ''} processed.`)
    } catch {
      setSyncMsg('Sync failed.')
    } finally {
      setSyncing(false)
    }
  }

  const lastSync = status?.lastEventAt
    ? new Date(status.lastEventAt).toLocaleString()
    : 'Never'

  return (
    <div className="settings-section">
      <h2>Connected accounts</h2>
      <div className="sec-sub">The agent only reads what it needs. You can disconnect at any time.</div>
      <section className="card">
        <div className="acct-row">
          <span className="logo-chip" style={{ background: '#D9663E' }}>G</span>
          <div style={{ flex: 1 }}>
            <div className="acct-t">Gmail</div>
            <div className="acct-d">
              Reads recruiter replies to update pipeline state. Never sends mail.
              {status?.connected && <> Last event: {lastSync}. {status.totalEvents} events total.</>}
            </div>
            {!loading && (
              <div style={{ marginTop: 4 }}>
                {status?.connected
                  ? <span className="acct-status"><span className="dot" /> Connected</span>
                  : <span className="acct-status" style={{ color: 'var(--fg-muted)' }}>Not connected</span>}
              </div>
            )}
            {syncMsg && <div style={{ marginTop: 4, fontSize: 12, color: 'var(--fg-muted)' }}>{syncMsg}</div>}
          </div>
          {loading ? (
            <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>…</span>
          ) : status?.connected ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <Button variant="secondary" size="sm" onClick={sync} disabled={syncing}>
                {syncing ? 'Syncing…' : 'Sync now'}
              </Button>
              <Button variant="secondary" size="sm" onClick={disconnect} disabled={disconnecting}>
                {disconnecting ? 'Disconnecting…' : 'Disconnect'}
              </Button>
            </div>
          ) : (
            <Button variant="primary" size="sm" onClick={() => { window.location.href = '/api/tracker/auth' }}>
              Connect Gmail
            </Button>
          )}
        </div>
        <div className="acct-row">
          <span className="logo-chip" style={{ background: '#0A66C2' }}>in</span>
          <div style={{ flex: 1 }}>
            <div className="acct-t">LinkedIn export</div>
            <div className="acct-d">Static export used to find connections at target companies. Phase 3.</div>
          </div>
          <Button variant="secondary" size="sm" disabled>
            <Icon name="upload" size={12} /> Coming in Phase 3
          </Button>
        </div>
      </section>
    </div>
  )
}

// ── Automation section ───────────────────────────────────────────────────────

const AutomationSection = ({ agentRunning, onToggleAgent, prefs, onSave }: {
  agentRunning: boolean
  onToggleAgent: () => void
  prefs: Preferences | null
  onSave: (p: Partial<Preferences>) => Promise<void>
}) => {
  const [autoApply,    setAutoApply]  = useState((prefs?.autoApplyThreshold ?? 0) > 0)
  const [crawling,     setCrawling]   = useState(false)
  const [crawlMsg,     setCrawlMsg]   = useState('')

  const triggerCrawl = async () => {
    setCrawling(true)
    setCrawlMsg('')
    try {
      await api.triggerCrawl()
      setCrawlMsg('Crawl triggered. New jobs will appear in the feed shortly.')
    } catch {
      setCrawlMsg('Crawl trigger failed — check that the discovery service is running.')
    } finally {
      setCrawling(false)
    }
  }

  const saveAutoApply = async (v: boolean) => {
    setAutoApply(v)
    await onSave({ autoApplyThreshold: v ? 80 : 0 }).catch(() => {})
  }

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
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}><Toggle on={autoApply} onChange={saveAutoApply} /></div>
        </div>
      </section>

      <section className="card">
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>Manual trigger</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 13, color: 'var(--fg-muted)' }}>
            Run the discovery crawlers now instead of waiting for the next scheduled run.
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {crawlMsg && <span style={{ fontSize: 12, color: crawlMsg.includes('failed') ? 'var(--red-700)' : 'var(--fg-muted)' }}>{crawlMsg}</span>}
            <Button variant="secondary" size="sm" onClick={triggerCrawl} disabled={crawling}>
              {crawling ? 'Running…' : 'Trigger crawl'}
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export default function Settings({ prefs, profile, agentRunning, onToggleAgent }: {
  prefs: Preferences | null
  profile: Profile | null
  agentRunning: boolean
  onToggleAgent: () => void
}) {
  const [section, setSection] = useState('automation')

  const savePrefs = async (patch: Partial<Preferences>) => {
    await api.setPreferences(patch)
  }

  const renderSection = () => {
    switch (section) {
      case 'profile':    return <ProfileSection profile={profile} />
      case 'stories':    return <StoryBankSection />
      case 'targets':    return <TargetsSection prefs={prefs} onSave={savePrefs} />
      case 'accounts':   return <AccountsSection />
      case 'automation': return <AutomationSection agentRunning={agentRunning} onToggleAgent={onToggleAgent} prefs={prefs} onSave={savePrefs} />
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
