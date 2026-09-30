# {Project name} documentation

Documentation for the developers and agents of this system. It is not end-user documentation. It changes with the code: {timing, for example "in the same change as the code, as part of done"}.

## How to read it

Choose at least one section from each level L1 to L3 for the task at hand, more if more are relevant. L4 is optional, depending on the task. Each layer stands alone. The tables below list the sections of each file.

- **Glossary.** Should probably be read by all agents.

- **L1 Vision.** Why this exists and who it is for. Read first for any product decision.
- **L2 Architecture.** Stack, subsystems, data flow. Read before implementation work.
- **L3 Modules.** How each part works, with gotchas. Read when working in that module.
- **L4 Operations.** Git, testing, setup, deployment, debugging. Read for process guidance.
- **ADRs.** Why a decision went one way. Read when asking "why not X?"

## Routing

| File | Contents |
|---|---|
| `L1-vision.md` | {one line} |
| `L2-architecture.md` | {one line} |
| `L3-modules/index.md` | {one line} |
| `L4-operations/index.md` | {one line} |
| `Glossary.md` | Domain language glossary (only if the team uses the glossary) |
| `adr/` | Decision records (only if the team uses ADRs) |
| `house-style.md` | How docs are written here |

### L3 sections

<!-- One row per section in L3-modules/index.md, with an approximate line number. -->

| Section | Line |
|---|---|
| {name} | ~{n} |

### L4 sections

| Section | Line |
|---|---|
| {name} | ~{n} |

### Forked files

<!-- When a section passes about 100 lines it moves to its own file, listed here. -->

| File | Contents |
|---|---|

## Keeping it current

- Update the docs your change makes stale, {timing}.
- A section stays inline until it passes about 100 lines. Then fork it to its own file, leave a summary and a link, and update this index.
- One fact has one home. Link to it instead of restating it.
- Derived files such as `llms.txt` are views of these docs, never the source.
- Follow `house-style.md`.
- After you're done, make sure that all pointers, section namens and line numbers here are correct, otherwise fix it as part of your current work.
