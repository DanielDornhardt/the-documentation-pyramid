# L1 Vision

## What is this repository?

The C source of the Lua 5.5.1 interpreter, with its test suite and manual source.

Lua is a small, embeddable scripting language. The repository builds the language core, the standard libraries and the stand-alone `lua` program. Its README calls it "the repository of Lua development code, as seen by the Lua team", mirrored irregularly. This copy is a snapshot without history.

## Who is it for?

People who change the interpreter or study how a small language runtime works.

People who only write Lua programs, or embed a released Lua, use the official releases from lua.org and the reference manual instead. These docs skip them.

## Core concepts

These are the ideas needed to read any other document here.

- State: one `lua_State` is a thread of execution; all threads of one VM share a `global_State`.
- Value: a tagged union (`TValue`); strings, tables, closures, userdata and threads are collectable objects.
- Stack: C code and the VM exchange values through a per-thread stack, never through pointers into the heap.
- Bytecode: source is compiled in one pass into register-based instructions and run by the VM loop.
- Table: the only data structure; it has an array part and a hash part.
- Collector: an incremental or generational mark-and-sweep collector frees unreachable objects.

## Success

The interpreter builds on any C99 compiler and passes the whole suite in `testes/` ("final OK").

Portability, small size and speed are the qualities the code protects. A plain build skips the tests that need the internal test build, so "final OK" alone proves less than it seems (see the test suite in L3). Unverified: no build or test was run while writing these docs; all claims come from reading the source.

## Direction

The snapshot is the development line of Lua 5.5 (`lua.h` names release 5.5.1 and copyright to 2026). Its manual is `manual/manual.of`.

Visible 5.5 changes in the code include the `global` declaration in the parser and the 10-bit `ivABC` instruction format. Beyond that, direction comes from the Lua team, not from this repository.

## Non-goals

The project deliberately stays small and does not take outside contributions.

- No pull requests: the README asks reporters to use the Lua mailing list.
- No large standard library: no networking, no GUI, no regular expressions (Lua has its own patterns).
- No required third-party dependencies: the core needs only a C compiler and the C standard library.
- No `luac` compiler tool in this tree: the makefile builds only `lua` and `liblua.a`.
