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
