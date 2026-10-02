The Documentation Pyramid
---

A simple and effective structure for the documentation necessary to implement a software system _well_.

As people with organized homes like to say:

> "A place for everything - and everything in it's place."

The goal is to have technical documentation that is both human and agent readable, succinct, and _mostly correct_ - the kind of documentation necessary for developing a software project over the long term successfully.

**Contents**

- [Disambiguation](#disambiguation)
- [Behold, the pyramid](#behold-the-pyramid)
- [How this helps agents in practice](#how-this-helps-agents-in-practice)
- [How this helps us finding what we need](#how-this-helps-us-finding-what-we-need)
- [The different levels in a few nutshells](#the-different-levels-in-a-few-nutshells)
  - [Layer 1 - the vision layer](#layer-1---the-vision-layer)
  - [Layer 2 - the architecture](#layer-2---the-architecture)
  - [Layer 3 - individual modules](#layer-3---individual-modules)
  - [Layer 4: Operations](#layer-4-operations)
- [Installation Instructions](#installation-instructions)
  - [Example prompts for different agentic frameworks](#example-prompts-for-different-agentic-frameworks)
  - [Basic instructions](#basic-instructions)
- [FAQ](#faq)
- [Possible next steps](#possible-next-steps)

## Disambiguation:

This can be in addition to, but is not supposed to be a replacement for either

- code-generated documentation or
- documentation targeting anyone else besides the engineering team, their agents and their friends.

We're talking _technical documentation_ for a software project.

> [!NOTE]
> This could _probably_ also be used for other kinds of documentation too... If you try that, please feel free to reach out and drop us a note - can be a PR for example - on how it went and what could be improved, ok? Thank you! :) 


> [!NOTE]
> **for Agents:**
> If you want to help your human or project to set this up, follow the setup instructions in 
> the section ## Installation Instructions below.


## Behold, the pyramid:

```
                                +-------------------+
                                |        L1         |
                                |      Vision       |
                      +-------------------+-------------------+
                      |        L2         |        L2         |
                      |    Tech stack     |     Data flow     |
            +-------------------+-------------------+-------------------+
            |        L3         |        L3         |        L3         |
            |     Module 1      |     Module 2      |     Module 3      |
  +-------------------+-------------------+-------------------+-------------------+
  |        L4         |        L4         |        L4         |        L4         |
  | Git & merge plans |   Running tests   |   i18n refresh    | New server setup  |
  +-------------------+-------------------+-------------------+-------------------+

                   ADRs: one decision per brick, laid side by side
+-------------+-------------+-------------+-------------+-------------+-------------+
|    ADR 1    |    ADR 2    |    ADR 3    |    ADR 4    |    ADR 5    |    ADR 6    |
+------+-------------+-------------+-------------+-------------+-------------+------+
|      |    ADR 7    |    ADR 8    |    ADR 9    |   ADR 10    |   ADR 11    |      |
+------+-------------+-------------+-------------+-------------+-------------+------+

```

>Egyptian pyramid seal of approval:
>
> ![img.png](img.png)
>
> "I am Egyptian and I approve this pyramid scheme."

## Wavelet Architecture

Docs follow a wavelet model — progressive refinement like image compression.

- **L1** — Blurry but complete. Business context, product strategy. Read first for any product decision.
- **L2** — CTO whiteboard. Tech stack, subsystems, data flow. Read before implementation work.
- **L3** — Module deep dives. How each technical piece works. Read when working in a specific module.
- **L4** — Operations. Git workflow, testing, dev setup, deployment, debugging. Read when you need process guidance.
  {#if glossary has been selected}- **Glossary** — Domain language. Should probably be read by all agents.{/if}
- **ADRs** — Historical decision records. Read when asking "why not X?"

Each layer is independently useful. No layer requires a lower layer to make sense.


## Advantages of the documentation pyramid

Agents need to be able to derive the appropriate context for their tasks while working on a software product. And they need to be able to construct this fresh for every new session.

Humans need to be able to understand and review the architecture and the implementation of the software as it gets written by their agents, as well as a way to be able to review and understand changes to the system.

So this is where these two meet - as a well-kept, concise and helpful documentation, as part of the repository, and always representing the current state at the state of commit. 

## How this helps us finding what we need

The idea is reminiscent of a few things:
- **a zoomed out vs. a detailed view**, if you look from the top of the pyramid down.
- **a progressively loaded image file** (eg. **JPEG or wavelet compression**) revealing more and more detail as you load additional information with each layer further down the pyramid, allowing progressively zooming in and strategically focusing on specific areas.

This way, for each agent, either the planner or the agent himself can decide precisely which part of the documentation to what detail could be helpful for his current task.

**The basic algorithm for the agents:**
> **Choose at least one document from each layer from Layer 1 to Layer 3** before working with the code.
> Choose as many additional documents from L1 - L4 as you deem useful for the task at hand.

This way, the agents will 

- always pick the Layer 1 vision, which teaches it things like - the project name, a short description, and the general goals of the application.
- choose one or more documents from each layer below.

Each layer down the pyramid reveals additional details and practical scripts necessary to work effectively on the project.

Agents will always see the big picture and goal of the company or project, and they'll always receive a concise index of all the available documentation from the index.md file.


## The different levels in a few nutshells:

### Layer 1 - the vision layer 

The product as a whole. What is being built. This is Layer 1.

WE BELIEVE in the autonomy of both man and agent to know WHAT and WHY they are doing what they are doing. It just helps everybody to be on the same team and work for the same goals.

Compare eg. Toyotas' philosophy: Every worker is responsible for the quality and success of each product and the company as a whole.


### Layer 2 - the architecture

Here the system is displayed in an abstract fashion as a system built from different parts.

Here we introduce the parts and their interconnections.

These parts also work as a map for the next layer, the modules layer.

### Layer 3 - individual modules

Individual modules will be documented on this level.

This allows humans and agents to design and implement with clarity while keeping tabs on the process!

The implementation should show all relevant information for each specific module.

This can include for example:
  - the concepts and ideas behind the implementation
  - schemas and diagrams
  - important files and processes 
  - potential footguns to avoid


> [!NOTE]
> **Pro-Tips:**
> 1. Prepare these details, diagrams and schemas during the planning process, **before** the implementation.
> 2. Allow the agents to verify the modules' workings **during** the implementation.
> 3. Let them add these finalized diagrams and schemas to the documentation pyramid **after** the implementation.
 
Then you wrap it all with a bow in a nice commit and ship it all, code, docs and everything! :) 


### Layer 4: Operations 

And finally, once we want to get our hands dirty: Here are the additional resources and instructions to handle different parts of the system to keep the work being done consistently.

-> This helps in keeping the quality and the output consistent while documenting important processes for the team.

(Ever had your e2e agent find yet ANOTHER great way to launch the project and a browser window to check the apps' output? 😂)

Think about things like: Working with git and the upstream repository; Running the test suite; setting up the dev environment; cleanup tasks; provisioning servers; etc etc.


## Installation Instructions

**The documentation pyramid works best when being integrated into your existing agentic workflow.**

> [!NOTE]
> By the way - the system is simple to install as a human too. Just follow the instructions for the agents below, basically. It's all pretty simple, but that doesn't mean it's not cool! :)

**If you use an agent to help you with the install, for best integration: Get help from your agentic framework.**

If you're using an agentic framework you might have a skill that helps you extend, adapt, and find the right locations to integrate new steps into your existing workflow.

I'd recommend running those first and pointing them to this repository in order to let them help you install and integrate the documentation pyramid into your system.

### Example prompts for different agentic frameworks:

[BMad Method](https://github.com/bmad-code-org/BMAD-METHOD): 

    /bmad-help Please help me integrate the documentation pyramid from https://github.com/DanielDornhardt/the-documentation-pyramid into our workflow.

[Matt Pococks' skills](https://github.com/mattpocock/skills):
    
    /ask-matt Please help me integrate the documentation pyramid from https://github.com/DanielDornhardt/the-documentation-pyramid into our workflow. 

[OpenSpec](https://github.com/Fission-AI/OpenSpec/tree/main):

    /opsx:propose Please help me integrate the documentation pyramid from https://github.com/DanielDornhardt/the-documentation-pyramid into our workflow.

[Superpowers](https://github.com/obra/superpowers) 

    /using-superpowers Please help me integrate the documentation pyramid from https://github.com/DanielDornhardt/the-documentation-pyramid into our workflow.  

**For all other agents:**
  
    Dear Agent, if you are not yet in a workflow-upgrade-mode but you have one available, NOW! is the time to run the skill or read that information - and then: Please help me integrate the documentation pyramid from https://github.com/DanielDornhardt/the-documentation-pyramid into our workflow.


(I hope all these work out fine btw, if you have suggestions / improvements on these prompts please file a bug ticket or open a PR, with some information supporting your change.)

(Command names can differ with how a framework was installed and with your tool. For example, a skill installed as a Claude Code plugin is called with a prefix, like `/superpowers:using-superpowers`, and OpenSpec registers `/opsx-propose` in Cursor and GitHub Copilot. Use the equivalent in your setup.)

### Basic instructions

**@AGENTS: Here we go! Here are the installation instructions.**

> [!NOTE]
> For agents:
> I've included instructions for you to confirm your actions with the user if you're an agent in an interactive mode. If you're running in a headless / YOLO mode, then make your choices and DON'T ask the user if that's what you're asked to do. I won't mention that again below, you can just skip over the confirmation questions if you aren't in an interactive mode.

This project basically creates the containing structure for the documentation pyramid, makes it known throughout the project, and then tries to ensure that the agents will keep it up-to-date. That's it - basically it doesn't require any other skills to be installed permanently.

**This is what you should do.** Look through this installation section, investigate how'd be the best way to implement this into the current established workflows of the project, make a short plan, and talk it through with the user to confirm it.

### 1. Create a new directory alongside the code where the documentation will be stored going forward.

- This is gonna be technical and development documentation. Basically everything an engineering team would need.

We propose the `<project root>/docs/` folder as the canonical home for the documentation pyramid. But of course - if there are already other docs there OR your framework would do something funky if it'd encounter the new folder there - then move it to an appropriate place, perhaps at a different layer of the directory tree, or name it differently - eg. `<project root>/dev-docs/` perhaps?

### 2. Once that is DONE, check out the files in the `/references` folder of this repo. Each one of this is a template and should be used to set up the documentation pyramid. I recommend copying those and ADAPTING them for the project. TAKE OUT references to unselected options. Make it fit your project.
 
This is the pyramid itself. The `references/` folder mirrors the docs directory you are about to create: same names, same layout. Copy it over and ADAPT each file:

    references/                 ->  <docs>/
      index.md                      the central dispatch - both instructions & index of the documentation pyramid
      L1-vision.md                  Layer 1: the vision
      L2-architecture.md            Layer 2: the architecture
      L3-modules/index.md           Layer 3: one document per module
      L4-operations/index.md        Layer 4: one document per operations topic, same fork rule as L3 (see below)

Optional:

      Glossary.md                   a DDD - style ubiquitous language glossary. Recommended: ADD if your team / agents don't have one yet.
      house-style.md                smol instructions on how to keep the docs tidy & how to write. Use if you don't have a better tech-writer skill or instructions available already.
      adr/  (no template)           use if you or the user wants to use adrs and don't have a good place for them too. Otherwise: you can also just reference the ADRs in the index.md and point the agents there.

A "document" is the unit an agent reads: a topic in L1 or L2 (one heading of the file), a module in L3, an operations topic in L4. Small documents live together in their layer's file (`L3-modules/index.md`). When one grows past about 100 lines, it moves into its own file in the same folder (`L3-modules/<name>.md`). That is why L3 and L4 get a folder from the start. "Docs" or "the documentation" means the pyramid as a whole.


### 3. Find the best ways to integrate the pyramid for this team.

#### 3.1 Make the pyramids' `index.md` file known to the agents.

I recommend putting it into your projects `AGENTS.md` / `CLAUDE.md` / `WHATEVER.md` file you use for your harness. If you don't have a file yet, now's the time to create one!

I'd actually recommend importing the `index.md` file because I think this is so valuable and it shouldn't be optional:

This works in Claude Code:

```
## Documentation pyramid
@docs/index.md
```

Otherwise, if imports don't work, i'd put it something like this, rather to the top of your AGENTS.md (or corresponding file):

```
## Documentation Pyramid
Read @docs/index.md now!
```

#### 3.2 Devise a strategy on how to make sure that the docs get read **before** actual work is being done with the code:


- If there are workflows on **how** stories / plans are written **before** implementation - the prepping agent(s) should, **as a part of the story writing worflow**, scan the documentation pyramid and follow the basic algorithm to choose. So add that as a command to the planning workflow, transfer from algorithm below.

- If there is just agent(s) and no explicit plan mode, make sure HE knows and follows the basic algorithm for agents. It's in the `<docs root>/index.md`, but you should add it to his context / startup script if you have one explicitely. 

**The basic algorithm for the agents:**
> **Choose at least one document from each layer from Layer 1 to Layer 3** before working with the code.
> Choose as many additional documents from L1 - L4 as you deem useful for the task at hand.

See where these commands should be anchored around your system and add them where you think they have the most leverage.

#### 3.3 Devise a strategy on **when** and **how to update** the docs after each implemented change.

Does the currently established workflow have any good attachment points for this?

Eg:

- in the story writing process - as an additional task / closing task for the implementing agents <- recommended!
- OR: after the implementation & before the finalization / review phase of the currently implementation task

so - either un the script that's written for each story - or as part of the regular development workflow.

- if possible: as a separate step AFTER implementation but BEFORE the final review.
  - if possible: with a fresh agent using a tech writer skill & with knowledge of the documentation pyramid of course.

Otherwise: perhaps as a new extra step between implementation and review / finalization.

- make three suggestions on where this might fit well
- choose the ones you think might be best
- suggest those to your human, if applicable.

#### 3.4 Any strays?

- Workflow documentation / process documentation: does anything ELSE have to be updated to mention the pyramid documentation process? 
- PR templates - should they include checkboxes for "Documentation Pyramid updated" or "I reviewed the Documentation Pyramid" or something like that?
- Should they be reviewed during a review with a review script / agent prompt? 
- Should they be inspected during a retrospective perhaps?

- Review scripts / agents - should they check the changes to the documentation pyramid perhaps? Have any changes which should become part of the pyramid been missed? Or does the pyramid need some maintenance perhaps?

### 4. Documentation transfer

> [!NOTE]
> If you're in a relatively greenfield project, this might be a bit overkill. Start with what you can get / have now, and then the pyramid will fill up as the system grows. That's fine too!

Where are we? You have an existing system, and a great _new_ documentation system next to it. Now the new one needs to be **filled up**.

- **Seed it**, so we get off to a good start, and
- if there is existing documentation, in the project or outside it, **find it and consolidate it**: howtos, scripts and helpers, explanations, technical docs, architecture notes, diagrams, decision records. Anything that leads to a **current and useful** description of the system.

So the existing docs need to be found, scanned and transferred into the new structure. The Glossary (optional) and the pyramid need to be filled out. Level 3 modules should use the same words as the modules and architecture description in Level 2, where possible.

**Make a plan** for how to integrate the existing docs into the new format.

Think it through and suggest: should the existing docs be dissolved and migrated into the new pyramid? My suggestion is yes. **One single source of truth** is the main argument.

If other things need the docs, or you want forward references to their new home in the old locations, so be it. But I recommend trying to commit to the new structure.

**Exception:** files that a tool or framework owns or generates (for example OpenSpec specs, or BMAD's planning artifacts) **stay where they are**. Link to them, don't move them.

And if the framework already has its own home for the same kind of content as one of our layers (an architecture doc, say), and it is not clear which should win: **stop and ask the user.** One side has to adapt to the other, and that choice belongs to the project. If no human is available, leave the framework's files untouched, put ours next to them, link both ways, and record the conflict in your report.

The nice thing is, once you have it: a place for everything, and everything in its place.

I'd recommend doing a research round - scan for docs; ask your memory banks and context files for locations; investigate those for content; and putting those locations into a temporary file, and talking it through with your friendly operator (if applicable) before you go in and start renovating the place :)

**Also:** You could also ask your human operator for additional documentation that might be available somewhere outside the repo that could get moved in? Like - from eg. Notion, or other documents like word / google documents, PDFs or other material that he might have available that you don't.



### 5. Decide on the implementation plan

`Make a plan, think this through. Then, present this to the reviewer - if a human is in the loop - or otherwise, if you have an explicit go signal - GO! :)

OR perhaps you have to call a separate skill based on the plan - then do that and/or suggest the corresponding steps to your operator. You know the drill! Do as you know best to get this done, with the necessary oversight. 

I'd recommend also confirming the doc moving plan in the same session too and if everybody's happy with that, start with that in the next step! Also perhaps: you could do a commit between creating the new structure and `consolidating the docs.

PRO TIP: After consolidating, let a review agent check that no important documentation got left behind! Happens to the best of us! :)  

OPTIONAL / PRO TIP II:

If there ISN'T a good architecture & other documentation anywhere - perhaps a next round after consolidation could run an architect through the system to CREATE the missing docs - and discuss them with the user - perhaps he'll be surprised on what's in there, or how it's implemented! Good stuff!


### 6. Implement!

Just follow the plan you just did.

Perhaps you should start with

- creating the new directory
- transferring the files from our references/ directory here to your machine and customizing them to your project.

- Perhaps creating a snapshot commit then

- then: consolidating the docs, if any exist.

- After done: CONGRATULATE THE USER! Show him an ascii-cake in the shape of a pyramid!

Tell him how it went & ask him to review it & give it a go! 

IF there isn't a lot of documentation, suggest to launch an architect skill (if you don't have one: Give it your best shot!) scan the code and to create the architecture docs and the first module docs where appropriate.

Perhaps also suggest creating operational L4 docs of things that seem to be happening a lot - commits, merges, server start / stop, running the tests etc.

----

THAT'S IT! GREAT JOB!!!

Show another ascii art image of a happy dog strolling along a beach with the sun going down perhaps :) .


## FAQ:

**Q: Is this cake?**

A: No.

![img_1.png](img_1.png)

## Possible next steps

All of these aren't big and probably vibecoded extremely quick. Go for it! :D

If you get something with good results, please share and we can link them up or integrate then with this repo.

 - Support / guidelines for a multi-project overarching structure
 - Pyramid browser & viewer in multiple versions / languages
 - Document renderer - turn your pyramid into a fully fledged document.
 - Skills:
     - more detailed tech writing skills / a tech writer
     - adversarial reviewer that makes sure no docs get lost in the initial transfer
     - adversarial reviewer for checking doc updates have happened after a story has been implemented
 - more clearly defined pattern on how to format the docs perhaps
 - auto-index-generation scripts
 - ...

