# Codexian

English | [简体中文](README.zh-CN.md)

Codexian is a desktop plugin for Obsidian that brings Codex into the vault as a local, vault-aware working assistant. It provides a chat sidebar, inline editing, file mentions, Codex skills, subagents, MCP support, and a structured knowledge-base workflow for turning saved sources into reusable notes.

![Codexian screenshot](assets/screenshot.png)

## Why Codexian

Obsidian is strong at long-term knowledge storage, but maintaining a useful knowledge base still requires repetitive work: collecting sources, summarizing them, extracting concepts, keeping indexes current, recording useful Q&A, and checking whether the system is drifting.

Codexian connects that work to Codex inside the vault. The plugin keeps the interaction close to the notes, lets Codex use the vault as its working directory, and adds a first-class workflow for a sustainable `new/`, `raw/`, `wiki/`, and `outputs/` knowledge system.

## Features

- Codex chat sidebar inside Obsidian.
- Inline edit for selected text or the current cursor position, with diff preview.
- `@mention` support for vault files, Codex subagents, and selected external context.
- Codex skills loaded from `.codex/skills/` and `.agents/skills/`.
- Multi-tab conversations, conversation history, fork, resume, and compact.
- Plan mode and permission controls through the shared toolbar.
- Instruction mode with `#`.
- English and Simplified Chinese interface. The default language follows Obsidian's language setting, and it can be overridden in Codexian settings.
- Codex CLI-managed MCP support. Configure servers with `codex mcp`.
- Knowledge-base workflow controls from the ribbon and command palette:
  - Compile new sources from `new/`.
  - Save the current Q&A.
  - Run a knowledge-base health check.
  - Apply low-risk health fixes.
  - Undo the latest source archive.
  - Run an end-to-end workflow acceptance check.
  - Open the workflow status and workflow map.
- First-run initializer from the settings page for creating the knowledge-base scaffold.

## Knowledge-Base Workflow

Codexian is designed around a three-layer knowledge-base structure:

```text
new/                  New sources waiting to be compiled
raw/                  Archived original sources
wiki/                 Reusable knowledge: summaries, concepts, indexes, maps
outputs/              Q&A, health checks, reports, and other workflow outputs
```

The initializer creates the following scaffold without overwriting existing notes:

```text
new/
raw/
  inbox/
  articles/
  posts/
  papers/
  transcripts/
wiki/
  indexes/
  summaries/
  concepts/
  maps/
outputs/
  qa/
  health/
  reports/
AGENTS.md
wiki/indexes/All-Sources.md
wiki/indexes/All-Concepts.md
wiki/maps/LLM Personal Knowledge Base Workflow.md
.codex/skills/
```

Put source files into the vault root `new/` folder, then click the ribbon action or run `Codexian: Compile new sources` from the command palette. Codexian sends Codex a workflow prompt that reads the new files, creates summaries, updates indexes and concepts, then archives the compiled originals into `raw/articles/`, `raw/posts/`, `raw/papers/`, `raw/transcripts/`, or `raw/inbox/`.

Compiled source files are renamed from their content with clearer, topic-specific titles. Filename collisions are handled without overwriting existing files, and archive moves are recorded in `outputs/reports/YYYY-MM-DD-archive-log.md`.

## Requirements

- Obsidian desktop 1.4.5 or newer.
- Node.js 22 or newer for development builds.
- Codex CLI available on the local machine.
- macOS, Windows, or Linux desktop environment supported by Obsidian and the Codex CLI.

When using Codex.app on macOS, the Codex CLI path is usually:

```text
/Applications/Codex.app/Contents/Resources/codex
```

## Install in Obsidian

### Install from a GitHub release

1. Download `codexian-1.0.0.zip` from the GitHub Releases page.
2. Create this folder in your vault if it does not already exist:

```text
<your-vault>/.obsidian/plugins/codexian/
```

3. Extract these three files into that folder:

```text
main.js
manifest.json
styles.css
```

4. Restart the app or run `Reload app without saving` from the command palette.
5. Open `Settings -> Community plugins`.
6. Enable community plugins if required, then enable `Codexian`.
7. Open `Settings -> Codexian` and confirm the Codex CLI path.

### Build from source

```bash
npm install
npm run build
```

The build produces `main.js`, `manifest.json`, and `styles.css` in the project root. Copy those files into:

```text
<your-vault>/.obsidian/plugins/codexian/
```

For local development, set `OBSIDIAN_VAULT` in `.env.local` and run:

```bash
npm run build
```

The build script will copy the plugin output into the configured vault plugin folder.

## Settings

Codexian stores plugin settings in:

```text
<vault>/.codexian/codexian-settings.json
```

The settings page includes:

- Codex CLI path.
- Language: auto, English, or Simplified Chinese.
- Provider and runtime options.
- Knowledge-base initializer.
- Compile batch size.
- Summary, concept, archive, and report templates.
- Archive rules for classifying compiled sources into `raw/`.

## Development

```bash
npm install
npm run typecheck
npm run lint
npm run test
npm run build
```

The project uses:

- TypeScript.
- Obsidian plugin API.
- Codex CLI session/runtime integration.
- esbuild.
- Jest.
- ESLint with TypeScript support.
- `smol-toml` for TOML parsing.

## Privacy and Security

Codexian runs locally inside Obsidian and uses the local Codex CLI. The plugin can read and write files in the active vault because that is required for vault-aware workflows. Codex can also run local commands when allowed by the configured permission mode.

Review permission prompts carefully, keep secrets out of the vault, and avoid placing private credentials in notes that may be sent to a model or used by tools.

Codex itself may use network services depending on the user's Codex CLI configuration and account. Codexian does not add separate telemetry, advertising, or self-update mechanisms.

The plugin can work with external context directories and local MCP tools when the user configures those features. In those cases, Codex may read files outside the vault or call local tools according to the configured permission mode.

## Author

Codexian is created and maintained by HalfMelon. The project is developed at https://github.com/Half-Melon/Codexian.

## Acknowledgements

Codexian takes inspiration from Claudian's approach to agent-assisted Obsidian workflows, then adapts and extends the idea for a Codex-only workflow with a structured knowledge-base system, source compilation, archive handling, and health checks.

Thanks to the Linux.Do community. Its open-source spirit and practical discussions encouraged this project.

## License

MIT.
