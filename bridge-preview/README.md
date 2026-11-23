# ENG 112 · Discovery Bridge · Separate pilot v0.1
## Links
- Launch page: `/bridge-preview/index.html`
- Isolated Library: `/bridge-preview/library.html`
- Isolated Living Thesis Studio: `/bridge-preview/thesis.html`

## What transfers, and when
**Library to Thesis:** students explicitly select saved source IDs, titles, authors, links, and (optionally) their notes, question, connections, and reflections. The Library writes an opt-in transfer packet to `localStorage` and opens the Thesis pilot. The Thesis student reviews the packet and clicks **Use these discoveries**. Source details and notes are appended to existing evidence notes, never silently replacing a thesis, and the incoming research question fills only an empty thesis question. If a thesis question already exists, the prior Library question is preserved in evidence notes.

**Thesis to Library:** the student explicitly writes or copies a return question, clicks **Send this question**, and opens the Library. On arrival, the Library displays the question and asks whether to accept it. If accepted, it archives the previous Library question in the student's changed-thinking reflection.

## Data and limitations
Both previews live under the same GitHub Pages *origin* (host) and use separate keys from the regular applications:
- `raec.connections.trail.bridge.v1` (pilot Library work)
- `eng112-research-thesis-bridge-v1` (pilot Thesis work)
- `eng112.discovery.bridge.v1.library-to-thesis` and `eng112.discovery.bridge.v1.thesis-to-library` (pending opt-in transfer packets)

The source collection is loaded from `../data/sources.js`; no separate copy of catalog data is necessary. Neither bridge script performs network requests or uploads student writing. Browser storage can be read by pages/scripts served from the same GitHub Pages origin; avoid confidential personal details. Storage is tied to the browser/device, can be cleared, and is not synchronized across devices. The standard export/backups are still needed.

The Library preview offers an explicit action to **copy**, without removing, work from the regular Library's earlier saved-state key `raec.connections.trail.v03`. Import may replace prior *pilot* work only after confirmation.

## Manual functional and accessibility review
1. Visit the launch page, follow Library; add two sources to My Discovery Trail, annotate one, write a question.
2. In the Bridge panel select only one source and opt out of reflections; transfer it to Thesis.
3. Review receipt before accepting; check source title and note appear in the Thesis **Listen to the sources before revising** evidence field. Verify existing thesis draft remains unchanged.
4. Fill the three stories and create a thesis version. Verify reload preserves it.
5. Return a new research question. Accept it in Library. Verify old question appears in **What has become more complicated?** and reload preserves both.
6. Repeat with both source notes and reflections; confirm repeated use doesn't duplicate a previously consumed packet.
7. Test empty transfers, missing browser storage, keyboard-only use, Safari mobile/narrow width, VoiceOver labels/announcements, reduced-motion preferences, and browser Back navigation.
8. Download backups from each application and restore test work; confirm the *regular* apps' saved data remains unchanged.

## Release discipline
This folder adds new URLs only. It does not replace `/index.html` in this repository or change files in the original `eng112-research-as-encounter` repository. The Bridge is a pilot, not a production accessibility-certified release. Publish a student-facing link after completing the manual Safari and VoiceOver review.
