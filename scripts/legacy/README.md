# Legacy one-off scripts (archived)

These are the one-off fix / patch / test / query scripts written during the
Nov 2026 build-out of the Findora site. They were each run once (or a few
times) against the repo or Firestore and then superseded — they are **not**
part of the build, the server, or any npm script, and nothing in `src/`,
`api/` or `server.ts` imports them.

They are kept here for history, not deleted, because several encode the
exact edit that fixed a past bug.

## Running one

Run from the **repo root** (their relative paths assume it):

```sh
node scripts/legacy/clean.cjs
python3 scripts/legacy/fix_categories.py
```

Most use `fs.readFileSync('src/...')` / `'server.ts'` paths resolved against
the working directory, so running them from inside `scripts/legacy/` will
fail to find their targets. Do not re-run a fix script without reading it
first — most edits are already applied and are not idempotent.

Moved from the repo root on 2026-11-17 (PR: repo hygiene — 217 files).
