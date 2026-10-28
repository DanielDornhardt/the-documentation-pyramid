**Table of contents**

- [L1 Vision](#l1-vision)
  - [What is this repository?](#what-is-this-repository)
  - [Who is it for?](#who-is-it-for)
  - [Core concepts](#core-concepts)
  - [Success](#success)
  - [Direction](#direction)
  - [Non-goals](#non-goals)
- [L2 Architecture](#l2-architecture)
  - [Tech stack](#tech-stack)
  - [Project structure](#project-structure)
  - [Subsystems](#subsystems)
  - [Data flow](#data-flow)
    - [Scenario](#scenario)
  - [Data model](#data-model)
  - [Key decisions](#key-decisions)
- [L3 Modules](#l3-modules)
  - [Compiler](#compiler)
    - [Things to know](#things-to-know)
  - [Virtual machine](#virtual-machine)
    - [Things to know](#things-to-know-1)
  - [Calls, stack and errors](#calls-stack-and-errors)
    - [Things to know](#things-to-know-2)
  - [Objects, tables and strings](#objects-tables-and-strings)
    - [Things to know](#things-to-know-3)
  - [Garbage collector](#garbage-collector)
    - [Things to know](#things-to-know-4)
  - [C API and auxiliary library](#c-api-and-auxiliary-library)
    - [Things to know](#things-to-know-5)
  - [Standard libraries](#standard-libraries)
    - [Things to know](#things-to-know-6)
  - [Bytecode dump and load](#bytecode-dump-and-load)
    - [Things to know](#things-to-know-7)
  - [Stand-alone interpreter](#stand-alone-interpreter)
    - [Things to know](#things-to-know-8)
  - [Test suite](#test-suite)
    - [Things to know](#things-to-know-9)
  - [Reference manual sources](#reference-manual-sources)
    - [Things to know](#things-to-know-10)
- [L4 Operations](#l4-operations)
  - [Build](#build)
  - [Run](#run)
  - [Testing](#testing)
  - [Debugging](#debugging)
  - [Change recipes](#change-recipes)
  - [Release](#release)

---

<!-- source: L1-vision.md -->
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

---

<!-- source: L2-architecture.md -->
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

---

<!-- source: L3-modules.md -->
# L3 Modules

## Compiler

The compiler turns source text into a function prototype in one pass, without a syntax tree.

It lives in `llex.c` (tokens), `lparser.c` (grammar, scopes, variables), `lcode.c` (instruction emission and register allocation) and `lzio.c` (buffered input, also used by the binary loader). The parser calls `luaK_*` functions while it reads. An expression is an `expdesc`: a description of where its value is or can be put, so code is emitted only when the context needs it (`a + 1` becomes `OP_ADDI`, `t.x` becomes `OP_GETFIELD`). The source gives no stated reason for the single-pass design.

| File | Role |
|---|---|
| `llex.c`, `llex.h` | Lexer, reserved words, `LexState` |
| `lparser.c`, `lparser.h` | Statements, expressions, `FuncState`, `expdesc`, `global` declarations |
| `lcode.c`, `lcode.h` | Emits instructions, folds constants, patches jumps |
| `lzio.c`, `lzio.h` | `ZIO` reader and `Mbuffer` |

### Things to know

- Boolean logic is jump lists: the `t` and `f` fields of an `expdesc` chain unresolved jumps through the jump instructions themselves.
- Code is rewritten after emission. Peephole edits of the previous instruction are legal only through `previousinstruction` and after `luaK_getlabel` at jump targets. `luaK_finish` runs at the end of each function and fixes returns, vararg opcodes and jump chains, so the opcode stream is not final before it.
- The scanner makes every name and string unique, and the parser compares names by pointer. Create names only through `luaX_newstring`. The same table anchors compiler objects against the collector.
- Constant folding refuses NaN, zero results and operations that could raise an error. The constant cache (`kcache`) can hold duplicates by design.
- `local x <const> = <constant>` takes no register and has no debug entry, so registers and variables are not one-to-one.
- `global` is not a reserved word in a default build (`LUA_COMPAT_GLOBAL` is 1 in `luaconf.h`). The test header `ltests.h` sets it to 0, so a change to the lookahead rule is invisible to the test build.
- Nesting depth shares the C-call counter (`LUAI_MAXCCALLS`, 200). "C stack overflow" is a run-time error without a "near" part. Other fixed limits: 200 locals, 255 registers, 255 upvalues.

Trap: operator, opcode, metamethod event and token enums are converted by arithmetic on their order. Each place carries a tag; run `grep "ORDER " *.c *.h` before changing one (`ORDER OPR`, `ORDER OP`, `ORDER TM`, `ORDER RESERVED`). A new test opcode also needs the T bit in `luaP_opmodes` (`lopcodes.c`), because every test must be followed by a jump. Release builds have no asserts to catch a mistake.

## Virtual machine

The virtual machine executes register-based bytecode in `luaV_execute`.

It lives in `lvm.c`, with the instruction set in `lopcodes.h`/`lopcodes.c` and the dispatch table in `ljumptab.h`. Instructions are 32-bit words with a 7-bit opcode and the formats `iABC`, `ivABC`, `iABx`, `iAsBx`, `iAx` and `isJ`, drawn at the top of `lopcodes.h`. On gcc-compatible compilers the loop dispatches with computed gotos (`LUA_USE_JUMPTABLE`); otherwise it uses a `switch`. The test build forces the `switch`, so a wrong `ljumptab.h` entry shows only in a normal build.

| File | Role |
|---|---|
| `lvm.c`, `lvm.h` | Main loop, arithmetic, comparison, concatenation, `for` loops, table get/set slow paths, `luaV_finishOp` |
| `lopcodes.c`, `lopcodes.h`, `lopnames.h` | Opcode list, formats, argument limits, mode table `luaP_opmodes` |
| `ljumptab.h` | Computed-goto table, included only inside `lvm.c` |
| `ltm.c`, `ltm.h` | Tag methods (metamethods), type names, vararg handling |

### Things to know

- A Lua-to-Lua call does not recurse in C: `OP_CALL` switches frames inside the same `luaV_execute`. A new C frame (`CIST_FRESH`) starts only when C code enters the VM, and metamethod calls do count against the C-call limit.
- The loop keeps `pc`, `base`, `k` and `trap` in locals. Wrap anything that can raise errors, grow the stack or change hooks in the matching macro (`Protect`, `halfProtect`, `ProtectNT`); after a stack reallocation `base` is refreshed through `trap`.
- Every arithmetic and bitwise opcode is followed by an `OP_MMBIN*`; success skips it with `pc++`, and the slow path finds its target by reading `pc - 2`. Comparison and test opcodes run the next jump inline and trust that it is one.
- The VM does no string-to-number coercion in arithmetic; the string library supplies it through the string metatable (`lstrlib.c`). Bitwise operations on strings get none.
- An opcode that can yield inside a metamethod needs a case in `luaV_finishOp`, which completes it when a coroutine resumes.
- The "uses top" bit of `luaP_opmodes` is read at run time by hooks (`luaG_traceexec`), not only by tests. A wrong bit works until a hook is set.
- Immediate shifts have a surprising operand order: `OP_SHLI` is `sC << R[B]`.
- The `lopcodes.h` comments for the generic `for` opcodes (`OP_TFORPREP`, `OP_TFORCALL`, `OP_TFORLOOP`) are stale; the comments in `lvm.c` are right.
- Only six metamethod events (up to `TM_EQ`) are cached as absent in `Table.flags`; every store path must call `invalidateTMcache`.

Trap: opcode order lives in `lopcodes.h`, `lopcodes.c` (`luaP_opmodes`), `ljumptab.h` and, through arithmetic on the order, `lcode.c`. A mismatch in `ljumptab.h` or `luaP_opmodes` breaks execution or hooks. `lopnames.h` only names opcodes in test listings.

## Calls, stack and errors

This module moves control between Lua functions, C functions, coroutines and error handlers.

Code is in `ldo.c` (calls, protected calls, resume and yield, stack growth, hook dispatch, result moving, closing on error, protected parsing), `lstate.c` (states, threads, the `CallInfo` list), `lfunc.c` (closures, upvalues, to-be-closed variables) and `ldebug.c` (`lua_sethook`, line info, tracing, error messages with variable names). Errors are C exceptions: `luaD_throw` jumps with `longjmp`, or throws a C++ exception when compiled as C++ without `LUA_USE_LONGJMP`. A yield unwinds the same way, and resumption continues through the `CallInfo` chain and continuation functions (`lua_KFunction`), not through the C stack. Yielding across a C function without a continuation is refused.

### Things to know

- A `pcall` in a yieldable coroutine has no `setjmp` of its own: it sets `CIST_YPCALL` and relies on `lua_resume`'s protection. Elsewhere `luaD_pcall` is used. Two recovery paths exist for one Lua function.
- `L->nCcalls` holds two counters: C recursion (low 16 bits) and non-yieldable calls (high 16 bits). A longjmp skips decrements, so `luaD_rawrunprotected` restores it. The parser uses the same counter.
- Overflow handling keeps spare room: after a stack overflow the stack may exceed `LUAI_MAXSTACK` by `STACKERRSPACE`; a second overflow raises "error in error handling" (`luaD_errerr`).
- The message handler runs at the throw site, before unwinding, and only for run-time errors. Memory and syntax errors skip it. Memory errors avoid allocating.
- Stack reallocation converts every stack pointer (`relstack`, `correctstack`). Raw `StkId` values are stale after anything that can grow the stack; keep offsets (`savestack`) or use `checkstackp`. The test build uses the non-strict address mode (`LUAI_STRICT_ADDRESS 0`), a default build the strict one.
- In frames with hidden varargs `ci->func` is moved up; `OP_RETURN`, `rethook` and `luaD_pretailcall` move it back. Hooks and debug code see the moved value.
- Result counts, `__call` hop counts and the saved error status are packed into `callstatus`. A change to result adjustment touches `moveresults`, `OP_RETURN0`/`OP_RETURN1` in `lvm.c` and the return rewriting in `lcode.c`.
- To-be-closed variables form a list stored in the stack slots. An error in a `__close` method replaces the current error.
- A yield inside a debug hook does not throw from `lua_yieldk`; `luaG_traceexec` throws it later.
- The `CallInfo` list keeps free entries after `L->ci`; they count toward the thread's memory size.
- `luaG_runerror` adds "source:line:" only for Lua frames; C functions use `luaL_where`.

Trap: the Lua stack is reallocated when it grows. A new function that calls anything while holding a stack pointer must save and restore it.

## Objects, tables and strings

This module defines how values are represented and how tables and strings work.

`lobject.h` holds the `TValue` tagged union, the type tags and variants, `Proto`, closures and the `Table` and `Node` structs; `lobject.c` has number conversion and `luaO_pushvfstring`. `ltable.c` implements the array part and a chained scatter hash part with Brent's variation. `lstring.c` interns short strings (up to `LUAI_MAXSHORTLEN`, 40 bytes) in one string table; long strings are hashed lazily. `lmem.c` wraps the user-supplied allocator and runs an emergency collection when an allocation fails.

| File | Role |
|---|---|
| `lobject.c`, `lobject.h` | Value and object definitions, `luaO_*` helpers |
| `ltable.c`, `ltable.h` | Tables: array part, hash part, rehash |
| `lstring.c`, `lstring.h` | String creation, interning, the `luaS_new` cache, external strings, userdata |
| `lmem.c`, `lmem.h` | Allocation wrappers, size-overflow checks, GC debt accounting |
| `llimits.h` | Internal types (`lu_byte`, `l_uint32`), casts, assertions |

### Things to know

- The array part is not an array of `TValue`: values grow downward and one-byte tags upward from `t->array`, with the `#t` length hint between them. Use the access macros (`getArrTag`, `getArrVal`), never `t->array[i]`.
- The array size rule in the header comment of `ltable.c` ("more than half used") is stale. The code (`computesizes`, `arrayXhash`) accepts a size when about a third of its slots are used. Trust the code.
- Nil has three kinds in a slot: nil, empty and absent key. Deleted keys stay in the node as dead keys until the collector clears them, so `next` keeps working.
- Setting is two-phase (`luaH_pset*`, then `luaH_finishset`). The caller owns the write barrier and the metamethod cache; `luaH_set` does neither.
- The `flags` byte caches absent metamethods and shares the byte with the dummy-node bit.
- `#t` is a border search with a hint, not a stored length. A resize allocates the hash part first and then the array, and keeps the old table until both succeed.
- Float keys are normalised; nil and NaN keys are rejected at the set, not at lookup.
- Equal short strings are the same object, except short external strings (`lua_pushexternalstring`) until `luaS_normstr` interns them. A dead short string that is not yet swept is revived on lookup. The string table shrinks only in the collector, never in an emergency collection.
- The hash seed is a required argument of `lua_newstate`; it defeats adversarial keys.

Trap: code that writes to a table that may be a metatable must call `invalidateTMcache`, and any store of a collectable value into a table needs `luaC_barrierback`.

## Garbage collector

The collector frees unreachable objects with an incremental or a generational mark-and-sweep.

It lives in `lgc.c` and `lgc.h`. It runs when allocation debt reaches zero (`luaC_step`, via `luaC_condGC`), when `lua_gc` asks, and when an allocation fails (emergency collection, `lmem.c`). The library creates a state in incremental mode; the `lua` command switches to generational. Objects are white, gray or black. There are two whites that swap at the end of the atomic phase, so "dead" is a colour. A black object may not point to a white one, so a write into a black object needs a barrier: forward (`luaC_barrier`) for closures, prototypes and userdata, back (`luaC_barrierback`) for tables. Threads have no barrier and are re-traversed in the atomic phase.

### Things to know

- The invariant is suspended during sweep on purpose; the barrier then repaints or does nothing.
- Generational mode keeps an age ladder (`G_NEW` to `G_OLD`, `G_TOUCHED1/2`) and cuts the `allgc` and `finobj` lists with pointers (`survival`, `old1`, `reallyold`). Anything that unlinks an object from `allgc` must fix them, as `luaC_checkfinalizer` and `udata2finalize` do.
- The order inside the atomic phase decides finalizer semantics: weak values drop objects being finalized, weak keys keep them. Do not reorder it. Ephemerons converge by repeated traversal.
- Weak tables use the gray lists `weak`, `allweak` and `ephemeron`. Finalizers use the object lists `finobj` and `tobefnz` and the sweep states `GCSswpfinobj`, `GCSswptobefnz` and `GCScallfin`. Strings are never weak.
- `__gc` takes effect only if it is in the metatable when `setmetatable` is called. Finalizers run with the collector stopped, and a failing one becomes a warning. They do not run in emergency collections.
- Emergency collection never runs inside the collector (`gcstopem`), so GC code must not allocate.
- The six tuning values (`LUAI_GCPAUSE`, `LUAI_GCMUL` and four more in `lgc.h`) are read once in `lua_newstate`; afterwards only `lua_gc(LUA_GCPARAM)` changes them.
- Shutdown order matters: `luaC_freeallobjects` runs pending finalizers, then frees `allgc`, then `fixedgc`. Permanent objects (reserved words, metamethod names) live in `fixedgc` via `luaC_fix`.

Trap: a new collectable object type needs a case in `objsize`, `getgclist`, `reallymarkobject`, `propagatemark` and `freeobj` (each asserts on unknown types). Sweeping is generic. A barrier is needed at every write site, not per type. `HARDMEMTESTS` forces a full collection at every collection point, which finds unanchored values; it is not shown to find a missing barrier.

## C API and auxiliary library

The C API is the stack-based interface through which C code, including the libraries, uses the core.

`lua.h` is the public header, `lapi.c` implements it, and `luaconf.h` configures types and limits. `lauxlib.c` and `lauxlib.h` build the higher-level `luaL_*` helpers on top. The file states its own rule: it uses only the official API. `luaL_newstate` also installs the panic function, the warning system and the hash seed (`luaL_makeseed`). Values are addressed by stack index, with pseudo-indices for the registry and for upvalues.

| File | Role |
|---|---|
| `lua.h`, `lapi.c`, `lapi.h` | Public API and its implementation |
| `luaconf.h` | Number types, paths, platform switches, compatibility flags |
| `lauxlib.c`, `lauxlib.h` | Auxiliary library, `luaL_Buffer`, references, error helpers |
| `lprefix.h` | Feature-test macros included first by every `.c` file |

### Things to know

- A default build validates nothing. `api_check` is active only with `LUA_USE_APICHECK` (it uses `assert`, so `NDEBUG` turns it off) or in a `LUAI_ASSERT` build.
- Stack-index checks are split between two functions with different strictness. Some stack operations are restricted while to-be-closed slots are pending.
- `luaL_Buffer` keeps one hidden stack slot and becomes a to-be-closed userdata when it grows. `luaL_pushresult` hands the buffer over without copying.
- References: `t[1]` is the free-list head, so registry slot 1 is reserved.
- `luaL_argerror` adjusts the argument number for method calls.

Trap: `luaconf.h` changes the ABI (number types, `LUA_32BITS`); the core and every C library must be built with the same one. Only number sizes and the version are checked automatically at load time.

## Standard libraries

The standard libraries are one C file each, registered through `linit.c`.

`lbaselib.c`, `lstrlib.c` (strings, patterns, `string.pack`), `ltablib.c`, `lmathlib.c`, `liolib.c`, `loslib.c`, `lcorolib.c`, `lutf8lib.c`, `ldblib.c` and `loadlib.c` (the `package` library and `require`). They use the public API and `lauxlib`, and also the internal `llimits.h` (casts, branch hints, `lua_assert`); copy that header too when using one as an example. Libraries are selected by a bit mask whose order is the table order in `linit.c`.

### Things to know

- `require` loops over `package.searchers`: preload, Lua path, C path, C root. The C-root searcher loads submodules from one shared library.
- Loaded C libraries sit in the registry table `_CLIBS`, mapped to a light userdata and to an external "library string" whose deallocator unloads the library. A module name with a hyphen opens the function named after the part before the hyphen.
- Search paths: the versioned variable (`LUA_PATH_5_5`, `LUA_CPATH_5_5`) wins over the plain one; `;;` expands to the default from `luaconf.h`; `-E` ignores the environment.
- `table.sort` has an "invalid order function" error and a randomised pivot. The table library accepts table-like objects through metamethods.
- `load` and `loadfile` refuse the mode letter `B`. `getmetatable` honours `__metatable`; the `debug` functions do not.
- `math.random` is xoshiro256**. The `math` compatibility functions need `LUA_COMPAT_MATHLIB`. `table.create` is new in this tree.
- `utf8` is strict by default, with a lax mode up to 31 bits. `string.pack` derives alignment from a struct probe.
- `coroutine.close` of the running coroutine closes it from inside and does not return.

Trap: the C-library loader depends on platform macros (`LUA_USE_DLOPEN`, `LUA_DL_DLL`, or none; `LUA_USE_LINUX` sets the first). Without a loader, `require` of C modules fails at run time with "dynamic libraries not enabled", not at build time.

## Bytecode dump and load

This module writes and reads precompiled chunks, used by `string.dump`, `lua_dump` and `load`.

`ldump.c` writes a `Proto` and `lundump.c` reads it back. The loader checks a header first: signature, `LUAC_VERSION`, `LUAC_FORMAT`, `LUAC_DATA`, the sizes of `int`, `Instruction`, `lua_Integer` and `lua_Number`, and the test values `LUAC_INT`, `LUAC_INST` and `LUAC_NUM` (`lundump.h`). That catches a different version, byte order or type size. It does not catch a different opcode set or `Proto` layout of the same version and format. The tree has no `luac` program; `string.dump` (a wrapper over `lua_dump`, with a `strip` option) produces chunks.

### Things to know

- Strings are deduplicated through an implicit index, so dump order and load order are one contract.
- There is no bytecode verifier. The loader trusts the chunk, so a crafted chunk can crash the VM.
- Fixed-buffer mode (`B`) makes the loaded function point into the caller's memory.
- Loading is ordered for error safety and collector anchoring. Integers use varints and zig-zag, floats are raw.
- Debug block sizes are always written, even when stripped.

Trap: changing the instruction set or the `Proto` fields without changing the dumper and the loader together leaves old chunks loading into wrong code. `LUAC_VERSION` is computed from the Lua version and is not a counter; bump `LUAC_FORMAT` when the layout changes.

## Stand-alone interpreter

The stand-alone interpreter is the `lua` command: option handling, a REPL and script execution.

`lua.c` creates the state, switches the collector to generational mode, opens the libraries, handles the options (`-e`, `-i`, `-l`, `-v`, `-E`, `-W`, `--`, `-`), runs the init variable, runs the script with the `arg` table, and prints errors with a traceback. `main` does almost nothing; `pmain` runs in protected mode. `onelua.c` includes every other `.c` file, so the whole interpreter builds as one translation unit; its header comment has the working command lines (`gcc -O2 -std=c99 -o lua onelua.c -lm`, plus `-DLUA_USE_LINUX -Wl,-E ... -ldl` on Linux). `luac.c` is not in this tree, so `MAKE_LUAC` is unusable.

### Things to know

- Startup order is fixed. `LUA_INIT_5_5` is tried first and `LUA_INIT` is the fallback; only one runs. A value starting with `@` is a file name. `-E` ignores both.
- Options are parsed in two passes; the first runs no Lua. `-l name=module` is accepted, and a `-version` suffix is stripped when there is no `=`.
- Every chunk runs through `docall` with a message handler (`msghandler`) that builds the traceback before unwinding.
- A signal handler never touches the Lua state; it installs a hook, so Ctrl-C arrives as the error "interrupted!".
- The REPL first tries `return <line>;` and continues a line only on an "<eof>" error. Locals do not survive a line.
- Readline is optional three ways: linked (`LUA_USE_READLINE`), loaded at run time with `dlopen` (`LUA_READLINELIB`, set by `LUA_USE_LINUX`), or absent, when the REPL falls back to `fgets`.

Trap: `onelua.c` lists the source files by name; a new `.c` file must be added there as well as to the makefile.

## Test suite

The test suite is Lua scripts in `testes/`, driven by `all.lua`, plus an internal test build.

Most `testes/*.lua` files cover one area (`api.lua`, `gc.lua`, `coroutine.lua`, `strings.lua`). Exceptions: `all.lua` is the driver, `tracegc.lua` and `bwcoercion.lua` are helpers, and `heavy.lua` is a manual script that `all.lua` never runs. The C-side tests need the internal test library: `ltests.c` is compiled only with `LUA_DEBUG`, and `ltests.h` defines it, arriving through `-DLUA_USER_H='"ltests.h"'` from the `TESTS` variable in the makefile (commented out by default). The root script `all` runs the whole suite.

| File | Role |
|---|---|
| `testes/all.lua` | Driver; honours `_soft`, `_port`, `_nomsg` and `_U` |
| `ltests.c`, `ltests.h` | Internal test library and a different build configuration |
| `testes/libs/` | Linux-style C libraries and a makefile for `package` tests |

### Things to know

- The test build is a different Lua, not only the same code with asserts: it disables the jump table, reserves `global`, shrinks limits (`LUAI_MAXCCALLS` 180, `LUAL_BUFFERSIZE` 23), uses the non-strict stack address mode, and replaces the allocator, panic handler, warning function and state creation. The global table `T` exposes this to scripts, and `MEMLIMIT` in the environment caps memory.
- `all.lua` runs most files as `string.dump` bytecode, so the suite also exercises `ldump.c` and `lundump.c`. Running one file alone skips that path.
- Some files return magic values the driver asserts (`attrib.lua` 27, `locals.lua` 5, `events.lua` 12, `verybig.lua` 10). Do not edit their last lines or add an early `return`.
- End-of-run checks fail away from their cause: no global `debug`, same C-stack level, all globals erased, then collections.
- `tracegc.lua` prints a dot per collection and is switched off around stack-overflow tests.
- Run from `testes/` with `../lua` and a small C stack (`ulimit -S -s 1100`). In `testes/libs/makefile` the `lib2-v2.so` rule lists `lib21.c` but compiles `lib22.c`, so editing `lib22.c` does not trigger a rebuild. `testes/packtests` has a hand-kept file list.

Trap: a green run can mean little. A plain build skips `api.lua`, `code.lua`, `memerr.lua` and parts of about fourteen other files; it announces this and warns at the end, but still prints "final OK". A `_VERSION` other than "Lua 5.5" ends `all.lua` with exit status 0, so `all` also prints "final OK" without running a test.

## Reference manual sources

The manual sources are `manual/manual.of` and `manual/2html`, the script that turns them into HTML.

`manual.of` is the reference manual in the `.of` markup: nine chapters from the language and the C API to the standard libraries, the stand-alone interpreter, incompatibilities and the complete syntax. `2html` is a Lua script that reads stdin and writes stdout (one optional argument, `port`, for the Portuguese variant) and exits 0 on most errors. Its output `manual/manual.html` is ignored by git and needs `lua.css`, `manual.css` and `logo.gif`, which are not in the repository.

### Things to know

- The markup is a home-made macro language in which blank lines are syntax. Cross-references resolve in two passes.
- Each API entry carries a machine-shaped stack-effect tag that the converter reformats.
- Nothing links the manual to the code or the tests.
- The manual and the code disagree on the default collector mode: the introduction says generational, the code creates incremental states and only `lua.c` switches (`lstate.c`, `lua.c`).

The manual is the closest thing to a specification here, but no file in the snapshot says that a disagreement with the code is a bug. That is this pyramid's working rule.

---

<!-- source: L4-operations.md -->
# L4 Operations

## Build

The developer's makefile builds `liblua.a` and the `lua` program with gcc.

Run `make` in the repository root. Settings are at the top of `makefile`: `CC`, `CFLAGS`, `MYCFLAGS` (default `-std=c99 -DLUA_USE_LINUX` plus a long list of warnings), `MYLDFLAGS` (`-Wl,-E`) and `MYLIBS` (`-ldl`). Targets: `all` (default), `o`, `a`, `clean`, `depend` and `echo`. For another platform, change `LUA_USE_LINUX` to the matching macro; `luaconf.h` explains them. `make all` also does `touch all`, which updates the modification time of the test script of the same name. Unverified: no build was run for these docs.

Single-file build:

```sh
gcc -O2 -std=c99 -o lua onelua.c -lm
```

## Run

The built program is `./lua`; it reads a script, runs `-e` strings, or starts a REPL.

```sh
./lua script.lua
./lua -e "print(_VERSION)"
./lua -i
```

Options are listed in `lua.c` (`-e`, `-i`, `-l`, `-v`, `-E`, `-W`). `LUA_INIT_5_5` or `LUA_INIT` runs before the script unless `-E` is given.

## Testing

The suite runs from `testes/` with the freshly built `lua`; this snapshot has no CI configuration.

The script `all` in the root does the full run: it builds with `make -s -j`, builds the C libraries in `testes/libs`, sets a small C stack (`ulimit -S -s 1100`) and runs `../lua -W all.lua` from `testes/`. It prints "final OK" on success. To run one file, start `../lua -W name.lua` in `testes/`. The scripts expect `Lua 5.5` in `_VERSION`; with another version `all.lua` exits with status 0 without running tests, and `all` still prints "final OK".

For the C-side tests, build with the `TESTS` line in the makefile enabled (`-DLUA_USER_H='"ltests.h"'`) so that `ltests.c` is compiled in. A plain build skips the tests that need the global `T` (announced and warned about, but the run still ends "final OK"). Options such as `-DHARDSTACKTESTS`, `-DHARDMEMTESTS` and `-DEMERGENCYGCTESTS` are listed in the makefile comments. Unverified: not run here.

## Debugging

Start with the debug test build and the debug library.

- Build with `TESTS` set (see Testing): `LUAI_ASSERT` turns on the internal assertions (`lua_assert`).
- Add `-DLUA_USE_APICHECK` to check C API arguments (`api_check` in `lapi.h`); it uses `assert`, so `NDEBUG` disables it, and a default build checks nothing.
- The makefile comments mention sanitizers (`-fsanitize=undefined`, `-fsanitize=address`) for undefined behaviour.
- In `ltests.c`, the test library offers heap and state checks (`T` functions) for the test scripts.
- For Lua-side problems use the `debug` library (`debug.traceback`, hooks).

## Change recipes

These are the changes people make most often, with what silently breaks if you miss a file.

- Add or change an opcode: `lopcodes.h` (enum, format), `lopcodes.c` (mode table, same order), `lopnames.h`, `ljumptab.h`, `lvm.c` (and `luaV_finishOp` if it can yield), `lcode.c`, `ldebug.c`; for an operator also `lcode.h`, `lparser.c`, `ltm.h` and `lua.h`. Grep `ORDER` first; then `LUAC_FORMAT` in `lundump.h` if the binary format changes (`LUAC_VERSION` follows the Lua version). Run `testes/code.lua` and `testes/db.lua`.
- Add a library function: add it to the `luaL_Reg` array in the library file; document it in `manual/manual.of`. A new library also needs `lualib.h` and `linit.c`.
- Add a metamethod: `ltm.h` (enum), `ltm.c` (names), and the places that call it; the first entries up to `TM_EQ` are cached in `Table.flags`, so their order matters.
- Add a source file: add it to `makefile` (`CORE_O`, `LIB_O`, and the dependency list at the end), and to `onelua.c`.
- Change a build-time limit or type: `luaconf.h`, then rebuild everything and every C library.

## Release

Releases are not made from this repository.

The README says to download official releases from lua.org. This tree has no packaging or install target; `testes/packtests` only builds a tarball of the test suite.
