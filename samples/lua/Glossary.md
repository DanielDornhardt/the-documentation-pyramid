# Glossary

The project's domain words, defined once, in the language the source, the manual and these docs share. Covers Lua implementation terms only. One sentence per definition. Alphabetical.

| Term | Definition | Notes |
|---|---|---|
| Barrier | Code that keeps the collector's invariant when a collectable value is stored into an already marked object. | Two kinds: forward (`luaC_barrier`) and back (`luaC_barrierback`); see `lgc.h` and `lgc.c`. |
| CallInfo | The record of one active function call on a thread. | `lstate.h`. The list also holds unused cached entries after the active one. |
| Chunk | A unit of code loaded at once, as source text or as a precompiled binary. | |
| Closure | A function value: a `Proto` plus its upvalues (`LClosure`), or a C function plus its upvalues (`CClosure`). | |
| Collectable | An object the garbage collector manages: strings, tables, closures, userdata, upvalues, prototypes and threads. | `GCObject` in `lobject.h`. |
| Light userdata | A raw C pointer stored as a value; it is not collectable. | Not the same as full userdata. |
| Metamethod | A function stored under a special key (such as `__index`) in a metatable that changes how a value behaves. | Called a tag method (`ltm.c`) in the source. |
| Proto | A compiled function prototype: instructions, constants, nested prototypes and debug data. | `Proto` in `lobject.h`. |
| Registry | A table reachable from C only, used to store values that libraries share. | `LUA_REGISTRYINDEX`. |
| State | One `lua_State` is a thread of execution; the `global_State` is shared by all threads of one VM. | Many sources say "state" for the whole VM. |
| TValue | The tagged value: a type tag plus a payload. | |
| Upvalue | A variable of an enclosing function captured by a closure. | Open while on the stack, closed after. |
| Userdata | A block of memory managed by Lua that C code gives a metatable. | Full userdata, as opposed to light. |
