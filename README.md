# DocuTool

DocuTool is a universal documentation productivity app for call-center agents and other business users. Its core workflow is deliberately simple:

**customize note phrases → check phrases → generate into an advanced notepad → edit → copy**

The app is a clean Vite + React build. Personal working data stays in the browser; shared manager content uses Supabase when configured.

## What works

- Eleven editable default note templates, with add, edit, delete, reorder, and restore-default actions.
- Five independent editable note drafts with local persistence and an active-tab preference.
- Generate, Copy, Clear, and Uncheck actions scoped to the active note.
- Editable browser speech-recognition scratchpad with explicit append-to-note behavior.
- Shared announcements and links with a two-state panel.
- Slowly auto-scrolling announcements that pause on hover/focus and under reduced motion.
- Responsive team-recognition gallery with consistent `4 / 5` portrait crops.
- A shared, idempotent browser-session counter backed by a Supabase RPC.
- A Team Spotlight below CSAT MTD, with a private draft, approved text/photo, and up to three Q&As.
- A prototype Admin gate (`000`) with announcements, links, and recognition CRUD interfaces.
- Live clocks for Cebu City, Eastern, Central, Pacific, and India using IANA time zones.
- Supabase migration, RLS policies, Storage bucket policy, Netlify configuration, and pinned dependencies.

When Supabase is not configured, the app loads clearly labeled preview content. It never pretends preview data is global, and global writes fail with an explicit secure-auth requirement.

### Weekly Team Spotlight

Sign in through the existing admin modal, open **Team Spotlight**, and enter the employee's name, optional team and week label, hook, short intro, fun fact, photo, and up to three Q&As. Save a draft and show the preview to the employee. Once they approve the exact text and photo, check the approval box, select **Publish globally**, and save. Editing any content returns the form to draft until approval is confirmed again. The section stays in the center column beneath CSAT MTD; before the first publication it shows a neutral coming-soon message.

The Netlify function stores the single replaceable spotlight and its photo in a site-scoped Blob store. It verifies the existing Supabase admin session before writes or draft reads. Published text and photos are globally readable through the function. The week label is display text; admins replace or unpublish the feature when the week ends.

## Requirements

- Node.js 22 or newer. Node.js 24 is configured for Netlify.
- npm 11 or compatible.
- A modern Chromium-based browser for browser speech recognition. Unsupported browsers retain a fully editable manual scratchpad.
- Optional: a Supabase project for global content and the shared visitor counter.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

Production verification:

```bash
npm run build
npm run preview
```

## Environment variables

Copy `.env.example` to `.env.local` and set:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

`VITE_SUPABASE_PUBLISHABLE_KEY` is preferred for new projects. The integration also accepts the legacy `VITE_SUPABASE_ANON_KEY` for compatibility. Both are public browser credentials and depend on RLS for authorization. Never place a Supabase secret key or service-role key in a Vite variable.

## Architecture

`App.jsx` is composition glue. Rendering, browser persistence, shared persistence, time formatting, clipboard work, and speech recognition are separate.

```text
docutool/
├── public/
│   └── recognition/                # fictional local preview portraits
├── src/
│   ├── components/
│   │   ├── admin/                  # admin gate and content managers
│   │   ├── ui/                     # shared button primitive
│   │   ├── AudioCapture.jsx
│   │   ├── Header.jsx
│   │   ├── InfoPanel.jsx
│   │   ├── NotesWorkspace.jsx
│   │   ├── RecognitionStrip.jsx
│   │   └── TemplatePanel.jsx
│   ├── constants/defaults.js       # templates and preview content
│   ├── hooks/                      # local workspace, shared data, speech, visits
│   ├── services/                   # browser storage and Supabase boundaries
│   ├── utils/                      # text and time helpers
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
├── supabase/
│   ├── config.toml
│   └── migrations/
│       └── 20260829161444_docutool_initial.sql
├── .env.example
├── .gitignore
├── index.html
├── netlify.toml
├── package-lock.json
├── package.json
└── vite.config.js
```

### Local user data

All personal customization goes through `src/services/localStorageService.js`.

Key: `docutool:workspace:v1`

```json
{
  "schemaVersion": 1,
  "updatedAt": "ISO-8601 timestamp",
  "data": {
    "templates": [{ "id": "string", "text": "string" }],
    "notes": ["Note 1", "Note 2", "Note 3", "Note 4", "Note 5"],
    "activeNoteIndex": 0
  }
}
```

The visitor deduplication token uses session storage key `docutool:visitor-session:v1`. It is not a counter and is never used for customer data.

DocuTool necessarily persists whatever a user types in the five drafts. Users should avoid storing sensitive customer information longer than their approved workflow requires and should clear notes after transferring documentation to the authorized system of record.

### Shared Supabase data

The migration creates:

| Resource | Purpose |
| --- | --- |
| `announcements` | Published manager reminders and sort order |
| `shared_links` | Published useful/training links and sort order |
| `top_performers` | Recognition metadata and Storage object path |
| `site_metrics` | Aggregate `browser_sessions` value |
| `site_visits` | Idempotency record keyed by a random browser-tab session UUID |
| `recognition-images` bucket | Publicly readable recognition portraits; admin-only mutations |
| `record_docutool_visit(uuid)` | Narrow public RPC that records one session and returns the aggregate |

Public users can only read published content. Shared writes require a Supabase Auth user with:

```json
{
  "app_metadata": {
    "docutool_role": "admin"
  }
}
```

Authorization deliberately uses `app_metadata`, not user-editable `user_metadata`. Every public table has RLS enabled. Updates have both `USING` and `WITH CHECK` policies, and explicit Data API grants are included because new Supabase projects no longer auto-expose tables by default.

### Apply the Supabase migration

Create a dedicated Supabase project for DocuTool, then from this folder:

```bash
npx --yes supabase login
npx --yes supabase link --project-ref YOUR_PROJECT_REF
npx --yes supabase db push
```

After the push:

1. Add the project URL and publishable key to `.env.local` and Netlify.
2. Create or invite the intended admin user through Supabase Auth.
3. Assign `app_metadata.docutool_role = "admin"` from a trusted server/admin environment.
4. Refresh that user's session so the new JWT claim is current.
5. Run Supabase Security and Performance Advisors and review any finding.

The public visitor RPC is intentionally `SECURITY DEFINER`, but it accepts only a UUID, inserts into one non-readable table, atomically increments one metric, and returns one aggregate. The migration revokes default execution before explicitly granting only `anon` and `authenticated`. It can still be spammed by an attacker generating fresh UUIDs; production environments that need fraud-resistant analytics should move counting behind a rate-limited Netlify or Supabase server function, or use a dedicated analytics provider.

## Admin security model

Password `000` reveals the Supabase admin sign-in form. The authorized manager must then sign in with the email and password of a Supabase Auth user whose `app_metadata.docutool_role` is `"admin"`. The frontend verifies that role before opening the management workspace, and the database independently enforces the same claim with RLS.

The browser keeps the Supabase session so an authorized manager does not need to sign in again on every visit. The **Sign out** button ends only the current browser session; it does not sign the manager out on other devices.

Recommended production hardening:

- Require Supabase Auth and organization-approved SSO for managers.
- Keep JWT expiry short enough for admin-role revocation needs and refresh sessions after claim changes.
- Add an audit table or server-side audit log for global content changes.
- Add image dimension/type validation in a trusted server function if uploads are exposed broadly.
- Add rate limiting or bot protection to the visitor endpoint if the counter has business significance.
- Review data-retention and customer-information handling with security/compliance owners.

## Visitor-counter meaning

The counter represents **unique browser-tab sessions**, not people and not analytics-grade unique visitors.

The random UUID is stored in `sessionStorage`, so refreshes in the same tab reuse the UUID. React Strict Mode and repeated renders are harmless because the client reuses one in-flight request and the database uses the session UUID as a primary key. A new tab or a new browser session counts again.

## GitHub

The authenticated GitHub account detected for this workspace is `joeybidan`. No remote repository is created automatically.

```bash
git init
git add .
git commit -m "Build DocuTool universal documentation workspace"
git branch -M main
gh repo create joeybidan/docutool --public --source=. --remote=origin --push
```

Use `--private` instead of `--public` when the repository will contain internal business context. `.env.local`, build output, Netlify state, and dependencies are already ignored.

## Netlify

### CareMatch arcade

CareMatch sits directly in a compact dashboard panel with the board, three waiting members, move controls, and the all-time Top 5. Players enter a short alias and play in place with touch or keyboard arrows. The silent game loads as a separate chunk. A 2 KB original pixel font is included; there are no audio files or image downloads for the game. The compiled game chunk, CSS, and font together are under 20 KB before compression.

Ranked players enter a 1–12 character alias (letters, numbers, spaces, dots, dashes, or underscores). The single **global all-time Top 5** displays only the five highest qualifying player scores. There is no weekly reset. Ties favor the round that started first. A browser can have one best entry; aliases identify players on the board but are not employee authentication.

The `/api/carematch` function issues a random 24-hour round identifier, stores a small round seed server-side, and independently replays the submitted actions before saving a score. Completed rounds are deleted; expired abandoned rounds are cleaned up when new games start. Score records that fall out of the Top 5 are deleted. The production function uses a site-scoped Netlify Blobs store so scores persist across production deployments. Branch/deploy previews use a separate deploy-scoped store so test scores do not mix with production. There is no database migration and no game-specific environment variable.

`npm run test:carematch` covers merges, deadlines, undo, score verification, the all-time Top 5, and simultaneous submissions. `npm run build` checks the lazy-loaded game bundle. The server function depends on `@netlify/blobs`; the deployment's normal dependency installation supplies it.

`netlify.toml` configures the application as a Vite single-page app:

- Base directory: repository root
- Build command: `npm run build`
- Publish directory: `dist`
- Node version: `24`
- SPA fallback: `/*` → `/index.html` with status `200`

Git-based deployment:

1. Push the repository to GitHub.
2. In Netlify choose **Add new project → Import an existing project → GitHub**.
3. Select the DocuTool repository. Netlify will read `netlify.toml`.
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` under project environment variables.
5. Deploy a preview, verify it, and then promote/deploy to production.

CLI alternative after login:

```bash
npx netlify status
npx netlify init
npx netlify deploy
npx netlify deploy --prod
```

Use a preview deploy before production.

## Verification checklist

- [x] Pinned dependency installation succeeds with no reported npm vulnerabilities.
- [x] Production Vite build succeeds.
- [x] Five independent notes, active tab, and templates use the versioned local service.
- [x] Generate appends selected templates in panel order without erasing manual text.
- [x] Copy, Clear, and Uncheck are scoped correctly.
- [x] Captured conversation remains separate until the explicit append action.
- [x] External links use `target="_blank"` and `rel="noopener noreferrer"`.
- [x] Recognition uses fixed `4 / 5` image frames and `object-fit: cover`.
- [x] Visitor recording is idempotent across refreshes and React Strict Mode.
- [x] Time zones use current IANA identifiers and `Intl.DateTimeFormat`.
- [ ] Apply the migration to a dedicated Supabase project and run live RLS/advisor tests.
- [ ] Test real microphone capture in the intended managed browser/device environment.
- [ ] Complete GitHub import and Netlify preview deployment after the repository/project choices are confirmed.

The local Supabase migration could not be executed in this workspace because Docker is unavailable. The migration was created with Supabase CLI `2.116.0`; apply it to a dedicated project and run Advisors before enabling global writes.

## Generated sample assets

The three preview recognition portraits are fictional, generated specifically for this project, and stored under `public/recognition/`. Replace them through Supabase Storage when live employee recognition is configured.
