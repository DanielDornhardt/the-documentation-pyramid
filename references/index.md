# {Project name} documentation

Documentation for the developers and agents of this system.

It is not end-user documentation.

It stays in sync with the code and its maintenance is part of the development process and the DOD (Definition Of Done).

## Wavelet Architecture

Docs follow a wavelet model — progressive refinement like image compression.

- **L1** — Blurry but complete. Business context, product strategy. Read first for any product decision.
- **L2** — CTO whiteboard. Tech stack, subsystems, data flow. Read before implementation work.
- **L3** — Module deep dives. How each technical piece works. Read when working in a specific module.
- **L4** — Operations. Git workflow, testing, dev setup, deployment, debugging. Read when you need process guidance.
{#if glossary has been selected}- **Glossary** — Domain language. Should probably be read by all agents.{/if}
- **ADRs** — Historical decision records. Read when asking "why not X?"

Each layer is independently useful. No layer requires a lower layer to make sense.

## How to read it

For agents - how to navigate and use the documentation pyramid:

**The basic algorithm:**
**IMPORTANT: Always, before diving into the code or evaluation of the project:**
> **Choose at least one document from each layer from Layer 1 to Layer 3** before working with the code.
> Choose as many additional documents from L1 - L4 as you deem useful for the task at hand.

-> Then pick the documents each implementing agent should read before it starts, by the same method as above, and put that list into the story / plan.

## Routing Table

<!-- Delete the Glossary.md and adr/ rows below if this project does not use them. Also delete the matching Glossary and ADRs bullets under "Wavelet Architecture". -->

| File                     | Contents                                                      |
| ------------------------ | ------------------------------------------------------------- |
| `L1-vision.md`           | {one line}                                                    |
| `L2-architecture.md`     | {one line}                                                    |
| `L3-modules/index.md`    | {one line}                                                    |
| `L4-operations/index.md` | {one line}                                                    |
| `Glossary.md`            | Domain language glossary (only if the team uses the glossary) |
| `adr/`                   | Decision records (only if the team uses ADRs)                 |
| `house-style.md`         | How docs are written here                                     |

### L1 documents

<!-- One row per heading in L1-vision.md, with an approximate line number. Remove rows for headings you dropped. -->

| Document           | Line |
| ------------------ | ---- |
| What is {project}? | ~{n} |
| Who is it for?     | ~{n} |
| Core concepts      | ~{n} |
| Success            | ~{n} |
| Direction          | ~{n} |
| Non-goals          | ~{n} |

### L2 documents

<!-- One row per heading in L2-architecture.md, with an approximate line number. Remove rows for headings you dropped. -->

| Document          | Line |
| ----------------- | ---- |
| Tech stack        | ~{n} |
| Project structure | ~{n} |
| Subsystems        | ~{n} |
| Data flow         | ~{n} |
| Data model        | ~{n} |
| Key decisions     | ~{n} |

### L3 documents

<!-- One row per document in L3-modules/index.md, with an approximate line number. -->

| Document | Line |
| -------- | ---- |
| {name}   | ~{n} |

### L4 documents

| Document | Line |
| -------- | ---- |
| {name}   | ~{n} |

### L3 forked files

<!-- When an L3 document passes about 100 lines it moves to its own file in L3-modules/, listed here. -->

| File | Contents |
| ---- | -------- |

### L4 forked files

<!-- When an L4 document passes about 100 lines it moves to its own file in L4-operations/, listed here. -->

| File | Contents |
| ---- | -------- |

## Keeping it current

- Update the docs your change makes stale
- A document is the unit you read: a topic in L1 or L2 (one heading of the file), a module in L3, an operations topic in L4. Small documents share their layer's file. When one passes about 100 lines, fork it to its own file, leave a summary and a link, and update this index.
- One fact has one home. Link to it instead of restating it.
- Derived files such as `llms.txt` shouldn't be consolidated into these docs but left in place.
- Follow `house-style.md`. <!-- <- if applicable / wanted, otherwise remove line -->
- After you're done, make sure that all pointers, document names and line numbers here are correct, otherwise fix it as part of your current work. To list a file's headings with their line numbers: `grep -n '^## ' <file>`.
