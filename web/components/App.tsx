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
import { api, type FeedJob, type Profile, type Preferences } from '../lib/api'

type Screen = 'dashboard' | 'jobs' | 'review' | 'pipeline' | 'analytics' | 'settings' | 'onboarding'

export default function App() {
  const [active, setActive] = useState<Screen>('dashboard')
  const [openJob, setOpenJob] = useState<FeedJob | null>(null)

  const [jobs, setJobs] = useState<FeedJob[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [prefs, setPrefs] = useState<Preferences | null>(null)
  const [agentRunning, setAgentRunning] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.getJobs().catch(() => [] as FeedJob[]),
      api.getProfile().catch(() => null),
      api.getPreferences().catch(() => null),
    ]).then(([fetchedJobs, fetchedProfile, fetchedPrefs]) => {
      setJobs(fetchedJobs)
      setProfile(fetchedProfile)
      if (fetchedPrefs) {
        setPrefs(fetchedPrefs)
        setAgentRunning(fetchedPrefs.agentEnabled)
      }
      setLoading(false)
    })
  }, [])

  const handleToggleAgent = useCallback(async () => {
    const next = !agentRunning
    setAgentRunning(next)
    try {
      await api.setPreferences({ agentEnabled: next })
      setPrefs(p => p ? { ...p, agentEnabled: next } : p)
    } catch {
      setAgentRunning(!next)
    }
  }, [agentRunning])

  const user = {
    name: profile?.contact?.name ?? 'You',
    email: profile?.contact?.email ?? '',
    avatarMonogram: (profile?.contact?.name ?? 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
  }

  const screen = (() => {
    switch (active) {
      case 'dashboard':  return <Dashboard jobs={jobs} agentRunning={agentRunning} userName={user.name} loading={loading} />
      case 'jobs':       return <JobsFeed jobs={jobs} loading={loading} onOpen={setOpenJob} />
      case 'review':     return <ReviewQueue />
      case 'pipeline':   return <Kanban />
      case 'analytics':  return <Analytics />
      case 'settings':   return <Settings prefs={prefs} agentRunning={agentRunning} onToggleAgent={handleToggleAgent} />
      case 'onboarding': return <Onboarding onDone={() => setActive('dashboard')} />
      default:           return null
    }
  })()

  return (
    <div className="demo-shell">
      <div className="app">
        <Sidebar active={active} onChange={id => setActive(id as Screen)} />
        <main>
          <TopBar
            active={active}
            agentRunning={agentRunning}
            onToggleAgent={handleToggleAgent}
            user={user}
          />
          {screen}
        </main>
      </div>

      {openJob && (
        <JobDetailDrawer
          job={openJob}
          onClose={() => setOpenJob(null)}
        />
      )}
    </div>
  )
}
