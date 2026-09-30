# Hooking the pyramid into the project

Use the process the team already has. Do not impose a new one.

## Find the process

Look for, and ask about:

- Instruction files: `AGENTS.md`, `CLAUDE.md`, editor or tool rules.
- Planning or spec workflows: story or spec folders, workflow tooling, ticket conventions.
- Workflow or planning skills you have available yourself. If one fits the project, read it to find where its "read first" and "done" steps are, and hook in there.
- Where done is defined: a PR template, a definition of done, a review checklist, CONTRIBUTING.

Then ask: how does work get planned and finished here? Decide the placement together with the user. Explain your reasoning briefly.

## Two hooks

**Discovery: where agents choose what to read.** Put the pointer where every session sees it. Usually that is the instruction file. In a planned flow, also add a reading step to planning.

**Maintenance: where the docs stay true.** Put a line where the team already checks that work is finished: the PR template, the definition of done, or the step that closes a story or task.

## Snippets

Adapt the wording to the project's language and format. Keep each one short.

**Instruction file, discovery** (use the import syntax if the tool has one, otherwise a plain sentence):

```
Project docs live in <docs-dir>/. Read <docs-dir>/index.md first.
Before changing code, read the sections that matter for the task: at least one from each of L1 to L3, more if more are relevant, and L4 when the task needs process guidance.
```

**Instruction file, maintenance** (single-session work):

```
Before finishing a task, check whether the docs need to change and update them in the same change. Follow <docs-dir>/house-style.md.
```

**Planning step** (planned flows):

```
Reading list: choose sections as described in <docs-dir>/index.md and list them here.
Documentation impact: list the docs this change will make stale. For a design-level change, discuss and draft the doc change before the code.
```

**Definition of done or PR template:**

```
- [ ] Developer docs (<docs-dir>/) updated in this change, or "Docs: none" with a reason.
```

If a checkbox already says "Documentation" (often meaning end-user docs), reword it to say what it covers, and add the developer-docs line beside it.

## Timing variants

- **Same change (recommended):** use the snippets above.
- **Separate commit in the same PR:** say "in a separate commit before merge".
- **Later:** name where and when in the project's own process, and record it in the index.

Record the chosen timing in `<docs-dir>/index.md`.

## Rules

- Follow the repo's convention for the instruction file. If `CLAUDE.md` only imports `AGENTS.md`, or the reverse, or one is a symlink to the other, edit the file that holds the content. If none exists, propose a minimal `AGENTS.md`.
- Smallest edit that works. Show the diff and ask before applying.
- Add to existing files. Do not restructure the team's workflow.
- If a tool generates a file or overwrites it on update, use the tool's override mechanism, or the instruction file, instead of editing the generated file.
