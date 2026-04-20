# Codex Handoff

## Product
Innovation Center Platform POC for client presentation.

## Must preserve
- Bilingual Arabic/English
- RTL/LTR switching
- Ministry-inspired green branding
- Light and dark theme toggle
- Login button icon-only
- Utility buttons smaller than page buttons
- Logo left, nav middle, utilities right on desktop
- On smaller widths, page nav drops below logo/utilities

## Current unresolved item
Use a proper logo asset strategy for light theme instead of CSS filter.

## Pages required
- Home
- Challenges
- Challenge Details
- Submit Idea
- Admin Dashboard
- Matchmakers

## UX notes from chat
- Page buttons should be equal width
- Page buttons should be stronger visually than utility buttons
- No horizontal scrollbar in header
- On smaller width, pages buttons should wrap below

## Suggested implementation path
- Split into components
- Use React Router or Next.js routing
- Move translations into structured files
- Replace embedded logo with asset files
- Keep frontend-only POC with mocked data for now
