# House style

Rules for docs here. Edit this file to change them.

Readers: humans and agents, equally. One text serves both. It must read well to a person at first glance and parse cleanly for an agent. Write terse: short sentences, plain words, no filler, no repetition. Keep a little fun: a light joke is welcome when it helps and never when it costs clarity. A concrete example beats a rule. A diagram can beat a thousand words.

Writer: any agent that follows this file. A named writer (`agent:` or `skill:`, plus when it runs) follows it too; this file wins.
Base guide: Google developer documentation style. A team guide named here replaces it.

## Write

- Say who the doc is for and what it skips. Answer first, detail after.
- One home per fact. Link to it, never copy it.
- One kind per doc: why, how, or what. Link across.
- Present tense. Describe what exists. One word per thing; define it once.
- Dates as YYYY-MM-DD. No relative dates, no time estimates.
- Claims about the system: cite the file path, or mark them unverified. Check that named paths exist.
- Smallest edit. Keep the author's voice. Docs and code disagree: say so, replace the wrong fact, keep no second version.
- Cut before adding. Table cells and list items: one or two sentences.
- Section over about 100 lines: move it to its own file in the layer folder, starting at its `##` heading.
- Module text is prose, no label prefixes: a short summary first, then where it lives and what is special about it. The idea behind it, why it is built that way, and a trap come only where they apply, and never explain what readers already know.
- Keep the agent's chat persona out of docs. A light touch of humour in the text is fine.

## Structure

- Byline: first sentence under each heading, at most 140 characters, says what the section covers.
- A heading is an anchor. Rename it: fix every link to it in the same edit. No repeated headings in a file. No links in headings.
- Heading levels are the same everywhere. A layer file has one H1, the layer title. Every module is `##`, in the layer file and in its own file; its sections are `###`.
- A broken-out file has no H1: it starts at its `##` module title. Moving a module between the layer file and the folder never changes a level.
- Other documents (`index.md`, glossary, this file, decision records) keep one H1.

## Links

- Relative paths. Link text names the target. Never "here". Never a bare URL.
- Link a file or a heading, never a line number. Only the generated blocks in `index.md` carry line numbers.
- Code references: path and symbol in code font, `src/billing/invoice.js`, `createInvoice`. No links into source.

## Format

- Plain CommonMark. Headings in sentence case. Lists for two or more parallel items, tables with a header row, code fenced with a language.
- Viewer-safe: no task lists, footnotes, alert blocks, raw HTML, emoji.
- Diagrams: ASCII in a fenced block. No Mermaid.

## Done when

Edits are finished (not after each one): run `node tools/refresh-pyramid.js docs` and fix what it reports (it never edits your docs). The skill `/refresh-pyramid` helps when the report is long. Claims are cited or marked unverified.
