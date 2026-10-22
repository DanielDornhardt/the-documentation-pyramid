---
name: refresh-pyramid
description: Check and refresh the routing table of a documentation pyramid (a docs folder with a root index.md, layer files like L1-vision.md and L3-modules.md, and pyramid:begin marker lines) with docs/tools/refresh-pyramid.js. Use only when the project has such a docs folder and it was edited (before committing documentation changes), or when asked to refresh, check, lint or update the pyramid index, routing table, bylines or module line numbers, to split a long section out, or to migrate a layer folder that has its own index.md.
---

# Refresh the documentation pyramid index

The tool is `docs/tools/refresh-pyramid.js` (one file, Node 20.11+, no dependencies). Full reference: `docs/tools/refresh-pyramid.md`. If `docs/tools/refresh-pyramid.js` is not in the project, say so and ask the user to copy it from the documentation pyramid repository (`references/tools/`) to `docs/tools/`; do not write your own. The docs folder is `docs` unless the project says otherwise; if the layout is unclear (no `docs/index.md`, no `L<n>-*.md` files, several candidates), ask which folder is the pyramid before running anything.

## Step 1: check

```sh
node docs/tools/refresh-pyramid.js docs --check --json
```

Read `stale` and `findings` (each has `severity`, `code`, `file`, `line`, `message`, `fix`). Exit 0 means the index is current and there are no errors. `info` findings are notes and counts only. This step never writes.

## Step 2: explain and fix

If `stale` is true or findings exist, explain each one in plain words (file, line, what it means, what to do). Then:

* Fix errors by editing the document that is wrong. Never delete content without saying so first.
  * E2 (module in two places): see step 4 for the usual case; otherwise the user decides which copy stays.
  * E3 (broken marker lines or an unclosed code fence in index.md), E6 (hand-written pointer with a path or anchor to something that is gone), E5 (byline over twice the limit): edit the lines named in the finding.
  * E4, E8, E9, E10, E11 (index missing, symlink out of the docs folder, unreadable file, layer not fully read so its table was left unchanged, index too big): these need a human fix of the file or permissions named in the finding; report them and stop.
  * E7 (layer without a marker block) and S1 (stale table) are cured by the write run below.
* Warnings W2 and W3 (missing or long byline): propose a one-sentence first paragraph under the heading (at most 140 characters) and apply it if the user agrees. A leading label such as "Purpose." is skipped by the tool, so the sentence after it is the byline. W9 is a bare file name in the hand-written index that exists nowhere in the docs folder; it is often a repository file such as a README, so mention it and move on.
* Refresh the table:

```sh
node docs/tools/refresh-pyramid.js docs
```

On a first run for an index without marker blocks, this appends the missing blocks under a `## Routing table` heading, outside any existing marker pair. Tell the user before running it, and afterwards look at the I2 note: hand-written routing tables that stay in the index now duplicate the generated ones, and the user decides what to remove.

Then run step 1 again. Repeat until `--check` is clean, or only warnings remain that the user accepts. Otherwise the write run rewrites only the generated blocks between the `pyramid:begin` and `pyramid:end` marker lines, and does nothing when nothing changed.

## Step 3: W1 (section longer than 100 lines)

Propose the split with the exact argument from the finding's `fix` field, and show the preview first:

```sh
node docs/tools/refresh-pyramid.js docs --split "L3-modules.md#sync-system" --dry-run
```

Run it for real (same command without `--dry-run`) only after the user agrees. It moves the section to `L3-modules/sync-system.md`, leaves no summary behind, refreshes the table, and lists other documents that still link to the old anchor and reference definitions that ended up on the other side of their links. Fix those by hand, or offer to. It refuses on a dirty git tree for the files it touches: commit or stash first, and use `--force` only if the user asks.

## Step 4: E1 (index.md inside a layer folder)

Propose the migration, preview first:

```sh
node docs/tools/refresh-pyramid.js docs --fix-layout --dry-run
```

Run it without `--dry-run` only after the user agrees (same git rules as step 3). It renames `L3-modules/index.md` to `L3-modules.md` and rewrites relative links; it lists links it could not resolve. If a layer file already exists, the E1 fix says to merge by hand instead. Afterwards run the write mode, then step 1.

Expect one E2 per module when the old folder index held a summary section per module file. The deterministic recommendation: the file is the module, so the summary section goes. Show the user the list of E2 findings (the `fix` field names the section and its line range), propose deleting all of those sections in one go, ask once, then delete them from the layer file (bottom to top, so line numbers stay valid) and run the write mode. A section that holds more than a summary is merged into the file first.

## Step 5: report

Say what changed in the index (which layers, which rows or line numbers), which files you edited, and what remains (open findings with codes, or "clean"). Mention anything you did not run.
