'use client'

import { useState } from 'react'
import { Button, Field, Icon, Input, Toggle } from './Atoms'

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  const next = () => setStep(s => Math.min(2, s + 1))
  const prev = () => setStep(s => Math.max(0, s - 1))

  return (
    <div className="onb">
      <div className="onb-step">Step {step + 1} of 3</div>

      {step === 0 && (
        <div>
          <h1 className="onb-h">Upload your resume.</h1>
          <p className="onb-sub">JobAgent reads it once to learn what you've shipped, what you can negotiate for, and what to write in cover letters.</p>
          <div className="dropzone">
            <Icon name="upload" size={20} />
            <div className="dz-t mt-2">Drop a PDF, or click to upload</div>
            <div className="dz-s">PDF, DOCX. Up to 5 MB.</div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <h1 className="onb-h">What are you looking for?</h1>
          <p className="onb-sub">JobAgent uses these to score every posting. You can change them anytime in settings.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Title" help="The role you want next.">
              <Input defaultValue="Senior frontend engineer" />
            </Field>
            <Field label="Stack" help="Comma-separated. Used for fit scoring.">
              <Input defaultValue="TypeScript, React, Node.js" />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Min salary (USD)"><Input defaultValue="180000" /></Field>
              <Field label="Location"><Input defaultValue="Remote · Americas" /></Field>
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
              <Toggle on={true} />
            </div>
            <div className="set-row" style={{ padding: 16, gridTemplateColumns: '1fr auto' }}>
              <div className="set-l">
                <div className="t">USD-paying only</div>
                <div className="d">Skip roles paid in other currencies.</div>
              </div>
              <Toggle on={true} />
            </div>
          </div>
        </div>
      )}

      <div className="onb-foot">
        <Button
          variant="ghost"
          onClick={prev}
          disabled={step === 0}
          style={step === 0 ? { visibility: 'hidden' } : {}}
        >
          Back
        </Button>
        {step < 2
          ? <Button variant="primary" onClick={next}>Continue</Button>
          : <Button variant="primary" onClick={onDone}>Start the agent</Button>}
      </div>
    </div>
  )
}
