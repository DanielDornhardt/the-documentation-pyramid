# refresh-pyramid

`docs/tools/refresh-pyramid.js` does two things for a documentation pyramid:

1. It regenerates the routing blocks of the root `index.md` from the documents.
2. It reports problems, each with a message that says what is wrong and what to do.

It never edits a document other than the generated blocks of `index.md`. Fixing a problem is done by hand (or by an agent); the tool then refreshes the index. One file, Node 20.11 or later, no dependencies, reads and writes only inside the docs folder.

```text
node docs/tools/refresh-pyramid.js [docs-folder] [--dry-run | --check] [--max-section-lines N] [--max-byline N] [--help]
```

The docs folder defaults to `./docs`; limits default to 100 lines and 140 characters.

| Mode            | Writes                                    | Exit code                                      |
| --------------- | ----------------------------------------- | ---------------------------------------------- |
| write (default) | `index.md`, only when its content changed | 1 when errors exist                            |
| `--dry-run`     | nothing; prints which blocks would change | 1 when errors exist                            |
| `--check`       | nothing                                   | 1 when errors exist or the index is stale (S1) |

Exit code 2 means a usage error or an unreadable folder (one message, no stack trace). Warnings never change the exit code. In every mode the findings are printed, one per line, plain text:

```text
error E1 L3-modules/index.md: folder index inside a layer folder ... (fix: move its content into L3-modules.md ...)
warning W1 L3-modules.md:120: "Sync system" is 135 lines, over the limit of 100 (fix: ...)
```

## The layout it knows

```text
docs/
  index.md             routing table, with generated blocks
  L1-vision.md         one FILE per layer: L<n>-<name>.md
  L3-modules.md        one "#" title, every module a "##" section, its sections "###"
  L3-modules/          optional: broken-out modules, files directly in it
    overdue-notices.md no "#" title: starts at "## Overdue notices"
  adr/                 optional: one file per decision
```

The heading levels are the same everywhere, so moving a module between the layer file and its folder is a cut and paste. These layout and heading rules belong to the house style of the pyramid; the tool only checks them. Routing lives in the root `index.md`, so a folder `index.md` inside a layer folder is an error (E1).

## The generated blocks

The root `index.md` has one block per layer (and `adr`) between marker lines on their own lines. The id is the stem of the layer file or folder.

```markdown
<!-- pyramid:begin L3-modules -->

| Module | Where | What |
| --- | --- | --- |
| Loan desk | `L3-modules.md#loan-desk` (line 11) | The loan desk records which item leaves with which member. |
| Overdue notices | `L3-modules/overdue-notices.md` | Overdue notices are produced by the nightly job. |

<!-- pyramid:end L3-modules -->
```

* Rows: the `##` sections of the layer file in document order (with anchor and current line number), then the broken-out files in byte order of their names (file path only). `adr` lists its files. A layer with nothing to list gets `_No modules yet._`. Pipes in a cell are escaped.
* Text outside the markers is never touched. The rewrite is idempotent, keeps line endings and a BOM, and goes through a temp file and a rename.
* A layer without markers gets its block appended to the end of `index.md` in write mode, under a `## Routing table` heading that is created if missing; this is reported as a note. In `--check` and `--dry-run` it is only reported (E6).
* If a layer cannot be read (E7), its existing block is left untouched. Symbolic links are skipped, never followed, and said once.

## Findings

| Code | Meaning                                                                                                                        | Fix                                                                                                                              |
| ---- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| E1   | A folder `index.md` inside a layer folder.                                                                                     | Move its content into the layer file, break out only long sections as `##`-first files, delete the folder index.                 |
| E2   | The same module title (compared by slug) twice in one layer: section and section, section and file, or file and file.          | Keep one copy.                                                                                                                   |
| E3   | Broken markers: begin without end, end without begin, duplicate id, end before begin. Nothing is written.                      | Repair the marker lines.                                                                                                         |
| E4   | Root `index.md` missing.                                                                                                       | Create it.                                                                                                                       |
| E5   | A byline longer than twice `--max-byline`.                                                                                     | Shorten the first sentence.                                                                                                      |
| E6   | A layer has no markers (a note in write mode, which adds them).                                                                | Run write mode, or add the marker lines.                                                                                         |
| E7   | The documents of a layer could not be read; its block is unchanged.                                                            | Fix the permissions, run again.                                                                                                  |
| W1   | A `##` section longer than `--max-section-lines`.                                                                              | Move it to its own file in the layer folder starting at its `##` heading; never cut detail to get under the limit; run the tool. |
| W2   | A module without a byline.                                                                                                     | Write one sentence under the heading.                                                                                            |
| W3   | A byline longer than `--max-byline`.                                                                                           | Shorten it.                                                                                                                      |
| W4   | A sub-folder inside a layer folder (not scanned).                                                                              | Move its files up or break them out one level.                                                                                   |
| W5   | A broken-out file that does not start at its `##` title (starts with an H1, text or no heading) or holds a second `##` module. | Start the file at `## Title`; give a second module its own file.                                                                 |
| S1   | The index is stale (`--check`, `--dry-run`).                                                                                   | Run write mode.                                                                                                                  |

Info lines (`info L3-modules: 14 sections, 3 broken out`) give counts per layer.

## Scanning rules and limits

* Files are read as UTF-8; a BOM is ignored, CRLF is read as LF, and a leading front matter block (`---` to `---`) is skipped.
* A heading is an ATX heading (`#` to `######` and a space) at the start of a line outside fenced code (three backticks or tildes). Setext headings and headings in block quotes, lists, HTML comments or HTML blocks are not seen.
* A section runs from its `##` heading to the line before the next `##` heading, or the end of the file.
* The title is the heading text with links reduced to their text and emphasis and code marks removed. The anchor is the heading slug (lowercase, Unicode letters and digits kept, other punctuation removed, spaces to hyphens); duplicates in one file get `-1`, `-2`. Headings of levels 1 to 4 count for numbering. Numeric entities and `&amp; &lt; &gt; &quot; &apos; &nbsp;` are decoded for the slug; other named entities are not.
* The byline is the first sentence of the first paragraph under the heading, before any other heading. Blank lines and HTML comment lines before it are skipped; a leading bold label such as `**Purpose.**` is skipped. A paragraph that starts with a list marker, table, quote or code fence has no byline. A sentence ends at the first `. `, `? ` or `! `, or at the end of the paragraph. The paragraph also ends at a line that starts a list, table, quote or fence.
* The first `. ` also ends a sentence after "e.g."; the fix is a better first sentence.
* The title of a broken-out file is its first heading of level 1 or 2; a file with no heading is named after its file name.
* Lines count from 1; the line number in the index is the line of the heading in the file, front matter included.
* Not verified: behaviour on Windows; files with lone CR line endings.

## Wiring `--check`

As a git pre-commit hook (`.git/hooks/pre-commit`, executable):

```sh
#!/bin/sh
node docs/tools/refresh-pyramid.js docs --check || {
  echo "docs index is stale or has errors: run node docs/tools/refresh-pyramid.js docs --dry-run" >&2
  exit 1
}
```

As a Claude Code `PostToolUse` hook in `.claude/settings.json` (a recipe: it has not been tried in a live session). It blocks the edit with exit code 2 while the check fails:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "node docs/tools/refresh-pyramid.js docs --check > /dev/null 2>&1 || { echo 'docs index is stale or has errors: run node docs/tools/refresh-pyramid.js docs --dry-run' >&2; exit 2; }"
          }
        ]
      }
    ]
  }
}
```

## Copying the tool

The single file can be copied into any project. It imports nothing else.
