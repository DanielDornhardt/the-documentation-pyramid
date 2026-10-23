# L3 Modules

<!-- How specific parts work. Read before working in a module.
     One module is one "##" section in this file. Under the heading, write one first sentence of at most 140 characters
     that says what the module is for. The routing table in index.md copies that sentence.
     A module that passes about 100 lines moves to its own file in L3-modules/<name>.md, and its section is removed
     from this file: nothing is left behind, a module has one home. The moved file has no "#" title and starts at its
     "## <Module>" heading, with its sections still "###": cut and paste, no level changes. Do not add an index.md to L3-modules/.
     Delete the example section below when you add the first real module. -->

## {Module}

**Purpose.** {What it does, in one sentence.}

**Motif.** {The one idea or pattern that explains this module, named in a few words. Reuse the name wherever the idea comes back.}

**Why.** {One or two sentences: what the design bought and what it cost. Use the repository's own words, else mark it as inferred.}

**How it works.** {The key mechanics: data flow, main functions, lifecycle. Code-level detail belongs here.}

{DIAGRAM - Add one if the module has more than a few parts, or a schema, state machine or flow worth seeing. Skip it if it would only decorate.}

**Key files.**

| File | Role |
|---|---|
| `{path}` | {what it does} |

**Gotcha.** {One thing that will bite someone: what they changed, what broke, how they would notice. The most valuable part of L3.}
