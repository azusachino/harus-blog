.PHONY: help local build migrate check format fmt fmt-check

# Show help when invoked with no target, instead of running the first one.
.DEFAULT_GOAL := help

# Material for MkDocs prints an unsolicited MkDocs-2.0 notice to stderr; opt out.
export NO_MKDOCS_2_WARNING := true

help: ## show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'

local: ## serve the site locally with live reload
	uv run mkdocs serve --dev-addr 0.0.0.0:1313

build: ## build the static site (strict)
	uv run mkdocs build --strict

migrate: ## (re)generate docs/ from Hugo content
	uv run python scripts/migrate.py

fmt: ## format markdown with rumdl, configs with prettier
	bunx prettier --write "**/*.{json,yaml,yml}"
	rumdl fmt .

format: fmt ## alias for fmt

fmt-check: ## verify formatting without modifying files
	bunx prettier --check "**/*.{json,yaml,yml}"
	rumdl fmt --check .

check: fmt-check build ## pre-commit and CI gate
