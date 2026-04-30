'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button, Icon } from './Atoms'

interface DraftSummary {
  id: string
  job_id: string
  status: string
  cover_letter_preview: string | null
  answer_count: number
  created_at: string
}

interface SubmitResult {
  method: string
  status: string
  message: string | null
}

export default function ReviewQueue() {
  const [drafts, setDrafts] = useState<DraftSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, SubmitResult>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/drafts')
      if (res.ok) setDrafts(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const approve = async (id: string) => {
    setSubmitting(id)
    try {
      const res = await fetch(`/api/submit/${id}`, { method: 'POST' })
      const result: SubmitResult = await res.json()
      setResults(r => ({ ...r, [id]: result }))
      if (result.status === 'submitted') {
        setDrafts(d => d.filter(x => x.id !== id))
      }
    } finally {
      setSubmitting(null)
    }
  }

  const skip = (id: string) => {
    setDrafts(d => d.filter(x => x.id !== id))
  }

  if (loading) {
    return (
      <div className="page">
        <h1 className="page-title">Review queue</h1>
        <div className="muted" style={{ marginTop: 32 }}>Loading…</div>
      </div>
    )
  }

  return (
    <div className="page">
      <h1 className="page-title">Review queue</h1>
      <p className="page-sub">Applications the agent has drafted. Approve to submit, skip to dismiss for this session.</p>

      {drafts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Icon name="check-circle" size={32} />
          <div style={{ marginTop: 12, fontWeight: 600 }}>Queue is clear</div>
          <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>
            New drafts appear here as the agent discovers matching jobs.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {drafts.map(draft => {
            const result = results[draft.id]
            const isBusy = submitting === draft.id
            return (
              <div key={draft.id} className="card">
                <div className="row-between">
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className="eyebrow">Draft</span>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>
                        {new Date(draft.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {draft.cover_letter_preview && (
                      <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
                        {draft.cover_letter_preview}
                        {draft.cover_letter_preview.length >= 200 && '…'}
                      </p>
                    )}

                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--fg-muted)' }}>
                      {draft.answer_count} question{draft.answer_count !== 1 ? 's' : ''} answered
                    </div>

                    {result && (
                      <div style={{
                        marginTop: 8, fontSize: 12, padding: '4px 8px', borderRadius: 4,
                        background: result.status === 'submitted' ? 'var(--green-100)' : 'var(--bg-2)',
                        color: result.status === 'submitted' ? 'var(--green-700)' : 'var(--fg-muted)',
                        display: 'inline-block',
                      }}>
                        {result.status === 'submitted'
                          ? `Submitted via ${result.method}`
                          : result.message ?? result.status}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'flex-start' }}>
                    <Button variant="ghost" size="sm" onClick={() => skip(draft.id)} disabled={isBusy}>
                      Skip
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => approve(draft.id)} disabled={isBusy}>
                      {isBusy ? 'Submitting…' : 'Approve & Submit'}
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
