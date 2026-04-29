'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import Dashboard from './Dashboard'
import JobsFeed from './JobsFeed'
import JobDetailDrawer from './JobDetail'
import Kanban from './Kanban'
import Analytics from './Analytics'
import Settings from './Settings'
import Onboarding from './Onboarding'
import { DATA } from './data'
import type { Job } from './types'

type Screen = 'dashboard' | 'jobs' | 'pipeline' | 'analytics' | 'settings' | 'onboarding'

export default function App() {
  const [active, setActive] = useState<Screen>('dashboard')
  const [agentRunning, setRunning] = useState(true)
  const [openJob, setOpenJob] = useState<Job | null>(null)

  const screen = (() => {
    switch (active) {
      case 'dashboard':  return <Dashboard data={DATA} agentRunning={agentRunning} />
      case 'jobs':       return <JobsFeed data={DATA} onOpen={setOpenJob} />
      case 'pipeline':   return <Kanban data={DATA} />
      case 'analytics':  return <Analytics data={DATA} />
      case 'settings':   return <Settings data={DATA} agentRunning={agentRunning} onToggleAgent={() => setRunning(r => !r)} />
      case 'onboarding': return <Onboarding onDone={() => setActive('dashboard')} />
      default:           return null
    }
  })()

  const isSubmitted = openJob ? ['applied', 'active', 'closed'].includes(openJob.status) : false

  return (
    <div className="demo-shell">
      <div className="app">
        <Sidebar active={active} onChange={id => setActive(id as Screen)} />
        <main>
          <TopBar
            active={active}
            agentRunning={agentRunning}
            onToggleAgent={() => setRunning(r => !r)}
            user={DATA.user}
          />
          {screen}
        </main>
      </div>

      {openJob && (
        <JobDetailDrawer
          job={openJob}
          data={DATA}
          onClose={() => setOpenJob(null)}
          defaultTab="draft"
          submitted={isSubmitted}
        />
      )}
    </div>
  )
}
