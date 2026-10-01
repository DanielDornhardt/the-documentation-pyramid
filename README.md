The Documentation Pyramid
===

A simple but effective way to structure software development related docs.

Like people with organized homes like to say: "A place for everything - and everything in it's place."

The goal is to have a both human and agent readable, succinct, and correct version of the most important documentation necessary for working on and improving a software project.

> [!WARNING]
> This can be in addition to, but should NOT be seen as a replacement for either code-generated documentation or any human written documentation or documentation targeting anyone else besides the engineering team and their agents. You can see whether you could colocate all these for additional coverage perhaps?

> [!NOTE]
> **for Agents:**
> If you want to help your human or project to set this up, follow the setup instructions in 
> the section ## Installation Instructions below.



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


The main idea is this: Agents need to be able to easily derive the appropriate context for each of their tasks working on a software product. And they need to be able to construct this fresh for every new session.

Humans need to be able to understand and review the architecture and the implementation of the software as it gets written by their agents, as well as a way to be able to review and understand changes to the system.

One big part of this could be - a well-kept, concise and helpful documentation, part of the repository, and always representing the current status at the state of commit. 

## From the grand vision down to the details

The idea is reminiscent of a few things:
- a zoomed out vs. a detailed view
- a progressively loaded image file (eg. JPEG or wavelet compression) revealing as much detail as you need, progressively

This way, for each agent, either the planner or the agent himself can decide precisely which part of the documentation to what detail could be helpful for his current task.

He will always see the big picture / goal of the company, and he'll always receive a concise index of all the available documentation.

And from that he can pick and choose bite-sized chunks or actual full working documents for the areas and parts of the solution that he is going to work with. 

Each layer down the pyramid reveals additional details and practical scripts necessary to work effectively on the project.


## The different levels in a few nutshells:

### Layer 1 - the vision layer 

The product as a whole. What is being built. This is Layer 1.

WE BELIEVE in the autonomy of both man and agent to know WHAT and WHY they are doing what they are doing. 

Compare eg. Toyotas' philosophy: Every worker is responsible for the quality and success of each product and the company as a whole.


### Layer 2 - the architecture

Here the system is displayed in an abstract fashion as a system built from different parts.

Here we introduce the parts and their interconnections.

These parts also work as a map for the next layer, the modules layer.

### Layer 3 - individual modules

Surprise! Individual modules will be documented on this level.

This allows humans and agents to design and implement with clarity while keeping tabs on the process!

The implementation should show all relevant information for each specific modules.

I'd recommend one or two helpful diagrams if database tables are involved and also just structural explanations on how the thing is supposed to work.

This can include the concepts and ideas the implementation is based on as well as potential footguns to avoid.

### Layer 4: Operations 

And finally, if you want to get your hands dirty: Here are the additional resources and instructions to handle different parts of the system to keep the work being done consistently, without having to go out to reinvent the wheel for actual operational tasks each time.

This helps in keeping the quality and the output consistent while documenting important processes for the team.

Think about things like: Working with git and the upstream repository; Running the test suite; setting up the dev environment; cleanup tasks; provisioning servers; etc etc.


## Installation Instructions

The documentation pyramid works best if it's integrated into your existing agentic workflow. This means if you're using a framework or have a skill that helps you extend, adapt, or find the right locations to integrate this with your workflows, I'd recommend running that first, and then pointing it to this repository in order to install and integrate the documentation pyramid.

Point your agent of choice here, to [this repositorys' URL](https://github.com/DanielDornhardt/the-documentation-pyramid) and let it _rip_ - or, if you have a helpful workflow-aware agent or skill helping you out, launch it like this:


### Example prompts:

[BMad Method](https://github.com/bmad-code-org/BMAD-METHOD): 

    /bmad-help Please help me integrate the documentation pyramid from https://github.com/DanielDornhardt/the-documentation-pyramid into our workflow.

[Matt Pococks' skills](https://github.com/mattpocock/skills):
    
    /ask-matt Please help me integrate the documentation pyramid from https://github.com/DanielDornhardt/the-documentation-pyramid into our workflow. 

[OpenSpec](https://github.com/Fission-AI/OpenSpec/tree/main):

    /opsx:propose Please help me integrate the documentation pyramid from https://github.com/DanielDornhardt/the-documentation-pyramid into our workflow.

[Superpowers](https://github.com/obra/superpowers) /using-superpowers Please help me integrate the documentation pyramid from https://github.com/DanielDornhardt/the-documentation-pyramid into our workflow.  

ALL OTHERS: Dear Agent, if you are not yet in workflow-upgrade-mode but you have one available, NOW! is the time to run the skill or read that information - and then continue below:


(I hope all these work out fine btw, if you have suggestions / improvements on these prompts please file a bug ticket or open a PR, with some information supporting your change.)

(Command names can differ with how a framework was installed and with your tool. For example, a skill installed as a Claude Code plugin is called with a prefix, like `/superpowers:using-superpowers`, and OpenSpec registers `/opsx-propose` in Cursor and GitHub Copilot. Use the equivalent in your setup.)

### Basic instructions

This project basically creates the containing structure for the documentation pyramid, makes it known throughout the project, and then hopes that the agents will keep it up-to-date. That's it - basically it doesn't require any skills installed permanently, unless you choose to enhance your system thus.


This is what you should do. Look through this, investigate how'd be the best way to implement this into the current established workflows of the project, make a short plan, and talk it through with the user to confirm it (if applicable).

1. Create a new directory alongside the code where the documentation will be stored going forward.

- This is gonna be technical and development documentation. Basicaly everything an engineering team would need.

We propose the `<project root>/docs/` folder as the canonical home for documentation. But of course - if there are already other docs there OR your framework would do something funky if it'd encounter the new folder there - then move it to an appropriate place, perhaps at a different layer of the directory tree, or name it differently - eg. `<project root>/dev-docs/` perhaps?

2. Once that is DONE, check out the files in the `/references` folder of this repo. Each one of this is a template and can be used to set up the documentation pyramid. I recommend copying those and adapting them for the project.
 
This is the pyramid itself:

    index.md                - the central dispatch - both instructions & index of the documentation pyramid
    l1-vision.md            - L1 document template
    l2-architecture.md      - L2 document template
    l3-modules.md           - L3 document template
    l4-operations.md        - L4... you got the point :) 


Optional:

    Glossary.md             - OPTIONAL: a DDD - style ubiquitous language glossary. Recommended: ADD if your team / agents don't have one yet.
    house-style.md          - OPTIONAL: smol instructions on how to keep the docs tidy & how to write. Use if you don't have a better tech-writer skill or instructions available already.
    adr/                    - OPTIONAL: use if you or the user wants to use adrs and don't have a good place for them too. Otherwise: you can also just reference the ADRs in the index.md and point the agents there, there.


3. Find the best ways to integrate the pyramid for this team.

#### 1. Make the pyramids' index.md file known to the agents.

I recommend putting it into your projects AGENTS.md / CLAUDE.md / WHATEVER.md file you use.

I'd actually recommend importing the file because I think this is so valuable and it shouldn't be optional:

This works in Claude Code:

```
@docs/index.md
```

Otherwise, if imports don't work, i'd put it something like this, rather to the top of your AGENTS.md (or corresponding file):

```
## Documentation Pyramid
Load @docs/index.md !
```

#### 2. Devise a strategy on how to make sure that the docs get READ before an actual IMPLEMENTATION OR CODE SCANNING / PLANNING / ARCHITECTURAL ANALYSIS:

- If there are workflows on HOW stories / plans are prepped / written BEFORE implementation - the prepping agent(s) should, as PART OF THE STORY WRITING WORKFLOW, scan the documentation pyramid and follow the following system:

    "Choose at least one section from each level L1 to L3 to read for the task at hand, more if more are relevant. L4 is optional, depending on the task. Each layer stands alone. The index.md list the sections of each file."

- If there is just one skill or particular skills and an LLM is doing the work standalone: Let itself follow the same algorithm:

  "Choose at least one section from each level L1 to L3 to read for the task at hand, more if more are relevant. L4 is optional, depending on the task. Each layer stands alone. The index.md list the sections of each file."

See where these commands should be anchored around your system and add them where you think they have the most leverage.

#### 3. Devise a strategy on WHEN and HOW TO UPDATE the docs after each implemented change.

Does the currently established workflow have a good attachment point for this?

Eg:

- in the story writing process - as an additional task / closing task for the implementing agent
- OR: after the implementation & before the finalization / review phase of the currently implementation task

so - either a script that's writeen for each story - i think that's probably better - or as part of the workflow.

- if possible: as a separate step AFTER implementation but BEFORE the final review.
  - if possible: with a fresh agent using a tech writer skill & with knowledge of the documentation pyramid of course.

Otherwise: perhaps as a new extra step between implementation and review / finalization.

- make three suggestions on where this might fit well
- choose your OWN FAVORITE / the one you think might be best
- suggest that to your human, if applicable.

#### 4. Any strays?

- Workflow documentation / process documentation: does anything ELSE have to be updated to mention the pyramid documentation process? 
- PR templates - should they include checkboxes for "Documentation Pyramid updated" or "I reviewed the Documentation Pyramid" or something like that?

- Review scripts / agents - should they check the changes to the documentation pyramid perhaps? Have any changes which should become part of the pyramid been missed? Or does the pyramid need some maintenance perhaps?

4. Documentation transfer

OK! WHERE ARE WE AT!

YOU GOT AN EXISTING SYSTEM. AND YOU GOT A GREAT _NEW_ DOCUMENTATION SYSTEM TOO!

BUT! The new system - we gotta FILL IT UP! We have to 

- seed it so we are off to a good start and 

- PERHAPS - if we have, in our system or outside, somewhere - 

existing documentation. Howtos. Scripts / helpers. Explanations.

Documentation. Technical. Architecture notes. Diagrams. Decision Records.

ANYTHING that can lead us to a CURRENT and USEFUL documentation of the system.

We need to FIND IT! And then CONSOLIDATE IT! And WRITE IT! INTEGRATE IT!

-> Soo... the existing docs need to be found & scanned and transferred into our new structure!

The Glossary (optional) and the pyramid need to be filled out.

Level 3 modules should correspond, in words, to the modules and architecture description from Level 2, language wise, where possible.

SOOO - PLAN / make a plan for how to integrate the docs into the new format.

ASK / THINK / SUGGEST - should the existing docs be dissolved & migrated into the new pyramid documentation system? MY SUGGESTION IS: YEAH - One single source of truth is the main argument.

If there's other things needing the docs or you want to perhaps include forward references to the docs' new home in the previous locations, so be it - but i'd recommend TRYING to commit to the new structure.

The nice thing is - once you have it - you know the saying - a place for everything - and everything in it's place.

I'd recommend doing a research round and putting this into a temporary file - and talking this through with your friendly operator, if applicable, before you go in and start renovating the place :) 


5. Decide on the implementation plan

Make a plan, think this through. Then, present this to the reviewer - if a human is in the loop - or otherwise, if you have an explicit go signal - GO! :)

OR perhaps you have to call a separate skill based on the plan - then do that and/or suggest the corresponding steps to your operator. You know the drill! Do as you know best to get this done, with the necessary oversight. 

I'd recommend also confirming the doc moving plan in the same session too and if everybody's happy with that, start with that in the next step! Also perhaps: you could do a commit between creating the new structure and consolidating the docs.

PRO TIP: After consolidating, let a review agent check that no important documentation got left behind! Happens to the best of us! :)  

OPTIONAL / PRO TIP II:

If there ISN'T a good architecture & other documentation anywhere - perhaps a next round after consolidation could run an architect through the system to CREATE the missing docs - and discuss them with the user - perhaps he'll be surprised on what's in there, or how it's implemented! Good stuff!


6. Implement!

Just follow the plan you just did.

Perhaps you should start with

- creating the new directory
- transferring the files from our references/ directory here to your machine and customizing them to your project.

- Perhaps creating a snapshot commit then

- then: consolidating the docs, if any exist.

- After done: CONGRATULATE THE USER! Show him an ascii-cake in the shape of a pyramid!

Tell him how it went & ask him to review it & give it a go! 

IF there isn't a lot of documentation, suggest to launch an architect skill (if you don't have one: Give it your best shot!) to create the architecture docs and the first module docs where appropriate.

Perhaps also suggest creating operational L4 docs of things that seem to be happening a lot - commits, merges, server start / stop, running the tests etc.

----

THAT'S IT! GREAT JOB!!!

Show another ascii art image of a happy dog strolling along a beach with the sun going down perhaps :) .


## FAQ:

- Q: Is this cake?
- A: no.
