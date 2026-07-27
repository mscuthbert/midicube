# AGENTS.md

Notes for AI agents working on midicube. `CLAUDE.md` is a symlink to this file,
so there is only one set of instructions to keep current.

**This file may only be changed with the specific permission of a human user.**
If you believe something here is wrong or missing, say so and ask; do not edit
it on your own initiative.

## Releasing a new version

The version appears in more than one place, and the banner is easy to forget:

* `package.json` — the authoritative version.
* `js/index.js` — the banner comment at the top of the file carries the version
  and its release date. **Update it whenever the version changes**; it ships in
  `releases/midicube.js` and is what users see in the built bundle.
* `README.md` — add a line to the `## Changes` section.

`npm run prepublishOnly` builds and copies into `releases/`, so make the banner
correct before publishing.

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
