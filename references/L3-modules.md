# L3 Modules

<!-- How specific parts work. Read before working in a module.
     One module is one "##" section in this file. Write it as prose, with no label prefixes.
     The first sentence is a short summary of what the module is and holds, at most 140 characters, shorter is
     better: the routing table in index.md copies it. The rest of the opening paragraph says where the module
     lives and what is special about it. Do not explain what readers already know.
     Everything below the opening paragraph is optional and only where it applies:
     - the idea that explains the module, said plainly, and why it is built that way (what it bought, what it cost);
     - a diagram, if the module has more than a few parts, a schema, a state machine or a flow worth seeing;
     - a small table of key files, if the paragraph would otherwise list many paths;
     - one trap that is highly relevant: what someone changed, what broke, how they would notice.
     A module that passes about 100 lines moves to its own file in L3-modules/<name>.md, and its section is removed
     from this file: nothing is left behind, a module has one home. The moved file has no "#" title and starts at its
     "## <Module>" heading, with its sections still "###": cut and paste, no level changes. Do not add an index.md to L3-modules/.
     Delete the example section below when you add the first real module. -->

## {Module}

{Short summary of what it is and holds, in under 140 characters; then where it lives and what is special about it.}

{Optional: the idea behind it and why it is built that way.}

{Optional: a diagram.}

| File | Role |
|---|---|
| `{path}` | {what it does} |

{Optional, only if highly relevant: the trap, in a sentence or two.}
