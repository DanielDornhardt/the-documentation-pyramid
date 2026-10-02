The Documentation Pyramid
---

**Built for agentic engineering workflows.**

A simple and effective structure for the documentation necessary to implement a software system _well_.

> "A place for everything - and everything in its place."

The goal is technical documentation that is both human and agent readable, succinct, and _mostly correct_ - the kind you need to develop a software project successfully over the long term.

**Contents**

- [Disambiguation](#disambiguation)
- [Behold, the documentation pyramid](#behold-the-documentation-pyramid)
- [Wavelet Architecture](#wavelet-architecture)
- [Advantages of the documentation pyramid](#advantages-of-the-documentation-pyramid)
- [How this helps us find what we need](#how-this-helps-us-find-what-we-need)
- [The different levels in a few nutshells](#the-different-levels-in-a-few-nutshells)
  - [Layer 1 - the vision layer](#layer-1---the-vision-layer)
  - [Layer 2 - the architecture](#layer-2---the-architecture)
  - [Layer 3 - individual modules](#layer-3---individual-modules)
  - [Layer 4: Operations](#layer-4-operations)
- [Installation Instructions](#installation-instructions)
  - [Example prompts for different agentic frameworks](#example-prompts-for-different-agentic-frameworks)
  - [The short version](#the-short-version)
- [FAQ](#faq)
- [Possible next steps](#possible-next-steps)

## Disambiguation:

This is in addition to, not a replacement for

- code-generated documentation, or
- documentation for anyone besides the engineering team, their agents and their friends.

We're talking _technical documentation_ for a software project.

> [!NOTE]
> This could _probably_ also be used for other kinds of documentation too... If you try that, please feel free to reach out and drop us a note - can be a PR for example - on how it went and what could be improved, ok? Thank you! :) 


> [!NOTE]
> **for Agents:**
> If you want to help your human or project to set this up, follow the instructions in
> [INSTALL.md](INSTALL.md).


## Behold, the documentation pyramid:

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
- **Glossary** (optional) — Domain language. Should probably be read by all agents.
- **ADRs** — Historical decision records. Read when asking "why not X?"

Each layer is independently useful. No layer requires a lower layer to make sense.


## Advantages of the documentation pyramid

Agents need to be able to derive the appropriate context for their tasks while working on a software product. And they need to be able to construct this fresh for every new session.

Humans need to be able to understand and review the architecture and the implementation of the software as it gets written by their agents, as well as a way to be able to review and understand changes to the system.

So this is where these two meet - as a well-kept, concise and helpful documentation, as part of the repository, and always representing the current state at the time of commit. 

## How this helps us find what we need

The idea is reminiscent of a few things:
- **a zoomed out vs. a detailed view**, if you look from the top of the pyramid down.
- **a progressively loaded image file** (eg. **JPEG or wavelet compression**) * (think JPEG or wavelet compression): each layer further down reveals more detail, so you can zoom in strategically on the areas that matter.

The planner, or the agent itself, decides which parts of the documentation, in what detail, help with the current task.

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

The product as a whole. What is being built.

WE BELIEVE in the autonomy of both man and agent to know WHAT and WHY they are doing what they are doing. It just helps everybody to be on the same team and work for the same goals.

Compare eg. Toyotas' philosophy: Every worker is responsible for the quality and success of each product and the company as a whole.


### Layer 2 - the architecture

The system displayed in an abstract fashion, as a system built from different parts, and how those parts connect. These parts also work as a map for the next layer, the modules.

### Layer 3 - individual modules

Each module gets documented here, so humans and agents can design and implement with clarity while keeping tabs on the process. It should hold everything relevant for that module, for example:

- the concepts and ideas behind the implementation
- schemas and diagrams
- important files and processes
- potential footguns to avoid


> [!NOTE]
> **Pro-Tips:**
> 1. Prepare these details, diagrams and schemas during the planning process, **before** the implementation.
> 2. Allow the agents to verify the modules' workings **during** the implementation.
> 3. Let them add these finalized diagrams and schemas to the documentation pyramid **after** the implementation.

Then wrap it all with a bow in a nice commit and ship it all: code, docs and everything! :)


### Layer 4: Operations 

And finally, once we want to get our hands dirty: Here are the additional resources and instructions to handle different parts of the system to keep the work being done consistently.

-> This helps in keeping the quality and the output consistent while documenting important processes for the team.

(Ever had your e2e agent find yet ANOTHER great way to launch the project and a browser window to check the apps' output? 😂)

Think about things like: Working with git and the upstream repository; Running the test suite; setting up the dev environment; cleanup tasks; provisioning servers; etc etc.


## Installation Instructions

**The documentation pyramid works best when it is integrated into your existing agentic workflow.**

> [!NOTE]
> By the way - it's simple to install as a human too. Just follow [INSTALL.md](INSTALL.md), or the short version below. It's all pretty simple, but that doesn't mean it's not cool! :)

**If you use an agent to help you with the install, for best integration: Get help from your agentic framework.**

If you're using an agentic framework you might have a skill that helps you extend, adapt, and find the right locations to integrate new steps into your existing workflow.

I'd recommend running those first and pointing them to this repository in order to let them help you install and integrate the documentation pyramid into your system.

### Example prompts for different agentic frameworks:

[BMad Method](https://github.com/bmad-code-org/BMAD-METHOD): 

    /bmad-help Please help me integrate the documentation pyramid from https://github.com/DanielDornhardt/the-documentation-pyramid into our workflow.

[Matt Pocock's skills](https://github.com/mattpocock/skills):
    
    /ask-matt Please help me integrate the documentation pyramid from https://github.com/DanielDornhardt/the-documentation-pyramid into our workflow. 

[OpenSpec](https://github.com/Fission-AI/OpenSpec/tree/main):

    /opsx:propose Please help me integrate the documentation pyramid from https://github.com/DanielDornhardt/the-documentation-pyramid into our workflow.

[Superpowers](https://github.com/obra/superpowers) 

    /using-superpowers Please help me integrate the documentation pyramid from https://github.com/DanielDornhardt/the-documentation-pyramid into our workflow.  

**For all other agents:**
  
    Dear Agent, if you are not yet in a workflow-upgrade-mode but you have one available, NOW! is the time to run the skill or read that information - and then: Please help me integrate the documentation pyramid from https://github.com/DanielDornhardt/the-documentation-pyramid into our workflow.


(I hope all these work out fine btw, if you have suggestions / improvements on these prompts please file a bug ticket or open a PR, with some information supporting your change.)

(Command names can differ with how a framework was installed and with your tool. For example, a skill installed as a Claude Code plugin is called with a prefix, like `/superpowers:using-superpowers`, and OpenSpec registers `/opsx-propose` in Cursor and GitHub Copilot. Use the equivalent in your setup.)

### The short version

1. Create a docs directory: `docs/`, or `dev-docs/` if `docs/` is taken.
2. Copy the templates from `references/` into it and adapt them to your project.
3. Import `docs/index.md` from your `AGENTS.md` / `CLAUDE.md`.
4. Add "read before / update after" steps to your planning and story workflow.
5. Fill it from the code and from your existing docs. Greenfield? Start small, it fills up as you go.

The full, step-by-step instructions (written for agents, fine for humans too) are in **[INSTALL.md](INSTALL.md)**.


## FAQ:

**Q: Is this cake?**

A: No.

![Pyramid Layer Cake](pyramid-final-4.jpg)

## Possible next steps

None of these are big, and they can probably be vibecoded extremely quickly. Go for it! :D

If you get something with good results, please share and we can link it up or integrate it with this repo.

- Support / guidelines for a multi-project overarching structure
- Pyramid browser & viewer in multiple versions / languages
- Document renderer - turn your pyramid into a fully fledged document
- Skills:
    - more detailed tech writing skills / a tech writer
    - adversarial reviewer that makes sure no docs get lost in the initial transfer
    - adversarial reviewer for checking doc updates have happened after a story has been implemented
- a more clearly defined pattern on how to format the docs
- auto-index-generation scripts
- ...
