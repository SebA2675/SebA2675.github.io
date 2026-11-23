# Embed Dashboard - Full Project Handoff Plan - version 2

*Reference Document: DOC-20261123-WA0000.pdf*

For the developer (and the developer's Claude) who will code the next rounds. **Owner:** Shivanshu.
Version 2 written 23 Nov 2026 after a full review of both code repositories and the live dashboard.

## What changed in this version (read this first)
1. **Patches, not whole files.** The owner now accepts small, exact find-and-replace patches (Section 5 explains the format). New files and big rewrites are still delivered whole.
2. **The plan matches reality.** A lot of version 1's to-do list is already built (classic embeds, test send, webhook personas, login nonce, rate limits). Section 4 lists what exists; the roadmap lists only what is left.
3. **Scope is now decided.** Tickets, polls/giveaways, role groups/temporary roles, levels and moderation are OUT. Welcome/goodbye, keyword auto-replies, custom commands and feeds are IN (Section 2).
4. **New structure.** Features are grouped into Website looks, Website onboarding, Website handling, Editor, Bot handling and Safety (Appendix A). The roadmap (Section 7) is the build order for them.
5. **New work found in review:** database speed fixes and nightly backups (Phase 1), design polish list from real screenshots (Phase 2), and many new ideas from comparing other embed bots.

---

## Contents
1. **Read this first**
   1.1 What the project is
   1.2 The owner's working environment (very important)
   1.3 Kickoff prompt to give your Claude
   1.4 Reading order
   1.5 Status tags used in this document
2. **Scope: what is in and what is out**
   2.1 Decided: IN
   2.2 Decided: OUT
3. **Architecture**
   3.1 Hosting limits
   3.2 Settings (never in GitHub)
   3.3 Login flow (as built)
   3.4 Access rules
4. **Current state (code review, 23 Nov 2026)**
   4.1 Bot repository (griedon-embeds)
   4.2 Website repository (SebA2675.github.io)
   4.3 What is built (verified)
   4.4 Data model
   4.5 API routes today
   4.6 Findings from the review (the to-fix list)
5. **Patch delivery rules (the new way of working)**
   5.1 The seven rules
   5.2 Patch types
   5.3 Required patch layout
   5.4 Tips for editing on a phone
6. **Fix first: the two issues the owner reported**
   6.1 'Testers can edit the website with Inspect'
   6.2 'Visiting nation9.me/dashboard shows a harmful-site warning'
7. **Roadmap: build in this order**
   - Phase 0 - Security hardening and the browser warning
   - Phase 1 - Foundations: database speed, backup and cleanup
   - Phase 2 - Dashboard polish: Website looks and library handling
   - Phase 3 - Editor power tools
   - Phase 4 - Website flow and onboarding
   - Phase 5 - Sending, scheduling and webhooks
   - Phase 6 - Interactions and forms
   - Phase 7 - Automation
   - Phase 8 - Management, teamwork and safety
   - Phase 9 - Extras backlog
8. **Database load, speed and backups**
   8.1 What loads the database
   8.2 The fixes in order
   8.3 SQLite or Cloudflare D1?
9. **Design notes for the harder features**
   9.1 Variables engine and playground
   9.2 Fill-in-the-blank templates
   9.3 Multi-message send / sequences
   9.4 Paginated embeds
   9.5 Share draft link
   9.6 Welcome and goodbye
   9.7 Keyword auto-replies
   9.8 Form responses and CSV export
   9.9 Feeds
   9.10 Trigger URLs
10. **Open decisions for the owner (with recommendations)**
11. **Rules for every change**
    11.1 The routine
    11.2 Standing rules
    11.3 Test checklist template

**Appendices**
- Appendix A: The feature catalog, by category
- Appendix B: Planned database changes by phase
- Appendix C: Discord limits cheat sheet
- Appendix D: Intents and permissions per feature
- Appendix E: What other embed bots do (research summary)
- Appendix F: Glossary for a beginner

---

## 1. Read this first

### 1.1 What the project is
A private, free web dashboard plus a Discord bot (Python, discord.py) for designing, posting, editing, scheduling and managing rich Discord messages. It supports layout messages (Discord Components V2: text, images, dividers, boxes, buttons, dropdowns, pop-up forms, role actions, private replies) and classic embeds. The project belongs to the owner; you are helping to code it. It is an embed bot, not a general-purpose bot: no tickets, no moderation, no levels.

### 1.2 The owner's working environment (very important)
- The owner cannot install anything. Everything is done in a browser (often on a phone): GitHub web editor, the Bot-Hosting file manager and console, the Discord Developer Portal.
- Free services only. Do not add anything paid. If a free tier has limits, state them and design inside them.
- Patches are now the default delivery format (Section 5). Give exact find/replace blocks with the repo, the file path and the indentation. Give a whole file only for brand-new files, for rewrites of more than about 40% of a file, or when the owner asks.
- The owner is a beginner. Explain steps simply, one at a time, and end every answer with a short test checklist.
- The owner has hand-edited `dashboard/index.html` since Claude last wrote it (Edit and Test modes, click-to-select preview with a floating toolbar, a text formatting toolbar, a clickable problems list with red dots, breadcrumbs, a collapsible parts tree). **Always ask for the CURRENT version of the part you will change before you write a patch.**

### 1.3 Kickoff prompt to give your Claude
> I am taking over the coding for the project in the attached document. Read all of it.
> Before changing anything, ask me to paste the CURRENT code of the part you will change.
> Give me PATCHES (exact find / replace blocks, as described in Section 5) instead of whole files. Brand-new files may be whole. For every patch name the repo, the file path and the indentation. Keep everything free and browser-only, and end each answer with a short test checklist. Start with Phase 0 (security and the browser warning).

### 1.4 Reading order
| If you want to... | Read |
| :--- | :--- |
| Understand what exists today | Section 3 (architecture) and Section 4 (current state) |
| Know what is in and out of scope | Section 2 |
| Learn how to deliver code to the owner | Section 5 (patch rules) and Section 11 (every-change routine) |
| Start coding | Section 7 (roadmap): Phase 0 first |
| See every feature idea, by category | Appendix A |
| Understand database load and the fixes | Section 8 and Appendix B |
| Look up Discord limits, intents, permissions | Appendices C and D |
| Look up a word you do not know | Appendix F (glossary) |

### 1.5 Status tags used in this document
| Tag | Meaning |
| :--- | :--- |
| **DONE** | Already built and visible in the code or the live dashboard. |
| **PARTLY** | Partly built; the remaining work is listed. |
| **PLANNED** | Agreed and not built yet. |
| **NEW** | New idea added in version 2, not built. |
| **TOP PICK** | Highest value for the effort; build these early in their phase. |
| **DECIDE** | Borderline: needs an owner decision (Section 10). |
| **CUT** | Removed from the project. |

---

## 2. Scope: what is in and what is out
The owner wants an embed bot. Anything that is a separate kind of bot (tickets, moderation, levels, giveaways) is out. Features that exist only to make posted messages smarter (cooldowns, role buttons, forms attached to a message) stay in.

### 2.1 Decided: IN
Everything about designing, posting, editing, scheduling and managing messages (layout and classic).
- Welcome and goodbye messages designed in the editor (needs the Server Members intent).
- Keyword auto-replies and custom commands that reply with a saved message (auto-replies need the Message Content intent; slash-command versions do not).
- Form flow: store responses, CSV export, Accept/Deny buttons with a DM and a role. The database cost is small (about 1 KB per response; 10,000 responses is about 10 MB).
- RSS, YouTube and Reddit feeds rendered through a chosen template. (Reddit may block hosting-provider IPs, so treat that one as best-effort.)
- Webhook sending as a custom name and avatar, forum channels and threads.
*Sticky messages, webhook trigger URLs and slash commands are borderline: see Section 10 for the decision.*

### 2.2 Decided: OUT
| Removed feature | Why |
| :--- | :--- |
| Tickets (private threads, claim/close, transcripts) | A separate bot category; large and security-sensitive. |
| Polls, suggestions, giveaways | Not embed design; they are their own bots. |
| Role groups and temporary roles (pick-one, max N, expiring roles) | Reaction-role-bot territory. Plain role buttons, menus and cooldowns stay. |
| Levels, XP, streaks, moderation, anti-nuke, AI features | Not an embed bot. |
| Premium tiers | The project must stay free. |
| A Discohook-style general 'flows' engine | Too large; the simple actions list in Phase 6 covers the real needs. |
| Live member/online-count embeds | Removed by the owner. |
| Auto-pin, auto-delete, auto-publish | Channel housekeeping, not embeds. |
| Translation features | Would need an AI or translation API; not worth it. |

---

## 3. Architecture

| Part | Where it runs | Notes |
| :--- | :--- | :--- |
| **Dashboard** | One static site at `https://nation9.me/dashboard/` on GitHub Pages (owner's .me domain from the student pack) | Repo `SebA2675.github.io`. Currently ONE file (`index.html`, 3,077 lines). To be split in Phase 0. |
| **API** | FastAPI inside the same Python process as the bot, on Bot-Hosting's free plan | Free HTTPS subdomain `*.apps.bot-hosting.cloud`. API_URL is a constant near the top of the page script. |
| **Database** | One SQLite file `data.db` next to the code | Kept out of Git by `.gitignore`. See Section 8 for speed fixes and backups. |
| **Bot** | `discord.py` 2.6 or newer (Components V2), Python 3.14 container | Repo `griedon-embeds`. Default intents only today. |

### 3.1 Hosting limits
- Free plan: one deployment, about 256 MB RAM, 512 MB storage; renew by hand every 4 days (a paid tier removes this).
- The host pulls code from GitHub only when started: Stop, then Start after every bot code change.
- Packages install from `requirements.txt` on start (no pip commands in the console). Current list: `discord.py>=2.6`, `fastapi`, `uvicorn`, `PyJWT`, `tzdata`. A new feature that needs a library (for example feedparser for RSS) means adding one line there.

### 3.2 Settings (never in GitHub)
Set as host variables or in a `.env` file on the host: `BOT_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `OWNER_ID`, `JWT_SECRET`, `API_URL`, `DASHBOARD_ORIGIN` (`https://nation9.me`), optional `SERVER_PORT` or `PORT`. Future: `GITHUB_BACKUP_TOKEN` (Phase 1). The bot exits with a clear message if a required setting is missing.

### 3.3 Login flow (as built)
1. The dashboard creates a random nonce, saves it in localStorage, and sends the browser to `/auth/login?n=NONCE` on the API.
2. The API checks the nonce format (16-64 letters/digits) and redirects to Discord OAuth (scope identify only) with a signed 5-minute state that contains the nonce.
3. Discord returns to `/auth/callback`. The API exchanges the code, reads the user ID, and (for non-owners) checks the user can reach at least one approved server.
4. The API issues a signed JWT valid 12 hours and redirects to `nation9.me/dashboard/#token=...&n=...`.
5. The page compares `n` with the saved nonce (stops login-CSRF), stores the token in localStorage and sends it as a Bearer header on every request.

### 3.4 Access rules
- **Owner (OWNER_ID):** sees everything plus the owner-only Servers page.
- Everyone else must be an Administrator of a server that is on the approved list and where the bot is. Permission is re-checked on every request (60-second cache, uses fetch_member, no privileged intents).
- The bot leaves any server not on the approved list and records it as pending. On the very first run it approves the servers it is already in.
- Protection already in `main.py`: CORS locked to the dashboard origin, 4 MB body cap, 240 requests/min per IP (20/min for `/auth/`), 300 requests/min per user.

---

## 4. Current state (code review, 23 Nov 2026)

### 4.1 Bot repository (`griedon-embeds`)
| File | What it does | Lines |
| :--- | :--- | :--- |
| `main.py` | Entry point. Settings, FastAPI app, rate-limit/size middleware, CORS, `/health`, `/auth/login`, `/auth/callback`, `/me`, bot subclass (starts API and scheduler), approved-server enforcement, forwards clicks to `interactions.py`. | 239 |
| `access.py` | Permission checks: `is_admin` (cached 60 s), `accessible_guilds`, `require_guild`. | 50 |
| `routes.py` | Every API route, hand-written layout validation (`v_*` functions, `check_layout`), channel checks, import, export, backup. | 962 |
| `builder.py` | Turns saved layout JSON into `discord.py` objects: Components V2 parts and classic embeds (up to 10), with validation. | 336 |
| `db.py` | All SQLite access and table creation. No indexes yet (Phase 1). | 583 |
| `interactions.py` | Handles clicks on posted buttons and dropdowns (custom_id `m:{message_id}:{component_id}`): reply, role add/remove/toggle, open form, cooldown/once-per-person rules. | 195 |
| `forms.py` | Pop-up form (modal), up to 5 questions; posts answers to the chosen channel (same-server check) and thanks the user privately. | 63 |
| `webhooks.py` | NEW since v1. Finds or creates the bot's own webhook in a channel; send, edit and delete as a webhook with a persona (name and avatar). | 61 |
| `scheduler.py` | Loop every 30 s: runs due schedules (post new, optionally delete previous, or update posted message); skips runs missed by over an hour. | 168 |
| `timeutil.py` | Time-zone-aware date maths for schedules (once, daily, weekly). | 42 |
| `requirements.txt`, `.gitignore`, `README.md` | Dependencies; `.gitignore` contains `.env` and `data.db`; README is almost empty (fill it in, Phase 8). | - |

### 4.2 Website repository (`SebA2675.github.io`)
- `dashboard/index.html` (3,077 lines): the whole dashboard in one file (HTML, CSS, an inline SVG icon sprite, one script block). Views: login, library, builder, owner-only Servers page, overlays for send, emoji picker, server tools (backup, import, templates), version history and scheduling.
- `dashboard/logo.png`: the bot logo. CNAME = `nation9.me`.
- `dashboard/send.js` (4 KB): an old leftover. `index.html` does not load it, and it builds a dark-themed overlay that does not match the cream design. Delete it in Phase 0.
- The rest of the repo is the owner's portfolio. Do not touch it.

### 4.3 What is built (verified)
| Area | Built | Status |
| :--- | :--- | :--- |
| **Messages / Editor** | Layout messages (text, text + side, images, divider, box, button row, dropdown); replies; forms; classic embed editor ("New classic embed"). Undo/redo, autosave (3 s after typing stops), drag reorder, duplicate, Edit/Test modes, click-to-select preview with floating toolbar, breadcrumbs, formatting toolbar, emoji insert, problems chips with red dots, component counter (20/40), character counter (745/4000). | DONE |
| **Sending** | Post as new, update posted message, delete posted message, send as webhook persona, test send to your DMs ("DM me"), Template, History, Schedule. | DONE |
| **Library** | Cards with Open, copy, export, delete; "changed since posted" badge; version history (last 20); backup, import; templates; owner Servers page. | DONE |
| **Interactions** | Link, reply, form, role actions; cooldown and once-per-person rules (`button_uses` table). | DONE |
| **Scheduling** | Once, daily, weekly; replace previous post; time zones. | DONE |
| **Security** | Login nonce, 12-hour token, rate limits, body cap, CORS lock, approved servers, permission re-checks, deeper validation, secrets out of Git. | PARTLY |

### 4.4 Data model
- `messages` (id, name, guild_id, channel_id, posted_message_id, webhook_id, layout_json, created_at, updated_at)
- `templates` (id, guild_id, name, layout_json, created_at)
- `versions` (id, message_id, name, layout_json, created_at)
- `schedules` (id, message_id, guild_id, action, channel_id, run_date, run_time, tz, repeat_kind, replace_previous, next_run, last_run, last_status, active, created_at)
- `button_uses` (message_id, component_id, user_id, last_used, uses) *(primary key already indexes this)*
- `webhook_personas` (id, guild_id, name, avatar_url, created_at)
- `allowed_guilds` (guild_id, name, added_at)
- `pending_guilds` (guild_id, name, seen_at)

### 4.5 API routes today (all need a Bearer JWT except health and auth)
| Group | Routes |
| :--- | :--- |
| Auth, health | `GET /health`, `/auth/login`, `/auth/callback`, `/me` |
| Messages | `GET/POST /messages`; `GET/PUT/DELETE /messages/{id}`; `POST /messages/{id}/post`, `/update`, `/post-webhook`, `/test`; `DELETE /messages/{id}/posted`; `GET /messages/{id}/export` |
| History | `GET /messages/{id}/versions`, `/versions/{vid}` |
| Schedules | `GET/POST /messages/{id}/schedules`; `DELETE /schedules/{id}` |
| Servers | `GET /guilds`, `/guilds/{id}/channels`, `/guilds/{id}/roles`, `/emojis` |
| Personas | `GET/POST /guilds/{id}/personas`; `DELETE /personas/{id}` |
| Tools | `GET /guilds/{id}/backup`; `POST /guilds/{id}/import`; `GET/POST /guilds/{id}/templates`; `GET/DELETE /templates/{id}` |
| Owner only | `GET /admin/servers`; `POST /admin/allow`; `DELETE /admin/allow/{id}`; `DELETE /admin/pending/{id}` |

### 4.6 Findings from the review (the to-fix list)
| # | Finding | Risk | Fixed in |
| :--- | :--- | :--- | :--- |
| 1 | No Content-Security-Policy; all JS/CSS inline in one 3,077-line file. | An XSS bug could run attacker code and steal the token. | Phase 0 |
| 2 | 48 uses of `innerHTML`, not yet audited. | XSS if any interpolation misses `esc()`. | Phase 0 |
| 3 | JWT is kept in `localStorage`; no logout revocation. | Stolen token works until it expires (12 h). | Phase 0 |
| 4 | Layout validation is hand-written (`v_*` functions), not a strict schema. | A crafted request might store something the bot rejects later. | Phase 0 |
| 5 | Rate limiter reads the LAST value of `X-Forwarded-For`. | Correct only if the host's proxy appends the real client IP; unverified. | Phase 0 |
| 6 | `send.js` is unused dead code; README is empty. | Confusion; extra attack surface. | Phase 0/8 |
| 7 | No database indexes. The library badge ("changed since posted") loads two full layouts per posted message. | Slow library and wasted reads as data grows. | Phase 1 |
| 8 | Autosave writes the whole message every few seconds and adds a history version. | Needless writes; history spam. | Phase 1 |
| 9 | Everything lives in `data.db` on a free host. | A host wipe loses all data. | Phase 1 |
| 10 | Library cards are all named "Untitled message"; top bar wraps to 3 rows; tree labels are cut off. | Hard to use, especially on phones. | Phase 2 |
| 11 | Only one responsive breakpoint (900 px). | Phone layout is rough. | Phase 2 |
| 12 | The preview shows the bot as "Griedon Embeds" while the logo says 9 NATION. | Branding mismatch (set in the bot's Discord profile, not the dashboard). | Owner task |

---

## 5. Patch delivery rules (the new way of working)
The owner can edit files by hand but must not be asked to retype big files. A patch is a tiny, exact instruction: find this text, change it to that. Version 1 insisted on whole files because in-place edits once caused indentation crashes in Python. The rules below remove that risk, so patches are now allowed.

### 5.1 The seven rules
1. **Ask first.** Before writing a patch, ask the owner to paste the CURRENT version of the function or section you will change. Never patch from memory.
2. **One change per patch.** Give each patch an ID (for example P-1.1) and a plain-English title.
3. **Always say where.** Name the repo, the exact file path, and the action.
4. **Show indentation.** Put every code block in a box that keeps its spaces, state the number of leading spaces (Python files use 4 spaces per level, never tabs).
5. **Prefer whole-function replacement** for anything longer than about 6 lines.
6. **Say how to check it.** After each patch give a one-line check, then the test steps.
7. **Whole file when needed:** new files; rewrites of >40%; Phase 0 file split; or when ambiguous.

### 5.2 Patch types
| Type | What the owner does | Use when |
| :--- | :--- | :--- |
| **REPLACE** | Find the exact old text, select it, paste the new text over it. | Changing a few lines. |
| **INSERT BEFORE / AFTER** | Find the anchor line, cursor at its start/end, paste. | Adding lines without removing any. |
| **DELETE** | Find the exact text and remove it. | Removing dead code. |
| **REPLACE FUNCTION** | Select from the function's first line to the line before the next function; paste the new function. | Anything longer than about 6 lines. |
| **NEW FILE** | Create the file at the given path and paste the whole content. | A file that does not exist yet. |

### 5.3 Required patch layout
*(Example formatting)*
**PATCH P-1.1 Add database indexes**
**Repo:** griedon-embeds
**File:** db.py
**Action:** INSERT BEFORE
**FIND:** `cols = {r["name"] ...`
**INSERT these lines directly ABOVE it (8 spaces):**
```python
conn.execute("CREATE INDEX IF NOT EXISTS idx_messages_guild ON messages (guild_id)")
# ...
```

### 5.4 Tips for editing on a phone
- In the GitHub web editor, tap the pencil icon. Switch to 'Desktop site' if needed.
- Use REPLACE FUNCTION patches on a phone.
- After pasting, check the first and last pasted line before committing.
- Before any database change, download `data.db` first.

---

## 6. Fix first: the two issues the owner reported

### 6.1 'Testers can edit the website with Inspect'
Anything that runs in a browser can be inspected and changed by the person using it. Those edits only change that person's own open tab; they are never sent to the server. Real safety comes from the server never trusting the browser. 

The work is listed as Phase 0 steps 0.2 to 0.9 and summarized here:
1. Server-side authorization audit with a written test list.
2. Strict schema validation (pydantic) for the layout.
3. Rate limits and size limits per user and per IP.
4. XSS defence: audit `innerHTML`, split JS/CSS, add CSP.
5. Token handling: logout revocation.
6. Login CSRF.
7. Secrets check.
8. Audit log.

### 6.2 'Visiting nation9.me/dashboard shows a harmful-site warning'
First identify WHICH warning. 
**A. 'Your connection is not private' or 'Not secure' (Certificate issue):** Fix via Namecheap DNS (keep only GitHub A records and CNAME) and GitHub Pages 'Enforce HTTPS' settings.
**B. 'Dangerous site' or 'Deceptive site ahead' (Google Safe Browsing):** Verify domain in Google Search Console, reduce phishing look-alikes, add Terms/Privacy pages, and submit a review request. 

---

## 7. Roadmap: build in this order

### Phase 0 - Security hardening and the browser warning
**Goal:** Make a modified browser unable to harm the server or other users, and remove the harmful-site warning.
1. 0.1 Explain Inspect to the owner and testers.
2. 0.2 Route audit.
3. 0.3 Strict validation via `pydantic`.
4. 0.4 Secrets check.
5. 0.5 Verify the rate limiter's IP source.
6. 0.6 Split `index.html` into HTML, `styles.css`, and `app.js`. Delete `send.js`.
7. 0.7 `innerHTML` audit.
8. 0.8 Content-Security-Policy meta tag in `index.html`.
9. 0.9 Token handling (logout revocation).
10. 0.10 Public legal pages (About, Privacy, Terms).
11. 0.11 Fix the browser warning.

### Phase 1 - Foundations: database speed, backup and cleanup
**Goal:** Make the library/clicks cheap, and ensure host wipes don't lose data.
1. 1.1 Indexes.
2. 1.2 WAL mode (optional).
3. 1.3 Layout hash.
4. 1.4 Smarter autosave (dashboard side).
5. 1.5 Click cache.
6. 1.6 Nightly backup to GitHub via contents API.
7. 1.7 Cleanup job (daily).
8. 1.8 Size meter in dashboard.

### Phase 2 - Dashboard polish: Website looks and library handling
**Goal:** Polish passes based on real screenshots, not a rebuild.
1. 2.1 Top bar compacting.
2. 2.2 Tree rows optimization.
3. 2.3 Settings panel styling.
4. 2.4 Layout (wider preview, breakpoints).
5. 2.5 Library cards enhancements.
6. 2.6 Feedback (toasts, empty states).
7. 2.7 App feel (PWA, shortcuts, accessibility).

### Phase 3 - Editor power tools
**Goal:** Add features power users expect.
1. 3.1 Variables engine.
2. 3.2 Variables panel and playground.
3. 3.3 Raw JSON tab next to Visual.
4. 3.4 Pickers (mention, channel, emoji, timestamp).
5. 3.5 Role picker / role button parts.
6. 3.6 Multi-message send ('Sequence').
7. 3.7 Fill-in-the-blank templates.
8. 3.8 Paginated embeds.
9. 3.9 Imports.
10. 3.10 Classic embed checks.
11. 3.11 Share draft link.
12. 3.12 Images via pasting HTTPS URLs.

### Phase 4 - Website flow and onboarding
**Goal:** A visitor understands the tool, requests access, and navigates easily.
1. 4.1 Landing page at `nation9.me/embeds/`.
2. 4.2 Request access flow.
3. 4.3 Server picker after login.
4. 4.4 Per-server workspace.
5. 4.5 First-run tour and in-app guides.
6. 4.6 Starter template gallery.
7. 4.7 Status page.
8. 4.8 Discord link-preview card.

### Phase 5 - Sending, scheduling and webhooks
**Goal:** Reliable delivery to the right place at the right time.
1. 5.1 Permission checker.
2. 5.2 Forum channels and threads.
3. 5.3 Multi-channel send.
4. 5.4 Webhook manager per channel.
5. 5.5 Scheduler upgrades.
6. 5.6 Silent send / suppress link previews.
7. 5.7 Trigger URLs (optional).

### Phase 6 - Interactions and forms
**Goal:** Smarter buttons/forms while staying inside embed-bot scope.
1. 6.1 Actions list.
2. 6.2 Rules.
3. 6.3 Conditions.
4. 6.4 Click counters per button.
5. 6.5 Form responses and CSV export.
6. 6.6 Accept / Deny actions on forms.
7. 6.7 Form upgrades.
8. 6.8 Role-menu limit.

### Phase 7 - Automation
**Goal:** Event-driven messages using the same editor.
1. 7.1 Welcome and goodbye messages.
2. 7.2 Keyword auto-replies.
3. 7.3 Custom commands.
4. 7.4 Built-in slash commands.
5. 7.5 Feeds (RSS, YouTube, Reddit).
6. 7.6 Sticky messages (optional).
7. 7.7 Safety for automation.

### Phase 8 - Management, teamwork and safety
1. 8.1 Audit and activity log.
2. 8.2 Per-server settings and brand kit.
3. 8.3 Trash with 30-day restore.
4. 8.4 Editor roles.
5. 8.5 Bulk tools.
6. 8.6 Usage meters.
7. 8.7 Data rights (export/delete).
8. 8.8 Housekeeping (README setup steps).

### Phase 9 - Extras backlog
Image library, developer features, analytics-lite, dashboard languages, countdown cards, etc.

---

## 8. Database load, speed and backups
*(Refer to Section 8.1 - 8.3 in DOC-20261123-WA0000.pdf for deeper technical reasoning on SQLite vs Cloudflare D1.)*
**Recommendation:** Stay on SQLite plus nightly backups for now, keeping ALL database code inside `db.py`.

## 9. Design notes for the harder features
Specific implementation notes for: Variables engine, Fill-in-the-blank templates, Multi-message sequences, Paginated embeds, Share draft link, Welcome/goodbye, Keyword auto-replies, Form CSV export, Feeds, and Trigger URLs.

## 10. Open decisions for the owner
*(Owner to decide on landing page paths, custom subdomains, trigger URL usages, image hosting, etc.)*

## 11. Rules for every change
1. Ask for the current code.
2. Deliver patches properly.
3. Restart bot via Bot-Hosting after code commits.
4. Hard-refresh website after GitHub Pages deploys.
5. Download `data.db` before DB structural changes.
6. Always provide a numbered test checklist.
- **Never put secrets in Git.**
- **The server never trusts the browser.**

---

**Appendix A - F** are fully detailed in the source document `DOC-20261123-WA0000.pdf`, including the feature catalog, database change phases, Discord limits, intents/permissions per feature, research on other bots, and a glossary for beginners.
