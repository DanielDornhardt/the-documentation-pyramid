# Samples

Two example documentation pyramids, so you can see what the format looks like on real code and try the [viewer](https://github.com/DanielDornhardt/the-documentation-pyramid-viewer) on something.

| Sample | Project | Layers |
| ------ | ------- | ------ |
| [`lua/`](lua/index.md) | The Lua interpreter (C source) | L1 to L4, 11 modules |
| [`nethack/`](nethack/index.md) | NetHack (C source) | L1 to L4, 13 modules |

```
node viewer.js serve samples/lua --skin metal      # in a clone of the viewer repository
```

## Exports

Each sample has an `exports/` folder with ready-made output of the viewer, so you can look at a pyramid without installing anything:

| Folder or file | What it is |
| -------------- | ---------- |
| `exports/html/` | The pyramid and tree views as static pages, in the light and the metal skin (`light/`, `metal/`), with a skin switcher in every page. Open `exports/html/index.html`. |
| `exports/<name>-docs.md` | All layers in one Markdown file with a table of contents. Its links use plain heading names, so it works in GitHub's viewer and in editor previews. |

**Looking at the HTML.** GitHub shows an HTML file in a repository as source text. Download the repository (or the folder) and open `index.html` in a browser; it needs no server.

**Regenerate** them with the [viewer](https://github.com/DanielDornhardt/the-documentation-pyramid-viewer) after a change:

```
node viewer.js export samples/nethack samples/nethack/exports/html --view both --skins light,metal
node viewer.js markdown samples/nethack samples/nethack/exports/nethack-docs.md --toc --anchors headings --force
```

The viewer ignores the `exports/` folder, so these files never feed back into the pyramid.

## Licence

The sample documentation is under this repository's MIT licence. The projects it describes have their own licences: Lua is MIT, and NetHack uses the NetHack General Public License. The samples contain descriptions, short quoted comments and ASCII diagrams, no copied source files.

## How they were made

An AI agent installed the pyramid into a snapshot of each project by following [INSTALL.md](../INSTALL.md), the regular first pass. Then one agent per module dug into the code with the `code-module-deep-dive` skill, and a technical writer agent integrated what was worth keeping (see the optional deep dive in INSTALL.md).

## Read them with the right expectations

* **Built from one snapshot, not grown.** A real pyramid fills up over the course of development, one decision and one gotcha at a time. These were written in a single session from a single commit. Yours should end up richer.
* **Unofficial and unverified.** They are not made by or affiliated with the projects. Claims cite files and were checked by a second agent against the code, but nothing was built or run, and errors remain possible. Where something is inferred, the text says so.
* **Reasons are thin.** The snapshots have no commit history, so the "why" comes from comments and doc files only.
* The files are generated examples: the folders here are plain output of the install, not curated by hand.
