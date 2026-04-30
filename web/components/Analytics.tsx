'use client'

export default function Analytics() {
  return (
    <div className="page">
      <h1 className="page-title">Analytics</h1>
      <p className="page-sub">Funnel metrics, reply rates, and variant performance will appear here once applications are submitted.</p>
      <div className="card" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--fg-muted)' }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>No data yet</div>
        <div style={{ fontSize: 13 }}>Start approving drafts and submitting applications to see analytics.</div>
      </div>
    </div>
  )
}
