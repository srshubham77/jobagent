'use client'

import { useRef, useState } from 'react'
import { Button, Field, Icon, Input, Toggle } from './Atoms'
import { api } from '../lib/api'

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)

  // Step 0 — resume
  const fileRef = useRef<HTMLInputElement>(null)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState('')

  // Step 1 — preferences
  const [title,     setTitle]     = useState('Software Engineer')
  const [stack,     setStack]     = useState('')
  const [minSalary, setMinSalary] = useState('80000')
  const [location,  setLocation]  = useState('Remote')

  // Step 2 — rules
  const [autoApply, setAutoApply] = useState(false)
  const [usdOnly,   setUsdOnly]   = useState(true)
  const [finishing, setFinishing] = useState(false)

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) { setResumeFile(f); setUploadErr('') }
  }

  const nextStep0 = async () => {
    if (!resumeFile) { setUploadErr('Please select a resume file first.'); return }
    setUploading(true)
    try {
      await api.uploadResume(resumeFile)
      setStep(1)
    } catch {
      setUploadErr('Upload failed. Check that the profile service is running.')
    } finally {
      setUploading(false)
    }
  }

  const nextStep1 = async () => {
    try {
      await api.setPreferences({
        targetTitle:  title || null,
        targetStack:  stack ? stack.split(',').map(s => s.trim()).filter(Boolean) : [],
        minSalary:    minSalary ? Number(minSalary) : null,
        location:     location || null,
        usdOnly,
      })
    } catch { /* non-fatal — continue to step 2 */ }
    setStep(2)
  }

  const finish = async () => {
    setFinishing(true)
    try {
      await api.setPreferences({ autoApplyThreshold: autoApply ? 80 : 0, agentEnabled: true })
    } catch { /* non-fatal */ }
    onDone()
  }

  return (
    <div className="onb">
      <div className="onb-step">Step {step + 1} of 3</div>

      {step === 0 && (
        <div>
          <h1 className="onb-h">Upload your resume.</h1>
          <p className="onb-sub">JobAgent reads it once to learn what you've shipped, what you can negotiate for, and what to write in cover letters.</p>
          <div
            className="dropzone"
            onClick={() => fileRef.current?.click()}
            style={{ cursor: 'pointer' }}
          >
            <Icon name="upload" size={20} />
            {resumeFile ? (
              <div className="dz-t mt-2" style={{ color: 'var(--accent)' }}>{resumeFile.name}</div>
            ) : (
              <div className="dz-t mt-2">Drop a PDF, or click to upload</div>
            )}
            <div className="dz-s">PDF, DOCX. Up to 5 MB.</div>
            <input ref={fileRef} type="file" accept=".pdf,.docx" style={{ display: 'none' }} onChange={pickFile} />
          </div>
          {uploadErr && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--red-700)' }}>{uploadErr}</div>}
        </div>
      )}

      {step === 1 && (
        <div>
          <h1 className="onb-h">What are you looking for?</h1>
          <p className="onb-sub">JobAgent uses these to score every posting. You can change them anytime in settings.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Title" help="The role you want next.">
              <Input value={title} onChange={e => setTitle(e.target.value)} />
            </Field>
            <Field label="Stack" help="Comma-separated. Used for fit scoring.">
              <Input value={stack} onChange={e => setStack(e.target.value)} placeholder="Go, TypeScript, Postgres" />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Min salary (USD)"><Input value={minSalary} onChange={e => setMinSalary(e.target.value)} /></Field>
              <Field label="Location"><Input value={location} onChange={e => setLocation(e.target.value)} /></Field>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h1 className="onb-h">Set the agent's rules.</h1>
          <p className="onb-sub">Two important defaults. You can change them in settings later.</p>
          <div className="card" style={{ padding: 0 }}>
            <div className="set-row" style={{ padding: 16, gridTemplateColumns: '1fr auto' }}>
              <div className="set-l">
                <div className="t">Auto-apply when fit ≥ 80</div>
                <div className="d">Otherwise JobAgent will queue matches for your review.</div>
              </div>
              <Toggle on={autoApply} onChange={setAutoApply} />
            </div>
            <div className="set-row" style={{ padding: 16, gridTemplateColumns: '1fr auto' }}>
              <div className="set-l">
                <div className="t">USD-paying only</div>
                <div className="d">Skip roles paid in other currencies.</div>
              </div>
              <Toggle on={usdOnly} onChange={setUsdOnly} />
            </div>
          </div>
        </div>
      )}

      <div className="onb-foot">
        <Button
          variant="ghost"
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          style={step === 0 ? { visibility: 'hidden' } : {}}
        >
          Back
        </Button>
        {step === 0 && (
          <Button variant="primary" onClick={nextStep0} disabled={uploading}>
            {uploading ? 'Uploading…' : 'Continue'}
          </Button>
        )}
        {step === 1 && (
          <Button variant="primary" onClick={nextStep1}>Continue</Button>
        )}
        {step === 2 && (
          <Button variant="primary" onClick={finish} disabled={finishing}>
            {finishing ? 'Starting…' : 'Start the agent'}
          </Button>
        )}
      </div>
    </div>
  )
}
