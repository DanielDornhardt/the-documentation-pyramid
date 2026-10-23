# L4 Operations

## Git workflow

The repository's own rules are a short commit-message rule and an optional set of git hooks.

Pull requests follow the 50/72 rule: subject under 50 characters, blank line, body wrapped at 72 (`Contributing.md`). The DevTeam's optional setup (`perl DEVEL/nhgitset.pl`) installs hooks and the `nhadd` and `nhcommit` aliases that expand `$NHDT-...$` header lines; nothing breaks if you skip them (`DEVEL/Developer.txt`). The hooks and `nhsub` are described in `DEVEL/hooksdir/` and `git_recipes.txt`. The public repositories are on GitHub and SourceForge (`README`). Source files carry `$NHDT-Date$` style header lines; do not hand-edit them.

## Setup

A tty build needs a C compiler, make and, on Unix, a hints file; Lua is vendored.

The Unix route (`sys/unix/NewInstall.unx`):

```
cd sys/unix
sh setup.sh hints/linux.501      # or hints/macOS.501, hints/bsd.501
cd ../..
make all
make install
```

`setup.sh` writes `Makefile`, `dat/Makefile`, `doc/Makefile`, `src/Makefile` and `util/Makefile`. After a failed build, `make spotless` removes generated files. `make install` deletes and recreates the playground directory, so save the `record`, `logfile` and `sysconf` files first.

Interfaces are chosen on the make line: `make WANT_WIN_TTY=1 WANT_WIN_CURSES=1 WANT_WIN_X11=1 all` (`sys/unix/README.hints`). Windows: `sys/windows/build-vs.txt`, `build-msys2.txt`, `build-nmake.txt`. Other platforms: `Porting`, `Cross-compiling`, `sys/*/Install.*`. `submodules/` is empty until the PDCurses submodules are fetched.

## Testing

There is no unit-test suite; CI only builds, and the Lua tests run by hand in wizard mode.

- CI (`azure-pipelines.yml`): Visual Studio and MinGW builds, Linux full and minimal builds, a macOS build, an MS-DOS cross-build, and the Guidebook. It builds; it does not run the game or the Lua tests (from reading the file, not from a CI run).
- Lua tests (`test/README.md`): build without DLB, install, copy `test/*.lua` into the playground, start in wizard mode and run `#wizloadlua` on a file. The tests check level scripting (`test_des.lua`, `test_sel.lua`), objects, shops and wishes.
- Not covered by anything: combat and monster behaviour, save compatibility, the window ports' drawing.
- `sys/libnh/test/` has tests for the library build.

## Debugging

Wizard mode and a few build flags are the main tools.

- Wizard mode: start with `-D`, allowed only for users in the `WIZARDS` line of `sysconf` (`doc/nethack.txt`, `sys/unix/sysconf`). Explore mode is `-X`.
- Wizard commands are in `src/wizcmds.c`; `sanity_check()` runs each turn when the wizard-only `sanity_check` option is set (it checks monsters, worn slots, vision blocking and level connectivity), and the debug fuzzer (`#debugfuzzer`, `iflags.debug_fuzzer`) drives the game with random input; commands that exit or block are flagged `NOFUZZERCMD`. Whether the fuzzer runs in CI is unverified.
- `impossible()` reports internal inconsistencies without ending the game; `panic()` ends it. The `recover` utility rebuilds a game from level files after a crash (needs `INSURANCE`, `include/config.h`).
- From Lua: `nh.debug_flags` can turn off monster generation and hunger (`doc/lua.adoc`).
- Unverified: crash report and panic trace options (`NOCRASHREPORT`, `NOPANICTRACE` appear in the CI file and `util` makefile).

## Change recipes

Most changes touch a table plus one or two other places; the list below says which.

- Add a monster species: entry in `include/monsters.h` (keep its class contiguous, fill in `difficulty` by hand, keep the dragon order); tile art in `win/share/monsters.txt` (unverified that a missing tile fails the build); mention in `dat/data.base` if it has lore; fixes note in `doc/fixes5-0-1.txt`.
- Add an object kind: entry in `include/objects.h` (kinds are grouped by class; the position is the `otyp`, so insertion shifts later kinds and changes the meaning of old saves); check `obj_shuffle_range` in `src/o_init.c` if it has a shuffled appearance; tile art in `win/share/objects.txt`.
- Add a command: row in `extcmdlist[]` in `src/cmd.c` and the handler. Decide the flags (`IFBURIED`, `NOFUZZERCMD`, `AUTOCOMPLETE`, `CMD_M_PREFIX`, `WIZMODECMD`) and return `ECMD_TIME` when it takes time. The row's description feeds `#?`; whether `dat/hh` and `dat/cmdhelp` also need a line is unverified. Update `doc/Guidebook.mn`.
- Add an option: entry in `include/optlist.h`, a variable in `flags` (saved; may need `EDITLEVEL` raised) or `iflags`, an `optfn_<name>()` in `src/options.c` unless it is a plain boolean, the short help, `dat/opthelp` and the Guidebooks. Check that its abbreviation does not shadow an existing option. Steps in `doc/options.txt`.
- Add a special level: a Lua file in `dat/` and an entry in `dat/dungeon.lua`; if C code must recognise it, an entry in `level_map[]` in `src/dungeon.c`; add the file to `SPEC_LEVS` in `sys/unix/Makefile.top` or it is not installed. A level may be flipped at random unless it sets `noflip`.
- Add a source file: list it in `sys/unix/Makefile.src` (`HACKCSRC`, the object list and the dependency lines) and the other platform build files (`sys/windows/`, Xcode project); a file listed in only one build breaks the others. Also add it to `Files`.
- Add a window port: implement `struct window_procs` per `doc/window.txt`, give it a `wp_` id in `include/winprocs.h`, and register it in `winchoices[]` in `src/windows.c`.
- Add a saved global: put it in an `sv*` group in `include/decl.h` and add a matching write and read in `src/save.c` and `src/restore.c`; the group alone saves nothing. Raise `EDITLEVEL` in `include/patchlevel.h` if saved data changes shape.
- Add a sound library or effect: see the Sound module; a library touches the enum, the registry, `src/mdlib.c` and the build files.
- Add a field to `struct monst` or `struct obj`: if it holds a timer, add it to `mon_catchup_elapsed_time()`; if it must not be copied on a split, add it to `splitobj`; optional structures follow the recipes in `include/mextra.h` and `include/obj.h`.
- Record every player-visible fix in `doc/fixes5-0-1.txt`.

Unverified: this list was derived from reading the Makefiles and headers, not from making the changes.

## Deployment

Releases are source distributions made by the DevTeam; the repository has no release scripts.

`sys/unix/Makefile.top` has targets for building a distribution tree (`package`, `distrib`, `manpages`). Version numbers live in `include/patchlevel.h` and `DEVEL/VERSION`. Unverified: the DevTeam's actual release procedure is not documented in the repository.
