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
