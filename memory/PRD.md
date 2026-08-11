# SAI — Smart Agent Intelligence

## Problem statement
SAI is a mobile operating system for Dubai real-estate agents that turns client, property, conversation, deal and market context into recommended next actions. The first build demonstrates the complete Sarah Khan relationship loop and Ahmed Rahman off-plan investment loop while making demo-only data and integrations explicit.

## Architecture
- Expo SDK 54 React Native frontend with Expo Router entry and safe-area mobile layout.
- Deterministic seeded intelligence in `/app/frontend/src/sai-data.ts` and interactive presentation in `/app/frontend/app/index.tsx`.
- FastAPI/MongoDB starter remains available for a later persistence layer; current user choice is demo-only with no backend persistence.
- Mobile-first bottom navigation: Home, Leads, Add, Inbox, More; wide layouts add a workspace sidebar.

## User personas
- Individual Dubai agent managing leads, viewings, client memory, property matches and deals.
- Brokerage/team manager needing pipeline visibility, response-time coaching and risk alerts.
- Brokerage operator needing connected compliance, financial, marketing and integration workspaces.

## Core requirements (static)
- Action over information; every intelligence card includes a reason and next action.
- Explain scores and recommendations instead of showing unexplained AI output.
- Agent approval remains required for messages and important actions.
- Demo, coming-soon and simulated information must never appear as live integrations.
- Core Sarah flow: intent score → Client 360 → property matches → conversation concern → viewing/offer actions → deal → mortgage risk.
- Core Ahmed flow: investor context → off-plan projects → match reasoning → payment plan → follow-up.

## Implemented 2026-08-11
- Premium light SaaS visual system with deep slate, Dubai gold, blue action accents, responsive cards, bottom navigation and wide sidebar.
- Command Center with greeting, period selector, metrics, priority recommendations, schedule, pipeline visualization and simulated Dubai market snapshot.
- Sarah priority card, Client 360 modal, lead scoring reasoning, property-match action, viewing and deal conversion actions.
- Leads & Pipeline priority screen with score factors, stages and conversion metrics.
- Unified Inbox DEMO with simulated conversations and service-charge concern extraction.
- Ask SAI deterministic command sheet with keyboard-aware scrolling and structured actionable responses.
- Ahmed Off-Plan Intelligence with investor context, three projects, match reasoning, completion dates and 20/40/40 payment-plan recommendation.
- Deals & Transactions with Sarah deal stages, checklist statuses and missing mortgage approval risk detection.
- Workspace module directory for Properties, Finance, Marketing, Compliance, Team, Reports, Integrations and Settings, with DEMO / COMING SOON labeling where applicable.
- Mobile preview verified at 390x844; lint clean; dashboard, Ask SAI, Leads, Client 360, Inbox, Ahmed and Deal Risk flows verified.

## Prioritized backlog
### P0
- Add backend models and persistence for clients, leads, properties, conversations, tasks and deals.
- Replace deterministic Ask SAI with an approved LLM integration behind a structured-action API.
- Connect Sarah actions so property match, viewing, offer and deal state update across screens.

### P1
- Build full list/Kanban drag states, Client 360 timeline and referral network.
- Add property comparison, CMA, mortgage/rental/cash-flow calculators and marketing generation forms.
- Add team performance analytics, notification feed and compliance expiry workflows.
- Add full action testIDs and automated regression coverage for each module.

### P2
- Implement authenticated brokerage roles and assignment rules.
- Connect approved property portals, calendars, email and messaging providers.
- Add document attachments, audit history, localization and offline-safe mobile caching.

## Next task list
1. Confirm the data contract and add FastAPI endpoints with Mongo-safe response models.
2. Implement shared client/deal state and replace modal-only demo actions with connected navigation.
3. Integrate Ask SAI using the selected provider and structured response schema.
4. Expand each workspace from the current architecture shell into its production workflow.