---
name: documentation-pyramid
description: Set up a layered documentation pyramid (L1 vision, L2 architecture, L3 modules, L4 operations, plus ADRs) for a software project, for its developers and agents, and hook it into the project's existing workflow. Use when the user wants to start, adopt or set up structured project docs.
disable-model-invocation: true
---

# Documentation pyramid

Layered project documentation for the developers and agents of a system. Each layer is a complete picture at one zoom level, and an index routes readers to the right depth. This is not end-user documentation; a separate pyramid serves that.

| Layer | Read it to learn |
|---|---|
| L1 Vision | why the project exists and who it is for |
| L2 Architecture | how it is built: stack, subsystems, data flow |
| L3 Modules | how one part works, and its gotchas |
| L4 Operations | how to run, test, branch, deploy and debug |
| ADRs | why a decision went one way |

## Principles

- Each layer stands alone. No layer needs a lower one to make sense.
- One fact, one home. Link to it instead of restating it.
- A section stays inline in its layer's file until it passes about 100 lines. Then it forks into its own file, leaving a summary and a link, and the index is updated. This helps human readers by having less files to jump through.
- The index heals itself: whoever finds a stale pointer fixes it.
- Files such as `llms.txt` are derived views, never the source.
- Docs change with the code. The recommendation is the same change, as part of done. The team may choose otherwise.

## Steps

Never overwrite an existing file. Ask before editing one. Write real content, not placeholders.

### 1. Look around

Before asking anything, check what exists: docs folders, README and CONTRIBUTING, instruction files (`AGENTS.md`, `CLAUDE.md`, editor rules), and signs of a planning workflow or PR template. Summarise what you found in a few lines.

### 2. Ask, one group at a time

Confirm each group before moving on. Skip what the repo already answers.

1. **Location.** Where should the docs live? Suggest `docs/`, or an existing folder if one fits. If `docs/` already exists and is a published site or generated content (a site generator config, a deploy workflow, generated files), suggest a separate folder such as `dev-docs/` or `docs/dev/`, and say why.
2. **Process.** How does work get planned and finished here? Mostly single sessions, or a planned flow such as stories, specs or tickets? Which files define it?
3. **Timing.** When are docs updated? Recommend: in the same change as the code. Alternatives: a separate commit in the same pull request, or later.
4. **ADRs.** Does the team want decision records? If yes, move over the ones it already has, and add a `.gitkeep` if the folder starts empty. If no, skip `adr/`.
5. **The project.** Vision, architecture, three to five main modules, how to run and test. Ask only what you cannot read from the code.
6. **Style.** Use the default in `references/house-style.md`, or point to a guide the team already has.

### 3. Scaffold

Create the structure below with the templates in `references/`, filled with the answers.

```
<docs-dir>/
  index.md              routing table and the rules of the pyramid
  house-style.md        how docs are written here
  L1-vision.md
  L2-architecture.md
  L3-modules/index.md
  L4-operations/index.md
  adr/                  only if the team wants ADRs
```

### 4. Hook it in

Two places need a line: where agents choose what to read, and where the team defines done. Follow `references/integration.md`. Propose the smallest edits, show them, and apply them only with consent.

### 5. Confirm

Show the result and be honest about depth. Report which sections rest only on file names or a skim, and say so if the docs look thin for the project's size and complexity. Offer to go deeper: pick a section, read its code, and rewrite it from what you find, marking what you verified.

Then, only now, look at the docs that already existed. List the purely technical ones (READMEs, architecture notes, design docs, long prose in general files) whose content the pyramid now covers, and ask what to do with them:

- **Fold in and remove the originals** (recommended: it avoids two copies of the truth).
- **Fold in and leave a one-line pointer** in each original.
- **Leave them as they are.**

For the first two, move the content into the right layer and polish it. Then search the repo for references to the moved files or sections (links, other docs, CI, config) and update them. Remove an original only if it is tracked in git, so it can be recovered. Instruction files (`AGENTS.md`, `CLAUDE.md`, editor rules) are never removed; if one holds long prose that is documentation rather than instruction, offer to move that prose. Remind the user to review the diff and talk it through before shipping.

## References

- `references/index.md`, `l1-vision.md`, `l2-architecture.md`, `l3-modules.md`, `l4-operations.md`, `adr.md`: templates.
- `references/house-style.md`: the default writing rules.
- `references/integration.md`: how to find the project's process and where to hook in.
