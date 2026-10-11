.PHONY: help install local build check format fmt fmt-check

# Show help when invoked with no target, instead of running the first one.
.DEFAULT_GOAL := help

help: ## show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'

install: ## install locked dependencies
	bun install --frozen-lockfile

local: install ## serve the site with live reload on :4321
	bunx --bun astro dev --host 0.0.0.0 --port 4321

build: install ## build the static site into dist/
	bunx --bun astro build

fmt: ## format markdown with rumdl, configs with prettier
	bunx prettier --write "**/*.{json,yaml,yml}"
	rumdl fmt .

format: fmt ## alias for fmt

fmt-check: ## verify formatting without modifying files
	bunx prettier --check "**/*.{json,yaml,yml}"
	rumdl fmt --check .

check: fmt-check install ## pre-commit and CI gate: formatting, then bun run verify (contrast, frontmatter, build, URL parity)
	bun run verify
