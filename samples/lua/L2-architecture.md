# L2 Architecture

## Tech stack

Portable ISO C (C99 by default, C89 optional), built with a plain makefile and gcc.

- C99 or C89: the makefile uses `-std=c99 -DLUA_USE_LINUX`; `onelua.c` shows C89 and Linux builds.
- POSIX hooks: `LUA_USE_POSIX`, `LUA_USE_DLOPEN` and `LUA_USE_READLINE` switch on platform features in `luaconf.h`.
- Lua itself: the test suite in `testes/` and the manual converter `manual/2html` are Lua scripts.
- No external libraries: only the C library, `-lm`, and `-ldl` for dynamic loading on Linux.

## Project structure

All source files sit flat in the repository root; there is no `src/` folder.

```
lua/
  l*.c l*.h      core (VM, compiler, GC), libraries, C API
  lua.c          stand-alone interpreter
  onelua.c       whole interpreter as one translation unit
  luaconf.h      build-time configuration
  makefile       developer's makefile (not the release one)
  all            script: build, then run the whole suite
  testes/        test suite (Lua scripts, plus C libraries in testes/libs/)
  manual/        reference manual source (manual.of) and HTML converter (2html)
  docs/          these documents
```

## Subsystems

The interpreter has about nine parts, listed here from the outside in; each has a module in L3.

```
 lua.c  --->  standard libraries  --->  C API + auxiliary library
 (host)       (lbaselib, ...)           (lapi, lauxlib)
                                              |
        compiler  --->  virtual machine  <--- calls, stack, errors
        (llex, lparser, lcode)   (lvm)        (ldo, ldebug, lfunc, lstate)
                                              |
                       objects, tables, strings   <--->   garbage collector
                       (lobject, ltable, lstring, lmem)   (lgc)
```

- Compiler: turns source text into a function prototype (`Proto`).
- Virtual machine: runs the bytecode in `lvm.c`.
- Calls, stack and errors: `ldo.c` and friends move control between Lua and C.
- Objects, tables and strings: the value representation and the two big data structures.
- Garbage collector: `lgc.c`, driven by allocation and by `lua_gc`.
- C API and auxiliary library: the only supported way for C code to use the core.
- Standard libraries: base, string, table, math, io, os, coroutine, utf8, debug, package.
- Bytecode dump and load: `ldump.c`, `lundump.c`.
- Stand-alone interpreter: `lua.c`.
- Test suite: `testes/`, plus the special test build around `ltests.c`.

## Data flow

Source text becomes a closure; running it calls back into the C API and the libraries.

```
source text / precompiled chunk
   |  lzio (buffered reader)
   v
llex -> lparser + lcode  (one pass, no syntax tree)  -> Proto (bytecode, constants, line info)
   |                                                     |  or ldump/lundump for binary chunks
   v
LClosure  -> ldo (call, stack) -> lvm (execute) -> calls C functions via lapi
                                       |
                              ltable / lstring / ltm (metamethods) / lgc
```

### Scenario

`lua script.lua` runs one file.

1. `lua.c` creates a state with `luaL_newstate`, opens the libraries (`luaL_openlibs`, `linit.c`) and handles options and `LUA_INIT`.
2. `luaL_loadfile` reads the file through `lzio`, and `luaD_protectedparser` compiles it into a closure.
3. `lua_pcall` runs the closure through `luaD_pcall` and `luaD_callnoyield`: `luaD_precall` pushes a `CallInfo` and `luaV_execute` runs the instructions.
4. An error anywhere calls the message handler (`msghandler` in `lua.c`, which builds a traceback), then unwinds with `luaD_throw` to the protected call; `lua.c` prints the message.

## Data model

Every value is a `TValue`: a type tag plus a payload.

```
global_State (one per VM) --- registry (Table), string table, GC lists, metatables for basic types
   |
lua_State (one per thread) --- stack, CallInfo list, open upvalues, hooks
   |
Collectable objects: TString, Table, LClosure/CClosure, UpVal, Udata, Proto, lua_State
```

The payload is a number, a light pointer or a pointer to a collectable object. Inside a table's array part the payload and the tag are stored apart, so an array slot is not a `TValue`.

`Proto` holds code, constants, upvalue descriptions and debug information; an `LClosure` is a `Proto` plus its `UpVal`s. See `lobject.h` and `lstate.h`.

## Key decisions

No decision records exist for this snapshot. The source states a few principles in comments; they shape most changes. Details are in L3.

- Single pass, no syntax tree: the parser emits code while it reads.
- Fast path first, metamethod second: each arithmetic opcode is paired with a fallback opcode.
- The C stack is disposable: a yield or error unwinds it, and the `CallInfo` chain holds the state.
- Enum order is load-bearing: opcodes, operators and metamethod events are converted by arithmetic, marked with `ORDER` tags in the source.
- Write barriers are the caller's job: the collector invariant is kept at each write site.

Design comments in the source can be stale; the table-size rule at the top of `ltable.c` is one (L3, Objects, tables and strings).
