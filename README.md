# Codexidian

Codexidian is a Codex-only Obsidian plugin.

It embeds Codex in an Obsidian sidebar and uses your vault as the working directory, so Codex can read, edit, search, run commands, and work through multi-step knowledge-base tasks from inside Obsidian.

## What It Does

- Chat sidebar from the ribbon icon or command palette.
- Inline edit for selected text or the current cursor position, with diff preview.
- Codex skills from `.codex/skills/` and `.agents/skills/`.
- `@mention` support for vault files, Codex subagents, and selected external context.
- Plan mode through the shared permission-mode toolbar.
- Instruction mode with `#`.
- Multi-tab conversations, history, fork, resume, and compact.
- Codex CLI-managed MCP support. Configure servers with `codex mcp`.
- First-run knowledge-base bootstrap for the Karpathy-style `new/`, `raw/`, `wiki/`, `outputs/` workflow, including `AGENTS.md`, indexes, workflow map, and vault-level Codex skills.

## Requirements

- Obsidian desktop v1.4.5 or newer.
- Codex CLI available locally.
- Recommended macOS CLI path when using Codex.app:

```bash
/Applications/Codex.app/Contents/Resources/codex
```

## Install From This Source Tree

To copy build output into an Obsidian vault during development, set `OBSIDIAN_VAULT` in `.env.local`.

Build and install:

```bash
npm install
npm run build
```

Then reload Obsidian and enable `Codexidian` under Community plugins if it is not already enabled.

## Knowledge Base Workflow

On first load, Codexidian creates any missing knowledge-base scaffold files without overwriting existing notes:

- `new/`
- `raw/inbox/`, `raw/articles/`, `raw/posts/`, `raw/papers/`, `raw/transcripts/`
- `wiki/indexes/`, `wiki/summaries/`, `wiki/concepts/`, `wiki/maps/`
- `outputs/qa/`, `outputs/health/`, `outputs/reports/`
- `AGENTS.md`
- `wiki/indexes/All-Sources.md`
- `wiki/indexes/All-Concepts.md`
- `wiki/maps/LLM 个人知识库工作流.md`
- `.codex/skills/compile-source`, `archive-source`, `update-indexes`, `save-qa`, `health-check`, `repair-health`, `undo-archive`, and `workflow-acceptance`

You can also run `Codexidian: 初始化知识库工作流` from the command palette or from Codexidian settings.

Put new source files in the vault root `new/` folder, then click the left ribbon button `Codexidian: 编译新来源` or run the same command from the command palette. Codexidian compiles those sources into `wiki/summaries/`, updates concepts and indexes, archives successfully compiled originals into `raw/articles/`, `raw/posts/`, `raw/papers/`, `raw/transcripts/`, or `raw/inbox/`, and records the moves in `outputs/reports/YYYY-MM-DD-archive-log.md`.

The workflow controls also include status review, health-check repair, archive undo, and end-to-end acceptance checks. Archive rules rename compiled files from their content with clearer titles, handle filename collisions without overwriting existing files, and keep source links aligned. Batch size, summary template, concept template, archive rules, and archive-log template are configurable in Codexidian settings.

## Storage

- Plugin settings: `vault/.codexidian/codexidian-settings.json`
- Codex sessions: `~/.codex/sessions/`
- Codex vault skills: `vault/.codex/skills/` and `vault/.agents/skills/`
- Codex vault subagents: `vault/.codex/agents/*.toml`

## Development Notes

Codexidian is intentionally Codex-only. The runtime provider registry only registers Codex, and Codex MCP tool calls are rendered from the Codex CLI session stream.

## Attribution

Codexidian adapts the original plugin architecture into a Codex-only Obsidian workflow.

## License

MIT, following the upstream Codexidian license.
