# Samples

Two example documentation pyramids, so you can see what the format looks like on real code and try the [viewer](https://github.com/DanielDornhardt/the-documentation-pyramid-viewer) on something.

| Sample | Project | Layers |
| ------ | ------- | ------ |
| [`lua/`](lua/index.md) | The Lua interpreter (C source) | L1 to L4, 11 modules |
| [`nethack/`](nethack/index.md) | NetHack (C source) | L1 to L4, 13 modules |

```
node viewer.js serve samples/lua --skin metal      # in a clone of the viewer repository
```

## HTML versions

[`html/`](html) holds static exports of both samples, in the light and the metal skin, each with the pyramid view and the tree view (`lua-light`, `lua-metal`, `nethack-light`, `nethack-metal`). Each folder opens from its `index.html`.

GitHub shows an HTML file in a repository as source text, not as a page. To look at an export, download the repository (or just that folder) and open `index.html` in a browser; it needs no server. Regenerate them after a change with the viewer:

```
node viewer.js export samples/nethack samples/html/nethack-metal --view both --skin metal
```

## How they were made

An AI agent installed the pyramid into a snapshot of each project by following [INSTALL.md](../INSTALL.md), the regular first pass. Then one agent per module dug into the code with the `code-module-deep-dive` skill, and a technical writer agent integrated what was worth keeping (see the optional deep dive in INSTALL.md).

## Read them with the right expectations

* **Built from one snapshot, not grown.** A real pyramid fills up over the course of development, one decision and one gotcha at a time. These were written in a single session from a single commit. Yours should end up richer.
* **Unofficial and unverified.** They are not made by or affiliated with the projects. Claims cite files and were checked by a second agent against the code, but nothing was built or run, and errors remain possible. Where something is inferred, the text says so.
* **Reasons are thin.** The snapshots have no commit history, so the "why" comes from comments and doc files only.
* The files are generated examples: the folders here are plain output of the install, not curated by hand.
