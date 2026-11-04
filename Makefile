.PHONY: help install local build preview preview-stop check format fmt fmt-check cv

-include .env.local

ASTRO_PREVIEW_HOST ?= 127.0.0.1
ASTRO_PREVIEW_PORT ?= 4342
ASTRO_ALLOWED_HOSTS ?=
TAILSCALE_SLOT ?= 9442

# Show help when invoked with no target, instead of running the first one.
.DEFAULT_GOAL := help

help: ## show this help
	@grep -hE '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

install: ## install locked dependencies
	bun install --frozen-lockfile

local: install ## serve the site with live reload on :4321
	bunx --bun astro dev --host 0.0.0.0 --port 4321

build: install ## build the static site into dist/
	bunx --bun astro build

preview: build ## serve the production build on loopback and expose via Tailscale slot (default 9442)
	@bunx --bun astro preview stop >/dev/null 2>&1 || true
	@bunx --bun astro preview --host $(ASTRO_PREVIEW_HOST) --port $(ASTRO_PREVIEW_PORT) --background $(if $(ASTRO_ALLOWED_HOSTS),--allowed-hosts $(ASTRO_ALLOWED_HOSTS),)
	@if command -v tailscale >/dev/null 2>&1 && [ -n "$(TAILSCALE_SLOT)" ]; then \
		tailscale serve --bg --https=$(TAILSCALE_SLOT) http://$(ASTRO_PREVIEW_HOST):$(ASTRO_PREVIEW_PORT) >/dev/null 2>&1 && \
		echo "Tailnet preview live at: https://$$(tailscale status --json | jq -r .Self.DNSName | sed 's/\.$$//'):$(TAILSCALE_SLOT)/"; \
	fi

preview-stop: ## stop the Astro preview server and release the Tailscale slot
	@bunx --bun astro preview stop 2>/dev/null || true
	@if command -v tailscale >/dev/null 2>&1 && [ -n "$(TAILSCALE_SLOT)" ]; then \
		tailscale serve --https=$(TAILSCALE_SLOT) off 2>/dev/null || true; \
		echo "Tailscale slot $(TAILSCALE_SLOT) released."; \
	fi

fmt: ## format markdown with rumdl, configs with prettier
	bunx prettier --write "**/*.{json,yaml,yml}"
	rumdl fmt .

format: fmt ## alias for fmt

cv: ## compile the Typst CV into public/cv.pdf (committed; served at /cv.pdf)
	typst compile --root . assets/cv/cv.typ public/cv.pdf

fmt-check: ## verify formatting without modifying files
	bunx prettier --check "**/*.{json,yaml,yml}"
	rumdl fmt --check .

check: fmt-check install ## pre-commit and CI gate: formatting, then bun run verify (contrast, frontmatter, build, URL parity)
	bun run verify

# Browser verification targets from the playwright-verify skill.
E2E_DIR ?= .
include e2e.mk
