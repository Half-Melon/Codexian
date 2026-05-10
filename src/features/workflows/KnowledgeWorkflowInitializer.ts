import type { VaultFileAdapter } from '../../core/storage/VaultFileAdapter';
import type { Locale } from '../../i18n/types';
import {
  KNOWLEDGE_WORKFLOW_AGENTS_PATH,
  KNOWLEDGE_WORKFLOW_CONCEPT_INDEX_PATH,
  KNOWLEDGE_WORKFLOW_MAP_PATH,
  KNOWLEDGE_WORKFLOW_SOURCE_INDEX_PATH,
} from './knowledgeWorkflowCommands';

export interface KnowledgeWorkflowInitializationResult {
  createdFiles: string[];
  createdFolders: string[];
}

const LEGACY_KNOWLEDGE_WORKFLOW_MAP_PATH = 'wiki/maps/LLM 个人知识库工作流.md';

const KNOWLEDGE_WORKFLOW_FOLDERS = [
  'new',
  'raw',
  'raw/inbox',
  'raw/articles',
  'raw/posts',
  'raw/papers',
  'raw/transcripts',
  'wiki',
  'wiki/indexes',
  'wiki/summaries',
  'wiki/concepts',
  'wiki/maps',
  'outputs',
  'outputs/qa',
  'outputs/health',
  'outputs/reports',
  '.codex',
  '.codex/skills',
  '.codex/skills/compile-source',
  '.codex/skills/archive-source',
  '.codex/skills/update-indexes',
  '.codex/skills/save-qa',
  '.codex/skills/health-check',
  '.codex/skills/repair-health',
  '.codex/skills/undo-archive',
  '.codex/skills/workflow-acceptance',
];

function isChineseLocale(locale: Locale): boolean {
  return locale.toLowerCase().startsWith('zh');
}

const EN_FILE_TEMPLATES: Record<string, string> = {
  [KNOWLEDGE_WORKFLOW_AGENTS_PATH]: `# Codexian Knowledge Base Rules

This vault uses Codexian to run an LLM personal knowledge-base workflow. When working on knowledge-base tasks, follow this file first.

## Three-Layer Boundary

- new/ is the staging area for new sources: put new material here before running Codexian source compilation.
- raw/ is the source archive layer: keep original source material here. Do not rewrite or summarize inside original files by default.
- wiki/ is the knowledge layer: keep compiled summaries, concepts, indexes, and maps here.
- outputs/ is the workflow output layer: keep saved Q&A, health checks, and reports here.
- Clippings/ may be treated as a historical source layer, but do not migrate it automatically unless the user explicitly asks.

## Folder Conventions

- new/: new sources waiting to be compiled.
- raw/inbox/: compiled sources whose category is uncertain.
- raw/articles/: web articles, essays, blog posts, newsletters, columns, and long-form pages.
- raw/posts/: social posts, forum threads, short notes, and fragmented posts.
- raw/papers/: papers, preprints, research reports, DOI/arXiv/PDF-style sources, or documents with abstract/references structure.
- raw/transcripts/: podcast, video, meeting, interview, or talk transcripts.
- wiki/summaries/: per-source summaries named S-001 Title.md.
- wiki/concepts/: reusable concepts named C-001 Concept Name.md.
- wiki/indexes/All-Sources.md: source index.
- wiki/indexes/All-Concepts.md: concept index.
- wiki/maps/LLM Personal Knowledge Base Workflow.md: workflow entry point and operating guide.
- outputs/qa/: saved reusable Q&A.
- outputs/health/: knowledge-base health checks.

## Source Compilation Rules

When compiling new sources, read only files in the vault root new/ folder. If new/ is empty, report that there are no new sources. Read indexes and the workflow map first, then read the source files in new/. Create a summary for each source, create or update concepts when needed, and keep indexes in sync.

After a source is successfully compiled, archive the original file from new/ into raw/articles, raw/posts, raw/papers, or raw/transcripts. If the source type cannot be classified with enough confidence, archive it into raw/inbox/. After moving a file, update the summary source, body source links, All-Sources paths, and any explicit links created or modified by the current task.

Whenever an archive move happens, create or update outputs/reports/YYYY-MM-DD-archive-log.md with the original path, new path, category, classification reason, updated links, and uncertainties.

Summary template:

\`\`\`markdown
---
type: summary
source: "[[Original source]]"
compiled_at: YYYY-MM-DD
concepts:
  - "[[C-xxx Concept name]]"
status: compiled
---

# Title

## Core conclusion

## Key evidence

## Reusable ideas

## Questions / To verify

## Related concepts
\`\`\`

Concept template:

\`\`\`markdown
---
type: concept
created: YYYY-MM-DD
updated: YYYY-MM-DD
sources:
  - "[[S-xxx Source summary]]"
status: active
---

# C-xxx Concept name

## One-sentence definition

## Key points

## Examples

## Boundaries

## Counterexamples / Confusions

## Sources
\`\`\`

## Q&A Save Rules

Save complex reusable Q&A to outputs/qa/YYYY-MM-DD-question-title.md. Include the question, short conclusion, analysis process, actionable recommendations, uncertainty, and content that can be reflected back into wiki.

## Health Check Rules

Write health checks to outputs/health/YYYY-MM-DD-health-check.md. Only generate a report; do not automatically rewrite wiki at scale. Focus on index registration, concepts missing sources, definition conflicts, isolated notes, outputs/qa feedback items, and next actions.

## Safety Boundary

Do not delete user files, migrate Clippings, or perform bulk renames or directory migrations beyond the current compiled new/ sources unless the user explicitly confirms. Do not start by adding RAG; use lightweight indexes first and upgrade only when vault size and retrieval needs prove it necessary.
`,

  [KNOWLEDGE_WORKFLOW_MAP_PATH]: `# LLM Personal Knowledge Base Workflow

This is the Codexian workflow entry point. Put new material into the vault root new/ folder, then run "Codexian: Compile new sources".

## How to use new/

- new/ is the staging area for sources waiting to be compiled.
- Any file placed in new/ is included when "Compile new sources" runs.
- After successful compilation, the original file moves from new/ into the matching raw/ source category. Uncertain classifications go to raw/inbox/.
- Archiving updates summaries, source indexes, and explicit links created in the current task, then records the move in outputs/reports/YYYY-MM-DD-archive-log.md.

## Operating Rhythm

- Daily: collect sources only, and optionally add one sentence explaining why the source was saved.
- Weekly: place selected new sources into new/ and run "Compile new sources".
- Weekly or after each batch: run a health check.
- Monthly: review whether concepts should be merged, split, or promoted into maps.

## Actions

- Codexian: Compile new sources
- Codexian: Save current Q&A
- Codexian: Run knowledge-base health check

## Open Questions

- Which sources in raw/inbox/ need manual reclassification?
- Which concepts need more sources, examples, or boundaries?
- Which outputs/qa files should be reflected back into wiki?
`,

  [KNOWLEDGE_WORKFLOW_SOURCE_INDEX_PATH]: `# All Sources

| ID | Source | Type | Status | Summary | Concepts | Notes |
| --- | --- | --- | --- | --- | --- | --- |

## Status Notes

- inbox: entered the source layer, not compiled yet.
- compiled: summary created and concepts registered.
- skipped: intentionally not processed for now.
`,

  [KNOWLEDGE_WORKFLOW_CONCEPT_INDEX_PATH]: `# All Concepts

| ID | Concept | Status | Sources | Notes |
| --- | --- | --- | --- | --- |

## Open Questions

- Are any concepts missing sources?
- Are any concepts duplicated or definition-conflicted?
- Should any concepts become topic maps under wiki/maps/?
`,

  '.codex/skills/compile-source/SKILL.md': `---
name: compile-source
description: Compile raw Obsidian sources into wiki summaries and candidate concepts.
---

# Compile Source

Use when the user asks to compile new sources into the LLM knowledge base.

Workflow:

1. Read AGENTS.md and wiki/maps/LLM Personal Knowledge Base Workflow.md.
2. Read all Markdown and readable text source files from the vault root new/ folder. If new/ is empty, report that there are no new sources and stop.
3. Read each source directly.
4. Create the next wiki/summaries/S-xxx file for each source.
5. Link summaries to existing concepts, or propose a new wiki/concepts/C-xxx file when the idea is reusable across contexts.
6. After each source is compiled successfully, use archive-source to move the original file from new/ into raw/articles, raw/posts, raw/papers, raw/transcripts, or raw/inbox.
7. Report created files, modified files, moved files, uncertainties, and files still remaining in new/.
`,

  '.codex/skills/archive-source/SKILL.md': `---
name: archive-source
description: Archive compiled new/ sources into raw/ and keep links aligned.
---

# Archive Source

Use after a source in new/ has been successfully compiled into wiki/summaries.

Destination rules:

1. raw/papers/ for papers, preprints, research articles, DOI/arXiv/PDF-style sources, or documents with abstract/references structure.
2. raw/transcripts/ for podcast, video, meeting, interview, or talk transcripts, especially with timestamps or speakers.
3. raw/posts/ for social posts, forum threads, short notes, and fragmented posts.
4. raw/articles/ for web articles, essays, blog posts, newsletters, columns, and long-form pages.
5. raw/inbox/ when classification is uncertain.

Workflow:

1. Move only sources from new/ that were successfully compiled in the current task.
2. Create a new title from the document content: the title should fit the source topic more closely and describe the document clearly. Use that title to create the archived filename.
3. Do not migrate Clippings or unrelated raw files.
4. If the target file already exists, append a short distinguishing suffix and never overwrite it.
5. Preserve the original extension when possible.
6. After moving a file, update the summary frontmatter source, summary body links, wiki/indexes/All-Sources.md, and any explicit links created or modified in this task.
7. Write or update outputs/reports/YYYY-MM-DD-archive-log.md with original path, new path, classification, reason, links updated, collision handling, and uncertainties.
8. If any move or link update is risky, stop and ask for confirmation.
`,

  '.codex/skills/repair-health/SKILL.md': `---
name: repair-health
description: Apply low-risk fixes from the latest knowledge-base health report.
---

# Repair Health

Use after health-check has produced an outputs/health report.

Workflow:

1. Read the latest outputs/health/YYYY-MM-DD-health-check.md.
2. Apply only low-risk fixes: missing index rows, obvious stale links, or metadata that is directly supported by existing summaries/concepts.
3. Do not merge concepts, split concepts, delete files, batch rename, migrate directories, or reinterpret sources without user confirmation.
4. Put risky changes under "Needs user confirmation".
5. Write outputs/reports/YYYY-MM-DD-health-fixes.md with applied fixes, skipped fixes, modified files, and confirmation items.
`,

  '.codex/skills/undo-archive/SKILL.md': `---
name: undo-archive
description: Undo the latest source archive operation from archive logs.
---

# Undo Archive

Use when the user asks to undo the latest Codexian archive move.

Workflow:

1. Read the latest outputs/reports/*archive-log.md.
2. Build an undo plan listing raw/ archived paths, original new/ paths, and link updates to reverse.
3. If any destination already exists, the archive log is incomplete, or link scope is unclear, stop and ask for confirmation.
4. When safe, move files back to new/ and revert summary source links, body links, All-Sources paths, and explicit links changed in the archived task.
5. Write outputs/reports/YYYY-MM-DD-undo-archive.md with reverted files, reverted links, skipped items, and uncertainties.
`,

  '.codex/skills/workflow-acceptance/SKILL.md': `---
name: workflow-acceptance
description: Run an end-to-end acceptance check for the Codexian knowledge workflow.
---

# Workflow Acceptance

Use when validating that the vault can sustainably run the Codexian knowledge workflow.

Write outputs/reports/YYYY-MM-DD-workflow-acceptance.md. Check:

1. Required folders and workflow files exist.
2. new/ pending files are visible and reasonable.
3. Recent summaries link to archived raw sources.
4. All-Sources and All-Concepts align with summaries and concepts.
5. archive-log files explain every recent source move.
6. raw/inbox/ contains only uncertain classifications.
7. outputs/qa and latest health-check are available for review.

Only produce a report. Do not move, delete, or batch rewrite files during acceptance.
`,

  '.codex/skills/update-indexes/SKILL.md': `---
name: update-indexes
description: Keep All-Sources and All-Concepts aligned with summaries and concepts.
---

# Update Indexes

Use when summaries, concepts, or workflow maps changed.

Rules:

1. Update wiki/indexes/All-Sources.md for every compiled source.
2. Update wiki/indexes/All-Concepts.md for every new or changed concept.
3. Preserve existing user notes and manual status fields.
4. Prefer lightweight Markdown tables and wikilinks.
5. If index state is ambiguous, add an open question instead of guessing.
`,

  '.codex/skills/save-qa/SKILL.md': `---
name: save-qa
description: Save reusable Codexian conversations into outputs/qa.
---

# Save Q&A

Use when a conversation contains reusable knowledge or decisions.

Create outputs/qa/YYYY-MM-DD-question-title.md with:

- Question
- Short conclusion
- Analysis process
- Actionable recommendations
- Uncertainty
- Content that can be reflected back into wiki

Link related summaries and concepts when known. Do not silently rewrite concept files unless the user confirms.
`,

  '.codex/skills/health-check/SKILL.md': `---
name: health-check
description: Generate a lightweight health report for the Obsidian knowledge base.
---

# Health Check

Use when the user asks to inspect knowledge-base quality.

Write outputs/health/YYYY-MM-DD-health-check.md. Check:

1. summaries missing from All-Sources.
2. concepts missing from All-Concepts.
3. concepts with no sources, no definition, no examples, or no boundary.
4. duplicate or conflicting concept definitions.
5. outputs/qa files that should be reflected back into wiki.
6. isolated summaries or stale open questions.

Only produce a report. Put risky fixes under "Needs user confirmation".
`,
};

const ZH_CN_FILE_TEMPLATES: Record<string, string> = {
  [KNOWLEDGE_WORKFLOW_AGENTS_PATH]: `# Codexian Knowledge Base Rules

本 vault 使用 Codexian 运行 LLM 个人知识库工作流。执行知识库任务时，优先遵守本文件。

## 三层边界

- new/ 是新来源暂存区：用户把待编译的新资料放在这里，Codexian 编译新来源时只从这里读取。
- raw/ 是来源层：保存原始资料，默认不改写、不总结到原文件里。
- wiki/ 是知识层：保存 LLM 编译后的摘要、概念、索引和地图。
- outputs/ 是运行输出层：保存问答沉淀、健康检查和报告。
- Clippings/ 可以作为历史来源层处理，但不要自动迁移，除非用户明确要求。

## 目录约定

- new/：待编译的新来源。
- raw/inbox/：已编译但分类依据不足的来源归档。
- raw/articles/：网页、博客、长文。
- raw/posts/：社媒帖、论坛帖、短内容。
- raw/papers/：论文。
- raw/transcripts/：播客、视频、访谈转录。
- wiki/summaries/：逐篇来源摘要，命名为 S-001 标题.md。
- wiki/concepts/：可复用概念，命名为 C-001 概念名.md。
- wiki/indexes/All-Sources.md：来源索引。
- wiki/indexes/All-Concepts.md：概念索引。
- wiki/maps/LLM Personal Knowledge Base Workflow.md：工作流入口和运行说明。
- outputs/qa/：复杂问答落文件。
- outputs/health/：知识库健康检查。

## 编译来源规则

编译新来源时，只读取根目录 new/ 里的文件；如果 new/ 为空，直接报告没有新来源。先读索引和工作流入口，再读取 new/ 原文。为每篇来源生成 summary，必要时新建或更新 concept，并同步更新索引。

编译成功后，把已编译原文从 new/ 归档到 raw/articles、raw/posts、raw/papers 或 raw/transcripts。无法可靠判断类型时，归档到 raw/inbox/。归档后必须同步修正 summary source、正文来源链接、All-Sources 里的来源路径，以及本次创建或修改过的显式链接。

每次发生归档移动时，生成或更新 outputs/reports/YYYY-MM-DD-archive-log.md，记录原路径、新路径、分类、分类理由、已同步更新的链接和不确定项。

summary 模板：

\`\`\`markdown
---
type: summary
source: "[[原始来源]]"
compiled_at: YYYY-MM-DD
concepts:
  - "[[C-xxx 概念名]]"
status: compiled
---

# 标题

## 核心结论

## 关键证据

## 可复用观点

## 疑点 / 待验证

## 关联概念
\`\`\`

concept 模板：

\`\`\`markdown
---
type: concept
created: YYYY-MM-DD
updated: YYYY-MM-DD
sources:
  - "[[S-xxx 来源摘要]]"
status: active
---

# C-xxx 概念名

## 一句话定义

## 关键要点

## 例子

## 适用边界

## 反例 / 易混淆点

## 来源
\`\`\`

## Q&A 落文件规则

复杂问答必须保存到 outputs/qa/YYYY-MM-DD-问题标题.md。包含问题、简短结论、分析过程、可执行建议、不确定性，以及可反哺到 wiki 的内容。

## 健康检查规则

健康检查输出到 outputs/health/YYYY-MM-DD-health-check.md。只生成报告，不自动大规模改写 wiki。重点检查索引登记、概念缺来源、定义冲突、孤岛笔记、outputs/qa 反哺项和下一步行动。

## 安全边界

不要删除用户文件，不要迁移 Clippings，不要做超出本次 new/ 已编译来源的批量重命名或目录迁移，除非用户明确确认。不要上来就搭 RAG；先使用轻量索引，等规模和检索需求证明必要后再升级。
`,

  [KNOWLEDGE_WORKFLOW_MAP_PATH]: `# LLM Personal Knowledge Base Workflow

这是 Codexian 的知识库工作流入口。把新资料放入根目录 new/ 后，运行“Codexian: 编译新来源”。

## new/ 使用说明

- new/ 是待编译来源的暂存区。
- 只要文件放在 new/ 里，“编译新来源”就会把它纳入本次编译范围。
- 编译成功后，原文件会从 new/ 归档到 raw/ 对应来源分类；判断不准的进入 raw/inbox/。
- 归档会同步修正 summary、来源索引和本次生成内容里的显式链接，并写入 outputs/reports/YYYY-MM-DD-archive-log.md。

## 当前节奏

- 每天：只收集资料，必要时写一句为什么保存。
- 每周：把要处理的新资料放入 new/，运行一次“编译新来源”。
- 每周或每批次后：运行健康检查。
- 每月：审查概念是否需要合并、拆分或升级为 map。

## 操作按钮

- Codexian: 编译新来源
- Codexian: 保存当前问答
- Codexian: 运行知识库健康检查

## 开放问题

- raw/inbox/ 里有哪些来源需要人工重新分类？
- 哪些概念需要补来源、例子或适用边界？
- 哪些 outputs/qa 值得反哺到 wiki？
`,

  [KNOWLEDGE_WORKFLOW_SOURCE_INDEX_PATH]: `# All Sources

| ID | Source | Type | Status | Summary | Concepts | Notes |
| --- | --- | --- | --- | --- | --- | --- |

## 状态说明

- inbox：已进入来源层，尚未编译。
- compiled：已生成 summary 并登记概念。
- skipped：暂不处理。
`,

  [KNOWLEDGE_WORKFLOW_CONCEPT_INDEX_PATH]: `# All Concepts

| ID | Concept | Status | Sources | Notes |
| --- | --- | --- | --- | --- |

## 开放问题

- 是否有概念缺少来源？
- 是否有重复或定义冲突的概念？
- 是否有概念需要升级为 wiki/maps/ 下的主题地图？
`,

  '.codex/skills/compile-source/SKILL.md': `---
name: compile-source
description: 将 Obsidian 新来源编译为 wiki 摘要和候选概念。
---

# 编译来源

当用户要求把新来源编译进 LLM 知识库时使用。

流程：

1. 读取 AGENTS.md 和 wiki/maps/LLM Personal Knowledge Base Workflow.md。
2. 读取 vault 根目录 new/ 文件夹中的所有 Markdown 和可读文本来源文件。如果 new/ 为空，报告没有新来源并停止。
3. 直接读取每篇来源原文。
4. 为每篇来源创建下一个 wiki/summaries/S-xxx 文件。
5. 将摘要关联到已有概念；如果某个想法能跨场景复用，提出新的 wiki/concepts/C-xxx 文件。
6. 每篇来源编译成功后，使用 archive-source 把原文件从 new/ 移动到 raw/articles、raw/posts、raw/papers、raw/transcripts 或 raw/inbox。
7. 报告创建文件、修改文件、移动文件、不确定项，以及 new/ 中仍保留的文件。
`,

  '.codex/skills/archive-source/SKILL.md': `---
name: archive-source
description: 将已编译的 new/ 来源归档到 raw/ 并保持链接同步。
---

# 归档来源

当 new/ 中的来源已成功编译为 wiki/summaries 摘要后使用。

目标目录规则：

1. raw/papers/：论文、预印本、研究文章、DOI/arXiv/PDF 风格来源，或具有摘要/参考文献结构的文档。
2. raw/transcripts/：播客、视频、会议、访谈或演讲转录，尤其是包含时间戳或说话人的内容。
3. raw/posts/：社媒帖、论坛串、短笔记和碎片化帖子。
4. raw/articles/：网页文章、随笔、博客、newsletter、专栏和长文。
5. raw/inbox/：分类不确定时使用。

流程：

1. 只移动当前任务中已成功编译的 new/ 来源。
2. 根据文档内容制定一个新的标题：更贴切文章主题、更清晰表示文档内容，标题可以适当长一些；使用该标题生成归档文件名。
3. 不要迁移 Clippings 或无关 raw 文件。
4. 如果目标文件已存在，追加简短区分后缀，绝不覆盖已有文件。
5. 尽量保留原扩展名。
6. 移动文件后，更新 summary frontmatter source、summary 正文链接、wiki/indexes/All-Sources.md，以及本任务创建或修改的显式链接。
7. 写入或更新 outputs/reports/YYYY-MM-DD-archive-log.md，记录原路径、新路径、分类、理由、已更新链接、重名处理和不确定项。
8. 如果任一移动或链接更新存在风险，停止并请求确认。
`,

  '.codex/skills/repair-health/SKILL.md': `---
name: repair-health
description: 根据最近的知识库健康报告执行低风险修复。
---

# 修复健康检查问题

当 health-check 已生成 outputs/health 报告后使用。

流程：

1. 读取最新的 outputs/health/YYYY-MM-DD-health-check.md。
2. 只执行低风险修复：补索引缺项、修正明显过期链接，或补充由现有摘要/概念直接支持的元数据。
3. 未经用户确认，不要合并概念、拆分概念、删除文件、批量改名、迁移目录或重新解释来源。
4. 将高风险修改放入“需要用户确认”。
5. 写入 outputs/reports/YYYY-MM-DD-health-fixes.md，列出已应用修复、跳过项、修改文件和确认项。
`,

  '.codex/skills/undo-archive/SKILL.md': `---
name: undo-archive
description: 根据归档日志撤销最近一次来源归档操作。
---

# 撤销归档

当用户要求撤销最近一次 Codexian 归档移动时使用。

流程：

1. 读取最新的 outputs/reports/*archive-log.md。
2. 生成撤销计划，列出 raw/ 归档路径、原 new/ 路径，以及需要反向更新的链接。
3. 如果任一目标路径已存在、归档日志不完整，或链接范围不清晰，停止并请求确认。
4. 在安全时，把文件移回 new/，并回滚 summary source 链接、正文链接、All-Sources 路径和归档任务中更改的显式链接。
5. 写入 outputs/reports/YYYY-MM-DD-undo-archive.md，列出已回滚文件、已回滚链接、跳过项和不确定项。
`,

  '.codex/skills/workflow-acceptance/SKILL.md': `---
name: workflow-acceptance
description: 对 Codexian 知识库工作流运行端到端验收检查。
---

# 工作流验收

当需要验证 vault 是否能持续运行 Codexian 知识库工作流时使用。

写入 outputs/reports/YYYY-MM-DD-workflow-acceptance.md。检查：

1. 必需目录和工作流文件是否存在。
2. new/ 待处理文件是否可见且合理。
3. 最近摘要是否链接到已归档的 raw 来源。
4. All-Sources 和 All-Concepts 是否与摘要、概念一致。
5. archive-log 是否解释了最近每次来源移动。
6. raw/inbox/ 是否只包含分类不确定的来源。
7. outputs/qa 和最近的 health-check 是否可供审查。

只生成报告。验收期间不要移动、删除或批量改写文件。
`,

  '.codex/skills/update-indexes/SKILL.md': `---
name: update-indexes
description: 保持 All-Sources 和 All-Concepts 与摘要、概念同步。
---

# 更新索引

当摘要、概念或工作流地图发生变化时使用。

规则：

1. 为每篇已编译来源更新 wiki/indexes/All-Sources.md。
2. 为每个新增或变更概念更新 wiki/indexes/All-Concepts.md。
3. 保留已有用户备注和手动状态字段。
4. 优先使用轻量 Markdown 表格和 wiki 链接。
5. 如果索引状态不明确，添加开放问题，不要猜测。
`,

  '.codex/skills/save-qa/SKILL.md': `---
name: save-qa
description: 将可复用的 Codexian 对话保存到 outputs/qa。
---

# 保存问答

当对话包含可复用知识或决策时使用。

Create outputs/qa/YYYY-MM-DD-问题标题.md with:

- 问题
- 简短结论
- 分析过程
- 可执行建议
- 不确定性
- 可反哺到 wiki 的内容

在已知时链接相关摘要和概念。除非用户确认，不要静默改写概念文件。
`,

  '.codex/skills/health-check/SKILL.md': `---
name: health-check
description: 为 Obsidian 知识库生成轻量健康报告。
---

# 健康检查

当用户要求检查知识库质量时使用。

写入 outputs/health/YYYY-MM-DD-health-check.md。检查：

1. 缺少 All-Sources 登记的摘要。
2. 缺少 All-Concepts 登记的概念。
3. 没有来源、定义、例子或边界的概念。
4. 重复或冲突的概念定义。
5. 应反哺回 wiki 的 outputs/qa 文件。
6. 孤立摘要或过期开放问题。

只生成报告。将高风险修复放入“需要用户确认的修改”。
`,
};

function getFileTemplates(locale: Locale): Record<string, string> {
  return isChineseLocale(locale) ? ZH_CN_FILE_TEMPLATES : EN_FILE_TEMPLATES;
}

type KnowledgeWorkflowInitializerAdapter = Pick<VaultFileAdapter, 'ensureFolder' | 'exists' | 'write'> &
  Partial<Pick<VaultFileAdapter, 'rename'>>;

export class KnowledgeWorkflowInitializer {
  constructor(private adapter: KnowledgeWorkflowInitializerAdapter) {}

  async initialize(locale: Locale = 'en'): Promise<KnowledgeWorkflowInitializationResult> {
    const createdFolders: string[] = [];
    const createdFiles: string[] = [];

    for (const folder of KNOWLEDGE_WORKFLOW_FOLDERS) {
      if (!(await this.adapter.exists(folder))) {
        await this.adapter.ensureFolder(folder);
        createdFolders.push(folder);
      }
    }

    if (
      !(await this.adapter.exists(KNOWLEDGE_WORKFLOW_MAP_PATH))
      && await this.adapter.exists(LEGACY_KNOWLEDGE_WORKFLOW_MAP_PATH)
      && this.adapter.rename
    ) {
      await this.adapter.rename(LEGACY_KNOWLEDGE_WORKFLOW_MAP_PATH, KNOWLEDGE_WORKFLOW_MAP_PATH);
    }

    for (const [path, content] of Object.entries(getFileTemplates(locale))) {
      if (!(await this.adapter.exists(path))) {
        await this.adapter.write(path, content);
        createdFiles.push(path);
      }
    }

    return { createdFiles, createdFolders };
  }
}
