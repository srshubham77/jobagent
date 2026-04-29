'use client'

import React from 'react'
import {
  LayoutDashboard, Briefcase, Kanban as KanbanIcon, BarChart3, Settings,
  Upload, Filter, Sliders, Send, Check, X, Info,
  ChevronLeft, ChevronRight, Search, FileText, Mail, Link2, Copy,
  MessageSquare, HelpCircle, AlertTriangle, TrendingUp, Lightbulb,
  Download, Plus, Minus, Bot, LucideProps,
} from 'lucide-react'
import type { SalaryMode, PipelineStatus, ClosedTag, Tier } from './types'

// ---- Icon ----------------------------------------------------------------

const ICONS: Record<string, React.FC<LucideProps>> = {
  'layout-dashboard': LayoutDashboard,
  'briefcase': Briefcase,
  'kanban': KanbanIcon,
  'bar-chart-3': BarChart3,
  'settings': Settings,
  'upload': Upload,
  'filter': Filter,
  'sliders': Sliders,
  'send': Send,
  'check': Check,
  'x': X,
  'info': Info,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'search': Search,
  'file-text': FileText,
  'mail': Mail,
  'link-2': Link2,
  'copy': Copy,
  'message-square': MessageSquare,
  'help-circle': HelpCircle,
  'alert-triangle': AlertTriangle,
  'trending-up': TrendingUp,
  'lightbulb': Lightbulb,
  'download': Download,
  'plus': Plus,
  'minus': Minus,
  'bot': Bot,
}

export const Icon = ({ name, size = 16, style }: { name: string; size?: number; style?: React.CSSProperties }) => {
  const C = ICONS[name]
  if (!C) return null
  return <C size={size} style={{ display: 'inline-flex', flexShrink: 0, ...style }} strokeWidth={1.5} />
}

// ---- Avatar --------------------------------------------------------------

export const Avatar = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <span className={`avatar ${className}`}>{children}</span>
)

// ---- Wordmark ------------------------------------------------------------

export const Wordmark = () => (
  <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--fg)', fontFamily: 'var(--font-sans)' }}>
    JobAgent
  </span>
)

// ---- Button --------------------------------------------------------------

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'lg'
}

export const Button = ({ variant = 'primary', size, children, className = '', ...rest }: ButtonProps) => (
  <button className={`btn ${variant} ${size ?? ''} ${className}`} {...rest}>{children}</button>
)

// ---- Input ---------------------------------------------------------------

export const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input className="input" {...props} />
)

// ---- Field ---------------------------------------------------------------

export const Field = ({ label, help, error, children }: {
  label?: string; help?: string; error?: boolean; children: React.ReactNode
}) => (
  <div className="field">
    {label && <label className="lbl">{label}</label>}
    {children}
    {help && <span className="help" style={error ? { color: 'var(--red-500)' } : undefined}>{help}</span>}
  </div>
)

// ---- Pill / status pills -------------------------------------------------

export const Pill = ({ status, children, className = '' }: {
  status: string; children: React.ReactNode; className?: string
}) => (
  <span className={`pill ${status} ${className}`}><span className="d"></span>{children}</span>
)

const PIPELINE_LABELS: Record<PipelineStatus, string> = {
  discovered: 'Discovered',
  drafted: 'Drafted',
  applied: 'Applied',
  active: 'Active',
  closed: 'Closed',
}

const CLOSED_LABELS: Record<ClosedTag, string> = {
  offer: 'Offer',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  ghosted: 'Ghosted',
}

export const PipelineStatusPill = ({ status }: { status: PipelineStatus }) => (
  <Pill status={status}>{PIPELINE_LABELS[status]}</Pill>
)

export const ClosedSubTagPill = ({ tag }: { tag: ClosedTag }) => (
  <Pill status={`subtag-${tag}`} className={tag === 'ghosted' ? 'pill-italic' : ''}>
    {CLOSED_LABELS[tag]}
  </Pill>
)

// ---- Salary badge --------------------------------------------------------

const SALARY_LABEL: Record<SalaryMode, string> = {
  explicit: 'USD explicit',
  implied:  'USD likely',
  unstated: 'Salary unstated',
}

export const SalaryBadge = ({ mode, label }: { mode: SalaryMode; label?: string }) => (
  <span className={`salary-badge ${mode}`}>{label ?? SALARY_LABEL[mode]}</span>
)

// ---- Tier badge ----------------------------------------------------------

const TIER_LABEL: Record<Tier, string> = {
  1: 'Direct apply',
  2: 'Standard apply',
  3: 'Forwarded',
}
const TIER_TOOLTIP: Record<Tier, string> = {
  1: 'Direct ATS submit (Greenhouse, Lever, Workable). Reliable — submits in seconds via API.',
  2: 'Automated browser submit. Best-effort — falls back to manual if a captcha or anti-bot challenge appears.',
  3: 'Manual submit. The agent prepares the application; you submit yourself.',
}

export const TierBadge = ({ tier }: { tier: Tier }) => (
  <span className={`tier-badge t${tier}`} title={TIER_TOOLTIP[tier]}>
    <span className="n">T{tier}</span>{TIER_LABEL[tier]}
  </span>
)

// ---- Fit score -----------------------------------------------------------

export const FitScore = ({ value, size = 24 }: { value: number; size?: number }) => {
  const tier = value >= 80 ? 'good' : value >= 60 ? 'mid' : 'low'
  const ringColor = tier === 'good' ? '#3D7A4E' : tier === 'mid' ? '#C68B2C' : '#B5483A'
  const trackColor = tier === 'good' ? '#ECF2EC' : tier === 'mid' ? '#FAF1DF' : '#F7E7E3'
  const r = (size - 4) / 2
  const c = 2 * Math.PI * r
  const filled = (value / 100) * c
  const stroke = size >= 48 ? 3 : 2
  const fontSize = size >= 48 ? 16 : size >= 32 ? 12 : 10
  return (
    <span className={`fit ${tier}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={ringColor} strokeWidth={stroke}
          strokeDasharray={`${filled} ${c}`} strokeLinecap="round" />
      </svg>
      <span className="num" style={{ fontSize }}>{value}</span>
    </span>
  )
}

// ---- Kill switch ---------------------------------------------------------

export const KillSwitch = ({ running, onToggle }: { running: boolean; onToggle: () => void }) => (
  <span
    className={`killswitch ${running ? 'running' : 'paused'}`}
    onClick={onToggle}
    role="button"
    tabIndex={0}
    onKeyDown={e => e.key === 'Enter' && onToggle()}
  >
    <span className="dot"></span>
    {running ? 'Agent on' : 'Agent paused — resume'}
  </span>
)

// ---- Logo chip -----------------------------------------------------------

export const LogoChip = ({ char, bg }: { char: string; bg: string }) => (
  <span className="logo-chip" style={{ background: bg }}>{char}</span>
)

// ---- Toggle --------------------------------------------------------------

export const Toggle = ({ on, onChange }: { on: boolean; onChange?: (v: boolean) => void }) => (
  <span
    className={`toggle ${on ? 'on' : ''}`}
    onClick={() => onChange?.(!on)}
    role="switch"
    aria-checked={on}
    tabIndex={0}
    onKeyDown={e => e.key === 'Enter' && onChange?.(!on)}
  />
)
