# FlowVantage Frontend - DCIT208 repository command contract.
#
# The target names (setup, lint, test, run, build) are fixed by the course
# Appendix B contract so CI and grading can rely on them. What each one maps
# to is stack-specific and lives here.

.PHONY: help setup lint test test-watch run build preview emulators ci

help:
	@echo "setup      install dependencies (npm ci)"
	@echo "lint       static checks (oxlint)"
	@echo "test       run the unit suite once (vitest)"
	@echo "test-watch run the suite in watch mode"
	@echo "run        start the dev server (Vite)"
	@echo "build      typecheck and produce a production bundle"
	@echo "preview    serve the built bundle locally"
	@echo "emulators  start the Firebase Auth emulator"

setup:
	npm ci

lint:
	npm run lint

test:
	npm test

test-watch:
	npm run test:watch

run:
	npm run dev

# `tsc -b && vite build` - the typecheck is part of the build rather than of
# lint, because a type error here must fail the bundle, not just a warning
# step.
build:
	npm run build

preview:
	npm run preview

emulators:
	npm run emulators

# What the CI workflow calls, so "what CI does" is one line, here, rather
# than something that can drift inside the YAML.
ci: lint test build
