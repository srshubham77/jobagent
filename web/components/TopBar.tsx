'use client'

import { Avatar, KillSwitch } from './Atoms'

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
      </div>
    </header>
  )
}
