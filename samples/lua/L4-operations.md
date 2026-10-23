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
