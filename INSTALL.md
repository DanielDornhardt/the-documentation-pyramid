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

## 2. Copy the templates, the tool and the skill from `references/`

The `references/` folder of this repo mirrors the docs directory you are about to create: same names, same layout. Clone the repo (or fetch the files) to get it, then copy it over and adapt each file to the project. **Take out** references to unselected options.

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
      tools/refresh-pyramid.js  .md      ->  <docs>/tools/        the refresh tool and its reference
      skills/refresh-pyramid/SKILL.md    ->  .claude/skills/refresh-pyramid/SKILL.md   (outside docs; see 3.5)
      adr/  (no template)                    optional: decision records, one file per decision. Add it if you want ADRs and have no good place for them. Otherwise just reference the ADRs in index.md and point the agents there.

### The layout rules

- **One file per layer** at the base level of the docs: `L1-vision.md`, `L2-architecture.md`, `L3-modules.md`, `L4-operations.md`. A "document" is the unit an agent reads: a topic in L1 or L2 (one `##` heading), a module in L3, an operations topic in L4.
- **The 100-line break-out rule.** When a section grows past about 100 lines, move it to its own file in the layer folder (`L3-modules/<name>.md`) and **delete it from the layer file**. Nothing is left behind, no summary, no pointer. The routing table in `index.md` points to the new file. That is why `L2-architecture/`, `L3-modules/` and `L4-operations/` exist from the start, each holding only a `.gitkeep` so git keeps the empty folder. Delete the `.gitkeep` when you add the first real file. L1 gets no folder: it stays under 100 lines.
- **Heading levels are the same everywhere.** A layer file has one `#`, the layer title. Every module is a `##`, and its sections are `###`. A broken-out file has no `#`: it starts at the module's `##` heading, and its sections stay `###`. Moving a module between the layer file and the folder is a cut and paste; no level changes, and no tool changes a level when it moves or combines text (`--fix-headings` is the one-time migration of legacy files). Other documents (`index.md`, `Glossary.md`, `house-style.md`, decision records in `adr/`) are ordinary documents with one `#`.

  | Where | Module title | Section |
  |---|---|---|
  | Layer file (`L3-modules.md`) | `##` | `###` |
  | Broken-out file (`L3-modules/<name>.md`) | `##` | `###` |

- **One home per module.** A module is a section of the layer file or a file in the layer folder, never both.
- **No index files in layer folders.** The root `index.md` is the only routing table. (`adr/` is the exception: it may have its own `index.md` or `README.md`.)
- **The byline rule.** Start every section, and every broken-out file, with one sentence of at most 140 characters that says what it covers. The routing table copies that sentence. A leading label like `**Purpose.**` is skipped.
- **Marker blocks.** `index.md` holds one block per layer between `<!-- pyramid:begin L3-modules -->` and `<!-- pyramid:end L3-modules -->`. The tool rewrites what is between the markers (module, pointer with line number or file path, byline). Never edit inside the markers; edit the document and refresh. Everything outside the markers is yours. If you use ADRs, add a block for `adr` the same way.

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

Copy `references/tools/refresh-pyramid.js` and `refresh-pyramid.md` to `docs/tools/`. Copy `references/skills/refresh-pyramid/SKILL.md` to `.claude/skills/refresh-pyramid/SKILL.md` (or the skills folder your harness uses). The tool needs Node 20.11 or later and nothing else.

Add one instruction to `AGENTS.md` / `CLAUDE.md`, next to the import:

```
When your edits to docs/ are finished, run `node docs/tools/refresh-pyramid.js docs` once and fix what it reports. The skill /refresh-pyramid helps when it reports findings.
```

Run it once when the edits are finished, not after each edit. It rewrites only the marker blocks in `index.md`, so it is safe to run at any time; `--check` writes nothing and suits a pre-commit hook or CI (see `docs/tools/refresh-pyramid.md`).

### 3.6 Use the house style

`house-style.md` is the writing guide. Keep it, or replace it with the team's own and name that in the file. Its "Done when" section already tells agents to run the refresh tool.

## 4. Documentation transfer

> [!NOTE]
> In a relatively greenfield project this might be overkill. Start with what you have now, and the pyramid will fill up as the system grows. That's fine too!

You have an existing system, and a great _new_ documentation system next to it. Now the new one needs to be **filled up**:

- **Seed it**, so we get off to a good start, and
- if there is existing documentation, in the project or outside it, **find it and consolidate it**: howtos, scripts and helpers, explanations, architecture notes, diagrams, decision records. Anything that leads to a **current and useful** description of the system.

Fill out the pyramid (and the optional Glossary). Level 3 modules should use the same words as the modules in Level 2, where possible. Then run the refresh tool to fill the routing table.

**Make a plan** for how to integrate the existing docs. Should they be dissolved and migrated into the pyramid? My suggestion is yes: **one single source of truth**. If other things need the docs, or you want forward references in the old locations, so be it - but I recommend trying to commit to the new structure.

**Before you move or delete any existing docs, commit the current state**, so the migration can be undone with one revert. Commit only if the project's rules allow it. If they don't, ask the user to snapshot the current state first (commit, stash or copy). If you are unattended and cannot snapshot, copy instead of move and leave the originals in place.

**Exception:** files that a tool or framework owns or generates (for example OpenSpec specs, or BMAD's planning artifacts) **stay where they are**. Link to them, don't move them.

And if the framework already has its own home for the same kind of content as one of our layers (an architecture doc, say) and it's not clear which should win: **stop and ask the user.** One side has to adapt to the other, and that choice belongs to the project. With no human available, leave the framework's files untouched, put ours next to them, link both ways, and record the conflict in your report.

I'd recommend a research round first: scan for docs, ask your memory banks and context files for locations, investigate them, put the locations into a temporary file and talk it through with your friendly operator (if applicable) before you start renovating the place :)

**Also:** ask your human for documentation outside the repo that could be moved in - Notion, Word / Google docs, PDFs, anything they have that you don't.

## 5. Decide on the implementation plan

Make a plan and think it through. Then present it to the reviewer - if a human is in the loop - or, if you have an explicit go signal, GO! :) If the plan calls for a separate skill, run it and/or suggest the steps to your operator. You know the drill.

Confirm the doc-moving plan in the same session. Commit the new structure before you consolidate the docs (see step 4), so the consolidation is its own change.

**Pro tip:** After consolidating, let a review agent check that no important documentation got left behind! Happens to the best of us! :)

**Optional pro tip:** If there isn't a good architecture & other documentation anywhere, a next round after consolidation could run an architect through the system to create the missing docs - and discuss them with the user. Perhaps they'll be surprised what's in there, or how it's implemented! Good stuff!

## 6. Implement!

Follow the plan you just made:

- create the new directory
- copy the files from our `references/` directory (templates, tool, skill) and customize them to the project
- snapshot commit, before moving or deleting anything (see step 4)
- consolidate the docs, if any exist
- if there isn't a lot of documentation, launch an architect skill (or give it your best shot!) to scan the code and create the architecture docs and the first module docs
- suggest creating operational L4 docs for things that happen a lot: commits, merges, server start / stop, running the tests, etc.

### Check your work

Before you call it done:

- [ ] No template placeholders are left (`{…}`), and no sections or bullets remain for options you did not choose.
- [ ] `node docs/tools/refresh-pyramid.js docs` has been run, and `node docs/tools/refresh-pyramid.js docs --check` exits 0 with no findings.
- [ ] Every section has a byline of at most 140 characters, no module lives in two places, and no layer folder has an `index.md`.
- [ ] Links between the docs resolve.
- [ ] An empty layer folder still holds its `.gitkeep`; a folder with real files does not.
- [ ] The import (or the "Read @docs/index.md" line) is in the agent instruction file, with the path you actually chose.
- [ ] Smoke test, if you can: start a fresh session and ask what it loaded and what the project's non-goals are. The answer should come from L1.

After done: Congratulate the user! Show them an ascii-cake in the shape of a pyramid! Tell them how it went and ask them to review it & give it a go!

## Migrating an existing pyramid

For a pyramid in the old layout (a folder with an `index.md` per layer, for example `L3-modules/index.md`). Work on a clean git tree, and **dry-run first**:

```sh
node docs/tools/refresh-pyramid.js docs --fix-layout --dry-run   # preview: layer folder index.md -> layer file, links rewritten
node docs/tools/refresh-pyramid.js docs --fix-layout             # do it
node docs/tools/refresh-pyramid.js docs --split "L3-modules.md#sync-system" --dry-run   # preview a break-out of one long section
node docs/tools/refresh-pyramid.js docs --split "L3-modules.md#sync-system"
node docs/tools/refresh-pyramid.js docs --fix-headings --dry-run # preview: broken-out files that start with "# " (W10) move one level deeper
node docs/tools/refresh-pyramid.js docs --fix-headings           # do it
node docs/tools/refresh-pyramid.js docs                          # refresh the routing table
```

`--fix-layout` leaves a summary section next to each module file; delete those (the tool reports them as E2). `--split` moves a section into the layer folder, leaves nothing behind, and changes no heading level: the file starts at the module's `##` heading. `--fix-headings` is for broken-out files in the legacy form, which start with a `#` title: it moves every heading of such a file one level deeper, so the file starts at `##` like the module in the layer file. Replace the hand-written routing tables in `index.md` by the generated blocks. Details and all findings: `docs/tools/refresh-pyramid.md`.

----

That's it. Great job!

Show another ascii art image of a happy dog strolling along a beach with the sun going down perhaps :) .
