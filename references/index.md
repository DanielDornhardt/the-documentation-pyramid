# {Project name} documentation

Documentation for the developers and agents of this system.

It is not end-user documentation.

It stays in sync with the code and it's maintenance is part of the development process and the DOD (Definition Of Done).

## How to read it

For agents: 

How to navigate + use the documentation pyramid:

IMPORTANT: Choose at least one section from each level L1 to L3 to read for the task at hand, more if more are relevant. L4 is optional, depending on the task. Each layer stands alone. The tables below list the sections of each file.

If you are preparing an implementation story / planning an implementation for other agents:

-> Then prepare a list of documents for each of the implementation teams' agents to read before starting the documentation by the same method as above.

- **Glossary.** Should probably be read by all agents.

- **L1 Vision.** Why this exists and who it is for. Read first for any product decision.
- **L2 Architecture.** Stack, subsystems, data flow. Read before implementation work.
- **L3 Modules.** How each part works, with gotchas. Read when working in that module.
- **L4 Operations.** Git, testing, setup, deployment, debugging. Read for process guidance.
- **ADRs.** Why a decision went one way. Read when asking "why not X?"

## Routing

<!-- Delete the Glossary.md and adr/ rows below if this project does not use them. Also delete the matching Glossary and ADRs bullets under "How to read it". -->

| File                     | Contents                                                      |
| ------------------------ | ------------------------------------------------------------- |
| `L1-vision.md`           | {one line}                                                    |
| `L2-architecture.md`     | {one line}                                                    |
| `L3-modules/index.md`    | {one line}                                                    |
| `L4-operations/index.md` | {one line}                                                    |
| `Glossary.md`            | Domain language glossary (only if the team uses the glossary) |
| `adr/`                   | Decision records (only if the team uses ADRs)                 |
| `house-style.md`         | How docs are written here                                     |

### L3 sections

<!-- One row per section in L3-modules/index.md, with an approximate line number. -->

| Section | Line |
| ------- | ---- |
| {name}  | ~{n} |

### L4 sections

| Section | Line |
| ------- | ---- |
| {name}  | ~{n} |

### Forked files

<!-- When a section passes about 100 lines it moves to its own file, listed here. -->

| File | Contents |
| ---- | -------- |

## Keeping it current

- Update the docs your change makes stale
- A section is one document or module of a layer. Small sections share their layer's file. When one passes about 100 lines, fork it to its own file, leave a summary and a link, and update this index.
- One fact has one home. Link to it instead of restating it.
- Derived files such as `llms.txt` shouldn't be consolidated into these docs but left in place.
- Follow `house-style.md`. {<- if applicable / wanted, otherwise remove line}
- After you're done, make sure that all pointers, section names and line numbers here are correct, otherwise fix it as part of your current work. To list a file's sections with their line numbers: `grep -n '^## ' <file>`.
