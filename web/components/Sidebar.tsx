'use client'

import { Icon, Wordmark } from './Atoms'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
  { id: 'jobs',      label: 'Jobs feed', icon: 'briefcase' },
  { id: 'review',    label: 'Review',    icon: 'clipboard-check' },
  { id: 'pipeline',  label: 'Pipeline',  icon: 'kanban' },
  { id: 'analytics', label: 'Analytics', icon: 'bar-chart-3' },
  { id: 'settings',  label: 'Settings',  icon: 'settings' },
]

const COST_USED = 23.40
const COST_CAP  = 50

export default function Sidebar({ active, onChange }: { active: string; onChange: (id: string) => void }) {
  const pct = Math.min(100, (COST_USED / COST_CAP) * 100)
  return (
    <aside className="sidebar">
      <div className="brand"><Wordmark /></div>
      <div className="sb-section">Workspace</div>
      {NAV.map(n => (
        <div
          key={n.id}
          className={`sb-item ${active === n.id ? 'active' : ''}`}
          onClick={() => onChange(n.id)}
        >
          <Icon name={n.icon} /> {n.label}
        </div>
      ))}
      <div className="sb-spacer" />
      <div className="cost-meter">
        <div className="cm-row">
          <span className="cm-label">Agent cost</span>
          <span className="cm-value">${COST_USED.toFixed(2)}</span>
        </div>
        <div className="cm-track"><span className="cm-fill" style={{ width: `${pct}%` }} /></div>
        <div className="cm-foot">${COST_USED.toFixed(2)} of ${COST_CAP.toFixed(0)} this month</div>
      </div>
    </aside>
  )
}
