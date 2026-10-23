# L2 Architecture

## Tech stack

C99, a little C++ for platform libraries, and an embedded Lua 5.5 interpreter.

- C99 for the game (`include/cstd.h`, `README`): one portable code base. 4-space indentation, 78 columns (`DEVEL/code_style.txt`).
- C++ only where a platform library needs it, for example `sys/share/cppregex.cpp` and `win/Qt/`.
- Lua, vendored in `nhlua/lua/`: levels, dungeon layout, themed rooms and quest text are data scripts, replacing the old yacc/lex compilers (`README`).
- Make with a "hints" system for Unix (`sys/unix/`); GNUmakefile, nmake and Visual Studio files on Windows (`sys/windows/`).
- Optional libraries: curses, X11, Qt for windows; FMOD and platform sound libraries (`sound/`).

## Project structure

Shared code is in `src/` and `include/`; platform code is in `sys/` and `win/`.

```
nethack/
  src/        game code shared by all platforms (about 130 C files)
  include/    headers: hack.h is the common one, extern.h the prototypes
  dat/        data and Lua scripts: levels, dungeon.lua, quest.lua, help text
  util/       build-time tools: makedefs, dlb_main, recover, sfctool, tile tools
  sys/        operating-system layers: unix, windows, msdos, amiga, vms, libnh, share
  win/        window ports: tty, curses, Qt, X11, win32, chain, shim
  sound/      sound libraries
  nhlua/      the vendored Lua source and its update script
  doc/        Guidebook, man pages, fixes lists, window.txt, sound.txt, lua.adoc
  DEVEL/      git setup and developer notes for contributors
  test/       Lua test scripts run inside the game in wizard mode
  outdated/   retired ports kept for reference
  submodules/ PDCurses sources (git submodules, empty in a plain snapshot)
```

## Subsystems

The game has these major parts; the L3 module of the same name describes each.

- Game loop and startup: `src/allmain.c`; `main()` lives in the platform layer (`sys/unix/unixmain.c`).
- Global state: `src/decl.c` and `include/decl.h`.
- Commands and options: `src/cmd.c`, `src/options.c`, `src/cfgfiles.c`.
- Hero and actions: movement, combat, items in use, `src/hack.c`, `src/uhitm.c`, `src/worn.c`, `src/invent.c`.
- Monsters: `src/mon.c`, `src/monmove.c`, `src/mhitu.c`, `src/makemon.c`, `include/monsters.h`, pets in `src/dog*.c`.
- Objects: `src/objects.c`, `include/objects.h`, `src/mkobj.c`, `src/objnam.c`.
- Level generation and dungeon: `src/mklev.c`, `src/sp_lev.c`, `src/dungeon.c`.
- Lua integration: `src/nhlua.c`, `src/nhlobj.c`, `src/nhlsel.c`.
- Display and vision: `src/display.c`, `src/vision.c`, `src/light.c`, `src/glyphs.c`.
- Window ports: `src/windows.c`, `include/winprocs.h`, `win/`.
- Save and restore: `src/save.c`, `src/restore.c`, `src/sfstruct.c`, `src/sfbase.c`, `src/bones.c`.
- Platform layers and build: `sys/`, `util/`, `dat/Makefile` generation.
- Sound: `src/sounds.c`, `include/sndprocs.h`, `sound/`.

```
 sys/<os>/ main()  --->  allmain.c: early_init, newgame or dorecover, moveloop
                                |
        +-----------------------+------------------------+
        |                       |                        |
   cmd.c commands          monsters (mon.c)         level (mklev.c, sp_lev.c)
   hack.c hero moves       monmove.c, mhitu.c       dungeon.c, Lua scripts (dat/)
        |                       |                        |
        +-----------+-----------+------------------------+
                    |
              display.c, vision.c   (glyphs for what the hero sees)
                    |
              windowprocs table   ---> win/tty | curses | Qt | X11 | win32 ...
                                         (win/chain wraps it; win/shim for libnh)
```

## Data flow

Keys become commands, commands change state, and state flows back out as glyphs and messages.

1. `rhack()` in `src/cmd.c` takes the next command from the command queue, or else from `parse()`, which reads a key through `readchar` and the window port.
2. `rhack()` finds the key in a runtime binding list (`gc.Cmd.cmdbinds`), which maps it to a row of the command table, and calls the handler.
3. A handler that uses time returns `ECMD_TIME`, which makes `rhack()` set `svc.context.move`. On the next pass, `moveloop_core()` in `src/allmain.c` first pays for that action: monsters move and timers run (`src/timeout.c`). Then it reads the next command.
4. Changes call `newsym()` (`src/display.c`); `vision_recalc()` (`src/vision.c`) decides what the hero can see.
5. Glyphs and messages (`pline`, `src/pline.c`) go through `windowprocs` to the active window port.

One call of `moveloop_core()` is one pass, not one turn: the time of the previous action, then one input. A turn ends only when the hero and every monster are out of movement points. See the L3 module "Game loop and startup".

### Scenario

One example: the hero moves one square east in the tty interface.

1. `unixmain.c` has already called `moveloop()`, which calls `moveloop_core()` repeatedly.
2. `rhack()` maps `l` to the move handler; `domove()` in `src/hack.c` checks for monsters and terrain.
3. The hero's position changes, `vision_recalc()` runs, `newsym()` marks changed squares.
4. `flush_screen()` makes the tty port print the changed squares; monsters then move.

## Data model

A few big structures: the hero, the current level, monster and object chains, the dungeon table.

- `struct you` (`u`, `include/you.h`): the hero. The hero is also a `struct monst`, `gy.youmonst`, which shared monster code receives.
- The map `levl[x][y]` (`include/rm.h`) and the current level record `svl.level` (`include/decl.h`): an 80 by 21 grid (`COLNO`, `ROWNO` in `include/global.h`) with object lists per square.
- `struct monst` (`include/monst.h`) and `struct obj` (`include/obj.h`): linked lists. A monster is on the level, migrating or travelling with the hero; an object is in one of ten places named by `obj->where`. Per-type data is `permonst` (`include/permonst.h`, data in `include/monsters.h`) and `objclass` (`include/objclass.h`, data in `include/objects.h`). Both tables are runtime copies; `objects[]` is rewritten per game and saved.
- `svd.dungeons` and the level ledger (`include/dungeon.h`, `src/dungeon.c`): which dungeons exist and how deep.
- Globals: `g*` structures hold engine state, `sv*` structures state that belongs to a saved game (`include/decl.h`). The prefix saves nothing: every saved field is written by hand. The hero `u`, `flags` and `iflags` are plain globals outside both.

## Recurring patterns

Four habits explain why a small change often has side effects.

- One header, several expansions (X-macros): `include/objects.h`, `include/monsters.h`, `include/optlist.h`, `include/defsym.h`, `include/seffects.h` and `include/artilist.h` are each included several times with different macros. Entry order is the numbering.
- Tables mirrored by hand: `struct window_procs` and `struct chain_procs`, `soundlib_choices[]` and `enum soundlib_ids`, `defsyms` and `altlabels[]`, the save and restore routines. The compiler does not catch a mismatch.
- Orders written in comments: `newgame()` start-up order, the glyph enum, skill numbers, dragons, `makelevel()` steps. Nothing enforces them.
- State passed in globals: hero direction (`u.dx`), attack position (`gb.bhitpos`), the pending action (`ga.afternmv`), the speaker (`gv.voice`).

Each L3 module lists the traps that apply to it.

## State and persistence

A save holds the `sv*` globals, the hero, the dungeons and every visited level.

- The game always writes the `historical` format, a raw dump of C structs. `exportascii` exists only in the offline utility `sfctool`.
- While the game runs, each level that was left is written to a level file (`create_levelfile` in `src/files.c`); saving gathers them (`src/save.c`) and restoring splits them out again (`src/restore.c`). Saving frees the running game, and a save is deleted when restored (except in wizard and explore mode).
- Not saved: window state and most `g*` globals, though a few `g*` members are saved by their own routines (inventory, migrating monsters). The only Lua data saved is the `nh_lua_variables` table.
- Time values are saved relative to the current turn. A change to a saved structure needs `EDITLEVEL` in `include/patchlevel.h` raised.

## Configuration layers

Behaviour is set at build time, by a system file, and by the player's file.

- Build time: `include/config.h`, `include/unixconf.h` and the like, overridden by `sys/unix/hints/` variables such as `WANT_WIN_CURSES=1`.
- System: the `sysconf` file (shared settings, wizard-mode user list, limits), read by `src/sys.c` and `src/cfgfiles.c`.
- Player: `.nethackrc` or equivalent, read in `src/cfgfiles.c`, which hands `OPTIONS=` lines to `src/options.c`; the in-game `O` command uses the same parser.
- Environment variables and command-line flags such as `-D`, `-X`, `-u` (`doc/nethack.txt`). `NETHACKOPTIONS` may hold options or name a file.
- Order of precedence, last wins: built-in default, sysconf, RC file, `NETHACKOPTIONS`, command line, then play (`enum option_phases`, `include/global.h`).

## Extension points

New window systems, sound libraries and Lua scripts plug in without touching the core.

- Window port: fill a `struct window_procs` (`include/winprocs.h`), described in `doc/window.txt`. Two other tables must mirror it by hand.
- Sound library: fill a sound-procs table (`include/sndprocs.h`), described in `doc/sound.txt`, which is partly out of date. Adding one touches about five places.
- Lua: a script API under the `nh` and `des` tables (`doc/lua.adoc`).
- Regular expressions: one of three interchangeable files in `sys/share/` (`DEVEL/code_features.txt`).

## Trust and safety boundaries

Lua scripts run in a sandbox; save and bones files are trusted input, with some checks.

- The sandbox (`NHL_SANDBOX` in `include/config.h`, `nhl_sandbox_info` in `include/global.h`) removes risky Lua libraries (no `io`, `os`, `package`, `debug`, `load`) and limits memory and instruction counts. Running out of instructions always panics.
- A script error is fatal by policy: nearly every call into Lua panics on failure. Treat a script as part of the program.
- Wizard mode (`-D`) is gated by the `WIZARDS` list in `sysconf` where SYSCF is enabled.
- A save file carries Lua source text that is run on restore (inside the sandbox). Restore checks the version, feature bits, structure sizes and the owner (`CHECK_SAVE_UID`, default on); struct contents are not range-checked, and a truncated save inside a level is only partly guarded.

## Outside interfaces

The game has a command line, config files, data files and an optional library build.

- CLI flags in `doc/nethack.txt`; utilities `recover` (rebuild a crashed game, needs `INSURANCE` in `include/config.h`) and `sfctool` (convert the save file format), both in `util/`.
- File formats: save, bones, level files, record and logfile, the `dlb` data library (`util/dlb_main.c`).
- Library build: `sys/libnh/` produces `libnethack.a` or a WebAssembly module for other programs.
