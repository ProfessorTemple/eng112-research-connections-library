# Research Connections Library 0.3 · Classroom preview

## What this package is
A completely independent static website designed for a new GitHub Pages repository. Its content does **not** reference or modify the live `eng112-research-as-encounter` repository. Every text entry is an original teaching note or research lead, not a redistributed full-text article. Student writing stays in the browser unless the student exports a private backup.

## Preview before publishing
Open `index.html` in Safari or another browser (the separate `data/sources.js` file also works from a local folder). For GitHub Pages, place the **contents** of this folder at the root of a distinct, public repository, e.g. `ProfessorTemple/eng112-research-connections-library`, then in that repository go to **Settings → Pages → Deploy from a branch → main → /(root)**. The expected address after deployment is `https://professortemple.github.io/eng112-research-connections-library/`, but do not treat it as live until you actually open and confirm the page. GitHub Pages settings and access can change.

Our current connected GitHub tools can edit repositories but cannot create a new repository or enable GitHub Pages, so the owner must do those two GitHub actions. The original ENG 112 research site should not be changed.

## How to update the living collection
1. Update the master editorial spreadsheet (separate from this public code).
2. Validate new bibliographic metadata, source accessibility and link permissions. Avoid storing student names, essay text, or private interviews in source metadata.
3. Add/edit records in `data/sources.json`. Every source **must have a unique, permanent `id`**, even if its title is corrected later. Keep old IDs stable; retain all existing properties unless you intend a deliberate data change.
4. Run `python3 tools/prepare_sources.py` from this folder. It validates IDs, basic structure, and remote link schemes, then regenerates `data/sources.js` without editing `index.html` or `app.js`.
5. Refresh the page and try a source query, the e-book filter, saving a source, and restoring an earlier backup. Test publisher links and PCC authentication from student accounts separately.
6. Commit just the updated `data/sources.json` and `data/sources.js` (plus an optional editorial note) to the separate preview repository. The published page then reads the new catalog automatically.

### Where publication stands
This is a **classroom prototype**, not an accessibility-certified or user-tested production application. Automated Chromium checks, mobile reflow, keyboard controls and status announcements have been inspected; manual Safari, macOS VoiceOver, and assistive-technology/student tests are still needed. New source additions should be editorially reviewed before publication. There is no external analytics tracker, account requirement, or data upload.

### Student data
Research notes are saved locally where the browser permits. Browser data can be cleared or unavailable between devices. Students must save an editable JSON backup and can export a text journal. Backups created by the 0.2 preview can be restored in version 0.3. The Thesis Explorer currently accepts copied text, not this library's JSON format directly.