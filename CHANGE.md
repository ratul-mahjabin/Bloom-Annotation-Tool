# Changelog

## [2.0.2] — 2026-06-14

### Bug Fixes
- Fixed annotation saves failing with `Annotation 1 falls outside its referenced turn` when selected text contained repeated words or browser-rendered whitespace.
- Calculate span offsets directly from the browser selection range and extract the annotation text from the canonical conversation turn, ensuring saved text and offsets remain aligned.
- Added server-side verification that annotation text exactly matches the referenced section of the turn.
- Improved text selection so dragging remains valid when the mouse is released outside the message bubble.
- Prevented existing highlighted spans from opening edit mode while the user is selecting text.
- Kept the label-selection popup inside the visible viewport, including near the right and bottom edges of the screen.

**Files changed:**
- `src/components/AnnotationInterface.jsx`
- `src/components/ChatDisplay.jsx`
- `src/styles/LabelPopup.css`
- `server.js`

---

## [2.0.1] — 2026-06-13

### Bug Fixes
- Fixed Save → Next navigation showing the previous conversation while only the CID changed.
- Reset annotations, Bloom scores, comments, selections, and popups before loading another conversation, preventing annotated spans from carrying into an unannotated conversation.
- Cancelled obsolete conversation requests so late responses cannot overwrite the currently selected CID.
- Added server-side annotation validation to return a clear `400` error for invalid turn references instead of crashing with `Cannot read properties of undefined (reading 'text')`.

**Files changed:**
- `src/App.jsx`
- `src/components/AnnotationInterface.jsx`
- `server.js`

---

## [2.0.0] — 2026-06-13

### Overview
This release adds in-annotation navigation, richer completion status on the home page, and a "confused cases" review panel.

---

### New Features

#### 1. Prev / Next Navigation in Annotation Banner
- The **`← Back`** button has been replaced with a **`🏠 Home`** button that returns to the conversation selector.
- Two new buttons — **`◀ Prev`** and **`Next ▶`** — appear in the right side of the annotation banner, next to the `💾 Save` button.
- Clicking Prev or Next **auto-saves** the current annotation before switching to the adjacent user, so no work is lost.
- The Prev button is disabled on the first user; the Next button is disabled on the last user.

**Files changed:**
- `src/App.jsx` — tracks the full conversations list and current index; adds `handleNavigate(direction)`.
- `src/components/AnnotationInterface.jsx` — accepts `onNavigate`, `canGoPrev`, `canGoNext` props; implements `handleNavigateWithSave`.
- `src/styles/AnnotationInterface.css` — adds `.btn-home`, `.nav-group`, `.btn-nav` styles.
- `src/components/ConversationSelector.jsx` — passes full `conversations` array and zero-based index to `onSelectConversation`.

---

#### 2. Three-State Completion Status on Home Page Cards
Cards on the home page now display one of three statuses:

| Status | Label | Colour |
|---|---|---|
| Never opened | `○ Not started` | Grey |
| Opened but ≥1 Bloom score missing | `◑ Not finished` | **Yellow** |
| All 6 Bloom scores filled | `✓ Annotated` | Green |

The card border and background tint also reflect the state (amber for in-progress, purple tint for complete).

**Files changed:**
- `server.js` — new endpoint `GET /api/annotation-status/:annotatorName/:prolificId/:cidNumber` returning `{ exists, complete, confusedCount }`.
- `src/components/ConversationSelector.jsx` — `ConversationCard` now calls the status endpoint instead of the old exists-only endpoint.
- `src/styles/ConversationSelector.css` — adds `.card-status--not_started`, `.card-status--in_progress`, `.card-status--complete`, and `.conversation-card.in-progress` styles.

---

#### 3. Confused Cases Collapsible Panel
A sticky amber panel appears **directly below the header** on the home page:

- **Collapsed (default):** shows a summary bar, e.g. `⚠️ 3 confused spans across 2 CIDs`, with a ▼ chevron.
- **Expanded:** reveals a scrollable list grouped by CID. Each entry shows:
  - A **clickable CID badge** (e.g. `CID12 ↗`) that navigates directly to that annotation page.
  - The role icon (🤖 AI / 👤 User), the quoted span text in italics, and all applied label tags (the `confused` tag highlighted in amber).
- The panel only appears for CIDs that have at least one span annotated as `confused`.

**Files changed:**
- `server.js` — new endpoint `GET /api/confused-cases/:annotatorName` that scans all annotation JSON files and returns CIDs with confused spans.
- `src/components/ConversationSelector.jsx` — fetches confused cases on mount; renders the collapsible panel with clickable CID badges.
- `src/styles/ConversationSelector.css` — adds all confused panel styles (`.confused-panel`, `.confused-panel-bar`, `.confused-cid-group`, `.confused-span-item`, `.span-label-tag`, `.confused-cid-link`, etc.).

---

### Bug Fixes
- Fixed all home-page cards showing grey after server restart — the old server process was running pre-update code; restarting with the new `/api/annotation-status` endpoint resolved the issue.
- `prolificId` is now URL-encoded (`encodeURIComponent`) in all client-side API calls for robustness.
