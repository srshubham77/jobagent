'use client'

import { Avatar, KillSwitch } from './Atoms'

async function handleSignOut() {
  await fetch('/api/auth/logout', { method: 'POST' })
  window.location.href = '/login'
}

const TITLES: Record<string, string> = {
  dashboard:  'Dashboard',
  jobs:       'Jobs',
  pipeline:   'Pipeline',
  analytics:  'Analytics',
  settings:   'Settings',
  onboarding: 'Setup',
}

export default function TopBar({ active, agentRunning, onToggleAgent, user }: {
  active: string
  agentRunning: boolean
  onToggleAgent: () => void
  user: { name: string; email: string; avatarMonogram: string }
}) {
  return (
    <header className="topbar">
      <div className="tb-title">{TITLES[active] ?? active}</div>
      <div className="tb-right">
        <KillSwitch running={agentRunning} onToggle={onToggleAgent} />
        <Avatar>{user.avatarMonogram}</Avatar>
        <button
          onClick={handleSignOut}
          style={{
            fontSize: 12,
            color: 'var(--fg-muted)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: 6,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--fg-1)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--fg-muted)')}
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
