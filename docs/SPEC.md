# muSH Mindfulness Tracker Specification

## 1. Product Summary

muSH Mindfulness Tracker is a mobile-first bilingual web application for collecting anonymous before/after self-observation logs around scheduled mindfulness practice events.

The application has two primary purposes:

1. Allow participants to complete a short before/after questionnaire for a scheduled practice event.
2. Provide experiment leads with an admin dashboard to manage practice events, review anonymous responses, compare before/after signals, and export data.

The app will be built with Next.js and deployed on Vercel. Anonymous questionnaire data will be stored in Supabase. Practice event images will use Vercel Blob.

## 2. Principles

- Anonymous by default: no names, emails, phone numbers, wallet addresses, or identity fields are collected from participants.
- Mobile first: the participant experience must be optimized for one-handed mobile use.
- Bilingual: participant-facing questionnaire content appears in English first, then Simplified Chinese.
- Accessible: UI must follow semantic HTML, ARIA where needed, visible focus states, keyboard support, and WCAG AA contrast.
- Calm but innovative: the visual system should feel bio-hacking and health-oriented without excessive gradients or decoration.
- Manual biometric entry for MVP: CGM, wearable, and stress data are typed by participants when available.

## 3. Users

### Participant

A participant attends a scheduled mindfulness practice event and uses the app on their own device to submit:

- A before log, ideally within 10 minutes before the practice starts.
- An after log, ideally within 10 minutes after the practice ends.

Participants remain anonymous. Before/after logs are associated through the same browser/device anonymous session.

### Experiment Lead / Admin

An experiment lead signs into a password-protected admin panel to:

- Create and manage scheduled practice events.
- Add an image to each practice event.
- Review response details.
- View aggregate before/after dashboard data.
- Export anonymous response data as CSV.

MVP admin access uses one shared username/password.

## 4. Product Scope

### MVP In Scope

- Participant event list or direct event link.
- Anonymous browser/device session.
- Before questionnaire.
- After questionnaire.
- Before/after pairing by anonymous session and scheduled event.
- After questionnaire locked until the same browser/device session has submitted the before questionnaire for that event.
- Bilingual questionnaire copy.
- Hawkins Scale selector with labels, short descriptions, colors, and mobile-friendly UX.
- Manual optional biometric fields.
- Supabase persistence.
- Admin username/password login.
- Admin event management.
- Admin response table and response detail view.
- Admin before/after comparison charts.
- CSV export.
- Practice event image upload.
- Vercel Web Analytics and Speed Insights.

### Out of Scope for MVP

- Participant account creation.
- Email, phone, OAuth, or social login for participants.
- Direct CGM or wearable integrations.
- Medical interpretation or recommendations.
- Multi-role admin permissions.
- Native mobile app.
- Offline-first sync.
- Seeded sample events.

## 5. Core Concepts

### Practice Event

A practice is represented as a scheduled event instance, not just a reusable practice template.

Examples:

- Breathwork, May 22, 2026, 19:00
- Guided Meditation, May 23, 2026, 09:30
- Cold Exposure Reflection, May 24, 2026, 17:00

Each event can have:

- Title
- Short description
- Start date/time
- End date/time
- Location or context
- Image
- Publication status

All event date/time display in the participant and admin UI must use Asia/Shanghai time.

### Event Status

Event visibility and logging behavior use a simple V1 lifecycle.

Admins only manage publication state:

- `draft`: event is being prepared and is not visible to participants.
- `published`: event is visible according to its time-derived status.

The app derives the participant-facing event status from `publication_status`, `starts_at`, `ends_at`, and the current time in Asia/Shanghai:

| Derived status | Rule | Public list | Direct link | Logging behavior |
| --- | --- | --- | --- | --- |
| `draft` | `publication_status = draft` | Hidden | Admin preview only | Disabled |
| `not_started` | Published and current time is before `starts_at` | Visible | Accessible | Before log enabled; after log locked until before exists |
| `in_progress` | Published and current time is between `starts_at` and `ends_at` | Visible | Accessible | Before log enabled; after log locked until before exists |
| `finished` | Published and current time is after `ends_at` | Hidden from the main upcoming list | Accessible | After log enabled only if before exists; before log allowed but marked late |

The app should record actual submission timestamps and timing offsets. It should not hard-block before/after submissions solely for being outside the ideal 10-minute windows, except that the after log cannot be submitted before the before log exists for the same anonymous session and event.

### Anonymous Session

When a participant opens the app, the browser receives or reuses a random anonymous session ID stored client-side.

Requirements:

- The session ID must be random and non-identifying.
- The session ID must not encode IP address, user agent, or personal information.
- The same browser/device session links before and after submissions for the same event.
- The anonymous browser/device session should persist for two weeks.
- Store only a server-side hash of the client anonymous session key in Supabase.
- If a participant changes device/browser, logs may not be paired. The UI should explain this gently when relevant.

### Log Type

Each questionnaire response is either:

- `before`
- `after`

Only one before log and one after log should exist per anonymous session per event. If a user returns after submitting, the UI should show the already submitted state.

MVP default: allow resubmission by updating the existing log for that session/event/log type.

The before log is required before the after log. The after questionnaire must not be submittable unless a before log already exists for the same `practice_event_id` and anonymous browser/device session. If a participant opens an after link before completing the before log, the UI should route them to the event detail or before questionnaire with a gentle bilingual explanation.

## 6. Participant Experience

### Entry Points

Participants may enter through:

- A general event list page.
- A direct link or QR code to one scheduled practice event.

Recommended routes:

- `/` - published upcoming and in-progress events
- `/events/[eventId]` - event detail and log actions
- `/events/[eventId]/before` - before questionnaire
- `/events/[eventId]/after` - after questionnaire
- `/thanks` or inline submitted state

### Event Detail Page

The event detail page should show:

- Event image
- Event title
- Date and time
- Short description
- Before log action
- After log action
- Status of the user's before/after submissions on this device/browser
- Current derived event status

The page should make the ideal logging window visible:

- Before log: ideally within 10 minutes before the practice starts.
- After log: ideally within 10 minutes after the practice ends.

The app should not hard-block submissions outside the ideal window for MVP. It should record the actual submission timestamp so admins can evaluate timing.

The after log action is locked until this browser/device session has submitted the before log for the same event.

### Before Log Flow

The before log asks:

- Practice event confirmation
- Hawkins Scale
- Glucose from CGM, if available
- Food/drink before practice
- Food/drink detail, conditionally shown when yes
- Heart rate from watch/wearable, if available
- Stress score, if available
- Note

### After Log Flow

The after log asks:

- Practice event confirmation
- Hawkins Scale
- Glucose from CGM, if available
- Heart rate from watch/wearable, if available
- Stress score, if available
- Note

Food/drink is only asked in the before log.

### Required Fields

Required:

- Practice event
- Hawkins Scale

Optional:

- Glucose
- Food/drink answer and detail
- Heart rate
- Stress score
- Note

## 7. Questionnaire Content

All participant-facing questions, buttons, helper text, submitted states, empty states, and validation errors must show English first, then Simplified Chinese.

### Data Collection Statement

Display this statement at the top of the questionnaire before the first question:

> The data collected through this questionnaire will be recorded anonymously. By completing this questionnaire, you acknowledge and agree that the anonymous data you provide can be used for the analysis of this experiment. This experiment is intended only for self-observation, learning, and discussion purposes, and does not constitute medical diagnosis, medical advice, or psychological counseling.
>
> 本问卷所收集的数据将以匿名形式记录。填写本问卷即表示您已知情并同意，所提供的匿名数据仅用于本次实验分析。本实验仅用于自我观察与学习交流，不构成医学诊断、治疗建议或心理咨询建议。

### Questions

#### Practice

English: Practice  
Chinese: 练习项目

UX:

- Preselect from the scheduled event page.
- Show as read-only confirmation when entered from an event-specific link.
- If entered from a general questionnaire route, use a searchable event selector.

#### Hawkins Scale

English: Hawkins Scale  
Chinese: 霍金斯意识能量等级

Helper text:

English: Choose the state that best matches your current inner experience.  
Chinese: 请选择最符合你当下内在体验的状态。

UX:

- Use a visually rich selector optimized for mobile.
- Show the feeling label, short description, and color.
- Do not show numeric Hawkins values to participants. The frontend presents feelings only; the app maps the selected feeling to the database value on submit.
- Support tap, keyboard, and screen reader interaction.
- Avoid forcing users to understand the full theory before answering.
- Include a short disclaimer that this is a self-observation scale, not a clinical measurement.

#### Glucose from CGM

English: Glucose from CGM, if available  
Chinese: CGM 血糖数据（如有）

Input:

- Numeric
- Optional
- Unit: mg/dL by default
- Consider supporting mmol/L later if needed

#### Food/Drink Before Practice

English: Did you have food or drink before practice?  
Chinese: 练习前你是否摄入了食物或饮品？

Input:

- Yes / 是
- No / 否

Conditionally shown if yes:

English: What did you have?  
Chinese: 你摄入了什么？

Input:

- Free text
- Optional after selecting yes, but recommended

#### Heart Rate

English: Heart rate from watch or wearable, if available  
Chinese: 手表或可穿戴设备心率数据（如有）

Input:

- Numeric
- Optional
- Unit: bpm

#### Stress Score

English: Stress score, if available  
Chinese: 压力评分（如有）

Input:

- Numeric or short text
- Optional
- Keep flexible because devices use different scoring systems

#### Note

English: Note  
Chinese: 备注

Helper text:

English: Anything else you want to add.  
Chinese: 任何你想补充的内容。

Warning:

English: Please avoid including names, contact information, or other identifying details.  
Chinese: 请避免填写姓名、联系方式或其他可识别个人身份的信息。

Input:

- Free text
- Optional
- Maximum 1000 characters
- Show a visible character counter

## 8. Hawkins Scale UX

Use the Hawkins Scale as a self-reported subjective state selector. The app must not present it as a medical, psychological, or diagnostic instrument.

Recommended mobile interaction:

- A vertical list grouped by emotional energy range, or a bottom-sheet picker.
- Each option shows color, English label, Chinese label, and 3-5 word description.
- Numeric values are not shown in the participant UI; they are implementation values persisted with the response.
- The selected option is clearly highlighted.
- Provide enough hit area for touch: minimum 44px height.
- Avoid tiny slider-only controls because labels matter.

### Scale Options

| Database Value | English | Chinese | Short Description | Color |
| --- | --- | --- | --- | --- |
| 20 | Shame | 羞耻 | Collapse, hiding, unworthy | `#7F1D1D` |
| 30 | Guilt | 内疚 | Blame, regret, burden | `#991B1B` |
| 50 | Apathy | 冷漠 | Numb, helpless, drained | `#6B7280` |
| 75 | Grief | 悲伤 | Loss, sorrow, mourning | `#4B5563` |
| 100 | Fear | 恐惧 | Threat, worry, alert | `#92400E` |
| 125 | Desire | 欲望 | Craving, chasing, wanting | `#B45309` |
| 150 | Anger | 愤怒 | Friction, protest, heat | `#DC2626` |
| 175 | Pride | 骄傲 | Status, defense, proving | `#C2410C` |
| 200 | Courage | 勇气 | Agency, action, honesty | `#16A34A` |
| 250 | Neutrality | 中立 | Flexible, okay, balanced | `#059669` |
| 310 | Willingness | 主动 | Open, ready, cooperative | `#0D9488` |
| 350 | Acceptance | 接纳 | Ownership, grounded, allowing | `#0891B2` |
| 400 | Reason | 理性 | Clear, discerning, thoughtful | `#2563EB` |
| 500 | Love | 爱 | Warmth, care, connection | `#DB2777` |
| 540 | Joy | 喜悦 | Light, grateful, radiant | `#CA8A04` |
| 600 | Peace | 平和 | Still, spacious, complete | `#65A30D` |
| 700-1000 | Enlightenment | 开悟 | Unity, presence, transcendence | `#7C3AED` |

## 9. Admin Experience

Recommended routes:

- `/admin/login`
- `/admin`
- `/admin/events`
- `/admin/events/new`
- `/admin/events/[eventId]`
- `/admin/responses`
- `/admin/responses/[responseId]`
- `/admin/export`

### Authentication

MVP admin access:

- Single shared username/password.
- Store password securely as a hash, not plaintext.
- Use a server-managed auth layer for MVP, not Supabase Auth.
- Store the shared username and password hash in server-only environment variables.
- Verify credentials server-side and issue an `HttpOnly`, `Secure`, `SameSite=Lax` admin session cookie.
- Admin routes must be protected server-side.

Participant routes must not require login.

### Event Management

Admins can:

- Create event.
- Edit event.
- Save event as draft.
- Publish event.
- View the derived event status: draft, not started, in progress, or finished.
- Upload or replace image.
- View direct participant link.
- Use the direct link to generate QR codes later.

Event fields:

- Title
- Description
- Start date/time
- End date/time
- Location/context
- Image
- Publication status: draft or published
- Derived event status
- Created timestamp
- Updated timestamp

### Response Review

Admins can:

- View all anonymous logs.
- Filter by event.
- Filter by before/after.
- Filter by submission timing.
- Search notes and food/drink text.
- Open response detail.
- See whether a before and after log are paired for the same anonymous session/event.

### Dashboard

Dashboard should include:

- Total published events.
- Events by derived status.
- Total before logs.
- Total after logs.
- Number of paired before/after sessions.
- Completion rate from before to after.
- Hawkins before/after movement by event, computed from persisted database values but displayed with feelings or ranges rather than raw numbers.
- Distribution of Hawkins labels before vs after.
- Optional biometric summary when available:
  - Glucose average before/after
  - Heart rate average before/after
  - Stress score average before/after, if numeric
- Recent submissions table.

Charts should be simple and legible on admin desktop and tablet:

- Before/after bar chart
- Hawkins distribution chart
- Response count over time

### CSV Export

Admins can export anonymous raw data as CSV.

CSV should include:

- Response ID
- Event ID
- Event title
- Hashed anonymous session key
- Log type
- Submitted timestamp
- Minutes from event start/end
- Hawkins value
- Hawkins label
- Glucose value
- Glucose unit
- Food/drink yes/no
- Food/drink detail
- Heart rate bpm
- Stress score
- Note

The CSV must not include IP address, email, name, or other identity fields.

CSV generation must escape values that could be interpreted as spreadsheet formulas.

## 10. Data Model

### `practice_events`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `title` | text | Required |
| `description` | text | Optional |
| `starts_at` | timestamptz | Required |
| `ends_at` | timestamptz | Required |
| `location_context` | text | Optional |
| `image_url` | text | Optional, Vercel Blob URL |
| `publication_status` | enum | `draft` or `published`; default `draft` |
| `created_at` | timestamptz | Required |
| `updated_at` | timestamptz | Required |

Derived event status is not stored directly for MVP. It is computed from `publication_status`, `starts_at`, `ends_at`, and the current Asia/Shanghai time.

### `anonymous_sessions`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `session_key_hash` | text | Hash of browser anonymous session ID |
| `created_at` | timestamptz | Required |
| `last_seen_at` | timestamptz | Required |
| `expires_at` | timestamptz | Required, two weeks after session creation |

Store only a hash of the client anonymous session key in Supabase. The raw client anonymous session key must expire from the browser after two weeks.

### `questionnaire_responses`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `practice_event_id` | uuid | References `practice_events.id` |
| `anonymous_session_id` | uuid | References `anonymous_sessions.id` |
| `log_type` | enum | `before` or `after` |
| `submitted_at` | timestamptz | Required |
| `hawkins_value` | text | Required, supports `700-1000` |
| `hawkins_label` | text | Required |
| `glucose_value` | numeric | Optional |
| `glucose_unit` | text | Default `mg/dL` |
| `had_food_drink_before` | boolean | Before only |
| `food_drink_detail` | text | Before only |
| `heart_rate_bpm` | integer | Optional |
| `stress_score` | text | Optional |
| `note` | text | Optional, max 1000 characters |
| `created_at` | timestamptz | Required |
| `updated_at` | timestamptz | Required |

Constraint:

- Unique response per `practice_event_id`, `anonymous_session_id`, and `log_type`.
- An `after` response may only be created or updated if a `before` response already exists for the same `practice_event_id` and `anonymous_session_id`.

## 11. Privacy and Security

- Do not collect participant names, emails, phone numbers, IP addresses for product use, or account identifiers.
- Do not expose raw anonymous session keys to admins.
- Store only hashed anonymous session keys server-side.
- Keep anonymous browser/device sessions for two weeks.
- Use HTTPS only.
- Validate all form input server-side.
- Enforce note length server-side at 1000 characters.
- Protect admin pages and APIs server-side.
- Use server-managed shared username/password admin auth for MVP.
- Use Supabase Row Level Security policies.
- Participant insert/update access should be limited to questionnaire response APIs.
- Admin read/export access should require admin authentication.
- Free text fields may contain accidental personal data; admin UI should remind leads that exports are for experiment analysis only.

## 12. Accessibility Requirements

- Use semantic form elements and labels.
- Every input must have an accessible name.
- Bilingual question text must remain readable by screen readers.
- Bilingual validation errors must be announced and placed near the relevant field.
- Use `fieldset` and `legend` for grouped radio/select options.
- Use `aria-describedby` for helper text and validation messages.
- Preserve visible focus states.
- Ensure touch targets are at least 44px.
- Meet WCAG AA color contrast.
- Do not rely on color alone for Hawkins Scale meaning.
- Support keyboard-only completion.
- Avoid motion that cannot be disabled.

## 13. Visual Design Direction

The design should feel:

- Health-oriented
- Bio-hacking adjacent
- Calm
- Clean
- Trustworthy
- Innovative without visual noise

Recommended palette:

- Deep green: `#064E3B`
- Vital green: `#16A34A`
- Mint: `#A7F3D0`
- Soft background: `#F6FBF7`
- Ink: `#10231C`
- Muted text: `#5B6B63`
- Warm accent: `#D97706`

Guidelines:

- Use green tones as the main brand signal.
- Avoid heavy gradient backgrounds.
- Avoid excessive glassmorphism or decorative blur.
- Use event images to make practices feel inviting.
- Keep questionnaire screens focused and uncluttered.
- Use restrained cards, clear spacing, and strong typography.
- Make the Hawkins selector visually engaging through color chips and state hierarchy, not decoration.

## 14. Vercel and Platform Architecture

### Application

- Next.js App Router
- TypeScript
- Server Components where useful
- Server Actions or Route Handlers for mutations
- Progressive enhancement for forms where practical

### Vercel Offerings

- Vercel Hosting for production deployment.
- Vercel Preview Deployments for review.
- Vercel Environment Variables for Supabase keys and admin config.
- Vercel Web Analytics for privacy-conscious aggregate product analytics.
- Vercel Speed Insights for performance monitoring.
- Vercel Blob for practice event images.
- Vercel Functions / Route Handlers for admin APIs, response submission, CSV export, and image upload signing.
- Vercel Observability for monitoring deployments, functions, builds, traffic, and Blob usage.
- Vercel Firewall for project-level traffic protection and monitoring.
- Vercel Toolbar during review for comments, accessibility checks, interaction timing, and layout shift checks.

### Supabase

- Supabase Postgres for application data.
- Supabase Row Level Security for data protection.
- Server-managed shared username/password admin auth for MVP.
- Supabase Auth is deferred until individual admin accounts are needed.
- Supabase migrations for schema changes.

## 15. Performance Requirements

- Participant event and questionnaire pages should load quickly on mobile networks.
- Optimize event images with Next.js image handling.
- Keep questionnaire JavaScript lightweight.
- Avoid large charting bundles on participant pages.
- Admin charts can be loaded only in admin routes.
- Track Core Web Vitals with Vercel Speed Insights.

## 16. Analytics

Use Vercel Web Analytics only for aggregate product usage.

Recommended events:

- Event page viewed
- Before log started
- Before log submitted
- After log started
- After log submitted
- Admin export generated

Analytics must not include free text notes, food/drink details, anonymous session keys, or biometric values.

## 17. Acceptance Criteria

### Participant

- A participant can open a published event on mobile.
- A participant sees the anonymous data collection statement.
- A participant can submit a before log with Practice and Hawkins Scale.
- A participant can optionally enter glucose, heart rate, stress score, food/drink, and note.
- A participant cannot submit an after log until the before log for the same event and browser/device session exists.
- A participant can submit an after log after submitting the before log for the same event.
- The after log is paired with the before log when submitted from the same browser/device.
- The questionnaire is readable and usable in English and Simplified Chinese.
- Participant-facing Hawkins choices show feelings, not numeric values.
- The app remains usable with keyboard navigation and screen readers.

### Admin

- An admin can log in with the shared username/password.
- An admin can create, edit, draft, and publish scheduled practice events.
- An admin can see whether an event is draft, not started, in progress, or finished.
- An admin can upload an image for an event.
- An admin can view all anonymous responses.
- An admin can inspect response details.
- An admin can see before/after dashboard summaries.
- An admin can export anonymous raw data as CSV.

### Privacy

- Participant identity fields are not collected.
- Admin exports do not include identifying fields.
- Anonymous session keys are not stored raw in the database.

## 18. Open Decisions

- Whether future versions should support QR code generation inside admin.
- Whether future versions should support mmol/L glucose units.
- Whether future versions should integrate Apple Health, Garmin, Oura, or CGM APIs.
- Whether admin auth should move from shared credentials to individual experiment lead accounts after MVP.
