# ENG 112 Simplified Discovery Bridge · UX design notes (pilot v0.2)

## Design premise
A student should be able to begin in their own language without learning the architecture of multiple apps. The **default journey** is **My question → My discoveries → My living thesis**, with an explicit **Return to research** path. Steps are *locations*, not required essay sections or mastery scores.

The prototype is a separate static page at `/bridge-preview/simple.html`. Neither the regular Research as Encounter website nor the production Research Connections Library homepage was changed.

## Evidence-informed design decisions

| Finding and evidence | Student-facing implementation |
| --- | --- |
| Nielsen Norman Group recommends progressive disclosure and minimizing irrelevant controls in complex applications ([Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/); [8 Design Guidelines for Complex Applications](https://www.nngroup.com/articles/complex-application-design/)) | One opening prompt and one primary action. Boolean search, 128-source browsing, pathway/e-book filters, and larger research tools are inside closed optional `details` panels. |
| ACRL's [Framework for Information Literacy](https://www.ala.org/acrl/standards/ilframework) describes **Research as Inquiry**, **Searching as Strategic Exploration**, and **Scholarship as Conversation** as recursive and contextual practices | Students may edit questions, save conflicting sources, write personal notes, return from their thesis to research, and revise their interpretations. Suggested results are explicitly research leads, not validated conclusions. |
| CAST [UDL Guidelines 3.0](https://udlguidelines.cast.org/) encourage learner agency and multiple routes to expression | Students can begin with a lived question or an optional prompt, write and revise in free-form fields, proceed even with no saved sources, or enter advanced tools without needing permission. |
| W3C [Labels for Controls](https://www.w3.org/WAI/tutorials/forms/labels/) and [Cognitive Accessibility Step Instructions](https://www.w3.org/WAI/WCAG2/supplemental/patterns/o4p07-step-instructions/) call for meaningful labels, clear next steps, and understandable feedback | Native textareas with visible labels, visible primary action, keyboard focus states, headings receiving focus after a stage change, compact progress indicators, and save/error status feedback. |
| Nielsen Norman Group's [Information Scent](https://www.nngroup.com/articles/information-scent/) research recommends link labels that predict the destination | Source links say “Open PCC e-book”, “View PCC book record”, or “Find title in PCC catalog”, rather than generic “Open” or “Next”. Book titles are clickable when URLs exist. |

## Source-discovery behavior
The starting question is **not submitted to a server or AI model**. The script matches words against a curated source index and a small, transparent synonym/theme dictionary, then ranks matches. Results are **suggestions for human evaluation**. It is not an AI semantic analysis, cannot guarantee completeness, and does not verify individual claims. Up to six results appear at first; more are optional. The full 128-source catalog remains available under an advanced control. The nine PCC e-book links and existing reserve-book catalog URLs are inherited from the main source database.

## Browser storage and privacy
The independent pilot uses `eng112.discovery.simple.v02` in browser storage. It does **not** overwrite keys belonging to the original Research Connections Library or regular Research as Encounter. Students can export both a human-readable .txt journal and an editable .json backup, with explicit confirmation before restoring a backup. Different devices and browsers do not automatically sync. Because other scripts on the same GitHub Pages origin can technically access local storage, students should not enter identifying interviews or sensitive data.

Only if the student clicks **Send my research to the full Thesis Studio** does the pilot create an opt-in packet at `eng112.discovery.bridge.v1.library-to-thesis`, which the paired `bridge-preview/thesis.html` asks the student to accept. Existing three-story thesis text travels as a *reference note*, not a silent replacement for any thesis field.

## Unmoderated usability questions
Can a novice:
- Understand where to begin within the first 30 seconds?
- Explain why a source appeared without mistaking a keyword match for verified scholarly relevance?
- Save a source, write a personal reflection, then find that note in the thesis stage?
- Return to research without losing their thesis?
- Locate the optional Boolean search only when they choose to use it?
- Download or restore work without losing earlier writing?

These are **design targets for testing**, not results already measured with students.

## Suggested short, moderated pilot
Use roughly **five ENG 112 students** who have not worked with the prototype, as recommended for qualitative formative usability work in Nielsen Norman Group's [Usability Testing 101](https://www.nngroup.com/articles/usability-testing-101/). Include varied confidence levels and, where possible, students who use keyboard navigation or assistive technology. Invite them to think aloud rather than guiding their clicks.

A neutral task prompt: “You have a question from a Nature Diary that you're still thinking about. Explore it here and see whether you find a source worth remembering. Then show me where your interpretation is developing.” Do **not** initially tell them which buttons to press.

Observe first click, hesitations, incorrect expectations, whether saved notes persist, any confusion between source *description* and *evidence*, and whether participants find their way back. Ask afterward: “Where were you unsure what would happen next?” and “Did the research change your thinking, or only confirm what you already believed?” Revise the interface after the pilot, then test another small group.

## Technical verification
- JavaScript syntax and source-data presence checks
- DOM-simulation smoke test: opening question → six ranked sources → saved source → three stories and combined thesis → return to research → persistent state after reload → explicit handoff to full Thesis preview
- Source links remain direct to known library URLs where available; unverified record URLs are described as catalog title searches
- **Not yet completed:** live Safari / iPhone / VoiceOver and full WCAG audit; check focus management, 320px reflow, text zoom, browser back, and library authentication with actual student accounts before class-wide deployment

## Versioning
This pilot is intentionally not published as the default Research Connections Library or Thesis Studio. Instructor review and small-group usability observations should determine whether it becomes the next student-facing version.
