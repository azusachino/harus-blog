.PHONY: local build migrate check format

# Material for MkDocs prints an unsolicited MkDocs-2.0 notice to stderr; opt out.
export NO_MKDOCS_2_WARNING := true

local: ## serve the site locally with live reload
	uv run mkdocs serve --dev-addr 0.0.0.0:1313

build: ## build the static site (strict)
	uv run mkdocs build --strict

migrate: ## (re)generate docs/ from Hugo content
	uv run python scripts/migrate.py

check: build ## pre-commit gate

format: ## format markdown/config with prettier
	bunx prettier --write .
