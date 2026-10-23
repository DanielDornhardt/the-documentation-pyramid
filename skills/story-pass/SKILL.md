---
name: story-pass
description: Read a codebase for its ideas and write down how it is modelled and why, into the documentation pyramid (L1, L2 and the L3 modules), then check the claims against the code. Use when installing a documentation pyramid into an existing project, when asked to deepen, explain or re-check the story or design ideas of a module or of the whole project, or when the pyramid's explanations may have drifted from the code. Not for routing-table upkeep (use refresh-pyramid for that).
---

# Story pass

The aim is the story inside the code: how the thing is modelled and why it is shaped this way, so that a person or an agent changing it keeps the design consistent. It is not an index, a dependency graph or a file inventory. It is the 20% of text that explains 80% of the code. Write it into the documentation pyramid (`docs/` unless the project says otherwise), following `docs/house-style.md`.

## Modes

* **Whole project.** Used at install: fill L1 and L2, and the L3 modules.
* **One area.** Deepen one module or part: run the questions below for that area only, and edit its L3 text (and L2 where the answer changes the big picture).
* **Check only.** Do not write. Take the explanations that already exist (ideas, whys, traps, recipes), verify them as in "Check your claims", and report what is wrong.

## Read

Read the entry points, the central headers or types, the build files, the tests (they show intended behaviour), and the comments and commit messages near the oldest and most-changed code. If there is no history, use comments, doc files and changelogs, and say in the docs that this is where the reasons come from. Take notes as you read.

## Ask

Answer these in a sentence or two each, with a file path as evidence. Skip a question that does not apply (not every module has a story) or that the project cannot answer.

1. **Core nouns.** What are the five to ten things this system is made of, and which one is the center? Use the code's own names.
2. **The central trick.** Which one decision makes the rest cheap or possible?
3. **Refusals.** What does the code deliberately not do, not allow or not abstract? The design shows most clearly in what it leaves out.
4. **Seams.** Where does one idea hand over to another (a boundary, a conversion, a lifecycle step), and what is paid there?
5. **Drift.** Where do the idea and the code disagree today? Each case is a trap candidate: what someone would change, what would break, how they would notice.
6. **Vocabulary.** Which words does the code use for the ideas? Use them in the docs, and put the ones that carry meaning in the glossary.
7. **The why.** What do comments, commit messages and changelogs say about the reasons? Quote or cite them. A reason you infer is marked inferred; a reason you cannot find is left out.

## Write

* L1 and L2 carry the big picture: the nouns, the central trick, the refusals, the seams.
* Weave the answers that concern a module into its L3 text as plain prose, without labels. Say where it lives and what is special about it; do not explain what readers already know.
* Keep it short. If an answer needs more than a paragraph, it is two ideas: split them.
* A module tree is welcome where it helps: names with one-line pointers, never the main content.
* Never invent a reason. Cite it, mark it inferred, or leave it out.

## Check your claims

1. For every claim, open the path you cited and confirm it says what you wrote.
2. Pick the five claims you are least sure of. Give them, and only them, to a second agent that has not seen your notes, with the instruction to try to refute each one against the code and to answer "refuted" when unsure. If you cannot start a second agent, do the same yourself in a fresh pass and say so.
3. Fix or drop what fails. Keep the corrections in the docs; do not keep a second version.

## Finish

Run the refresh tool (`node tools/refresh-pyramid.js docs`) and fix what it reports. Report to the user: which mode ran, what was written, which claims were checked and which were corrected, and what you could not verify.
