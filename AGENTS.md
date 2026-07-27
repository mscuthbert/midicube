# AGENTS.md

Notes for AI agents working on midicube. `CLAUDE.md` is a symlink to this file,
so there is only one set of instructions to keep current.

**This file may only be changed with the specific permission of a human user.**
If you believe something here is wrong or missing, say so and ask; do not edit
it on your own initiative.

## Comments

Do not document fixes to prior bugs or mistakes in committed files or code.
Comments should say what the code does and why it is the way it is, not what it
used to do wrong. The rare exception is a mistake we are genuinely likely to
make again -- and then write it as a warning about the code, not as history.

## Releasing a new version

The checklist lives in `README.md`, under "Development". Follow it from there
rather than from memory, and if the steps change, keep that the only copy.

`package.json` holds the one authoritative version; webpack fills the built
file's banner in from it. No source file carries a hand-edited version, so
don't add one back.

## Note names and ranges

`keyToNote` / `noteToKey` in `js/gm.js` cover the whole MIDI range, C-1 (0)
through G9 (127), in scientific pitch notation where middle C is C4 and C0 is
MIDI note 12. Names use flats only (`Bb3`, never `A#3` or `As3`), and soundfont
keys must match that spelling to be found.

Soundfonts supply whatever subset they like -- most cover A0 (21) to C8 (108) --
so playback code must tolerate a missing sample for any note rather than assume
88 keys. The generators in `generator/` default to A0-C8 but take
`lowestToBuild`/`highestToBuild` (node) and `LOWEST_TO_BUILD`/`HIGHEST_TO_BUILD`
(ruby) constants for wider fonts.
