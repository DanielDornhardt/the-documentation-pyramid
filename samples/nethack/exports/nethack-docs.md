**Table of contents**

- [L1 Vision](#l1-vision)
  - [What is NetHack?](#what-is-nethack)
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
  - [Recurring patterns](#recurring-patterns)
  - [State and persistence](#state-and-persistence)
  - [Configuration layers](#configuration-layers)
  - [Extension points](#extension-points)
  - [Trust and safety boundaries](#trust-and-safety-boundaries)
  - [Outside interfaces](#outside-interfaces)
- [L3 Modules](#l3-modules)
  - [Game loop and startup](#game-loop-and-startup)
    - [Startup](#startup)
    - [Time](#time)
    - [Traps in the loop](#traps-in-the-loop)
  - [Global state](#global-state)
    - [Saving is per field](#saving-is-per-field)
    - [Initialisation](#initialisation)
    - [Traps in global state](#traps-in-global-state)
  - [Commands and options](#commands-and-options)
    - [Commands](#commands)
    - [Options](#options)
    - [Traps in commands and options](#traps-in-commands-and-options)
  - [Hero and actions](#hero-and-actions)
    - [The hero is two structures](#the-hero-is-two-structures)
    - [Design](#design)
    - [Traps in hero code](#traps-in-hero-code)
  - [Level generation and dungeon](#level-generation-and-dungeon)
    - [Which generator runs](#which-generator-runs)
    - [Dungeon placement](#dungeon-placement)
    - [Ordinary levels](#ordinary-levels)
    - [Themed rooms](#themed-rooms)
    - [Special levels](#special-levels)
  - [Lua integration](#lua-integration)
    - [States](#states)
    - [Sandbox](#sandbox)
    - [Traps in Lua integration](#traps-in-lua-integration)
  - [Monsters](#monsters)
    - [Where a monster is](#where-a-monster-is)
    - [Rules the code defends](#rules-the-code-defends)
    - [Adding a species](#adding-a-species)
  - [Objects](#objects)
    - [The kind table](#the-kind-table)
    - [Live items](#live-items)
  - [Display and vision](#display-and-vision)
    - [Display](#display)
    - [Vision](#vision)
  - [Window ports](#window-ports)
    - [The function table](#the-function-table)
    - [Selection and hangup](#selection-and-hangup)
    - [Chain and shim](#chain-and-shim)
  - [Save and restore](#save-and-restore)
    - [Format](#format)
    - [Version checks](#version-checks)
    - [Saving and the running game](#saving-and-the-running-game)
    - [Traps in save and restore](#traps-in-save-and-restore)
  - [Platform layers and build](#platform-layers-and-build)
    - [Unix Makefiles](#unix-makefiles)
    - [makedefs and data](#makedefs-and-data)
    - [The mains](#the-mains)
  - [Sound](#sound)
    - [How events work](#how-events-work)
    - [Selecting a library](#selecting-a-library)
    - [Traps in sound](#traps-in-sound)
- [L4 Operations](#l4-operations)
  - [Git workflow](#git-workflow)
  - [Setup](#setup)
  - [Testing](#testing)
  - [Debugging](#debugging)
  - [Change recipes](#change-recipes)
  - [Deployment](#deployment)

---

<!-- source: L1-vision.md -->
# L1 Vision

## What is NetHack?

NetHack is a single-player dungeon exploration game, written in C, whose source is this repository.

The source is the 5.0.1 work-in-progress line of NetHack 5.0 (`README`). It is not a release: the README tells players to use 5.0.0 when stability matters. Some file headers and documents still say 3.7, the earlier name of this line (for example `DEVEL/Developer.txt`). The game descends from Rogue and Hack and from NetHack 3.6. One C99 code base builds the game for many operating systems and several user interfaces. It is free to redistribute under the NetHack General Public License (`dat/license`).

## Who is it for?

Developers and agents who change the game code, its build or its ports; not players.

Typical readers: someone fixing a bug in monster behaviour, someone adding an item or a level, someone porting to a new platform or window system. Players read `doc/Guidebook.txt`, which this documentation does not replace.

## Core concepts

Five ideas explain the rest: hero and dungeon, movement points, window ports, Lua, platform layers.

- The hero and the dungeon: one hero, a set of generated or scripted levels, and the monsters and objects on them.
- Turns by movement points: the hero and each monster earn movement points per turn and act when they have enough.
- Window port: the game core never draws; it calls a table of functions that a user interface supplies.
- Lua scripts: special levels, the dungeon layout, themed rooms and quest text are Lua files in `dat/`, run by the game.
- Platform layer: `sys/` holds the operating-system code; `src/` stays portable.

## Success

The project works when the same source builds and plays correctly on every supported platform.

Supported means: Linux, macOS and Windows build natively; MS-DOS and AmigaOS are cross-compiled; OpenVMS has had some success (`README`). Release stability is judged by the NetHack DevTeam, not by an automated test suite (see the Testing section in L4).

## Direction

The line is heading to a 5.0.1 release with bug fixes for 5.0.0.

`doc/fixes5-0-1.txt` lists the fixes as they are committed. Cross-compiling, Lua-based content and a pluggable save format are recent architecture work (`README`, `Cross-compiling`).

## Non-goals

The project deliberately does not offer support for free-lanced patches or hints on how to play.

- No hints for playing the game and no release dates (`README`).
- No support for unofficial patches applied to this code (`README`).
- Variants are separate projects; `DEVEL/Developer.txt` tells variant authors to check their own documentation.
- No binary save or bones files in bug reports (`README`).

---

<!-- source: L2-architecture.md -->
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

---

<!-- source: L3-modules.md -->
# L3 Modules

## Game loop and startup

The game loop and startup code set up a game, then run turns forever in `moveloop()`.

It lives in `src/allmain.c`. `main()` is not here: each platform layer has its own (`sys/unix/unixmain.c`, `sys/windows/windmain.c`, `sys/libnh/libnhmain.c`, `sys/share/pcmain.c`, `sys/vms/vmsmain.c`, `sys/mac68k/macmain.c`). They share only `early_init()` and `moveloop(resuming)`; startup code added to one main is not in the others. `unixmain.c` and `libnhmain.c` carry copies of the same startup block, kept in step by hand.

| File | Role |
|---|---|
| `src/allmain.c` | `early_init`, `newgame`, `welcome`, `moveloop`, `moveloop_core` |
| `sys/unix/unixmain.c` | Unix `main()` and argument handling |
| `src/end.c` | game over, scoring, disclosure |

### Startup

`main()` parses early options, takes the lock file (`getlock()`), starts the window port and the data library, then tries `dorecover()` first and calls `newgame()` only if nothing was restored. Role selection can rename the hero; the save and lock files are named after the hero, so `unixmain.c` jumps back to the label `attempt_restore` (a `goto`) to try again.

`newgame()` order is stated in comments and enforced by nothing: `init_objects()` before `u_init()`, `role_init()` before `init_dungeons()`, `u_init()` and `init_artifacts()`, `init_dungeons()` before `u_init()` so that starting tins and eggs do not get odd monsters. A reorder compiles and misbehaves.

### Time

`moveloop_core()` is one pass, not one turn. Its first half pays for the action already taken: monsters move, and only when hero and monsters are all out of movement does a new turn start. Its second half refreshes the screen and reads the next command (`rhack(0)`). It is called from `moveloop()` and from the Lua binding `nh.doturn()` (`doc/lua.adoc`); the source gives no reason for the split.

Three time scales nest, each with a banner comment in `src/allmain.c`:

* Turn ("once-per-turn"): `svm.moves` rises once all movement is spent. The name is misleading; it counts turns. The counter is capped at 1,000,000,000 ("The dungeon capitulates").
* Hero action ("once-per-hero-took-time"): `u.umovement -= NORMAL_SPEED`. A fast hero acts several times per turn. `gh.hero_seq` identifies one action and is recomputed on restore.
* Player input ("once-per-player-input"): runs even when no time passed.

Put a new effect in the block that matches the scale it needs.

Speed is movement points: `u_calc_moveamt()` for the hero, `mcalcmove()` in `src/mon.c` for monsters. An actor moves while it has at least `NORMAL_SPEED` (12). Monster speed is rounded to a multiple of 12 at random, so there is no predictable free turn and no "melee kiting". The comments in `src/mon.c` list the guarantees to keep: shopkeepers are not outsped by a normal-speed player, and a normal-speed player cannot open a gap when fleeing a normal-speed monster. Hero speed uses another scheme: intrinsic Fast adds a move on 1 of 3 turns, Very fast on 2 of 3.

### Traps in the loop

* `svc.context.move` is the gate for time. `parse()` sets it before every command; a command that takes no time must clear it. Forgetting gives monsters a free turn; clearing wrongly gives the hero free actions.
* Occupations and counted commands return from `moveloop_core()` early, without calling `rhack()`. Code added at the end of the function does not run on those passes.
* `mvl_wtcap` and `mvl_change` are file-level statics that survive between passes and are not saved. A delayed polymorph pending at save time is probably lost (unverified).
* With `SAFERHANGUP`, `hangup()` only counts; the loop ends the game itself at a safe point (`end_of_input()`).
* `moveloop_preamble(resuming)` differs for new and restored games: a new game gets `u.umovement = NORMAL_SPEED`, a restore reads engravings and fixes shop damage. Luck changes for the moon phase and Friday the 13th apply to both.

## Global state

Global state lives in `include/decl.h` and `src/decl.c`, in groups by first letter of the name.

Most game state is grouped in structures named after a letter: `ga.`, `gb.`, ... `gz.` for engine state "that does not need to be persisted upon game exit", and `svb.`, `svc.`, ... `svy.` for state that belongs to a saved game. Examples: `svc.context` (game context), `svl.level` (current level), `svd.dungeons`. The letter is the first letter of the member name, by convention; it is not a subsystem boundary (`gc` holds command, colour, crash, pickup and sound state side by side). The comment `/* pickup.c */` inside each struct names the owner.

Not everything is in a group. The hero `u`, `flags`, `iflags`, `a11y`, `disp`, `program_state`, `level_status`, the worn-item pointers (`uwep`, `uarm`, ...) and the `WIN_*` window ids are plain globals. `flags` is declared in `include/flag.h`, not `decl.h`.

### Saving is per field

The group prefix saves nothing. `savegamestate()` in `src/save.c` writes a list of named fields (`Sfo_long(&svm.moves)`, `Sfo_context_info(&svc.context)`, ...), and other `sv*` members are written by their own modules (`src/dungeon.c`, `src/timeout.c`, `src/rumors.c`, `src/o_init.c`, `src/region.c`). A new `sv*` field with no matching `Sfo_`/`Sfi_` pair is silently not saved. The reverse also holds: some `g*` members are saved through their own routines (`gi.invent`, `gm.migrating_objs`, `gm.migrating_mons`, `gg.gamelog`).

### Initialisation

`decl_globals_init()` assigns each group from a `static const` template (`g_init_X`, `init_svX`). Initialisers are positional, so field order must match `decl.h`. For the `g` groups a check catches a misaligned list: every `g*` struct ends in `boolean havestate`, the template must set it `TRUE`, and `MAGICCHECK` exits with "decl_globals_init: %s.havestate not True." The `sv*` structs have no such check.

### Traps in global state

* `gh.havestate` has a second meaning in `savestateinlock()` (`src/save.c`): "a full checkpoint was written last time". Do not clear it for other reasons.
* `decl.h` still declares `extern char tune[6]`, but the object is `svt.tune`. Using `tune` is a link error.
* `src/restore.c` and `util/sfctool` compile the same code with `-DSFCTOOL`; a change to `savegamestate()` or `restgamestate()` must also build in that reduced mode.

## Commands and options

Commands turn keystrokes into game actions, and options let players change behaviour.

Commands are in `src/cmd.c` (about 5,700 lines, also key binding, repeat, `getdir()`, `#travel` and the `#` menu). Wizard-mode commands are in `src/wizcmds.c`, information commands in `src/insight.c`, position prompts in `src/getpos.c`. Options are defined in `include/optlist.h` and parsed in `src/options.c` (over 10,000 lines). `src/cfgfiles.c` reads the config file: it dispatches every statement (`OPTIONS`, `BIND`, `MSGTYPE`, `MENUCOLOR`, `SYMBOLS`, ...) and passes only `OPTIONS` lines to `parseoptions()`.

### Commands

`extcmdlist[]` is the table of commands: name, description, handler, flags and the text shown while a counted command runs. Its key column is only the default. `commands_init()` copies the keys into a runtime list, `gc.Cmd.cmdbinds`, and `rhack()` finds a typed key there (`cmdbind_get`). `BIND=` lines, the key-binding option, `number_pad` and `rest_on_space` all edit that list while the game runs. So a key does not tell you the table row, and a row does not tell you its key.

`rhack()` reads no key itself. It pops the command queue first and calls `parse()` (count and `readchar()`) only if the queue is empty.

Handlers return `ECMD_OK`, `ECMD_TIME`, `ECMD_CANCEL` or `ECMD_FAIL`. Only `rhack()` turns `ECMD_TIME` into game time; a handler that forgets it costs no time. `ECMD_CANCEL` and `ECMD_FAIL` wipe the queued commands. Table flags are checked in different places:

* `IFBURIED`, `WIZMODECMD`, `NOFUZZERCMD`: `can_do_extcmd()`.
* `CMD_M_PREFIX`, `CMD_gGF_PREFIX`: `rhack()` refuses a prefix key in front of a command without the bit.
* `AUTOCOMPLETE`: set by hand, because a completable name makes shorter prefixes ambiguous (`#exploremode` is left out so `#e` still means `#enhance`).
* `GENERALCMD`: grouping for the key list only. Despite a comment in `include/func_tab.h`, it does not mean "takes no time".

`NOFUZZERCMD` marks anything that blocks, exits or does file I/O (`#quit`, `#save`, `#shell`, the loaders). The debug fuzzer feeds random keys and refuses flagged commands; a new command that exits or waits on a human needs the flag. Options have the equivalent `set_wiznofuz`.

Repeat (`^A`) replays commands, not keystrokes. Two queues exist (`CQ_CANNED`, `CQ_REPEAT`, `include/hack.h`). Every command appends its handler to `CQ_REPEAT`, and prompts append the key they read. `CQ_CANNED` lets code act "as if the player typed" a command (apply from the inventory menu, autodig, Lua key input).

### Options

`optlist.h` has no code. `src/options.c` includes it three times with different macros (`NHOPT_PROTO`, `NHOPT_ENUM`, `NHOPT_PARSE`). Entry kinds: `NHOPTB` boolean, `NHOPTC` compound, `NHOPTP` prefix family, `NHOPTO` other. To add an option, follow the steps in `doc/options.txt`:

* A non-boolean option needs an `optfn_<name>()` function, or the build fails. A boolean needs a variable (`addr`); side effects go in the `switch` blocks of `optfn_boolean`.
* Put the variable in `flags` (saved; a change may need `EDITLEVEL` in `include/patchlevel.h` raised, see `include/flag.h`) or `iflags` (not saved).
* Update the short help (the `descr` string, `option_help()`), `dat/opthelp` and the Guidebooks (`doc/Guidebook.mn`, `.tex`, `.txt`). No tool checks this (unverified).

The config file, the `NETHACKOPTIONS` variable, the command line and the `O` menu all go through `parseoptions()`. The menu builds a string like `name:value` and calls it. Each option function must work in four request modes (`do_init`, `do_set`, `get_val`, `do_handler`) and in startup and play. `go.opt_phase` (built-in, sysconf, RC file, environment, command line, play) records who set a value last.

### Traps in commands and options

* Abbreviations are computed at startup (`determine_ambiguities()`): the shortest unique prefix, at least 3 characters. A new option that shares a prefix raises the minimum for the old one, and a user's `OPTIONS=autop` can stop working. `parseoptions()` strips a leading `no` or `!`, so no option name may start with `no`.
* Comma lists are processed right to left. `windowtype` must be handled before interface options, which is why it is first in `optlist.h`.
* `#saveoptions` rewrites the whole RC file and drops comments, ordering and anything it cannot write. It is marked experimental in the code.
* `number_pad` ends in `reset_commands(FALSE)`, which rebinds movement keys and backs up what was bound to them.
* The `run` and `rush` words differ by route. The table names `G` `#run` (`context.run = 3`) and `g` `#rush` (2); the direction keys are the other way round (Shift is `#run<dir>`, mode 1; Ctrl is `#rush<dir>`, mode 3). The comment in `include/context.h` is out of date.
* A Lua callback `cmd_before` can veto a command by name (`can_do_extcmd()`); renaming a command escapes a Lua blacklist, and the veto prints no message of its own.
* `mention_decor` is applied late on purpose, after the tutorial question, by re-reading the RC file with every other option switched off (`rcfile_only_this_option`).
* Unverified: whether the sysconf file is read twice on a normal Unix start (`initoptions_init()` and `initoptions()` both contain the read).

## Hero and actions

Hero code covers movement, fighting, items in use, skills, spells and religion.

Spread over many files: movement and terrain in `src/hack.c`, melee in `src/uhitm.c`, throwing in `src/dothrow.c`, kicking in `src/dokick.c`, eating in `src/eat.c`, wearing in `src/do_wear.c`, equipment slots and properties in `src/worn.c`, wielding in `src/wield.c`, applying tools in `src/apply.c`, reading in `src/read.c`, potions in `src/potion.c`, zapping in `src/zap.c`, spells in `src/spell.c`, prayer in `src/pray.c`, polymorph in `src/polyself.c`, riding in `src/steed.c`, ball and chain in `src/ball.c`, theft in `src/steal.c`. Roles and races: `src/role.c`, starting equipment: `src/u_init.c`, attributes: `src/attrib.c`, experience: `src/exper.c`. Shops (`src/shk.c`), temples (`src/priest.c`) and the quest (`src/quest.c`, text in `dat/quest.lua`, read by `src/questpgr.c`) react to the hero's actions.

### The hero is two structures

The hero is `struct you` (`include/you.h`), global `u`, and also a `struct monst`, `gy.youmonst`. Shared monster routines (attack effects, armour, light, hiding) are called with `&gy.youmonst`. Role and race are `gu.urole` and `gu.urace`. While polymorphed (`Upolyd`) hit points are `u.mh` and `u.mhmax`, not `u.uhp`. Movement points are in `u.umovement`, deliberately not in `youmonst.movement`. The split is known to be unfinished (`umonst` in `you.h`).

### Design

* Direction and target travel through globals, not arguments: `u.dx`, `u.dy`, `u.dz` and `gb.bhitpos`. `do_attack()` states "u.dx and u.dy must be set". A caller that reuses an attack routine without setting them (`src/dig.c` does) attacks the wrong square.
* A multi-turn action is `nomul(-n)` plus one global completion function, `ga.afternmv`. There is room for exactly one. Other code finds out what the hero is busy with by comparing `afternmv` to a function (`do_wear.c`, `weight_cap()` in `hack.c`). Anything that interrupts must clear it first (`stop_donning()`, `cancel_don()`, `steal.c`). `unmul()` clears it before the call because the function may set a new one.
* Armour is slotted at the start of donning (`setworn()`) but its effects wait for `Armor_on()` at the end. Levitation boots need a special case in `weight_cap()`; an interrupted donning has its own cleanup.
* `setworn()` and `setnotworn()` are the only writers of the slot pointers and of `u.uprops[p].extrinsic`, a bit set of the slots that grant a property. Writing `u.uprops` directly breaks the invariants that the `sanity_check` option reports as "Worn-slot insanity". `w_blocks()` allows one blocking item per property.
* `domove_core()` is an ordered chain of early refusals (luggage, swallowed, ice, confusion, trap avoidance, sticky monster, attack, iron bars, web, steed, rooted, `test_move`, ball and chain). The order decides which refusals cost time (`svc.context.move = 0` makes a step free). Moving a check across another changes that. The position changes in two steps: tentatively, then `u_on_newpos()` once a pet swap is known to work.
* `overexertion()` (hunger, HP loss when heavily encumbered) is charged in `do_attack()`, after `attack_checks()`, so declining to hit a peaceful costs nothing. Kicks, throws and spells do not pay it.
* Safe-pet protection is in `do_attack()`. Moving into a pet or peaceful monster swaps places unless a listed exception holds (Punished, a 1 in 7 roll, a long worm tail, hero in rock, pet in a tended shop). It is off while blind, confused, hallucinating or stunned. Stormbringer ignores it.
* One attack-effect table serves three directions. The `mhitm_ad_*` handlers in `src/uhitm.c` take `(magr, mattk, mdef, mhm)` and branch on hero attacks monster, monster attacks hero, monster attacks monster. `mhitu.c` and `mhitm.c` call `mhitm_adtyping()`. Editing one handler changes all three. `gazemm()` passes a NULL result struct to `mhitm_ad_blnd`.
* Hit processing is split so that the message is chosen before damage is applied (`struct _hitmon_data` in `you.h`). `first_weapon_hit()` must run before `xkilled()` to keep the gamelog in order, and `hmon()` may destroy the weapon, so callers save what they need first.
* Skill numbers in `include/skills.h` are an ordered contract: positive for hand-to-hand weapons and launchers, negative for ammunition, ranges tested with `<=`, and `weapon.c` and `oc_subtyp` depend on the order. No compile-time check was found (unverified).
* Attribute training (`exercise()`, `exerchk()` in `src/attrib.c`) is statistical: it runs every 800 to 999 turns, halves the stored value each time and covers only Str, Con, Dex and Wis. Adding or removing an `exercise()` call changes growth over thousands of turns without a local symptom.
* Starting inventory is created after the first level (`u_init_inventory_attrs()` called from `allmain.c`) and may be rerolled by the `reroll` option, so it must be idempotent. Once-only effects are in `u_init_skills_discoveries()`. `ini_inv` relies on object-class creation order to avoid polymorph plus polymorph control.
* Prayer sets `u.uinvulnerable` for the three turns of `nomul(-3)` only when the outcome is good and the hero is not in Gehennom. `nomul()` normally clears the flag; the early return when `multi < nval` keeps it alive (inferred). Trouble priorities are the order of checks in `in_trouble()`, "keep that code and these values synchronized". A sacrifice cannot raise Luck above the offering's value (balance rule, `src/pray.c`).
* Spell memory is a countdown from `KEEN` (20000 turns) in `src/spell.c`; the status thresholds are fractions of it.

### Traps in hero code

* `restore_attrib()` in `src/attrib.c` is dead code; do not use it as a model for timed attribute loss.
* `src/uhitm.c` (6,447 lines) and `src/trap.c` (7,221 lines) are both larger than `src/shk.c` (6,147).
* The kick, throw, apply, eat, read, zap and potion code was not read for the deep dive. Treat its rules as unverified.

## Level generation and dungeon

Levels are generated at first visit, by random code in `src/mklev.c` or from a Lua script.

The dungeon's shape (branches, depth ranges, special level positions) is `dat/dungeon.lua`, read once per game by `init_dungeons()` in `src/dungeon.c` and then saved. Special levels are built by their Lua scripts through `src/sp_lev.c`; ordinary levels from rooms. Timers (`src/timeout.c`), light sources (`src/light.c`) and gas regions (`src/region.c`) are per-level state. `src/stairs.c` holds the stairway list; branch placement is `place_branch()` in `src/mklev.c`.

### Which generator runs

`makelevel()` in `src/mklev.c` tries, in order:

1. A level in the special-level chain, except the Rogue level, goes to `makemaz(slev->proto)`.
2. A dungeon with a `protofile` (Vlad's Tower) goes to `makemaz("")`, with the level number appended (`tower1`).
3. A dungeon with a `lvlfill` (Mines, Gehennom fillers) goes to `makemaz(fill_lvl)`.
4. Quest levels build a filler name from the role (`<role>-fila` or `-filb`).
5. Gehennom, and 80 percent of main-dungeon levels below Medusa, go to `makemaz("")` (unverified for the whole range).
6. Otherwise the room-and-corridor code runs. The Rogue level takes this path too, via `makeroguerooms()`.

Despite its name, `makemaz()` in `src/mkmaze.c` is the loader for every scripted level: it builds the file name, calls `load_special()`, and makes a random maze only if the script fails to load. A level with `nlevels` variants gets `-N` appended (`minetn-3`). In wizard mode `SPLEVTYPE` forces a variant, and a level `chance` (only `bigrm`, 40) is ignored, so wizard games always have the big room. A dungeon-level `chance` is implemented in `init_dungeon_dungeons()` but no shipped dungeon sets it.

### Dungeon placement

`init_dungeons()` rolls each dungeon's length, then `place_level()` places every special level by recursive backtracking inside its base/range window (negative `base` counts from the bottom). If nothing fits, `panic("init_dungeon:  couldn't place levels")`: an edit to `dat/dungeon.lua` windows can make every new game fail at start.

`level_map[]` in `src/dungeon.c` maps Lua level names to C globals (`oracle_level`, `stronghold_level`, ...) behind `Is_medusa_level()`, `Is_stronghold()` and similar. A level added only to `dat/dungeon.lua` is placed and generated but has no C identity until it is added there.

Three numbers are not the same: `ledger_no()` is a game-wide running number (level files, bones, save); `depth()` is `depth_start + dlevel - 1`; `level_difficulty()` adds a correction in "builds-up" branches (Sokoban, Vlad's Tower) and uses the deepest level reached when the hero carries the Amulet. Monster and special-level code should use `level_difficulty()`.

### Ordinary levels

The order in `makelevel()` is load-bearing: rooms, `sort_rooms()`, stairs, corridors, niches, vault, at most one special room, branch, fill.

* `sort_rooms()` orders rooms left to right because `makecorridors()` joins room N to N+1. It rewrites `roomno`, so room numbers stored before the sort go stale.
* Special rooms are chosen after corridors: `mkshop()` needs a room with exactly one door and no stairs. `do_mkroom()` and `mkzoo()` only set the type; stocking happens at the end through `fill_special_room()` in `src/sp_lev.c`.
* Rooms are placed from a list of free rectangles (`src/rect.c`). The functions that size and test a room, `create_room()` and `check_room()`, and the corridor digger `dig_corridor()` live in `src/sp_lev.c`, not `mklev.c`.
* Corridors: pass 1 joins a to a+1, pass 2 joins a to a+2 if not yet connected, pass 3 joins any disconnected pair. Pass 1 to 3 guarantee connectivity. A fourth pass adds dead ends and boulder corridors on purpose. `mklev_sanity_check()` reports "room %i not connected?" when `sanity_check` is on.
* The Fort Ludios branch is created lazily by `mk_knox_portal()`, from a vault on a main-dungeon level deeper than 10 and above Medusa, with a 1 in 3 roll (always in wizard mode). A game can have no way to Ludios.
* `bound_digging()` makes the outer walls non-diggable and non-phaseable, once, at the end. `mineralize()` seeds gold and gems only into stone with stone on all eight sides, and mostly not on special levels.
* `topologize()` stamps `roomno` and shared-wall bits at the end; it skips rooms already stamped.
* `mklev()` reseeds the random number generator before and after a level (`reseed_random`), but only when the seed source is unguessable. The aim: a level's look must not let a player predict later random numbers.

### Themed rooms

`dat/themerms.lua` uses the same `des.*` Lua API as special levels. While `gi.in_mk_themerooms` is set, the meaning changes: rooms default to unfilled, a room or map that does not fit sets `gt.themeroom_failed` instead of shifting, and later `des.room` and `des.map` calls return early. Failure is a flag, not an error, so a `des.*` change that works for special levels can silently break themed rooms. `makerooms()` gives up after 10 failed attempts.

The hooks run in a fixed order: `pre_themerooms_generate`, `themerooms_generate` (repeated), `post_themerooms_generate`, corridors and filling, `post_level_generate`, then a whole-map `wallification`. Rooms added in `post_level_generate` are not joined by corridors.

Each dungeon branch has one persistent Lua state, `gl.luathemes[dnum]` (see Lua integration). Scripts must reset their own variables. A failed load writes `'\0'` into `svd.dungeons[dnum].themerms`, which disables themed rooms for that branch for the rest of the game.

### Special levels

* After a script runs, `load_special()` flips the level at random unless the script says `noflip`, `noflipx` or `noflipy` in `des.level_flags`. Anything that stores absolute coordinates (C fixups, `lregion` data, level-specific code) must go through the same transform. Castle, Oracle and many fillers set `noflip`.
* `fixup_special()` in `src/mkmaze.c` is a patch list for "what the level compiler cannot handle" (the compiler is gone; Lua replaced it): Medusa statues, `baalz_fixup`, graveyard flags, `check_ransacked()` for orc-raided Mine Town ("only works as long as orctown is minetn-1").
* `ensure_way_out()` is opt-in through the `inaccessibles` flag and marked for rewrite. Only `minetn-6.lua` uses it. There is no general connectivity guarantee for scripted levels.
* Caves come from a script, `des.level_init({ style = "mines" })`, which runs `mkmap()` through `splev_initlev()`. The same call requests a random maze, a swamp or Rogue-style rooms.

## Lua integration

Lua scripts drive level creation, the dungeon layout and some game events, inside a sandbox.

The interpreter is vendored in `nhlua/lua/` (Lua 5.5.1, updated with `nhlua/nhlua-update.sh`, no NetHack edits). The glue is `src/nhlua.c` (the `nh` function table, sandbox, `nh.variable`, `nh.callback`), `src/nhlobj.c` (object bindings) and `src/nhlsel.c` (selections). Level-building functions (`des.*`) are in `src/sp_lev.c`. The reference for script authors is `doc/lua.adoc`. The scripts in `dat/` include two library files loaded into every state: `dat/nhlib.lua` and `dat/nhcore.lua`.

### States

Every interpreter is made by `nhl_init(&sbi)`. All callers pass the same policy (`NHL_SB_SAFE`, 1 MiB memory, 1,048,576 steps per call), written out again in each caller (`src/mklev.c`, `src/dungeon.c`, `src/questpgr.c`, `src/sp_lev.c`, `src/wizcmds.c`). There is no shared constant.

* `gl.luacore`: one state for the whole game, loads `dat/nhcore.lua`, holds the saved variables and runs callbacks.
* `gl.luathemes[dnum]`: one per dungeon branch, kept between levels.
* A throw-away state per special level, and one in `init_dungeons()` for `dat/dungeon.lua`.
* A cached quest state, made at the first quest text.
* A `#wizloadlua` state with a 16 MiB budget.

### Sandbox

The sandbox opens a whole Lua library and then sets unwanted functions to nil. `NHL_SB_SAFE` allows only the safe base functions (`ipairs next pairs pcall select tonumber tostring type xpcall`) and `coroutine`, `table`, `string`, `math`, `utf8`. It does not include `error`, `assert`, `setmetatable` and friends, `collectgarbage`, `load`, `dofile`, `io`, `os`, `package` (so no `require`) or `debug`; `print` and `warn` are always removed. Scripts are written in that subset.

* The step limit counts blocks of `NHL_SB_STEPSIZE` (1000) instructions. Running out always panics ("Lua time exceeded"), whatever `NHLpa_*` the caller chose, because the game state may be corrupt. Running out of memory is an ordinary Lua error and does follow the caller's choice.
* `NHL_SANDBOX` off in `include/config.h` removes more than the library filter: the step limit, the version check and the stripping, so `io`, `os` and `debug` are open. Only the memory limit stays. Never do it in a build that loads untrusted scripts.
* The version is pinned to exactly 5.5 (`NHL_MIN_VERSION_NUM_EXPECTED` and `NHL_MAX_VERSION_NUM_EXPECTED`, both 505). Another version panics with "sandbox doesn't know this Lua version". A Lua upgrade means checking the `ct_*` function tables and both constants together.
* Script errors are fatal by policy. Nearly every call into Lua uses `NHLpa_panic` (the `lspo_*` callbacks, theme hooks, `nhcore` calls, callbacks, restore). `NHLpa_impossible` is used for loading a file, `pre_themerooms_generate`, the selection iterator and saving variables. A script is part of the program.

### Traps in Lua integration

* A nested `nhl_pcall` on the same state refills the step budget and leaves a stale `jmp_buf`. `setjmp(nud->jb)` and the counter are per state, and level scripts call back into Lua on the same state (`des.room({ contents = function() ... end })`, `l_selection_iterate`). The limit is therefore per nested call, and an overrun in the outer script jumps into a finished stack frame (undefined behaviour). Derived from the code, not run.
* `dat/nhlib.lua` is loaded into every state. It replaces `math.random` with the game's `rn2`, so scripts share the game's random stream, and it shuffles the global `align` table at load. Creating a state therefore consumes random numbers, and the lazily created quest state makes that point depend on play. The comment in `nhlL_openlibs` saying `math.random` uses Lua's own generator is out of date.
* The only Lua data in a save file is `nh_lua_variables` in `luacore`. It is saved as Lua source text (`get_variables_string`) and run on restore inside the sandbox, which is why the save file counts as trusted input. `nh.variable` accepts string, nil, boolean, number and table; a non-integer number is probably stored as 0 (unverified). Theme states, the quest state and script globals are lost on save.
* Callbacks are stored twice and only one copy is saved. `nh.callback` records the name in `nh_lua_variables._CB_<list>` (saved) and counts in `nhcb_counts[]` (not saved). After a restore, the counts are 0 and the callbacks never run. This is harmless today only because the one user, the tutorial, cannot be saved. Callbacks are found by name in `luacore`'s globals, so they must be defined in `nhlib.lua` or `nhcore.lua`.
* `nhl_loadlua()` reads scripts through `dlb` in 8 KB chunks; a line of 8 KB or more fails the load.
* The file-access hooks (`io.open` with pattern checks, `luapat`) are dead code under `#ifdef notyet`, and the block refers to `NHL_SB_PACKAGE`, which is not defined. The example `mk_dgl_extrainfo` in `dat/nhcore.lua` calls `io.open` and would fail in the sandbox.

## Monsters

Monsters are a table of species plus linked lists of live creatures.

The species struct is `struct permonst` (`include/permonst.h`); the data is `include/monsters.h`, built into `mons[]` by `src/monst.c`. Live monsters are `struct monst` (`include/monst.h`). Creation is `src/makemon.c`, the mover `movemon()` and death in `src/mon.c`, per-monster decisions `src/monmove.c`, attack loops and hit rolls against the hero `src/mhitu.c` and monster against monster `src/mhitm.c`, ranged attacks `src/mthrowu.c`, item use `src/muse.c`, spellcasting `src/mcastu.c`, pets `src/dog.c` and `src/dogmove.c`, helpers `src/mondata.c`. Special cases have their own files: shopkeepers and priests (`src/shk.c`, `src/priest.c`), the Wizard of Yendor (`src/wizard.c`), vault guards (`src/vault.c`), player-monsters (`src/mplayer.c`), minions (`src/minion.c`), lycanthropes (`src/were.c`), long worms (`src/worm.c`), theft (`src/steal.c`).

### Where a monster is

A monster is in exactly one of three places: on the level (`fmon`, which is `svl.level.monlist`, and `svl.level.monsters[x][y]`), migrating (`gm.migrating_mons`, `MON_MIGRATING`) or travelling with the hero (`gm.mydogs`). `mon_sanity_check()` enforces it through `mstate` and `mx`.

* Death does not free. `mondead()` calls `m_detach()`, which sets `mhp = 0` and counts the monster in `iflags.purge_monsters`; `dmonsfree()` frees it later and calls `impossible()` if the counts differ. Code that walks the list must test `DEADMONSTER()`.
* Vault guards are the exception: a dead or departed guard stays at `<0,0>` (`PARKEDMONSTER`) until his corridor is gone. Treating `mx == 0` as "invalid" breaks guards.
* While a monster migrates, `migrate_to_level()` reuses fields as a message to `mon_arrive()`: `mux,muy` are the destination, `mtrack[0..2]` arrival data, `wormno` the tail length. Do not read them as hero position or history.
* Levels that are not occupied are not simulated. `mon_catchup_elapsed_time()` in `src/dog.c` pays back the elapsed time on return. A new per-turn timer field on `struct monst` that is not added there freezes while the hero is away.

### Rules the code defends

* `mons[]` is a runtime copy of `mons_init[]`, made by `monst_globals_init()`. Nothing writes to it any more (the only writers are inside `#if 0`), so treat it as read-only. Per-game variation happens at use time: `getmattk()` in `src/mhitu.c` rewrites the attack on a copy before each use (seduction substitutes, no two disease attacks in one turn, cooldown degrades to a 1d6 claw, cancelled attackers turn physical). Code that reads `mons[x].mattk[i]` directly sees the unsubstituted attack.
* The damage of an attack type is in `src/uhitm.c`: `hitmu()` and `mattackm`/`hitmm` build a `struct mhitm_data` and call `mhitm_adtyping()`, which dispatches to one `mhitm_ad_<type>()` with three branches inside (hero attacks, hero is hit, monster against monster). A new damage type, or a change to fire or drain, is made in all three branches of one function. `mhm.done` ends the attack early.
* Speed is randomly rounded to multiples of 12 in `mcalcmove()`; see Game loop and startup for the guarantees. `worm.c` calls it with `FALSE`, which skips the randomisation.
* Extinction counts births, not deaths. `propagate()` raises `svm.mvitals[].born` (a `uchar`) and sets `G_EXTINCT` at `mbirth_limit()`; uniques are extinct as soon as they are made. `unmakemon()` undoes a rejected creation and refuses to decrement at 255. `mvitals[].died` also divides experience for later kills.
* Monsters know the hero's position only approximately: `mux,muy` is "where the monster thinks you are". `dochug()` calls `set_apparxy()` before the monster decides, because `inrange`, `nearby` and `scared` come from it. `onscary()` uses the real position unless the monster is blind or the hero invisible.
* `dochug()` has four phases: pre-movement, special actions (`tactics`, `find_defensive`, `find_misc`), `m_move`, standard attacks. A monster that moved can still attack in the same turn if it has a ranged or weapon attack; the hero cannot. The code comment asks whether that is fair.
* Monsters play by weaker rules (`src/muse.c`): they read scrolls only when they can see, and innate teleportation is refused on purpose ("you could never catch them"). A first attack-wand shot always misses.
* A pet is a `struct monst` with `mtame > 0` and `EDOG(mon)` in `mextra`. `mextra` also carries `egd`, `epri`, `eshk`, `emin`. Flags `isshk`, `isgd`, `ispriest`, `isminion` mirror which pointer is set. `include/mextra.h` has an 11-step recipe for a new extension; skipping `copy_mextra`, `savemon` or `restmon` corrupts clones and saves.

### Adding a species

* `include/monsters.h` is read three ways (the `PM_` enum, the table, an enum dump). Rule 1 of its header holds: a class is contiguous. Rule 2 (ascending strength) no longer does; `init_mongen_order()` sorts by class and difficulty at first use. Entries from `PM_LONG_WORM_TAIL` on are never generated randomly.
* Dragons are order-bound: gray first, yellow last, the same order as dragon scale mail and scales in `include/objects.h`, and shimmering follows silver for `tilemap`. Reordering is not a local change.
* `difficulty` is filled in by hand. Generation uses it in three unrelated formulas: `rndmonst_adj()` (zlevel/6 up to (zlevel + hero level)/2), `mkclass_aligned()` (`level_difficulty() >> 1`, sometimes accepting a stronger candidate) and `adj_lev()` for the created monster's level. Changing one does not change the others.

## Objects

Objects are a table of kinds plus live items held in several chains.

The kind table is `src/objects.c`, built from `include/objects.h`; live items are `struct obj` (`include/obj.h`). Creation is `src/mkobj.c`, random appearances are shuffled in `src/o_init.c` (which also holds discoveries and per-level gem odds), names in `src/objnam.c`, the inventory and stack merging in `src/invent.c`, picking up in `src/pickup.c`, deletion bookkeeping in `obfree` (`src/shk.c`), Lua references in `src/nhlobj.c`, artifacts in `src/artifact.c` with data in `include/artilist.h`.

### The kind table

* `objects.h` is included four ways: the `otyp` enum (`OBJECTS_ENUM`, `include/objclass.h`), `OBJECTS_DESCR_INIT` and `OBJECTS_INIT` (`src/objects.c`) and an enum dump (`DUMP_ENUMS`, `src/earlyarg.c`). The index of a kind is its position in the file; inserting or reordering shifts every later `otyp` and changes the meaning of old saves. `OBJECT()` has 15 parameters; a new field is packed into `BITS()`.
* `objects[]` is writable, shuffled per game and saved (`savenames` in `src/o_init.c`). Do not treat `oc_prob`, `oc_descr_idx`, `oc_color`, `oc_material` or `oc_name_known` as constants.
* Order is checked at startup: kinds must be in ascending `oc_class` order (`init_objects` panics "not in order!"), slot 0 is the strange object, slots 1 to 17 are generic per-class dummies, and the array ends with a NULL-named fencepost.
* Which kinds swap appearances is written by name in `obj_shuffle_range` (`src/o_init.c`). Amulets, scrolls and spellbooks shuffle only up to the first non-magic or unique entry (the fake Amulet of Yendor must come before the real one); gloves keep IRON as `CLR_BROWN`. A helmet, glove, cloak or boot added outside the named end points is silently left out of the shuffle. No check found (unverified by full-tree search).
* `oinit()` runs on level creation and arrival and calls `setgemprobs()`, so gem odds depend on depth. `mkobj` rolls against `go.oclass_prob_totals`; anything else that changes `oc_prob` must update the class totals. `mkobj` picks the class from a table per setting (`mkobjprobs`, `rogueprobs`, `hellprobs`).

### Live items

* An object is in exactly one place, named by `obj->where` (ten states in `include/obj.h`: floor, contained, inventory, monster inventory, migrating, buried, on a bill, and so on), each with its own chain. `obj_extract_self` is the single exit from any chain; moving an object is extract, then add. `obj_state_names[]` in `src/mkobj.c` and `NOBJ_STATES` must stay in step with the states.
* Deletion is deferred. Do not call `dealloc_obj` directly; use `delobj()` then `obfree()`, which fix shop bills, leashes and contents. `dealloc_obj` parks the object on `go.objs_deleted`, or leaves it to Lua's garbage collector if Lua holds a reference (`lua_ref_cnt`). `dobjsfree()` frees it from the main loop. A freed object is overwritten with `cg.zeroobj` so use-after-free shows up as a panic.
* Fields are overloaded. `spe` has about fifteen meanings by type; `corpsenm`, `usecount`, `oeroded`, `owornmask` and `omid` serve several purposes each. `splitobj` and `bill_dummy_object` copy the whole struct, then reset a hand-picked list (`oextra`, `timed`, `lamplit`, `owornmask`, `lua_ref_cnt`, `pickup_prev`). A new field that must not be inherited goes into both.
* `include/obj.h` ends with an 11-step checklist for a new `oextra` structure (`init_oextra`, `size_obj` in `src/cmd.c`, `dealloc_oextra`, `copy_oextra`, `restobj`, `saveobj`). Missing a step leaks the data, loses it on split or on save.
* `mergable()` in `src/invent.c` is the only definition of "same stack" (about 25 properties). Candles merge only if `age/25` matches; hatching eggs, reviving corpses and lit oil never merge; knowledge bits matter only while Blind or Hallucinating. The `nomerge` bit keeps prize items (Mines, Sokoban) apart until picked up.
* `next_ident()` adds `rnd(2)`, not 1, on purpose: with `#adjust` a player could otherwise learn the low id bit of the next object and wish for one that behaves well.
* Name strings (`xname`, `doname`) come from a ring of 12 buffers (`NUMOBUF`, `src/objnam.c`). A pointer is valid for the next 11 naming calls only.
* Artifact existence is a second registry: `artiexist[]` in `src/artifact.c` (saved) stops a second copy. When an artifact object is destroyed, call `artifact_exists(obj, name, FALSE, ...)` to "un-create" it, as `src/mkobj.c` does for monster inventories; otherwise it can never be generated again. `include/artilist.h` is compiled four ways like `objects.h`.

## Display and vision

Display decides what character or tile each map square shows; vision decides what the hero can see.

The design is stated at the top of `src/display.c`: vision decides what can be seen, display decides what is shown, and the window port decides how to draw it. The core never writes characters; it writes glyph integers.

Files: `src/display.c` (what is shown; the hero's memory), `src/vision.c` (line of sight, lit squares), `src/light.c` (light sources), `src/glyphs.c` (glyph names and player customisation of symbols and colours), `src/drawing.c` (default tables), `src/symbols.c` (loading and switching symbol sets), `src/coloratt.c`, `src/utf8map.c`; the selectable symbol sets are in `dat/symbols`. A glyph is an integer for one thing to draw (`include/display.h`). Symbol definitions are one macro list, `include/defsym.h`, included with different macros for the enums, the config parser, the default tables and the tile names.

### Display

* The hero's memory is one glyph per square, `levl[x][y].glyph` in `struct rm` (`include/rm.h`), next to `typ` (what is really there). Monsters are never in it; they "float above". Exceptions: the remembered unseen-monster glyph, and mimics, which overwrite the memory with their fake appearance on purpose (`display_monster()` does the mimic check first).
* Use `newsym()` to update a square; it follows the in-sight rules. The `map_background/object/trap/engraving/invisible` functions change memory permanently ("sticky") and are not for temporary effects. Temporary effects use `show_glyph()` or `tmp_at()`. Never call `print_glyph()` directly. All of this is a convention; nothing enforces it.
* `show_glyph()` writes to a third screen, `gg.gbuf`, and only `flush_screen()` calls `print_glyph()`, for changed cells. The screen can lag the game until a flush. `flush_screen(-1)` toggles delayed flushing and is not a flush. A static flag stops the loop flush, `print_glyph`, `impossible`, `pline`, flush.
* `waslit` is set from `lev->lit`, not `templit`, to avoid the "light pool" problem. The out-of-sight darkening in `newsym()` must stay there and not move into `back_to_glyph()`.
* Walls are drawn from the directions the hero has seen them (`seenv`) and the wall mode. `wall_angle()` turns type, `wall_info` and `seenv` into a symbol; a changed `seenv` forces a `newsym()`. The source says: take pen and paper. Wrong states (a door flag left on a wall) end in `impossible()`.
* The glyph enum (`glyph_offsets` in `include/display.h`) is ordered: `reset_glyphmap()` and `show_glyph()` walk the families top down and say so. Inserting a family elsewhere gives wrong symbols without an error. `struct rm` is saved whole, so reordering also changes old saves; `EDITLEVEL` in `include/patchlevel.h` exists for that (inferred).
* `glyphmap[]` (glyph to symbol, colour, flags) is rebuilt by `reset_glyphmap(trigger)` on level change (the Rogue level has its own symbols), symbol change, option change, accessibility change and new game. A feature that changes appearance and does not call it shows up late.
* Adding or removing a `defsyms` entry needs the same change in `altlabels[]` in `win/share/tilemap.c`; that pairing is not generated.

### Vision

* Vision is recomputed lazily. `gv.vision_full_recalc` is set by `block_point`, `unblock_point` and light changes, and cleared in `vision_recalc()`. `pline()` runs the recompute first, so a message describes what the hero sees now. Code that changes terrain or light without those calls leaves `cansee()` stale.
* `vision_recalc(control)`: 0 normal, 2 "see nothing, then `newsym()` everything" (used by `docrt()`, `goto_level`, swallowing). Value 1 is documented as adjacent recalculation but is unimplemented and treated as 0, though some callers pass it.
* Two line-of-sight systems exist and can disagree. The main one is "Algorithm C" over `viz_clear[][]`. The second, `clear_path()` (a Bresenham walk), serves monsters (`m_cansee`) and light sources away from the hero. `COULD_SEE` means "an unobstructed line exists", not "the hero sees": it is computed even when the hero is blind, because monsters use it (`m_canseeu()`).
* Vision code indexes `[y][x]`; everything else uses `[x][y]` (a banner at the switch in `src/vision.c`). `block_point(x,y)` swaps on the way in. A swapped call works on some positions and fails on others.
* `viz_clear[][]` is a cache of `does_block()` (walls, closed doors, trees, clouds, boulders, mimics, gas regions). Whatever changes these must call `block_point`, `unblock_point` or `recalc_block_point`. The wizard-mode `levl_sanity_check()` compares both.
* Light sources are recomputed in full on every vision recalc, on purpose: no extra memory, no tracking of movement. A moving lamp only needs `vision_full_recalc`. The polymorphed hero relies on `youmonst.m_id` staying 1 and `mx` staying 0.
* A save made with a stale `EDITLEVEL` once left `light_base` circular (comment in `src/light.c`). Changing the saved shape of light sources, timers or `struct rm` without bumping `EDITLEVEL` risks it.
* `UNBUFFERED_GLYPHINFO` is defined nowhere in `include/`, `src/`, `win/` or `sys/`, and its branch in `row_refresh()` would not compile. Treat it as dead.

## Window ports

A window port is a user interface: it implements one table of functions that the core calls to draw.

The table is `struct window_procs` (`include/winprocs.h`), copied by value into the global `windowprocs`. `src/windows.c` lists the ports compiled in (`winchoices[]`), and `choose_windows()` selects one by name, case-insensitively. The contract is `doc/window.txt`; its header date is old and it still says to edit `makedefs.c` for `window_opts`, which now lives in `src/mdlib.c`.

Ports: `win/tty` (default), `win/curses`, `win/Qt`, `win/X11`, `win/win32` (the name to type for `windowtype` is `mswin`) and `win/gem` (Atari, kept but not for current platforms). `win/macosx` is not a port: it holds AppleScripts and a recover script; on macOS the game uses tty, curses, X11 or Qt. `outdated/win` holds ports no longer maintained. Which ports are built is a build option: `WANT_WIN_*` in the Unix and macOS hints files, and other switches on Windows.

### The function table

* `struct chain_procs` repeats every member with a leading `CARGS` parameter, and the comment "this MUST match chain_procs" is the only guard. Port tables use positional initialisers, so order matters, and a swapped pair of same-typed pointers compiles. Adding a member means editing `window_procs`, `chain_procs`, the macro list, `hup_procs`, `chainin_procs`, `chainout_procs`, `win/chain/wc_trace.c` and every port table.
* `add_menu()`, `select_menu()` and `getlin()` are real functions in `src/windows.c` (and `yn_function` in `src/cmd.c`) that do common work, then call the port. `add_menu` applies menu colours; `select_menu` and `getlin` disable status redraws while they run; `getlin` first drains the command queue and, if queued keys exist, never calls the port. A port that calls its own `tty_add_menu` directly skips this.
* Status has two paths, chosen by `VIA_WINDOWPORT()`, which tests the capability bits `WC2_HILITE_STATUS` and `WC2_FLUSH_STATUS`. With them, `bot()` pushes `status_update()` calls per field; without them, the core writes two preformatted lines to an `NHW_STATUS` window, which `doc/window.txt` says will be phased out. `genl_status_update` sets `WC2_FLUSH_STATUS` at run time.
* Glyphs travel inside strings as `\GXXXXNNNN`, written by `encglyph()` with the per-game number `svc.context.rndencode`, so that player-supplied text such as pet names is not decoded by accident. Never hard-code the prefix.
* `wincap` has no free bits; `wincap2` has about 12. `doc/window.txt` ("Adding a new wincap option") gives the procedure.
* The `genl_*` helpers are the default implementations (`genl_putmixed`, `genl_status_*`, `genl_getmsghistory`). Their comments are the only spec for message history (called oldest first, a null pointer ends it) and menu inversion (`menuitem_invert_test`).
* The port is not fully behind the table. The core branches on `WINDOWPORT(x)` (an enum, `wp_ids`) in `invent.c`, `files.c`, `options.c`, `wizcmds.c`, `report.c` and `earlyarg.c`. A new port needs a `wp_` id.

### Selection and hangup

* `choose_windows()` skips names starting with `+` (chain processors) or `-` (chain ends), so they cannot be chosen. On a miss it first installs `def_raw_print` and `def_wait_synch`, because early config-error code calls them. It may run several times; each port's init routine undoes the last choice on `WININIT_UNDO`. `windowtype` is honoured only before `iflags.window_inited`.
* Hangup replaces the whole table with `hup_procs`: outputs do nothing, input returns ESC. Two old routines are kept on purpose: the previous `exit_nhwindows` (called later by `hup_exit_nhwindows`) and the previous `getmsghistory`, which the save needs.
* The dumplog redirect (`dump_open_log`, `dump_redirect` in `src/windows.c`, used by `src/end.c`) swaps nine slots and restores with a whole-struct copy. Any slot changed in between, such as a hangup, is undone (inferred).

### Chain and shim

* `win/chain` is not a port and cannot be chosen with `windowtype`. Processors are named `+trace` and set through the sysconf-only option `windowchain`; `commit_windowchain()` inserts `-chainin` at the head and `-chainout` at the tail. The only processor is `+trace`, which writes `tlog.<pid>`. `WINDOWPORT(tty)` is probably false under a chain (inferred).
* `WINCHAIN` is off in `include/config.h` and the platform mains call `commit_windowchain()` only under `#ifdef WINCHAIN`. `sys/unix/README.hints` documents `WANT_WINCHAIN=1`, which no file uses; the hints use `WANT_WIN_CHAIN`, which only adds object files. Enabling the chain means editing `config.h`.
* `win/shim` forwards every window call to one registered callback and is the default for the library and WebAssembly builds (`sys/unix/hints/include/cross-pre2.501`, `multiw-2.501`; contract in `sys/libnh/README.md`). With no callback every call returns 0.
* Known defects in `win/chain`: `trace_procs_init` calls `setvbuf` before the null check on `fopen`, and some tables use `#ifdef MAC` where `window_procs` uses `MAC68K`.

## Save and restore

Saving writes the global state, the hero and every level; restoring reads them back in order.

`src/save.c` writes, `src/restore.c` reads, in matching pairs (`savemon`/`restmon`, `saveobj`/`restobj`, and so on). Underneath, `src/sfbase.c` dispatches and `src/sfstruct.c` writes raw struct dumps. Bones files (`src/bones.c`) store the level where a hero died; `no_bones_level()` says which levels never get one. The high-score list is `src/topten.c`.

### Format

* The game always writes the `historical` format, a raw dump of C structs. There is no build switch and no run-time option (`src/files.c` hard-codes it). `exportascii` exists only in the separate `sfctool` utility, an offline step for moving a save between platforms that run the exact same version. The generated `sfdata.c` and `sfproto.h` (from `util/sftags.c`, which reads a ctags file) are built only for `sfctool` (`sys/unix/Makefile.utl`).
* The stream is untagged and strictly ordered. The name strings passed to `Sfo_*`/`Sfi_*` are ignored by the game binary. A write without the matching read shifts every later field and shows up far away as nonsense or "Read N instead of M bytes". `saveobj()` and `restobj()` must mirror each other, including the optional `oextra` parts.
* File order: format byte, critical-size list, version info, player name, current level, game state, then every other level preceded by its ledger number. Restore reads the current level, the game state and the other levels, writes the others back as level files (`restlevelfile()`), rewinds, and reads the current level a second time. The first read happens before the dungeon table exists (see `save_bubbles()`).
* `program_state.restoring` (`REST_GSTATE`, `REST_LEVELS`, `REST_CURRENT_LEVEL`) changes what `getlev()` and `savelev_core()` do: catch-up for time away and the level timestamp depend on it. Level code that runs during restore must not assume `u.uz` is valid.
* Time values are saved relative to the current turn (`moves_to_relative_time()`), and each level carries its own timestamp. A new turn-valued field saved as an absolute number is wrong the next time the level loads.
* Pointers are never saved. Context pointers (`victual.piece`, `tin.tin`, ...) are cleared and their ids kept; `u.ustuck` and `u.usteed` are rebuilt from `ustuck_mid` and `usteed_mid` in `getlev()`; worn items by `setworn()` after the inventory is read. A new pointer field in a saved struct needs an id-based fixup, or it restores a wild pointer.
* The date-dependent luck changes (full moon, Friday the 13th) are undone in `dosave0()` and re-applied at start-up. Keep the pair symmetric.
* Lua state is saved as a text blob: `save_luadata()` stores only the `nh_lua_variables` table (see Lua integration).
* Which globals are saved is decided field by field; see Global state.

### Version checks

`validate()` and `uptodate()` in `src/version.c` read the critical-size list and `struct version_info` before any data is trusted. `check_version()` rejects the file if the version is outside `[VERSION_COMPATIBILITY, current]` or if the feature bits or the structure entity count differ. Different data models are rejected, not converted. `include/patchlevel.h` holds only the constants: `EDITLEVEL`, `VERSION_COMPATIBILITY`, `SAVEFILE_REVISION_LEVEL`. The authors' rule: any incompatible change to saved data (`struct context`, `struct flag`, `struct rm`, glyph numbering, the light list) needs `EDITLEVEL` raised, which invalidates old saves and bones.

`include/revision.h` documents a 14-step "uplift" for reading old saves through a copy of a changed struct (`src/revision.c`). It is prepared, not exercised: `SAVEFILE_REVISION_LEVEL` is 0 and the demo code is example-only.

### Saving and the running game

* Saving destroys the running game. `dosave0()` sets the mode `WRITING | FREEING`: each `save*chn()` routine writes an item and frees it, and `dosave()` ends the process. A failure halfway cannot be rolled back. The same routines also run with `COUNTING`, plain `WRITING` (checkpoints, bones) or `FREEING` alone, selected by `update_file()` and `release_data()`. A new save routine that always frees, or always writes, breaks one mode.
* A save is deleted when restored, except in wizard and explore mode (`dorecover()`). A failed restore deletes it too. `CHECK_SAVE_UID` (default on) refuses a save that is "not yours" for normal players.
* The head of the save (pid, level number, name) is written unbuffered on purpose, so that `util/recover.c` and external tools can read it; the same holds for the bones info before the level data. Changing the order or encoding of the head breaks them without a compile error.
* With `INSURANCE` (default) and the `checkpoint` option, `save_currentstate()` writes the current level and the whole game state into the level-0 lock file; `recover` rebuilds a save from the level files. `gh.havestate` makes turning checkpoints off rewrite level 0 once.
* Bones use the level writer and reader with a "ghostly" flag (ids remapped, movement zeroed, peacefulness re-rolled, stairs and branch links repaired). A change to the level format affects saves, checkpoints and bones.

### Traps in save and restore

* A truncated save is only partly guarded. In the level loop a short read ends the restore cleanly at a level boundary; inside a level the remaining reads continue (`sfstruct_read_error()` is empty). Struct contents are not range-checked. Inferred from the code, not run.
* The real checks are header validation, the pid and level-number check in `getlev()` ("This game is void", `trickery()`) and the UID check.

## Platform layers and build

The `sys/` folders and the build tools in `util/` adapt one source tree to many systems.

`sys/unix` has the Makefile templates (`Makefile.top`, `.src`, `.dat`, `.doc`, `.utl`, `.check`), `setup.sh` and the hints files. `sys/windows` has two build systems for the same tree: `GNUmakefile` (MinGW) and `Makefile.nmake` plus `vs/NetHack.sln` (Visual C). It builds the console and the graphical program. `sys/share` holds code several systems use, such as the regex implementations. `sys/libnh` is the library build. `outdated/` (repository root) holds retired systems, but `sys/amiga`, `sys/atari`, `sys/mac68k`, `sys/msdos` and `sys/vms` are still in `sys/`, and four of them have cross-compile targets (`cross-pre1.501`). Being in `sys/` does not mean natively supported.

### Unix Makefiles

* `setup.sh` calls `mkmkfile.sh` once per Makefile (top, dat, doc, src, util). `mkmkfile.sh` writes the hints file's `#-PRE` part, the template, then the `#-POST` part. A line starting `#-INCLUDE name` in a hints file is replaced by `hints/include/name`; it is executed, not a comment. Edits to a generated `Makefile` are lost at the next `setup.sh`: change the template or the hints file. Run the scripts from `sys/unix`.
* `Makefile.check` (via `PRECHECK` in `linux.501` and `macOS.501`) only reports "Attention: <file> is older than ..."; it neither stops the build nor reruns `setup.sh`. `HINTSINCLNAMES` is edited by hand when a new `hints/include/*.501` file is added.
* The hints family is larger than `sys/unix/README.hints` says. `bsd.501` ("legacy", "use at your own risk", BSD make syntax) and `linux-minimal` do not use the shared includes or the stale-Makefile check, so a change to the shared includes does not reach them.
* Top-level parallel make is off on purpose (`.NOTPARALLEL:` in `Makefile.top`), because several targets each start a sub-make that builds host `makedefs` and would overwrite each other.
* Hints for WebAssembly and the library: `cd sys/unix`, `./setup.sh hints/macOS.501`, then `make WANT_LIBNH=1 all` or `make CROSS_TO_WASM=1 all`. `sys/libnh/README.md` still names `sys/lib` and `hints/wasm`, which do not exist.

### makedefs and data

* `util/makedefs.c` makes the data files: `data` (from `dat/data.base`), `rumors`, `oracles`, `epitaph`, `engrave`, `bogusmon`, `options`. It no longer makes `onames.h` and `pm.h`, and nothing includes them. `makedefs -v` still writes `include/date.h` for reference only. `doc/makedefs.txt` is out of date against `do_makedefs()` in the code (it lists `-m` and `-q` where the code uses `-v` and `-r`); trust the code.
* Version, build date and git hash come from `src/date.c`, filled at run time. `date.o` is deliberately built last and kept out of the object lists, so it is rebuilt after any other object (`HOBJ` in `Makefile.src`, `COREOBJS` in the `GNUmakefile`). Adding it to a list builds fine and ships a stale build time.
* `makedefs` links `monst.o`, `objects.o`, `alloc.o`, `date.o` and `panic.o`, and `#include`s `src/mdlib.c` directly. These objects must be built first (`FIRSTOBJ`), and the rules for `monst.o` and `objects.o` delete the `makedefs` binary to force a relink. In a cross-compile they exist twice, for HOST and TARGET, and must not share names or directories.
* `util/dlb_main.c` packs `dat/` files into `nhdat` only when `DLB` is defined: off in `include/config.h`, on in the Linux, macOS and cross hints. After the build, `check-dlb` in `Makefile.top` greps `dat/options` for "librarian", written by `makedefs -v` from `src/mdlib.c`. The install layout therefore follows what the compiled `makedefs` believes. Changing `-DDLB` without rebuilding `makedefs` and `dat/options` installs the wrong layout.
* Declared principle (`Cross-compiling` A4, `Porting` 5.4): the build must not produce files that depend on word size, byte order or struct layout. Levels, dungeon and quest text are Lua read at run time; makedefs outputs are text. A binary, layout-dependent build output breaks cross builds without breaking a native one.

### The mains

There is no shared `main()`. Each platform main parses its own options, then calls `early_init()` first and `moveloop()` last; see Game loop and startup. `early_init()` in `src/allmain.c` runs `decl_globals_init`, `objects_globals_init`, `monst_globals_init`, `sys_early_init()` and `runtime_info_init`. `sys/libnh/libnhmain.c` copies much of `unixmain.c`.

## Sound

Sound libraries are optional plug-ins that play effects and music for game events.

Two unrelated things share the word. `src/sounds.c` is mostly (about 1,500 of 2,200 lines) the game's in-world noises: `dosounds()` ("You hear..." for fountains, vaults, temples), monster noises, and the `#chat` and `#tiphat` commands. They work with no library. The plug-in interface starts at the library registry (`soundprocs`) near line 1,700. The interface is `include/sndprocs.h`, described in `doc/sound.txt` (partly wrong, see below). Libraries are in `sound/`: FMOD, `windsound`, `macsound`, `mac68ksound`. Qt's sound code is in `win/Qt/qt_bind.cpp` and `qt_bind.h`; `sound/qtsound/` holds only a README. `sound/wav` holds sample files, stored uuencoded (`*.uu`) and listed in `SNDWAVS` in `sys/unix/hints/include/multisnd2-pre.501`.

### How events work

* Events are raised by macros in `include/sndprocs.h` (`Soundeffect`, `Hero_playnotes`, `SoundAchievement`, `SoundSpeak`, `SetVoice`, `Play_usersound`), called from many files. With no `SND_LIB_*` define they expand to nothing, so arguments are not evaluated in a no-sound build and a variable used only as a sound argument needs `SOUNDLIBONLY` to avoid an unused warning.
* Every event passes a gate: `iflags.sounds`, then `!Deaf`, then the function pointer exists, then the library's `sound_triggers` bit is set. A library leaves bits clear for functions it leaves empty. FMOD and Qt claim only `SOUND_TRIGGER_USERSOUNDS`.
* Deafness is the hero's, achievements are the player's: `Soundeffect` and `Hero_playnotes` are suppressed when `Deaf`, `SoundAchievement` is not. The macro you pick decides whether a deaf hero gets the event.
* Sound effects are one X-macro list, `include/seffects.h`, giving the id `se_<name>` and the file name `se_<name>.wav`. Adding one means a line there, a `Soundeffect(se_x, vol)` call and a wav file in `SNDWAVS`. Id 0 (`se_zero_invalid`) is reserved.
* Speech compiles in only with `-DSND_SPEECH` (`WANT_SPEECH=1`). `SetVoice()` before a `pline` sets the speaker in the global `gv.voice`; forgetting it speaks the next line with the previous voice (inferred).

### Selecting a library

* A library exists only if the build defined `SND_LIB_<NAME>` (hints files, `SNDCFLAGS`). There is no run-time discovery. The Unix main hints only macsound; the Windows main prefers FMOD over windsound. CI builds macsound only (`WANT_MACSOUND=1`); the others are not built in CI.
* Activation has two phases. `assign_soundlib()` records a hint; `activate_chosen_soundlib()`, called from `init_sound_disp_gamewindows()`, copies the table into `soundprocs` and initialises it. The later hint wins, which matters for Qt, whose sound is part of its window port. The `soundlib` option only sets the hint, so it takes effect at the next start; an unknown name silently falls back to `nosound`.
* `enum soundlib_ids` is also the index into `soundlib_choices[]` in `src/sounds.c`. The two lists must match; a mismatch selects the wrong table without a compile error. Adding a library touches the enum, the `SND_LIB_INTEGRATED` list, the extern and `soundlib_choices` entry, `soundlib_opts[]` in `src/mdlib.c` and the build files (`doc/sound.txt` section VII).
* The name builders (`get_sound_effect_filename`, `base_soundname_to_filename`) return NULL on any doubt; callers must handle it. The first exists only under `SND_SOUNDEFFECTS_AUTOMAP`, user sounds (regex on message text) only under `USER_SOUNDS`.

### Traps in sound

* `SoundeffectEvenIfDeaf` tests the pointer backwards (`&& !soundprocs.sound_soundeffect`), so with a real library it does nothing. No caller exists yet.
* `sound_ambience` argument order differs between `include/sndprocs.h` (`ambience_action, ambienceid, proximity`) and `doc/sound.txt` and FMOD (`ambienceid, action, proximity`). Nothing calls it.
* `doc/sound.txt` drifts from the code: it says four trigger types (six exist), names `sa2_levelup` (the enum has `sa2_xplevelup`) and `iflags.voice` (it is `voices`), puts Qt code in `sound/`, points to `macOS.500` (the file is `macOS.501`), and its sample skeleton does not compile. `sndprocs.h` declares `struct sound_procs sndprocs`, which is never defined; the variable is `soundprocs`.

---

<!-- source: L4-operations.md -->
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
