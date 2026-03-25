# Project Rules

## Branch Protection — MANDATORY

**NEVER commit directly to the `main` branch.** No exceptions.

All development must happen on feature or milestone branches (e.g. `develop`, `milestone/M003`). The `main` branch receives only merge commits from completed, tested branches.

Before making any code changes, verify you are NOT on main:
```bash
git branch --show-current  # Must NOT be "main"
```

If on main, create a branch first:
```bash
git checkout -b develop  # or milestone/M00X
```

This rule is non-revisable (Decision D007).
