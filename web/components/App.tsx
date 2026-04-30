'use client'

import { useState, useEffect, useCallback } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import Dashboard from './Dashboard'
import JobsFeed from './JobsFeed'
import JobDetailDrawer from './JobDetail'
import Kanban from './Kanban'
import Analytics from './Analytics'
import Settings from './Settings'
import Onboarding from './Onboarding'
import ReviewQueue from './ReviewQueue'
import { DATA } from './data'
import { api } from '../lib/api'
import type { Job } from './types'

type Screen = 'dashboard' | 'jobs' | 'review' | 'pipeline' | 'analytics' | 'settings' | 'onboarding'

export default function App() {
  const [active, setActive] = useState<Screen>('dashboard')
  const [agentRunning, setRunning] = useState(true)
  const [openJob, setOpenJob] = useState<Job | null>(null)
  const [prefLoaded, setPrefLoaded] = useState(false)

  // Load agent_enabled from real preferences API on mount
  useEffect(() => {
    api.getPreferences()
      .then(prefs => {
        setRunning(prefs.agentEnabled)
        setPrefLoaded(true)
      })
      .catch(() => setPrefLoaded(true)) // fall back to default=true if service is down
  }, [])

  const handleToggleAgent = useCallback(async () => {
    const next = !agentRunning
    setRunning(next)
    try {
      await api.setPreferences({ agentEnabled: next })
    } catch {
      // Roll back optimistic update if the API call fails
      setRunning(!next)
    }
  }, [agentRunning])

  const screen = (() => {
    switch (active) {
      case 'dashboard':  return <Dashboard data={DATA} agentRunning={agentRunning} />
      case 'jobs':       return <JobsFeed data={DATA} onOpen={setOpenJob} />
      case 'review':     return <ReviewQueue />
      case 'pipeline':   return <Kanban data={DATA} />
      case 'analytics':  return <Analytics data={DATA} />
      case 'settings':   return <Settings data={DATA} agentRunning={agentRunning} onToggleAgent={handleToggleAgent} />
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
            onToggleAgent={handleToggleAgent}
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
