# Agent worktree verification

Verified 2026-08-30 for DREAM-5.

- Primary Git root: `/Users/so/Documents/projects/dreamlining`.
- Primary branch during verification: `codex/dream-1-product-definition`.
- The Dreamlining-specific `origin` is configured; the unrelated parent remote is not used.
- Local `.lattice/` is ignored and untracked. It contains the shared 32-task board.
- Lattice CLI: `0.2.0`.
- Lattice behavior: `LATTICE_ROOT=/Users/so/Documents/projects/dreamlining` makes a sibling worktree see the shared board; pointing `LATTICE_ROOT` directly at `.lattice/` is rejected by this install.
- Disposable worktree: `../dreamlining-dream5`, branch `codex/dream-5-worktree-protocol`.
- Shared-root checks from the disposable worktree saw 32 tasks, `DREAM-5` in progress, and a clean `lattice doctor` run. The worktree tracked zero `.lattice` paths.
- The disposable worktree was removed after the documentation commit and verification. The primary checkout remains on its original branch; its product-definition files are committed separately from the protocol documentation.

The board is local by design. All future worktree agents must export the primary project path as `LATTICE_ROOT` before any Lattice command.
