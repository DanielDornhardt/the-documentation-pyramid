# Glossary

The project's domain words, defined once, in the language the team, the docs and the code share. Covers the game domain and the project's own build vocabulary, not general programming terms. Alphabetical.

| Term | Definition | Notes |
|---|---|---|
| Bones | A saved level of a dead hero that a later game can load, with the corpse and its items. | `src/bones.c`. |
| DevTeam | The NetHack maintainers. | |
| DLB | The data librarian: one archive file for the read-only files in `dat/`. | Tool in `util/dlb_main.c`; reader in `src/dlb.c`. |
| Glyph | An integer that stands for one thing the map can show. | `include/display.h`. Not a character: a window port maps it to a character or tile. |
| Hints file | A file under `sys/unix/hints/` that sets Makefile variables for a platform. | Read by `sys/unix/setup.sh`. |
| Hero | The player's character, `struct you`, global `u`; also a `struct monst`, `gy.youmonst`. | Docs say "hero" for the in-game character; some code comments say "player". |
| Ledger | The running number of a level across all dungeons. | `src/dungeon.c`. Not the same as depth or `level_difficulty()`. |
| Playground | The directory where an installed game keeps its data, saves and scores. | `HACKDIR` in hints files. |
| Special level | A level built from a Lua script rather than random rooms. | Listed in `dat/dungeon.lua`. May be flipped at random unless the script says `noflip`. |
| Sysconf | The system-wide configuration file. | `sys/unix/sysconf`; read by `src/sys.c`. |
| Window port | A user interface implementing `struct window_procs`. | `win/`. Also called window system or interface. |
| Wizard mode | The debug mode that allows testing commands. | Started with `-D`; also `#wizloadlua` etc. |
