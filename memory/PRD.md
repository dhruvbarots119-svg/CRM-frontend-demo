# SAI — Smart Agent Intelligence

## Product
An AI-powered operating system for Dubai real-estate agents and brokerages. Not a CRM with AI bolted on — a continuous intelligence layer that turns clients, properties, conversations, deals and business activity into recommended next actions.

## Phase 2 (current build)
A fully modular Expo mobile app with **local device persistence** (AsyncStorage) and a persistent **Agent / Admin role switcher**. No backend required.

### Modules
- **Command Center** — greeting, KPIs (revenue / active deals / tasks / avg response), Your Priority Today (top-scored leads with SAI reasoning), pipeline overview, recent conversations, Dubai market snapshot.
- **Leads & Pipeline** — full 6-stage pipeline (New → Contacted → Site Visit → Negotiation → Closed Won / Lost), horizontal stage chip filters, vertical collapsible stage groups, lead-detail sheet with Client 360 (memory, preferences, concerns, score reasoning, property matches, stage checklist, call logs, stage progression).
- **Add Lead** — form with source/intent selection; SAI auto-assigns to the agent with the lightest active book and pushes a notification.
- **Properties** — CRUD (photo, price, size, beds, baths, type, status), status change chips (Available / Under Offer / Sold / Rented), lead-match badge on each listing card, matched-leads list in detail.
- **Tasks & Reminders** — priorities (Urgent / High / Medium / Low), overdue highlighting, filter chips (All / Overdue / Today / Completed), detail sheet with edit + delete, admin-only assignee picker. In-app reminder poller checks every 5 minutes and pushes overdue notifications once per session.
- **Unified Inbox** — mocked WhatsApp / Facebook / Instagram / Email messages, channel filters, unread dots, converted badges, message detail with SAI intelligence insight, **one-tap Convert to Lead** (auto-assigns + pushes notification + opens new lead).
- **Team & Analytics (Admin)** — 4 KPI cards, revenue-by-agent bar chart with Top Performer highlight, per-agent performance cards (leads, won, conversion, task completion, contact rate bar), tools grid.
- **Tools** — Commission split calculator, Cap rate & cash flow calculator, CSV exports (Leads / Revenue / Calls) via native share sheet.
- **Ask SAI** — global bottom-sheet intelligence with deterministic rule-based answers over live seed data, plus 6 suggestion chips.
- **Global Search** — one-shot search across leads / properties / tasks / inbox.
- **Notifications** — in-app bell with unread badge, kind-tinted rows (reminder / risk / match / lead / system), mark-all-read, deep-linking into the linked lead or task.
- **More / Settings** — Reputation Passport hero card, module hub, role & active-agent picker, demo reset.

### Design
iOS-native minimalism with Dubai gold (#C5A059) + pearl accents on soft off-white surfaces. Bottom tabs (Home / Leads / + / Inbox / More), sticky glass header, bottom-sheet modals, chip-based filters that never wrap.

### State Architecture
- Single `AppContext` provider with typed reducer-style setters.
- `sai:v1:*` AsyncStorage keys, JSON-serialised through the shared `@/src/utils/storage` wrapper.
- Role scoping via `visibleLeads` / `visibleTasks` selectors — Agent sees their own book, Admin sees the entire team.
- Seed data auto-restores on mount when storage is empty, and can be manually reset from More → Reset demo data.

### Two flagship demo workflows
1. **Sarah Khan** — New lead → Client 360 → Property matches (6) → Message with service-charge concern → Deal risk (missing mortgage doc) in Negotiation stage.
2. **Ahmed Rahman** — Investor lead → Off-plan preferences captured → Sobha Hartland II property match at 92% → Ask SAI project comparison → Follow-up task.

## Tech Stack
- Expo SDK 54, React Native 0.81, TypeScript, expo-router.
- AsyncStorage (via `@/src/utils/storage`) for persistence.
- `@expo/vector-icons` (Ionicons), `react-native-safe-area-context`.
- No backend, no LLM integration in this phase (Ask SAI is deterministic).
