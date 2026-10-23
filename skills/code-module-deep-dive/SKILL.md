---
name: code-module-deep-dive
description: Investigate one module or area of a codebase and report what is worth knowing about it that the code does not say at a glance - the ideas behind its design, the principles its authors state or defend, refusals, traps, and claims in existing docs that are wrong - as findings in a file for someone else to use. Use when asked to deep-dive, dig into, explain or fact-check how a specific part of a codebase is built and why. Works with or without a documentation pyramid. It only reads the code; it never edits documentation.
---

# Code module deep dive

You are given an area of a codebase: a module, a subsystem, a directory, or a set of files. Your job is to sift through the code and report what a person or an agent should know before changing it. You return findings in a file. You do not write or edit documentation: someone else (a technical writer, the owner, another agent) reads your file and decides what goes where.

## Input

* The area: a name, directories or files.
* Optional: the project's documentation (for example a documentation pyramid, starting at its `index.md`). Use it only to find your way around and to read what is currently written about the area. Do not edit it.
* Optional: where to write the findings file. Default: `<area>-findings.md` in the current directory.

Work the same way with or without documentation.

## Read

Read the code itself. Start with the entry points, the central headers or types, the build files and the tests (they show intended behaviour). Then read the implementation of the central pieces in full: the functions that carry the main flow, the core data structures and where they are changed. Skim the rest of the area enough to know what it does.

Hunt for what the authors wrote down. Comments that explain why are the best source: look at file and block headers, and search for words like `must`, `never`, `always`, `invariant`, `assume`, `careful`, `hack`, `workaround`, `XXX`, `TODO`, `FIXME`, `NOTE`, `WARNING`, and for comments that name another file. Read the commit messages near the oldest and most-changed code. If there is no history, use comments, doc files and changelogs, and say so in the findings.

Take notes as you read: each note is a claim and the path it rests on.

## Ask

Answer these with a file path as evidence. Skip a question that does not apply or that the code cannot answer.

1. **Core nouns.** What are the things this area is made of, and which one is the center? Use the code's own names.
2. **The central trick.** Which one decision makes the rest cheap or possible?
3. **Refusals.** What does the code deliberately not do, not allow or not abstract?
4. **Seams.** Where does one idea hand over to another (a boundary, a conversion, a lifecycle step), and what is paid there?
5. **Drift.** Where do the idea and the code disagree today?
6. **Vocabulary.** Which words does the code use for the ideas?
7. **The why.** What do comments, commit messages and changelogs say about the reasons? Quote or cite them. A reason you infer is marked inferred; a reason you cannot find is left out.
8. **Declared principles.** What rules, invariants or values do the authors state outright, in comments, assertions, headers, READMEs or contributing guides? Look for strong words and for rules the code enforces with checks or barriers. Quote the rule, cite the place, say what enforces it.
9. **Traps.** What would someone change that looks harmless and breaks something, and how would they notice?
10. **Existing text.** If documentation about the area exists: which of its claims are wrong, outdated or unsupported?

## Judge

Most findings are not worth passing on. Standard patterns and ordinary code need no story, and some areas have almost nothing out of the ordinary. Judge each finding on its own, ideally with a second agent that sees only the list and the cited paths:

* **Surprise.** Would a competent engineer new to this codebase expect it?
* **Cost of ignorance.** If someone changed this without knowing, would it break silently or expensively?
* **Reach.** Does it shape several parts, or only one corner?
* **Durability.** Will it still be true after the next few changes?
* **Findable.** Can a reader see it in thirty seconds from the code? Then it needs no finding.

A principle the authors state outright, or that the code defends with checks or barriers, counts as surprising by definition. Keep what is worth passing on; drop the rest and report only how many you dropped.

## Check your claims

1. For every claim you keep, open the path you cited and confirm it says what you wrote.
2. Give the five claims you are least sure of, and only them, to a second agent that has not seen your notes, with the instruction to try to refute each against the code and to answer "refuted" when unsure. If you cannot start a second agent, do it yourself in a fresh pass and say so.
3. Fix or drop what fails.

## Output

Write one file (see Input). Plain markdown, no emojis. Structure:

* **Scope.** The area, the date, which files you read in full, which you skimmed, which you did not read, and whether the project had commit history.
* **Findings.** One entry per kept finding: a short title, the finding in a few sentences, its evidence (paths and symbols), its kind (principle, central decision, refusal, seam, trap, vocabulary, correction of existing text), and whether it was checked by the refutation pass, checked by you only, or inferred.
* **Corrections to existing text.** If documentation about the area was given: each wrong or unsupported claim, quoted, with what the code says and where.
* **Not verified.** What you could not confirm, and why.
* **Counts.** Findings judged, kept, dropped.

Then reply to the caller with the file path and a five-line summary.
