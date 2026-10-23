# Installing the Documentation Pyramid

These are the full installation instructions. They are written for agents, but a human can follow them just as well. For the idea behind the pyramid, see the [README](README.md).

**@AGENTS: Here we go! Here are the installation instructions.**

> [!NOTE]
> For agents:
> I've included steps where you confirm with the user if you're in an interactive session. If you're running headless / YOLO, make your choices, DON'T ask the user, and skip those confirmations. I won't repeat that below.

This project creates the structure for the documentation pyramid, makes it known throughout the project, and then tries to ensure that the agents keep it up to date. It doesn't need any other skills installed permanently.

**This is what you should do.** Look through these instructions, work out how best to fit it into the project's established workflows, make a short plan, and talk it through with the user to confirm it.

## 1. Create a directory for the docs

Technical and development documentation: basically everything an engineering team needs.

We propose `<project root>/docs/` as the canonical home. But if there are already other docs there, or your framework would do something funky with a new folder there, put it somewhere else - another level of the tree, or another name, e.g. `<project root>/dev-docs/`. Where this guide says `docs/`, read your folder. The commands below assume `docs/`.

## 2. Copy the templates from `references/`

The `references/` folder of this repo mirrors the docs directory you are about to create: same names, same layout. Clone the repo (or fetch the files) to get it, then copy it over and adapt each file to the project. **Take out** references to unselected options. The sections in the layer files are suggestions: add the ones the project needs, delete the ones it does not (a C library has no Deployment section). Delete the template's HTML comments once you have followed them; only the `pyramid:begin` and `pyramid:end` marker lines stay. Ignore the other files in the repo root (images, notes): only `references/`, `tools/` and `skills/` matter here.

    references/                          ->  <docs>/
      index.md                               the central dispatch: agent instructions, plus the routing table
      L1-vision.md                           Layer 1: the vision (one file, stays under 100 lines)
      L2-architecture.md                     Layer 2: the architecture
      L3-modules.md                          Layer 3: one "##" section per module
      L4-operations.md                       Layer 4: one "##" section per operations topic
      L2-architecture/  L3-modules/          empty folders (each holds a .gitkeep), see below
      L4-operations/
      Glossary.md                            optional: a DDD-style ubiquitous language glossary. Recommended if your team / agents don't have one yet.
      house-style.md                         optional: the rules for how to keep the docs tidy and how to write. Use it if you don't have a better tech-writer skill or instructions.
      adr/  (no template)                    optional: decision records, one file per decision. Add it if you want ADRs and have no good place for them. Otherwise just reference the ADRs in index.md and point the agents there.

### The layout rules

- **One file per layer** at the base level of the docs: `L1-vision.md`, `L2-architecture.md`, `L3-modules.md`, `L4-operations.md`. A "document" is the unit an agent reads: a topic in L1 or L2 (one `##` heading), a module in L3, an operations topic in L4.
- **The 100-line break-out rule.** When a section grows past about 100 lines, move it to its own file in the layer folder (`L3-modules/<name>.md`) and **delete it from the layer file**. Nothing is left behind, no summary, no pointer. The routing table in `index.md` points to the new file. That is why `L2-architecture/`, `L3-modules/` and `L4-operations/` exist from the start, each holding only a `.gitkeep` so git keeps the empty folder. Delete the `.gitkeep` when you add the first real file. L1 gets no folder: it stays under 100 lines.
- **Heading levels are the same everywhere.** A layer file has one `#`, the layer title. Every module is a `##`, and its sections are `###`. A broken-out file has no `#`: it starts at the module's `##` heading, and its sections stay `###`. Moving a module between the layer file and the folder is a cut and paste; no level changes. Other documents (`index.md`, `Glossary.md`, `house-style.md`, decision records in `adr/`) are ordinary documents with one `#`.

  | Where | Module title | Section |
  |---|---|---|
  | Layer file (`L3-modules.md`) | `##` | `###` |
  | Broken-out file (`L3-modules/<name>.md`) | `##` | `###` |

- **One home per module.** A module is a section of the layer file or a file in the layer folder, never both.
- **No index files in layer folders.** The root `index.md` is the only routing table. (`adr/` is the exception: it may have its own `index.md` or `README.md`.)
- **The byline rule.** Start every section, and every broken-out file, with one sentence of at most 100 characters that says what it covers. The routing table copies that sentence. A leading label like `**Purpose.**` is skipped.
- **Marker blocks.** `index.md` holds one block per layer between `<!-- pyramid:begin L3-modules -->` and `<!-- pyramid:end L3-modules -->`. The refresh tool rewrites what is between the markers (module, pointer with line number or file path, byline). Never edit inside the markers; edit the document and refresh. Everything outside the markers is yours. When an `adr/` folder exists, the refresh tool adds its block to `index.md` automatically (write mode adds a block for any layer that has none), so you do not add it by hand.

### First pass: what to look for

Before you call the first pass done, look at the project for each topic below. If the topic exists and matters to someone changing the code, give it a module section or a line in one; if it does not exist, say nothing (no "n/a" entries). This list is a prompt for coverage, not a template to fill. The writing rules are in `house-style.md`; they are not repeated here.

- **L1:** who it is for, what it is not, platforms and licence in one line.
- **L2:** the main parts and how they fit, with a diagram (nearly always worth it here); data flow; core data structures; state (what is saved, what is lost on exit, where it lives); configuration layers (build time, run time, environment); extension points (plugins, hooks, scripting, an API for modules); trust and safety boundaries (sandbox, untrusted input, permissions); outside interfaces (protocols, CLI, file formats).
- **L3:** one module per cohesive subsystem, each saying where it lives and what is special about it, plus the idea behind it and one relevant trap only where they apply; where to start reading (entry points).
- **L4:** build and its options; run; test, and what CI covers and, just as useful, what it does not run; debug; release and packaging; security and deployment settings; contribution rules only where the repository has non-obvious ones; change recipes (what to touch to do X, and what silently breaks).
- **Glossary:** look for an existing glossary and point to it from the index, or move it over if the owner agrees; otherwise collect the domain terms that appear in more than one document.

Match the topics to the kind of project: a service adds interface contracts, data models, authentication and deployment; a library adds the public interface, versioning and extension points; a command-line tool adds commands and configuration; a game adds content and data files, the save format and modding hooks; an application with a screen adds component structure and state handling.

**Decisions are a conversation, not a document an agent writes.** During setup, look for existing decision records (`adr/`, `doc/decisions/`, an RFC folder, a decisions log) and point to them from the index or move them over, as the owner prefers. If there are none, ask: "Do you want agents to record important decisions as they are made?" Never write records for decisions you did not witness and never infer past ones. If the answer is yes, create `adr/` (with a `.gitkeep`, like the other folders) and add this note to `docs/index.md` in its hand-written part, where every agent reads it (AGENTS.md already imports that file, so it is not repeated there):

```
**Decisions.** When a significant decision is made (why X, not Y), record it as one short file in `adr/`: context, decision, consequences. If you are unsure whether it counts, ask.
```

If the answer is no, do nothing. If the owner says how or when decisions should be recorded (who decides, which kinds, which format), write that into the same note.

## 3. Find the best ways to integrate the pyramid for this team

### 3.1 Make the pyramids' `index.md` file known to the agents

Put it into the `AGENTS.md` / `CLAUDE.md` / `WHATEVER.md` file your harness uses (if you don't have one yet, now's the time!). I'd recommend importing it, because it's so valuable it shouldn't be optional. This works in Claude Code:

```
## Documentation pyramid
@docs/index.md
```

If imports don't work, put something like this near the top of your AGENTS.md (or the corresponding file):

```
## Documentation Pyramid
Read @docs/index.md now!
```

### 3.2 Make sure the docs get read **before** actual work is done with the code

- If stories / plans are written before implementation, the prepping agent(s) should scan the pyramid and follow the basic algorithm from `<docs root>/index.md` **as part of the story-writing workflow**. Add it to the planning workflow.
- If there is just an agent and no explicit plan mode, make sure it knows and follows the basic algorithm. It's in `<docs root>/index.md`, but add it explicitly to the context / startup script if you have one.

Anchor these commands where they have the most leverage in your system.

### 3.3 Decide **when** and **how to update** the docs after each implemented change

Does the established workflow have a good attachment point? For example:

- in story writing, as a closing task for the implementing agents <- recommended!
- after the implementation and before the finalization / review phase
- if possible: as a separate step **after** implementation but **before** the final review, with a fresh agent that has a tech writer skill and knows the pyramid.

Otherwise add a new step between implementation and review. Make three suggestions on where it might fit, choose the best, and suggest it to your human, if applicable.

### 3.4 Any strays?

- Does any workflow or process documentation need to mention the pyramid?
- PR templates: checkboxes for "Documentation Pyramid updated" or "I reviewed the Documentation Pyramid"?
- Review scripts / agents / retrospectives: should they check the pyramid changes? Did a change that should have become part of the pyramid get missed? Does the pyramid need maintenance?

### 3.5 Install the refresh tool and its skill

The repo has two more folders next to `references/`: `tools/` and `skills/`. They are not documentation and never go inside the docs folder. Copy `tools/refresh-pyramid.js` and `tools/refresh-pyramid.md` to a `tools/` folder next to `docs/` (or to the project's existing scripts folder, if it has one; then adjust the commands below). Copy `skills/refresh-pyramid/` to `.claude/skills/` (or the skills folder your harness uses). Also copy `skills/code-module-deep-dive/` there if the owner wants the optional deep dive (see the pro tip in step 5). The tool needs Node 20.11 or later and nothing else.

The tool regenerates the routing blocks of `docs/index.md` from the documents and reports problems, each with a message that says what is wrong and what to do. It never edits a document: agents fix what it reports by hand. Modes: write (the default, rewrites the marker blocks of `index.md` and adds a block for a layer that has none), `--dry-run` (prints the findings and which blocks would change, writes nothing) and `--check` (writes nothing, exits 1 on errors or a stale index; suits a pre-commit hook or CI, see `tools/refresh-pyramid.md`).

Add one instruction to `AGENTS.md` / `CLAUDE.md`, next to the import:

```
When your edits to docs/ are finished, run `node tools/refresh-pyramid.js docs` once and fix what it reports. The skill /refresh-pyramid helps when the report is long.
```

Run it once when the edits are finished, not after each edit.

### 3.6 Use the house style

`house-style.md` is the writing guide. Keep it, or replace it with the team's own and name that in the file. Its "Done when" section already tells agents to run the refresh tool.

## 4. Documentation transfer

> [!NOTE]
> In a relatively greenfield project this might be overkill. Start with what you have now, and the pyramid will fill up as the system grows. That's fine too!

You have an existing system, and a great _new_ documentation system next to it. Now the new one needs to be **filled up**:

- **Seed it**, so we get off to a good start, and
- if there is existing documentation, in the project or outside it, **find it and consolidate it**: howtos, scripts and helpers, explanations, architecture notes, diagrams, decision records. Anything that leads to a **current and useful** description of the system.

Fill out the pyramid (and the optional Glossary), using "First pass: what to look for" in step 2 as the coverage check. Level 3 modules should use the same words as the modules in Level 2, where possible. Then run the refresh tool to fill the routing table.

**Make a plan** for how to integrate the existing docs. Should they be dissolved and migrated into the pyramid? My suggestion is yes: **one single source of truth**. If other things need the docs, or you want forward references in the old locations, so be it - but I recommend trying to commit to the new structure.

**Before you move or delete any existing docs, commit the current state**, so the migration can be undone with one revert. Commit only if the project's rules allow it. If they don't, ask the user to snapshot the current state first (commit, stash or copy). If you are unattended and cannot snapshot, copy instead of move and leave the originals in place.

**Exception:** files that a tool or framework owns or generates (for example OpenSpec specs, or BMAD's planning artifacts) **stay where they are**. Link to them, don't move them.

And if the framework already has its own home for the same kind of content as one of our layers (an architecture doc, say) and it's not clear which should win: **stop and ask the user.** One side has to adapt to the other, and that choice belongs to the project. With no human available, leave the framework's files untouched, put ours next to them, link both ways, and record the conflict in your report.

I'd recommend a research round first: scan for docs, ask your memory banks and context files for locations, investigate them, put the locations into a temporary file and talk it through with your friendly operator (if applicable) before you start renovating the place :)

**Also:** ask your human for documentation outside the repo that could be moved in - Notion, Word / Google docs, PDFs, anything they have that you don't.

## 5. Decide on the implementation plan

Make a plan and think it through. Then present it to the reviewer - if a human is in the loop - or, if you have an explicit go signal, GO! :) If the plan calls for a separate skill, run it and/or suggest the steps to your operator. You know the drill.

Confirm the doc-moving plan in the same session. The commit order is: snapshot (only if you move or delete docs), new structure, consolidation, then the written content. Each is its own change.

**Pro tip:** After consolidating, let a review agent check that no important documentation got left behind! Happens to the best of us! :)

**Optional pro tip:** If there isn't a good architecture & other documentation anywhere, a next round after consolidation could run an architect through the system to create the missing docs - and discuss them with the user. Perhaps they'll be surprised what's in there, or how it's implemented! Good stuff!

**Optional deep dive.** The regular first pass is a seed. For the modules that matter, the skill `skills/code-module-deep-dive/SKILL.md` digs into the code of one module and returns its findings in a file: design ideas, principles the authors defend, traps, and claims in the docs that are wrong. It does not edit the docs. Run it once per L3 module, one agent per module, in parallel, in a longer session; a mid-size model is enough. Then one technical writer agent integrates the findings. The writer follows `house-style.md`, reads each findings file next to the module's current text, keeps what helps someone change the code, corrects the wrong claims, and edits the module in its layer file (or in its own file if it has grown past the break-out rule). It does not paste the findings. It also revisits L1 and L2 where the findings change the big picture, and keeps those two layers easy to understand. At the end it runs the refresh tool. The deep dive is optional and does not replace the first pass above.

## 6. Implement!

Follow the plan you just made:

- snapshot commit, only if you are going to move or delete existing docs (see step 4)
- create the new directory and copy the templates from `references/`, the tool from `tools/` and the skills from `skills/`; commit this structure on its own
- consolidate the docs, if any exist, as a separate commit
- if there isn't a lot of documentation, launch an architect skill (or give it your best shot!) to scan the code and create the architecture docs and the first module docs
- suggest creating operational L4 docs for things that happen a lot: commits, merges, server start / stop, running the tests, etc.

### Check your work

Before you call it done:

- [ ] No template placeholders (`{…}`) or template HTML comments are left (only the `pyramid:` marker lines), and no sections or bullets remain for options you did not choose.
- [ ] `node tools/refresh-pyramid.js docs` has been run, and `node tools/refresh-pyramid.js docs --check` exits 0 and its output has no `error` or `warning` lines (the exit code alone does not show warnings: read the output).
- [ ] Every section has a byline of at most 100 characters, no module lives in two places, and no layer folder has an `index.md`.
- [ ] Links between the docs resolve.
- [ ] An empty layer folder still holds its `.gitkeep`; a folder with real files does not.
- [ ] The import (or the "Read @docs/index.md" line) is in the agent instruction file, with the path you actually chose.
- [ ] Smoke test, if you can: start a fresh session and ask what it loaded and what the project's non-goals are. The answer should come from L1.

After done: Congratulate the user! Show them an ascii-cake in the shape of a pyramid! Tell them how it went and ask them to review it & give it a go!

----

That's it. Great job!

Show another ascii art image of a happy dog strolling along a beach with the sun going down perhaps :) .
