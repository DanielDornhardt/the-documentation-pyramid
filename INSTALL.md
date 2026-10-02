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

We propose `<project root>/docs/` as the canonical home. But if there are already other docs there, or your framework would do something funky with a new folder there, put it somewhere else - another level of the tree, or another name, e.g. `<project root>/dev-docs/`.

## 2. Copy the templates from `references/`

The `references/` folder of this repo mirrors the docs directory you are about to create: same names, same layout. Clone the repo (or fetch the files) to get it, then copy it over and adapt each file to the project. **Take out** references to unselected options.

    references/                 ->  <docs>/
      index.md                      the central dispatch - both instructions & index of the documentation pyramid
      L1-vision.md                  Layer 1: the vision
      L2-architecture.md            Layer 2: the architecture
      L3-modules/index.md           Layer 3: one document per module
      L4-operations/index.md        Layer 4: one document per operations topic, same fork rule as L3

Optional:

      Glossary.md                   a DDD - style ubiquitous language glossary. Recommended if your team / agents don't have one yet.
      house-style.md                smol instructions on how to keep the docs tidy & how to write. Use it if you don't have a better tech-writer skill or instructions.
      adr/  (no template)           if you or the user want ADRs and have no good place for them. Otherwise just reference the ADRs in index.md and point the agents there.

A "document" is the unit an agent reads: a topic in L1 or L2 (one heading of the file), a module in L3, an operations topic in L4. Small documents live together in their layer's file (`L3-modules/index.md`). When one grows past about 100 lines, it moves into its own file in the same folder (`L3-modules/<name>.md`), leaving a short summary and a link behind. That is why L3 and L4 get a folder from the start. "Docs" means the pyramid as a whole.

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

## 4. Documentation transfer

> [!NOTE]
> In a relatively greenfield project this might be overkill. Start with what you have now, and the pyramid will fill up as the system grows. That's fine too!

You have an existing system, and a great _new_ documentation system next to it. Now the new one needs to be **filled up**:

- **Seed it**, so we get off to a good start, and
- if there is existing documentation, in the project or outside it, **find it and consolidate it**: howtos, scripts and helpers, explanations, architecture notes, diagrams, decision records. Anything that leads to a **current and useful** description of the system.

Fill out the pyramid (and the optional Glossary). Level 3 modules should use the same words as the modules in Level 2, where possible.

**Make a plan** for how to integrate the existing docs. Should they be dissolved and migrated into the pyramid? My suggestion is yes: **one single source of truth**. If other things need the docs, or you want forward references in the old locations, so be it - but I recommend trying to commit to the new structure.

**Exception:** files that a tool or framework owns or generates (for example OpenSpec specs, or BMAD's planning artifacts) **stay where they are**. Link to them, don't move them.

And if the framework already has its own home for the same kind of content as one of our layers (an architecture doc, say) and it's not clear which should win: **stop and ask the user.** One side has to adapt to the other, and that choice belongs to the project. With no human available, leave the framework's files untouched, put ours next to them, link both ways, and record the conflict in your report.

I'd recommend a research round first: scan for docs, ask your memory banks and context files for locations, investigate them, put the locations into a temporary file and talk it through with your friendly operator (if applicable) before you start renovating the place :)

**Also:** ask your human for documentation outside the repo that could be moved in - Notion, Word / Google docs, PDFs, anything they have that you don't.

## 5. Decide on the implementation plan

Make a plan and think it through. Then present it to the reviewer - if a human is in the loop - or, if you have an explicit go signal, GO! :) If the plan calls for a separate skill, run it and/or suggest the steps to your operator. You know the drill.

Confirm the doc-moving plan in the same session, and consider a commit between creating the new structure and consolidating the docs.

**Pro tip:** After consolidating, let a review agent check that no important documentation got left behind! Happens to the best of us! :)

**Optional pro tip:** If there isn't a good architecture & other documentation anywhere, a next round after consolidation could run an architect through the system to create the missing docs - and discuss them with the user. Perhaps they'll be surprised what's in there, or how it's implemented! Good stuff!

## 6. Implement!

Follow the plan you just made:

- create the new directory
- copy the files from our `references/` directory and customize them to the project
- (snapshot commit)
- consolidate the docs, if any exist
- if there isn't a lot of documentation, launch an architect skill (or give it your best shot!) to scan the code and create the architecture docs and the first module docs
- suggest creating operational L4 docs for things that happen a lot: commits, merges, server start / stop, running the tests, etc.

After done: Congratulate the user! Show them an ascii-cake in the shape of a pyramid! Tell them how it went and ask them to review it & give it a go!

----

That's it. Great job!

Show another ascii art image of a happy dog strolling along a beach with the sun going down perhaps :) .
