# Claude Design briefs — AI Job Application Agent

> **How to use:** Open [claude.ai/design](https://claude.ai/design). For each screen, paste the **Design system seed** first (or set it once at the project level if Claude Design supports project-scoped systems), then paste the per-screen brief. Iterate through inline comments and sliders. Export and drop the URL back into the UI/UX designs page in Notion.

---

## Design system seed

Paste this as the first message of every project, or set it once at the project level.

```
Design system for "JobAgent" — an AI agent that finds remote USD-paying jobs and applies on the user's behalf.

Visual direction: friendly and approachable — Notion / Superhuman territory. Calm, confident, not corporate. Generous whitespace. Sentence case everywhere. No emoji. No gradients, no drop shadows beyond a subtle elevation, no neon.

Typography:
- Sans-serif throughout. Use Inter or the system sans equivalent.
- H1 24px / 600
- H2 20px / 600
- H3 16px / 600
- Body 14px / 400, line-height 1.6
- Caption 12px / 400, secondary color
- Mono (JetBrains Mono / system mono) for IDs and code

Color palette (light mode):
- Background primary: #FFFFFF
- Background secondary: #FAFAF9 (page surface)
- Background tertiary: #F4F4F2 (hover, subtle fills)
- Border default: #E7E5E4
- Border strong: #D6D3D1
- Text primary: #1C1917
- Text secondary: #57534E
- Text tertiary: #A8A29E
- Accent (brand): #6366F1 (indigo, used sparingly — primary CTAs and active states only)
- Success: #16A34A
- Warning: #D97706
- Danger: #DC2626
- Info: #2563EB

Color palette (dark mode):
- Background primary: #0C0A09
- Background secondary: #1C1917
- Background tertiary: #292524
- Border default: #292524
- Border strong: #44403C
- Text primary: #FAFAF9
- Text secondary: #A8A29E
- Text tertiary: #78716C
(accents stay the same; tweak if contrast is poor)

Spacing scale (4px base): 4, 8, 12, 16, 24, 32, 48, 64
Border radius: sm 4px, md 8px (default), lg 12px, full 9999px
Elevation: a single subtle shadow for cards — 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06). No heavier shadows.

Component patterns:
- Buttons: primary (indigo bg, white text), secondary (border, no fill), ghost (no border, hover bg)
- Inputs: 1px border, 8px radius, 36px height, focus ring uses accent at 30% opacity
- Cards: white bg, 1px border, 12px radius, 16px padding (or 24px for primary cards)
- Tabs: underline style, 2px accent underline on active
- Badges: pill shape, 12px font, colored bg at 10-15% opacity, full-saturation text
- Empty states: centered icon (line-style, 24px), heading, one-line description, CTA below
- Loading: subtle skeleton blocks, no spinners except for explicit async actions
- Toasts: bottom-right, 8px radius, auto-dismiss with manual close

Tone of microcopy:
- Direct and human. "Looks good?" not "Please review and confirm."
- Never use "AI" as a noun in the UI. Say "the agent" or just describe what's happening.
- Errors are honest and actionable. "Couldn't reach RemoteOK — retrying in 30s." not "An error occurred."

Accessibility:
- All interactive elements at least 36px tall.
- Focus rings always visible.
- Color is never the only signal — pair with icon, text, or shape.
- WCAG AA contrast minimum.
```

---

## Screen 1 — Onboarding (resume upload + story bank flow)

```
Design the onboarding flow for JobAgent. Multi-step, progress visible at the top.

Steps:
1. Welcome — single screen, headline "Let's set up your profile," one-line subhead, two CTAs: "Upload resume" (primary) and "Start from scratch" (ghost).
2. Resume upload — drag-and-drop zone occupying the upper half. PDF/DOCX accepted. After upload: parsing state with skeleton, then a side-by-side view: parsed resume on the left, editable structured fields on the right (contact, summary, experience, education, skills, projects). Each field shows a small confidence indicator (green dot = high, amber = medium, red = low). User can edit any field inline.
3. Target roles — system suggests 3-5 role titles based on the parsed profile (chips, removable). User can add custom roles by typing. Below: filters (minimum salary in USD with a slider, location preference radio group, seniority dropdown, must-have stack as multi-select chips).
4. Story bank guided interview — this is the most important step. Frame it warmly: "We want to know your real stories, not just your bullet points. We'll ask 5-7 questions; each takes about a minute. You can skip and come back, but long-form answers won't be as good without these." Then: a chat-like interface where the agent asks one question at a time (e.g. "Tell me about a time you led a migration — what went wrong, and what did you do?"). User types or voice-records their answer. Agent extracts a structured story (situation, action, result, metrics) and shows it for confirmation before moving on. Show progress: "Story 2 of 6."
5. Connect accounts — Gmail OAuth (for tracking), LinkedIn export upload (for referrals). Both optional, both clearly explain what they're used for and what's NOT shared. Skippable.
6. Done — summary of what's set up, primary CTA "See your matched jobs."

Key requirements:
- Progress bar at top of every step, with step names visible.
- Back button always available except on Welcome and Done.
- All transitions feel instant; long async work (parsing, story extraction) shows skeleton or progress, never a spinner.
- Story bank step has a "skip for now" option but with a clear quality warning: "Long-form answer quality will be limited until you finish this. You can come back anytime."
- Mobile-responsive, but optimize for desktop — this is a one-time setup users do at a laptop.

Generate the full flow as a clickable prototype with each step's main state. Bonus: show one error state (e.g. resume parse failed → fallback to manual form) and one loading state (parsing in progress).
```

---

## Screen 2 — Dashboard

```
Design the dashboard for JobAgent. This is the home screen after login.

Layout: left sidebar navigation, main content area.

Sidebar (always visible, ~240px wide):
- Logo + product name at top
- Nav items: Dashboard, Jobs feed, Pipeline, Analytics, Settings
- Each nav item has an icon (line style, 16px) and label
- At the bottom: a prominent kill switch — "Halt all automation" — small toggle with status indicator (green dot = running, red dot = halted). When halted, a banner appears across the top of every page.
- Below nav: LLM cost meter, "$23.40 this month" with a small progress bar against the user's budget.

Main content (top to bottom):
1. Greeting + summary line: "Morning, Shubham. 4 new high-fit jobs and 2 recruiter replies waiting."
2. A row of 5 stat cards, each ~180px wide, showing counts per pipeline tab (Discovered / Drafted / Applied / Active / Closed). Each card: large number, tab name below, small trend indicator (+3 this week). Clicking a card navigates to that pipeline tab.
3. Two-column section below stats:
   - Left (60%): "Today's high-fit discoveries" — a scrollable list of the top 5 jobs surfaced today, each row showing company, title, fit score (large number with breakdown on hover), salary range, source. "Review" button on each row.
   - Right (40%): "Pending reviews" — drafted applications waiting for approval. Each shows company + title + how long the draft has been waiting. "Review draft" button.
4. Funnel snapshot card (full width, below): a horizontal funnel chart showing this week's Discovered → Drafted → Applied → Active → Offer with conversion percentages between each stage. Subtle, not flashy.
5. Recent activity feed (collapsible): "Tracker moved Acme Corp to Active 2h ago. Recruiter replied from sarah@acme.com." Style like a Linear or Slack activity log.

Empty states:
- New user with no jobs yet: a friendly "We're crawling sources for the first time — give us 5 minutes" with a soft animated illustration.
- No pending reviews: "All caught up. The agent will draft new applications as high-fit jobs come in."

Generate light and dark mode variants. Mobile is a stacked single column, but desktop is the priority.
```

---

## Screen 3 — Jobs feed

```
Design the Jobs feed for JobAgent. This is where users browse discovered jobs and decide which to apply to.

Layout: same left sidebar as Dashboard, main content is a filterable list.

Top of main content:
- Page title "Jobs" with a count "324 jobs matching your profile."
- A filter bar: search input (left), and chip-style filters for source, fit score (slider), salary range (slider), posted date (last 24h / week / month), remote policy. Active filters show as removable chips below the bar.
- Sort dropdown (right): Fit score (default), Posted date, Salary high-to-low.

Job list (each row, ~80px tall, separated by 1px divider):
- Left: company logo (40px square, 8px radius)
- Company name (medium weight) and job title (primary, 16px)
- Below: location/remote badge, salary range with currency badge (USD explicit / USD implied / unstated — use color coding), source name, posted relative time
- Right: fit score in a circular indicator (0-100) with color (green 80+, amber 60-80, red <60). Hovering shows the breakdown: skill overlap %, seniority match, stack overlap, salary fit.
- Far right: a small "referral" indicator if the user has connections at the company (icon + count, e.g. "3 connections"), and a primary CTA "Review" that opens the job detail.

Multi-select mode:
- Checkboxes appear on hover. Selecting one or more rows reveals a bulk action bar at the bottom: "Generate drafts for 3 jobs" (primary), "Skip" (ghost).

Empty state:
- "No jobs match your current filters. Try widening your salary range or adding more target roles." With a "Reset filters" button.

Loading: skeleton rows.

Generate the main view, plus one row's hover state (showing fit score breakdown), plus the empty filter state.
```

---

## Screen 4 — Job detail

```
Design the Job detail screen for JobAgent. This is the most important screen in the product — it's where the user reviews the agent's draft and approves submission.

Layout: opens as a side panel on top of the Jobs feed (60% width), or a full page on direct navigation.

Top:
- Close button (top-right)
- Company logo, name, and job title (large, prominent)
- Below: location, salary range with classification badge, source link, posted time, fit score with breakdown
- Submission tier badge: "Tier 1 — direct ATS submit" or "Tier 2 — automated browser (best-effort)" or "Tier 3 — manual submit" — color-coded, with a question mark tooltip explaining the tier.

Tab bar: Job description / Draft preview / Network / Activity

JD tab:
- Clean, well-typeset rendering of the JD with bullet points preserved.
- Right rail: required skills tagged as chips, with green checkmarks on skills the user has, gray on missing ones.

Draft preview tab (the primary tab — opens by default):
- Two columns:
  - Left (40%): generated tailored resume — preview of the resume PDF that will be submitted, with a small "view changes" link at top showing a diff vs. the base resume (added keywords highlighted, reordered bullets indicated).
  - Right (60%): generated answers to application questions. Each Q-and-A in a card. Cards are individually editable inline. Below each answer, a small note: "Drawn from: [story name]" or "Drawn from: profile summary" so the user knows where it came from.
- At the bottom: a sticky action bar with: "Approve and submit" (primary, large), "Approve with edits" (ghost), "Skip this job" (ghost-danger).
- A small note above the action bar: "Will submit via Greenhouse API. Estimated time: ~3 seconds."

Network tab:
- "You have 3 connections at Acme Corp."
- List of connections with name, current title, mutual connection (for 2nd degree), and a "Draft referral message" button per connection. Clicking generates a copy-paste-ready message in a modal.

Activity tab:
- Empty until the application is submitted, then shows: submitted timestamp, screenshot of confirmation, any email replies, state transitions.

Empty states and loading:
- If the agent is still generating the draft: skeleton on the right column with text "Drafting your application..."
- If a referral path doesn't exist: "No connections at this company yet. You can pursue cold-apply, or connect with someone who works there."

Generate the Draft preview tab as the main hero state, plus the Network tab and the activity tab populated with one submitted state.
```

---

## Screen 5 — Pipeline kanban

```
Design the Pipeline kanban for JobAgent. 5 columns representing application states.

Layout: same left sidebar. Main content is a horizontal kanban with 5 columns, each scrollable vertically.

Columns (left to right): Discovered, Drafted, Applied, Active, Closed.

Each column header:
- Column name (medium weight)
- Count badge ("23")
- A small "+" button on Discovered to manually add a job

Each card (compact, ~80px tall):
- Company name (medium weight) + title (primary)
- Salary range with currency badge
- Fit score indicator (small circle, top-right)
- Below: chips for state-specific metadata
  - Discovered: "5h ago" + source
  - Drafted: "Draft ready" + how long the draft has been waiting
  - Applied: "Applied 2d ago" + tier badge
  - Active: "Last reply 4h ago" + a colored sub-tag (recruiter contact / interview scheduled / in process)
  - Closed: sub-tag chip (rejected / offer / withdrawn / ghosted) — color-coded

Drag-to-move:
- Cards are draggable between columns.
- Moving forward (e.g. Applied → Active) is silent.
- Moving backward (e.g. Active → Applied) shows a confirmation modal: "Are you sure? State transitions are usually automatic — only override if something went wrong."

Filters at the top of the page:
- Date range (default: last 30 days)
- Source (multi-select)
- Fit score range (slider)

Empty column state:
- Subtle dashed border around the column, centered text ("No jobs here yet" or similar context-appropriate copy).

Closed column has a sub-tab selector at the top to filter by sub-tag.

Generate the full board with realistic mock data — 5-8 cards per column, varied. Plus one card's hover state, plus the backward-move confirmation modal.
```

---

## Screen 6 — Analytics

```
Design the Analytics view for JobAgent. The user comes here to see if the product is working.

Layout: same left sidebar. Main content is a dashboard of charts and breakdowns.

Top:
- Page title "Analytics" with a date range picker (default: last 30 days, options: 7d / 30d / 90d / all time).
- Below title: a summary line — "You've sent 47 applications, gotten 6 replies (12.8%), and received 1 offer in this period."

Section 1 — Funnel (full width, ~400px tall):
- Horizontal funnel: Discovered → Drafted → Applied → Active → Offer
- Each stage shows: count, conversion rate from previous stage, and a thin progress bar
- Color-coded by stage (cool blues to warm green at offer)

Section 2 — Breakdowns (3-column grid of cards):
- "Reply rate by source" — bar chart showing which sources have the highest Applied → Active conversion. Each bar: source name, percentage, count.
- "Reply rate by role" — same format, by role title.
- "Reply rate by resume variant" — same format, with one variant marked as the leader.

Section 3 — Trends (full width):
- Line chart: weekly reply rate over time. Y-axis is %, X-axis is weeks. A subtle goal line at 10% (the target).

Section 4 — Actionable callouts (left rail, full height):
- Yellow-tinted cards with concrete suggestions, e.g.:
  - "RemoteOK has a 0.5% reply rate — consider deprioritizing"
  - "Resume variant A converts 2x better for backend roles — make it the default?"
- Each callout has a "Apply suggestion" button.

Empty state:
- For new users with <10 applications: "Not enough data yet. Come back after you've sent 10+ applications to see meaningful trends." With encouragement to keep applying.

Generate the populated state with realistic numbers, plus the empty state.
```

---

## Screen 7 — Settings

```
Design the Settings page for JobAgent.

Layout: same left sidebar. Main content has a sub-navigation on the left (sub-sidebar, ~200px) with sections, and the actual settings panel on the right.

Sub-nav sections:
1. Profile
2. Story bank
3. Target roles & filters
4. Connected accounts
5. Automation
6. Cost & usage
7. Account

Profile:
- Editable structured fields (same as onboarding step 2 but in a settled-state UI)
- "Upload new resume" button at top — triggers re-parse and version bump
- Below: profile version history with "View changes" links

Story bank:
- List view of all stories with theme tags, length variants, last edited
- "Add story" button
- Click any story to expand and edit
- Quality indicator at top: "Your story bank covers 7 themes well. Consider adding a story about [conflict resolution] for stronger long-form answers."

Target roles & filters:
- Role chips (removable, with "Add role" input)
- Filters: salary slider, location preferences, seniority, stack must-haves and nice-to-haves, company size
- "Save changes" button at the bottom of the panel

Connected accounts:
- Gmail status: connected (with email shown) or not. Last sync time. Disconnect button. Scope explanation.
- LinkedIn export: last upload date. "Upload new export" button. "How to export from LinkedIn" link.

Automation:
- Kill switch (large, prominent)
- Per-source toggles (RemoteOK / We Work Remotely / Wellfound / etc.) — each with last crawl time
- Auto-submit settings: max applications per day, per-domain throttle settings
- "Pause crawling for 24h" button

Cost & usage:
- This month's LLM spend with a budget limit setter
- Breakdown by service (drafting, classification, tailoring)
- Historical usage chart (last 6 months)

Account:
- Email, password, sign-out, delete account

Generate the Profile section as the main hero, plus the Connected accounts section, plus the Automation section (the kill switch is critical).
```

---

## Handoff workflow

For each screen you complete in Claude Design:

1. **Export the prototype URL** — Claude Design gives you a shareable link.
2. **Drop it in the UI/UX designs page** in Notion (under Design Links).
3. **Hand the implementation bundle to Claude Code** when you're ready to build the screen — Claude Design packages components, design tokens, copy, and interaction notes into a bundle you pass directly.
4. **Update the corresponding tasks** in the Tasks DB (e.g. `Onboarding UI` → status: In progress, notes: link to design).

## Iteration tips

- Don't stop at the first generation. Use the inline sliders and comments to push the design in 2-3 directions before settling — Brilliant's team reportedly used 2 prompts where competitors needed 20, but iteration is still where the polish comes from.
- For hero screens (Onboarding, Job detail), generate both light and dark mode variants explicitly.
- Ask Claude Design to surface 1-2 alternative layouts for high-stakes screens — especially Job detail and the kanban — so you have something to compare against.
