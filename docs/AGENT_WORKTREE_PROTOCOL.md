# Dreamlining agent worktree protocol

This repository uses a local, ignored Lattice board and Git worktrees for isolated agent changes.

## Invariants

- The primary checkout is `/Users/so/Documents/projects/dreamlining`.
- The only permitted Git remote is the Dreamlining `origin`; never attach to or push to the former parent `ostsam/vapight-kampff` repository.
- `.lattice/` is local coordination state. It is intentionally ignored, must stay untracked, and must never be committed, copied into a worktree, or initialized separately.
- This installed Lattice CLI (v0.2.0) expects `LATTICE_ROOT` to point to the primary project directory that contains `.lattice/`, not to the `.lattice/` directory itself. Use:

  ```bash
  export LATTICE_ROOT=/Users/so/Documents/projects/dreamlining
  ```

- Never run `lattice init` from a worktree. A worktree must use the existing primary board through `LATTICE_ROOT`.
- Worktrees live beside the primary checkout, for example `../dreamlining-dream-5`, never inside it.
- Do not use `lattice next` or `lattice next --claim` in this repository. Lattice CLI 0.2.0 does not enforce `depends_on` when ranking the next task. Use `bun scripts/lattice-ready.mjs --json` to inspect ready work and `bun scripts/lattice-ready.mjs --claim --actor agent:<id> --json` to claim it atomically into `in_planning`.

## Starting isolated work

```bash
git worktree add ../dreamlining-<task> -b codex/<task>-<slug> <base-ref>
export LATTICE_ROOT=/Users/so/Documents/projects/dreamlining
cd ../dreamlining-<task>
git branch --show-current
lattice show <task>
lattice doctor
```

The worktree should report the same task IDs and board state as the primary checkout, while `git ls-files .lattice` returns no paths and no second `.lattice/` is created in the worktree.

## Branch and change policy

- Use `codex/<task>-<slug>` branches.
- Verify the worktree branch and `git status` before every commit.
- Commit only the task's intended files; never stage `.lattice`, `.env*`, or secrets.
- Push non-force to the verified Dreamlining `origin` only after local checks pass.
- A task's implementation agent moves it to `review`; a fresh reviewer checks the diff and Lattice evidence before completion.

## Cleanup and recovery

After the branch is pushed/merged, return to the primary checkout and remove only the disposable sibling worktree:

```bash
git worktree remove ../dreamlining-<task>
git worktree prune
```

If ignored Lattice files disappear after a checkout/update, stop other Git operations and restore the local board worktree-only from a known-good local commit or backup. Verify `lattice doctor` before continuing; never re-add the board to Git.
