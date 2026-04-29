'use client'

import { Avatar, KillSwitch } from './Atoms'
import type { User } from './types'

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
  user: User
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
