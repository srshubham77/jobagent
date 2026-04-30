'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'

export default function LoginClient() {
  const [loading, setLoading] = useState(false)

  const handleSignIn = () => {
    setLoading(true)
    signIn('google', { callbackUrl: '/' })
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-0)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 32,
      }}>
        {/* Wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 8,
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 700, color: '#FAF8F3',
            letterSpacing: '-0.03em',
          }}>J</div>
          <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--fg-1)' }}>
            JobAgent
          </span>
        </div>

        {/* Card */}
        <div className="card" style={{ width: '100%', padding: '36px 32px', textAlign: 'center' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 8px' }}>
            Sign in
          </h1>
          <p style={{ fontSize: 13, color: 'var(--fg-muted)', margin: '0 0 28px', lineHeight: 1.5 }}>
            Your AI agent for remote, USD-paying engineering jobs.
          </p>

          <button
            onClick={handleSignIn}
            disabled={loading}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '11px 16px',
              background: loading ? 'var(--bg-2)' : 'var(--bg-1)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--fg-1)',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-2)' }}
            onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-1)' }}
          >
            <GoogleIcon />
            {loading ? 'Redirecting…' : 'Continue with Google'}
          </button>
        </div>

        <p style={{ fontSize: 11.5, color: 'var(--fg-subtle)', textAlign: 'center', maxWidth: 300, lineHeight: 1.6 }}>
          By signing in you agree that the agent will only act within the boundaries you set, and will never submit an application without your approval.
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
