# Installed UI Skills

Reviewed date: 2026-10-03

## Repository Verification

- Working directory inspected: `D:\Individua_Project\Capstone\Capstone_BE\frontend`
- Local folder identifies as `StockPilot_FE` in `README.md`.
- `git rev-parse --show-toplevel` failed because the folder is not currently a Git repository.
- Current branch, Git status, Git diff, and remote verification are not available in this folder.
- Project structure at review time contains `README.md`, `docs/AI_CONTEXT_MEMORY.md`, and `docs/UI_UX_IMPLEMENTATION_PLAN.md`.
- No `package.json`, `AGENTS.md`, `.codex`, `.agents`, or `docs/DESIGN_SYSTEM.md` existed before this audit.
- Official Codex documentation currently lists repository skills under `.agents/skills`, so this audit uses `.agents/skills` instead of `.codex/skills`.

## Review Table

| Candidate | Source | Official? | Relevant to StockPilot? | Install method | Files/scripts inspected | Security concerns | Maintenance signal | Recommendation |
|---|---|---:|---|---|---|---|---|---|
| `frontend-app-builder` | `openai/plugins`, `plugins/build-web-apps/skills/frontend-app-builder` | Yes, OpenAI | Partly. Strong for full visual concepting and new UI builds, but too broad and image-generation-heavy for StockPilot's current audit stage. | Not installed. Reference only. | `SKILL.md`, `agents/openai.yaml`, `references/imagegen-website-concepts.md`, sparse repo file list, Git history, GitHub repo metadata, keyword scan for risky commands. | No install scripts in inspected skill. No package or lockfile in sparse skill path. Mentions image generation and provider coordination. No credential harvesting found. Repo/license metadata did not expose a clear license for copied standalone use. | Repo created 2026-03-04, pushed 2026-09-28, 61 contributors returned by GitHub API, recent commits present. | APPROVED_AS_REFERENCE_ONLY |
| `frontend-design` | `anthropics/skills`, `skills/frontend-design` | Yes, Anthropic | Yes. Provides design-quality guidance without runtime code or business rules. Best used as optional visual/copy guidance beneath StockPilot docs. | Manual project-local copy only. No installer run. | `SKILL.md`, `LICENSE.txt`, sparse repo README, `THIRD_PARTY_NOTICES.md`, Git history, GitHub repo metadata, keyword scan for risky commands. | Instruction-only skill. No scripts, package files, lockfiles, bins, hooks, shell profile edits, remote script execution, sudo/admin commands, telemetry, token reads, or filesystem modification logic in the installed files. | Repo created 2025-09-22, pushed 2026-09-29, 15 contributors returned by GitHub API, recent commits present. | APPROVED |
| WebDeveloper.com `frontend-design` page | `webdeveloper.com/skills/anthropic/frontend-design/` | No | Low. It mirrors or describes Anthropic material but adds third-party installation instructions. | Not installed. | Search result and visible installation claims reviewed. | Recommends `curl`-based copy flows and is not affiliated with Anthropic; no advantage over the official Anthropic repository. | Not used as a source of truth. | REJECTED |
| Reddit/community frontend skill recommendations | Reddit and third-party discussion links from search results | No | Low. Useful only as community chatter. | Not installed. | Search result snippets only; no code trusted. | Unverified provenance and no direct trust benefit over official sources. | Not used. | REJECTED |

## Skill

Name: `frontend-design`

Source: Anthropic official skills repository

Repository: `https://github.com/anthropics/skills`

Commit: `8a1541c4a3ffa5a20a5a91de0dcf3f0bab1d1ef4`

License: Apache-2.0 for `skills/frontend-design/LICENSE.txt`

Reviewed date: 2026-10-03

Why selected:

- Instruction-only guidance with no runtime dependency.
- Helps avoid generic UI while still deferring StockPilot business truth to local docs.
- Covers visual hierarchy, typography, copy, responsive quality, accessibility basics, restrained motion, and screenshot review.
- Safer and smaller than installing a broad frontend plugin bundle.

Files installed:

- `.agents/skills/frontend-design/SKILL.md`
- `.agents/skills/frontend-design/LICENSE.txt`

Security findings:

- No install script was run.
- No package dependency was added.
- No shell, PowerShell, Python, JavaScript, or binary execution file was copied.
- No hook, global config, shell profile, SSH, Git remote, or credential behavior was present in the copied files.
- No network request code was present in the copied files.

Known limitations:

- It is design guidance, not StockPilot product truth.
- It does not define StockPilot routes, permissions, inventory semantics, pricing semantics, API contracts, or AI boundaries.
- It should be invoked through the local `stockpilot-ui` wrapper for StockPilot work.

## Local Project Skill

Name: `stockpilot-ui`

Source: local project wrapper

Repository: local StockPilot folder

Commit: not available because this folder is not currently a Git repository

License: project license not specified

Reviewed date: 2026-10-03

Why selected:

- Keeps StockPilot docs as the source of truth.
- Constrains UI work to the project's roles, flows, permissions, and safety rules.
- References `frontend-design` only as optional guidance.

Files installed:

- `.agents/skills/stockpilot-ui/SKILL.md`

Security findings:

- Instruction-only local file.
- No scripts, dependencies, hooks, network calls, credential access, or global configuration.

Known limitations:

- Must be revisited once a real frontend source tree, scripts, and design system file exist.
- Runtime validation could not run because no `package.json` exists in the inspected folder.

## Rejected Candidates

### `openai/plugins` `frontend-app-builder`

Repository: `https://github.com/openai/plugins/tree/main/plugins/build-web-apps/skills/frontend-app-builder`

Reason:

- Official and maintained, but too broad for a project-local StockPilot audit skill.
- Requires image-generation-first workflow for many UI tasks, which could fight StockPilot's already-defined UI/UX plan during early implementation.
- No clear license was exposed by GitHub repository metadata or the sparse-inspected skill path, so copied installation should wait for manual license review.

### WebDeveloper.com mirror or installer page

Repository: not an authoritative repository for the skill.

Reason:

- Third-party, unaffiliated page.
- Provides `curl`-style copy instructions without adding trust over the official Anthropic repository.

### Community Reddit recommendations

Repository: varies.

Reason:

- Not authoritative.
- No direct trust or security advantage over official OpenAI and Anthropic sources.

## Verification Notes

- No app source files were present or modified.
- No dependencies were added.
- No global Codex, npm, shell, SSH, Git, or system files were modified.
- Temporary inspection artifacts were created under `%TEMP%\stockpilot-skill-audit` and `%TEMP%\openai-docs-cache`.
- No install script was executed.
- No `npm install`, `npm ci`, lint, typecheck, test, or build command was applicable because no `package.json` exists.
- Git diff/status could not be produced because the inspected folder is not a Git repository.

## Recommended Next Step

Clone or switch to the actual `StockPilot_FE` Git checkout before application coding, then add a real `docs/DESIGN_SYSTEM.md` after team review and run the repository's actual validation scripts.
