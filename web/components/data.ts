import type { AppData } from './types'

export const DATA: AppData = {
  user: {
    name: 'Shubham Patel',
    email: 'shubham@example.com',
    avatarMonogram: 'SP',
  },

  agent: {
    running: true,
    lastSync: '4 minutes ago',
    appliedToday: 8,
    appliedThisWeek: 47,
    costMonth: 23.40,
    costCap: 50,
  },

  pipelineCounts: {
    discovered: 47,
    drafted: 12,
    applied: 31,
    active: 6,
    closed: 18,
  },

  funnel: {
    discovered: 142,
    drafted: 82,
    applied: 70,
    active: 21,
    offer: 5,
    responseRate: 23,
  },

  jobs: [
    { id: 'jb_01', title: 'Senior frontend engineer', company: 'Vercel', logoChar: 'V', logoBg: '#000000', location: 'Remote · US, EU', postedAgo: '2h ago', salaryMode: 'explicit', salaryRange: '$190 – 230k', fit: 92, status: 'applied', tier: 1, stack: ['TypeScript', 'React', 'Next.js'] },
    { id: 'jb_02', title: 'Staff product engineer', company: 'Linear', logoChar: 'L', logoBg: '#5E6AD2', location: 'Remote · global', postedAgo: '1d ago', salaryMode: 'explicit', salaryRange: '$220 – 260k', fit: 88, status: 'active', tier: 1, stack: ['TypeScript', 'React', 'GraphQL'] },
    { id: 'jb_03', title: 'Senior platform engineer', company: 'Notion', logoChar: 'N', logoBg: '#1A1A1A', location: 'Remote · Americas', postedAgo: '3d ago', salaryMode: 'explicit', salaryRange: '$210 – 250k', fit: 81, status: 'discovered', tier: 2, stack: ['TypeScript', 'Node.js', 'Postgres'] },
    { id: 'jb_04', title: 'Senior fullstack engineer', company: 'Replicate', logoChar: 'R', logoBg: '#000000', location: 'Remote · global', postedAgo: '6h ago', salaryMode: 'implied', salaryRange: 'USD likely ($170 – 220k)', fit: 76, status: 'applied', tier: 2, stack: ['Python', 'TypeScript', 'Postgres'] },
    { id: 'jb_05', title: 'Frontend engineer', company: 'Plain', logoChar: 'P', logoBg: '#3F6B8C', location: 'Remote · EU', postedAgo: '12h ago', salaryMode: 'explicit', salaryRange: '$160 – 190k', fit: 71, status: 'drafted', tier: 2, stack: ['TypeScript', 'React'] },
    { id: 'jb_06', title: 'Senior software engineer, growth', company: 'Height', logoChar: 'H', logoBg: '#4A4639', location: 'Remote · global', postedAgo: '2d ago', salaryMode: 'unstated', salaryRange: 'Salary unstated', fit: 64, status: 'applied', tier: 3, stack: ['TypeScript', 'React'] },
    { id: 'jb_07', title: 'Senior backend engineer', company: 'Inngest', logoChar: 'I', logoBg: '#6B6555', location: 'Remote · US', postedAgo: '5d ago', salaryMode: 'explicit', salaryRange: '$180 – 220k', fit: 58, status: 'closed', closedTag: 'rejected', tier: 2, stack: ['Go', 'TypeScript', 'Postgres'] },
    { id: 'jb_08', title: 'Senior infra engineer', company: 'Modal', logoChar: 'M', logoBg: '#3D7A4E', location: 'Remote · US', postedAgo: '1d ago', salaryMode: 'explicit', salaryRange: '$200 – 240k', fit: 84, status: 'active', tier: 1, stack: ['Python', 'Rust', 'Kubernetes'] },
    { id: 'jb_09', title: 'Software engineer, AI agents', company: 'Anthropic', logoChar: 'A', logoBg: '#D9663E', location: 'Remote · US', postedAgo: '8h ago', salaryMode: 'explicit', salaryRange: '$240 – 320k', fit: 89, status: 'drafted', tier: 1, stack: ['Python', 'TypeScript'] },
    { id: 'jb_10', title: 'Senior frontend engineer', company: 'Cal.com', logoChar: 'C', logoBg: '#1A1A1A', location: 'Remote · global', postedAgo: '4h ago', salaryMode: 'implied', salaryRange: 'USD likely', fit: 67, status: 'applied', tier: 2, stack: ['TypeScript', 'React', 'Prisma'] },
    { id: 'jb_11', title: 'Senior fullstack engineer', company: 'Resend', logoChar: 'R', logoBg: '#1A1A1A', location: 'Remote · global', postedAgo: '1w ago', salaryMode: 'explicit', salaryRange: '$180 – 220k', fit: 79, status: 'closed', closedTag: 'offer', tier: 1, stack: ['TypeScript', 'React', 'Node.js'] },
    { id: 'jb_12', title: 'Frontend engineer', company: 'Railway', logoChar: 'Y', logoBg: '#3D3056', location: 'Remote · global', postedAgo: '2w ago', salaryMode: 'unstated', salaryRange: 'Salary unstated', fit: 62, status: 'closed', closedTag: 'ghosted', tier: 2, stack: ['TypeScript', 'React'] },
    { id: 'jb_13', title: 'Staff engineer, infra', company: 'Supabase', logoChar: 'S', logoBg: '#3D7A4E', location: 'Remote · global', postedAgo: '5d ago', salaryMode: 'explicit', salaryRange: '$210 – 260k', fit: 74, status: 'closed', closedTag: 'withdrawn', tier: 1, stack: ['TypeScript', 'Postgres', 'Go'] },
  ],

  weekly: [
    { day: 'Mon', applied: 6, responses: 1 },
    { day: 'Tue', applied: 9, responses: 2 },
    { day: 'Wed', applied: 11, responses: 3 },
    { day: 'Thu', applied: 8, responses: 2 },
    { day: 'Fri', applied: 7, responses: 4 },
    { day: 'Sat', applied: 4, responses: 1 },
    { day: 'Sun', applied: 2, responses: 0 },
  ],

  pipeline: ['discovered', 'drafted', 'applied', 'active', 'closed'],
  closedSubTags: ['offer', 'rejected', 'withdrawn', 'ghosted'],

  replyBySource: [
    { source: 'We Work Remotely', rate: 8.2, applied: 24 },
    { source: 'Wellfound',        rate: 6.4, applied: 31 },
    { source: 'Greenhouse direct', rate: 5.1, applied: 18 },
    { source: 'Lever direct',     rate: 4.6, applied: 14 },
    { source: 'RemoteOK',         rate: 0.5, applied: 28 },
  ],

  replyByVariant: [
    { variant: 'Variant A · backend lean', rate: 9.4, applied: 32, leader: true },
    { variant: 'Variant B · fullstack',   rate: 5.2, applied: 41 },
    { variant: 'Variant C · platform',    rate: 4.1, applied: 22 },
  ],

  draftedJob: {
    id: 'jb_drafted',
    title: 'Senior frontend engineer',
    company: 'Vercel',
    logoChar: 'V',
    logoBg: '#000000',
    location: 'Remote · US, EU',
    postedAgo: '2h ago',
    salaryMode: 'explicit',
    salaryRange: '$190 – 230k',
    fit: 92,
    status: 'drafted',
    tier: 1,
    stack: ['TypeScript', 'React', 'Next.js'],
    sourceUrl: 'https://boards.greenhouse.io/vercel/',
    fitBreakdown: [
      { label: 'Stack overlap', value: 95 },
      { label: 'Salary fit',    value: 100 },
      { label: 'Remote policy', value: 100 },
      { label: 'Seniority',     value: 80 },
    ],
    skills: [
      { name: 'TypeScript', have: true },
      { name: 'React',      have: true },
      { name: 'Next.js',    have: true },
      { name: 'Node.js',    have: true },
      { name: 'GraphQL',    have: false },
      { name: 'WebGL',      have: false },
    ],
    questions: [
      {
        q: 'Why are you interested in joining Vercel?',
        a: "I've been building on Next.js since v9, and the developer experience improvements over the last three years have shaped how I think about web tooling. What draws me to Vercel specifically is the focus on the boundary between framework and platform — the most interesting problems live there. I'd want to contribute to that surface area.",
        source: 'Drawn from: profile summary',
      },
      {
        q: 'Describe a complex technical project you led.',
        a: 'At Linear-scale-startup I led the migration of our analytics pipeline from a self-hosted ClickHouse cluster to a managed solution, while keeping query latency under 200ms for the dashboard. The hardest part was the dual-write window — we ran both systems in parallel for six weeks to validate parity, and built a diffing tool that surfaced any drift in real time.',
        source: 'Drawn from story: Analytics migration',
      },
      {
        q: "What's your salary expectation?",
        a: 'Looking for $200–230k base, in line with the posted range. Open to discussing equity weighting once I learn more about the role.',
        source: 'Drawn from: profile summary',
      },
    ],
    network: [
      { name: 'Priya Shah',   title: 'Staff engineer, runtime',   degree: 1, mutual: null,              avatar: 'PS', avatarBg: '#3F6B8C' },
      { name: 'Marcus Lee',   title: 'Engineering manager',        degree: 2, mutual: 'via Jordan Wells', avatar: 'ML', avatarBg: '#3D7A4E' },
      { name: 'Aisha Carter', title: 'Senior frontend engineer',   degree: 2, mutual: 'via Priya Shah',   avatar: 'AC', avatarBg: '#D9663E' },
    ],
    activity: [
      { kind: 'discovered', icon: 'search',    text: 'Discovered on Greenhouse',                when: 'Today, 14:02' },
      { kind: 'drafted',    icon: 'file-text', text: 'Drafted resume + 3 application answers', when: 'Today, 14:03' },
      { kind: 'submitted',  icon: 'send',      text: 'Submitted via Greenhouse API',            when: 'Today, 14:18' },
      { kind: 'confirmed',  icon: 'check',     text: 'Confirmation received from Greenhouse',   when: 'Today, 14:18' },
      { kind: 'reply',      icon: 'mail',      text: 'Email reply from recruiter Sarah Kim',    when: 'Today, 16:44' },
    ],
  },

  jdBody: [
    { kind: 'p', text: "We're looking for a senior frontend engineer to join the core platform team. You'll work on the systems that thousands of developers rely on every day — from the deploy pipeline UI to the analytics dashboards." },
    { kind: 'h', text: "What you'll do" },
    { kind: 'ul', items: [
      'Own significant surface area of the dashboard, end-to-end.',
      'Partner with backend and design to ship features that respect the deploy-first principle.',
      'Contribute to the design system that powers our marketing and product surfaces.',
      'Mentor mid-level engineers on frontend architecture decisions.',
    ]},
    { kind: 'h', text: "What we're looking for" },
    { kind: 'ul', items: [
      '5+ years building production frontend systems with TypeScript and React.',
      'Comfortable owning tradeoffs in a fast-moving codebase.',
      'Care for craft — performance, accessibility, motion, the whole stack.',
      'Bonus: experience with Next.js internals or build tooling.',
    ]},
  ],
}
