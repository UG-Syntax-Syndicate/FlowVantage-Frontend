# Contributing to FlowVantage-Frontend

## Purpose
This guide helps new team members contribute safely and consistently to the frontend codebase.

## Workflow
1. Create a branch from the latest default branch.
2. Keep changes focused to one feature or fix per pull request.
3. Open a pull request with:
   - what changed
   - why it changed
   - how it was validated

## Pull Request Checklist
- Scope is small and focused
- Documentation is updated when behavior/process changes
- No secrets (keys/tokens) are committed
- Performance impact was considered for UI and bundle size
- Vercel deployment expectations were followed (see `docs/VERCEL_DEPLOYMENT.md`)

## Documentation First
When adding major features or architecture changes, update:
- `README.md` (if contributor-facing behavior changes)
- `docs/ONBOARDING.md` (if onboarding flow changes)
- `docs/PERFORMANCE_OPTIMIZATION.md` (if performance strategy changes)

## Collaboration Notes
- Ask for review from the relevant feature owner when possible.
- Keep PR conversations technical and actionable.
- Prefer incremental improvements over large unreviewable drops.
