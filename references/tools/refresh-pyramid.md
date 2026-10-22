# refresh-pyramid

`docs/tools/refresh-pyramid.js` keeps the routing table of a documentation pyramid in step with the documents, and checks the pyramid against the layout conventions below.

* One file, Node ES module, no dependencies, stable Node APIs only. Works on Node 20.11 and later.
* It does not depend on any other tool. See "Copying the tool" at the end.
* It never runs anything from the docs, never touches the network, and reads and writes only inside the docs folder.

```text
node docs/tools/refresh-pyramid.js [docs-folder] [options]
```

The default folder is `./docs`.

## The conventions it checks

A documentation pyramid is a folder with a root `index.md`, one file per layer, and optionally one folder per layer.

```text
docs/
  index.md              the routing table that agents read first
  L1-vision.md          one FILE per layer: L<n>-<name>.md
  L2-architecture.md
  L3-modules.md         one "#" title, modules as "##" sections
  L3-modules/           only modules that grew past about 100 lines
    overdue-notices.md  no "#" title: starts at "## Overdue notices"
  L4-operations.md
  adr/                  one file per decision, listed in the root index
```

1. A module lives in exactly one place: a `##` section of the layer file, or a file in the layer folder, never both. When a module is broken out, nothing is left behind in the layer file (no summary, no pointer).
2. There is no `index.md` inside a layer folder. All routing lives in the root `index.md`.
3. The root `index.md` gives every module a short description and a pointer. For a section, the pointer is the layer file path with the section anchor and its current line number. For a broken-out module, it is the file path.
4. Heading levels are the same everywhere. A layer file has one H1, the layer title. Every module in it is an H2 and its own sections are H3. A broken-out file has no H1: it starts at the module's H2 (the same text and level as in the layer file) and its sections stay H3. Moving a module between the layer file and the folder is a pure cut and paste, and no tool changes a heading level when it moves or combines text. Other documents (`index.md`, a glossary, a house style page, the decision records in `adr/`) are ordinary documents with one H1.
5. The decisions folder `adr/` is special: one file per decision, listed in the root index, no layer file needed, and an `index.md` or `README.md` there is allowed.

What the tool recognises:

* Layer files: top-level files named `L<n>-<name>.md`. Layer folders: top-level folders named `L<n>-<name>`. The layer id is the stem, for example `L3-modules`. A layer may have a file, a folder, or both. Layers are ordered by number, then `adr`.
* Hidden files and folders and `node_modules` are ignored. Sub-folders inside a layer folder are not scanned (W4).
* A section is a level-2 heading (`## text`, closing hashes allowed) outside fenced code (backticks or tildes), outside front matter, outside an HTML comment that starts at the beginning of a line, and outside a block-level HTML element (`<div>`, `<table>`, ...; it ends at the next blank line). A heading inside a block quote or a list item is not a heading for the tool. It runs to the line before the next level-2 heading, or to the end of the file. Its length is that number of lines, so `###` sub-sections belong to their section.
* The anchor is a slug: lowercase, entities decoded, punctuation removed, spaces to hyphens, Unicode letters and digits kept. Duplicate headings in a file get `-1`, `-2` in document order. All heading levels are counted for this. Only ATX headings (`## text`) are recognised, not underlined ones.
* The line number is the 1-based line of the heading in the file. CRLF line endings and a BOM are handled.

## The byline rule

The byline is the single source of the description in the routing table: the table copies it and the tool never invents text.

* For a section: the first sentence of the first paragraph directly under the heading, before any further heading.
* For a broken-out file: the first sentence of the first paragraph under its `## ` module title, or the `summary:` line in the front matter. The front matter value wins. The module title of a broken-out file is its first heading of level 2. A level 1 heading is accepted as a legacy title only when no `##` comes before it (W10 reports it). Text before the title heading is not part of the byline. A file without any such heading takes its title from the file name.
* For a decision record: the first sentence of the first paragraph under its `# ` title, or the `summary:` line. Decision records are ordinary documents, so their title is the first level 1 heading.
* A sentence ends at the first `. ` (period and space), or at the end of the paragraph. Links are replaced by their text, emphasis and code marks are removed, HTML comments are removed, whitespace is collapsed.
* A paragraph that starts with a list, a table, a code block, a quote or a block-level HTML element has no byline. A paragraph ends early at a list item (a bullet, or a number starting at 1), a quote, a code fence, a rule or a reference definition line; so "Intro text" followed directly by a list gives "Intro text". Inline HTML such as `<span>` is removed and its text kept.
* A leading label is not the byline. A bold label such as `**Purpose.**` or `**Purpose:**`, or a plain label from a short list (Purpose, Summary, Overview, Role, Scope, Context, Description, Responsibilities, Goal, Intent, Decision, Problem, Background, Note, Definition), is skipped and the sentence after it is used. In a decision record, a leading `Status:` or `Date:` line is skipped. If the first sentence ends in a colon (a lead-in to a list), there is no byline (W2).
* Images are dropped with their alt text. Inline links, reference links (`[text][ref]`, `[text][]`) and footnote marks (`[^1]`) keep only their text; a bare `[text]` shortcut link is left as written. Link destinations may contain balanced parentheses.
* The limit is 140 characters (`--max-byline N`). A byline over the limit is a warning (W3); over twice the limit it is an error (E5). A missing byline is a warning (W2).

Why 140 characters: the old Twitter length is enough to say what a module is and what it is for, for example "Sync back- and frontend, legacy databases, and address confabulator implementation". A routing table is read by an agent that must decide, from the table alone, which file to open. A byline longer than a tweet is usually a list of contents rather than a definition, and a table with long cells is hard to scan. The limit is a nudge, not a law, so the first overrun is a warning.

Known limits of the rule: the first `. ` also ends a sentence after "e.g." or "Dr.". A plain label that is not on the short list ("Remember. The module...") is taken as the first sentence. Intra-word asterisks are treated as emphasis, as in CommonMark (`2*3*4` becomes `234`). Entities such as `&amp;` are decoded in the Module column. Both are visible in the table, and the fix is to write a better first sentence.

## The generated blocks in the root index

The root `index.md` carries one block per layer, between marker lines that sit on their own lines. The layer id is the stem (`L3-modules`), and `adr` for decisions.

```markdown
## Routing table

<!-- pyramid:begin L3-modules -->

| Module | Where | What |
| --- | --- | --- |
| Member cards | `L3-modules.md#member-cards` (line 5) | Members get a numbered card that is scanned at the desk. |
| Loan desk | `L3-modules.md#loan-desk` (line 11) | The loan desk records which item leaves with which member and when it is due. |
| Overdue notices | `L3-modules/overdue-notices.md` | Overdue notices are produced by the nightly job and sent by email or printed for the desk. |

<!-- pyramid:end L3-modules -->
```

* Everything between the markers is generated. Rows are in this order: layer file sections in document order, then broken-out files by file name.
* Pipe characters in a cell are escaped. A missing byline gives an empty What cell. A layer with nothing to list gets the text `_No modules yet._`.
* Text outside the markers is never touched. Markers are never moved or duplicated.
* The rewrite is idempotent (a second run changes nothing), atomic (temp file in the same folder, then rename), keeps the line endings of the file (also mixed ones) and a BOM, and writes only when the content changed.
* A layer that could not be read completely (E8, E9 or a file over 5 MB in the layer file or folder) is error E10: its block is left exactly as it is, so a routing table is never replaced by "No modules yet" because of a permission or size problem. Fix the file and run again.
* An `index.md` that ends inside an unclosed code fence is error E3, and nothing is written (blocks appended inside a fence would never take effect). A rewrite that would make `index.md` larger than 5 MB is error E11 and is not written.
* A layer without markers is error E7. In write mode the tool appends the missing blocks, each under a `### <layer id>` heading, to the `## Routing table` section (it creates that heading at the end of the file when it is absent). Unbalanced, nested or duplicated markers are error E3, and then nothing is written.
* Hand-written parts of the index may mention documents in backticks, for example `` `L3-modules.md#loan-desk` ``. If such a pointer with a path (`L3-modules/gone.md`) or an anchor (`L3-modules.md#gone`) no longer exists, that is error E6. A pointer written from the repository root (`docs/...`) is accepted. A bare file name without a folder or anchor (`testing.md`) is looked up in the docs folder and every folder below it; found anywhere, it is fine. If it is found nowhere, it is only warning W9, because prose often names repository files outside the docs folder such as `README.md`.
* On a first run for an index that already has a hand-written routing table, the appended blocks sit next to it. The tool cannot tell which hand-written rows are now redundant, so it prints the info note I2 with the line range of the table rows outside the blocks. Review them and remove what the generated tables replace.

## Modes

| Mode            | Command                   | Writes                             | Use it for                                   |
| --------------- | ------------------------- | ---------------------------------- | -------------------------------------------- |
| write (default) | `node docs/tools/refresh-pyramid.js docs` | the generated blocks of `index.md` | after editing docs, to refresh the table     |
| dry run         | `--dry-run`               | nothing                            | to see the diff of `index.md` before writing |
| check           | `--check`                 | nothing                            | in a pre-commit hook, CI, or an agent loop   |

Options:

| Option                    | Meaning                                                                                                                                                                                                        |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--json`                  | Machine-readable report on stdout: `{stale, changes, findings: [{severity, code, file, line, message, fix}], layers: [{id, file, dir, sections, brokenOut}]}`. Write mode adds `written`, dry run adds `diff`. |
| `--strict`                | Warnings count as failures for the exit code.                                                                                                                                                                  |
| `--max-section-lines N`   | Longest section before W1 (default 100).                                                                                                                                                                       |
| `--max-byline N`          | Longest byline before W3, error over twice N (default 140).                                                                                                                                                    |
| `--split "<file>#<slug>"` | Opt-in refactor, see below.                                                                                                                                                                                    |
| `--fix-layout`            | Opt-in migration, see below.                                                                                                                                                                                   |
| `--fix-headings`          | Opt-in migration of broken-out files that start with `# `, see below.                                                                                                                                          |
| `--force`                 | Override the clean git tree safety of the three refactors.                                                                                                                                                       |
| `--help`                  | Usage.                                                                                                                                                                                                         |

Text output is plain: one finding per line, `error E1 L3-modules/index.md:1 message (fix: ...)`, no colours, no emojis. `--check` and `--dry-run` cannot be combined, and neither can be combined with the three refactors (`--dry-run` can), and the refactors cannot be combined with each other.

## Exit codes

| Code | Meaning                                                                                                                                                                   |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | Fine. For `--check`: the index is up to date and there are no error findings (and no warnings with `--strict`). For write mode: the write succeeded and no errors remain. |
| 1    | Findings or a stale index, according to the mode.                                                                                                                         |
| 2    | Usage error or I/O error, including a refused refactor. A one-line message on stderr, never a stack trace.                                                                |

A dry run exits as write mode would: 0 when the write would succeed and leave no errors.

## Findings

Codes are stable. Severity is `error`, `warning` or `info`. Errors fail `--check`; warnings fail only with `--strict`.

| Code | Severity                   | Meaning                                                                                                                                                                            | Fix                                                                                      |
| ---- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| E1   | error                      | An `index.md` inside a layer folder (not in `adr/`).                                                                                                                               | `--fix-layout`; when the layer file already exists, merge by hand and delete the folder index. |
| E2   | error                      | The same module as a section and as a file in the layer folder (the slug of the layer file's `##` title equals the slug of the file's `##` title or of the file name), or the same section title twice in one layer file, or the same module title in two files of one layer folder. | The finding names the section and its line range: delete it if it only summarises the file, else merge it into the file first. |
| E3   | error                      | Broken markers: unbalanced, nested, duplicated, mismatched, or `index.md` ends inside an unclosed code fence. Nothing is written.                                                                                                    | Fix the marker lines.                                                                    |
| E4   | error                      | Root `index.md` missing. It is never created.                                                                                                                                      | Create it with one marker pair per layer.                                                |
| E5   | error                      | A byline longer than twice the limit.                                                                                                                                              | Shorten the first sentence.                                                              |
| E6   | error                      | A hand-written pointer with a path or an anchor (`folder/file.md`, `file.md#slug`, in backticks) that no longer exists.                                                                                           | Correct or remove the pointer.                                                           |
| E7   | error                      | A layer has no marker block in `index.md` (the "missing markers" error). The finding names the exact lines to add.                                                                 | Add the lines, or run write mode, which appends the block.                               |
| E8   | error                      | A path is a symlink that leaves the docs folder, or `index.md` is a symlink. It is not read or written.                                                                            | Replace the symlink with a real file or folder inside the docs folder.                   |
| E9   | error                      | A file or folder cannot be read, or `index.md` is not valid UTF-8 (then it is not rewritten).                                                                                      | Fix permissions or encoding.                                                             |
| E10  | error                      | A layer could not be read completely (see E8, E9, W7 on the same layer). Its block in `index.md` is left unchanged.                                                               | Fix the named file, then run again.                                                      |
| E11  | error                      | The rewritten `index.md` would be larger than 5 MB, which the tool could not read back. It is not written.                                                                         | Reduce the number or length of modules.                                                  |
| W1   | warning                    | A section longer than the limit. The fix is the exact `--split` argument.                                                                                                          | `--split "L3-modules.md#sync-system"`                                                    |
| W2   | warning                    | Missing byline.                                                                                                                                                                    | Add a one-sentence description under the heading.                                        |
| W3   | warning                    | Byline longer than the limit.                                                                                                                                                      | Shorten it.                                                                              |
| W4   | warning                    | A nested folder inside a layer folder (not scanned).                                                                                                                               | Move its modules up.                                                                     |
| W5   | warning                    | A layer folder without a layer file and with a `README.md` as entry point (legacy layout).                                                                                         | Create the layer file.                                                                   |
| W6   | warning                    | A layer file with no `##` sections and no broken-out modules.                                                                                                                      | Add sections.                                                                            |
| W7   | warning                    | A file over 5 MB was skipped.                                                                                                                                                      | Split or exclude it.                                                                     |
| W8   | warning                    | A marker block for a layer that does not exist. It is left alone.                                                                                                                  | Remove the block or restore the layer.                                                   |
| W9   | warning                    | A bare file name in a hand-written part of `index.md` that exists nowhere in the docs folder (it may be a repository file outside it).                                             | Correct the name, or ignore it.                                                          |
| W10  | warning                    | A broken-out file starts with a level 1 heading (the legacy form). The finding gives the exact fix.                                                                                | `--fix-headings`, or change `# Title` to `## Title` and move every other heading one level deeper by hand. |
| W11  | warning                    | A broken-out file does not start with its `##` module title: text, or a heading of another level (for example `###`), comes first. Front matter and HTML comments may come before the title. A legacy `# Title` file gets W10 instead. | Make `## Title` the first thing in the file. |
| W12  | warning                    | A broken-out file has a second heading of level 1 or 2 after its module title (a legacy `# Title` file: a second level 1 heading). That is a second module in one file; sections of a module are level 3. | Give the module its own file, move it into the layer file, or make it a `###` section. |
| S1   | error (not a content code) | The index is stale: a generated block differs from the documents. This is what makes `--check` fail on an out-of-date table.                                                       | Run write mode.                                                                          |
| I1   | info                       | Counts per layer.                                                                                                                                                                  | None.                                                                                    |
| I2   | info                       | Table rows in the hand-written part of `index.md` when blocks were appended; they may duplicate the generated tables.                                                              | Review and remove what is redundant.                                                     |

## The three opt-in refactors

All three refuse to run unless the docs folder is inside a git work tree and the files they would touch have no uncommitted changes (untracked files count as changes). Outside git, or on a dirty tree, use `--force` to override. `--dry-run` shows the result and writes nothing, and skips the git check. A refusal exits 2 and changes nothing. A refactor that fails half way is not rolled back; use git to undo it.

### `--split "<file>#<section-slug>"`

Moves one section of a layer file into `<layer folder>/<slug>.md`, for the case where W1 says a section grew.

* The folder is created. If the target exists, the tool refuses.
* No heading changes level: the module's `##` heading stays `##` and its `###` headings stay `###`. The new file starts at the `##` heading and gets no H1. The text of the section is copied line for line.
* The section is removed from the layer file. No summary or pointer is left behind. A single blank line separates the neighbours.
* The generated blocks are refreshed (if the index cannot be refreshed, the split still happens and the tool says so).
* The tool then lists other places in the docs that still use the old anchor (`L3-modules.md#sync-system`, in links, reference definitions and backticks, and `#sync-system` inside the layer file), so a human can fix them. It does not edit them. Each occurrence is listed, also several on one line.
* Reference-style link definitions (`[label]: url`) move with the section. The tool lists definitions that now sit on the other side of a link that uses them (a link left behind whose definition moved, or the reverse), so they can be fixed by hand.
* `--split --dry-run` prints the line range that would be removed, the first and last lines of the new file (not the whole text) and the full diff of `index.md`.

### `--fix-headings`

Moves broken-out files in the legacy form (they start with `# Title`) to the one rule: every heading of the file goes one level deeper, so `# Title` becomes `## Title`, its `##` sections become `###`, and so on. The module title keeps its text, so anchors, bylines and links do not change.

* Only broken-out files of layer folders whose title heading is a level 1 heading are changed (the files W10 reports). Layer files, decision records, folder indexes and files that already start at `##` are never touched.
* Fenced code (backticks or tildes), front matter, HTML comments and HTML blocks are not headings and stay as they are. Indentation and closing hashes are kept. Line endings (CRLF) and a BOM are kept.
* A file that already has a level 6 heading cannot move deeper. It is refused and listed (`refused <file>:<line> ...`), left as it is, and the other files are still changed; the exit code is then 1. A legacy file with two level 1 headings moves as it is (two `##` modules in one file); W12 then reports the second one.
* The generated blocks are refreshed afterwards (if the index cannot be refreshed, the headings still move and the tool says so).
* Same safety as `--split`: a clean git tree for the files it touches (or `--force`), `--dry-run` shows a short diff of every file and of `index.md`. Setext (underlined) headings are not recognised, so they are not moved.
* `--json` gives `{operation, dryRun, files: [{file, headings}], refused: [{file, line, reason}], indexRefreshed}`.

### `--fix-layout`

Migrates the legacy layout: a layer folder with an `index.md` and no layer file.

* Renames `<layer>/index.md` to `<layer>.md` at the base level (`git mv` inside a git work tree, else a plain rename).
* Rewrites relative links in the moved file so they still resolve: links to siblings get the folder prefix, links with `../` lose it. The same for backticked `.md` paths. Fenced code is skipped.
* Also rewrites `<path.md>` autolinks. A link whose target cannot be percent-decoded cannot be resolved; in the moved file it is listed as unresolved.
* Rewrites links in other docs that pointed to `<layer>/index.md` or to the folder, so they point to `<layer>.md`.
* Reports every rewritten link, every link it could not resolve (target not found, left as written), and every link whose target is outside the docs folder (rewritten by path arithmetic, not verified).
* If a layer file already exists next to the legacy `index.md`, it refuses and explains: merge by hand.
* It does not refresh the routing table. Run write mode afterwards. A migrated folder `index.md` often held a summary section per module next to the module files; after the move those show up as E2. The file is the module, so the usual answer is to delete the summary sections; the E2 finding names each section and its line range. Merge a section that holds more than a summary into the file first.

## Wiring

### Pre-commit or CI

`--check` writes nothing and exits non-zero when the index is stale or errors exist:

```sh
node docs/tools/refresh-pyramid.js docs --check
```

As a git pre-commit hook (`.git/hooks/pre-commit`, executable):

```sh
#!/bin/sh
node docs/tools/refresh-pyramid.js docs --check || {
  echo "docs index is stale or has findings: run node docs/tools/refresh-pyramid.js docs" >&2
  exit 1
}
```

As a CI step (GitHub Actions syntax):

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 20
- run: node docs/tools/refresh-pyramid.js docs --check --strict
```

### Claude Code hook recipe

A `PostToolUse` hook that runs the check quietly after file edits, and speaks up only when something needs attention. This is a recipe, not installed by the repository, and it has not been tried inside a live Claude Code session. Put it in the project's `.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "node docs/tools/refresh-pyramid.js docs --check > /dev/null 2>&1 || { echo 'docs index is stale or has findings: run node docs/tools/refresh-pyramid.js docs --check, then fix or refresh' >&2; exit 2; }"
          }
        ]
      }
    ]
  }
}
```

The check takes a few milliseconds of work plus Node start-up, so the recipe above does not filter by path, and it blocks every edit in the project while any error finding exists, including edits outside the docs. To restrict it to edits under `docs/`, read `tool_input.file_path` from the JSON that the hook receives on stdin and exit 0 early for other paths:

```sh
node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const p=(JSON.parse(d).tool_input||{}).file_path||"";process.exit(/(^|\/)docs\//.test(p)?0:3)})' || exit 0
node docs/tools/refresh-pyramid.js docs --check > /dev/null 2>&1 || { echo 'docs index is stale or has findings: run node docs/tools/refresh-pyramid.js docs --check' >&2; exit 2; }
```

The helper exits 3 for paths outside `docs/`, and the first line then ends the script with exit 0 before the check runs. The two lines were run by hand with sample JSON on stdin (a path inside and a path outside `docs/`); they have not been tried in a live Claude Code session.

## Copying the tool

The single file can be copied into any project. In a pyramid installation it lives at `docs/tools/refresh-pyramid.js`. It needs only Node 20.11 or later.

## What is not verified

* Behaviour on Windows (path separators in findings use `/`; the file system calls were not run there).
* `--fix-headings` was tested on invented fixtures and on a temporary copy of a real documentation folder, not on a Windows machine.
* Setext (underlined) headings and nested lists are not interpreted (a Setext title is not a title for this tool, and `--fix-headings` does not move it); only ATX headings and the inline syntax described above. Reference-style links are reduced to their text in bylines, but `[text]` shortcut links are not recognised.
* Files with lone CR line endings (old Mac style) are read as one line; only LF and CRLF are handled.
* Headings inside an HTML block are recognised by a fixed list of block-level element names, not by the full CommonMark rules.
* The git integration was tested with the git version installed on the author's machine only.
