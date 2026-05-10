import type { VaultFileAdapter } from '../../core/storage/VaultFileAdapter';
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

const FILE_TEMPLATES: Record<string, string> = {
  [KNOWLEDGE_WORKFLOW_AGENTS_PATH]: `# Codexidian Knowledge Base Rules

本 vault 使用 Codexidian 运行 LLM 个人知识库工作流。执行知识库任务时，优先遵守本文件。

## 三层边界

- new/ 是新来源暂存区：用户把待编译的新资料放在这里，Codexidian 编译新来源时只从这里读取。
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
- wiki/maps/LLM 个人知识库工作流.md：工作流入口和运行说明。
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

  [KNOWLEDGE_WORKFLOW_MAP_PATH]: `# LLM 个人知识库工作流

这是 Codexidian 的知识库工作流入口。把新资料放入根目录 new/ 后，运行“Codexidian: 编译新来源”。

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

- Codexidian: 编译新来源
- Codexidian: 保存当前问答
- Codexidian: 运行知识库健康检查

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
description: Compile raw Obsidian sources into wiki summaries and candidate concepts.
---

# Compile Source

Use when the user asks to compile raw sources into the LLM knowledge base.

Workflow:

1. Read AGENTS.md and wiki/maps/LLM 个人知识库工作流.md.
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
4. raw/articles/ for web articles, essays, blog posts, newsletters, and long-form pages.
5. raw/inbox/ when classification is uncertain.

Workflow:

1. Move only sources from new/ that were successfully compiled in the current task.
2. 根据文档内容制定一个新的标题：更贴切文章主题、更清晰表示文档内容，标题可以适当长一些；use that title to create the archived filename.
3. Do not migrate Clippings or unrelated raw files.
4. If the target file already exists, append a short distinguishing suffix. 如果目标文件已存在，不要 overwrite.
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
4. Put risky changes under “需要用户确认”.
5. Write outputs/reports/YYYY-MM-DD-health-fixes.md with applied fixes, skipped fixes, modified files, and confirmation items.
`,

  '.codex/skills/undo-archive/SKILL.md': `---
name: undo-archive
description: Undo the latest source archive operation from archive logs.
---

# Undo Archive

Use when the user asks to undo the latest Codexidian archive move.

Workflow:

1. Read the latest outputs/reports/*archive-log.md.
2. Build a 撤销计划 listing raw/ archived paths, original new/ paths, and link updates to reverse.
3. If any destination already exists, the archive log is incomplete, or link scope is unclear, stop and ask for confirmation.
4. When safe, move files back to new/ and revert summary source links, body links, All-Sources paths, and explicit links changed in the archived task.
5. Write outputs/reports/YYYY-MM-DD-undo-archive.md with reverted files, reverted links, skipped items, and uncertainties.
`,

  '.codex/skills/workflow-acceptance/SKILL.md': `---
name: workflow-acceptance
description: Run an end-to-end acceptance check for the Codexidian knowledge workflow.
---

# Workflow Acceptance

Use when validating that the vault can sustainably run the Codexidian knowledge workflow.

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
description: Save reusable Codexidian conversations into outputs/qa.
---

# Save QA

Use when a conversation contains reusable knowledge or decisions.

Create outputs/qa/YYYY-MM-DD-问题标题.md with:

- 问题
- 简短结论
- 分析过程
- 可执行建议
- 不确定性
- 可反哺到 wiki 的内容

Link related summaries and concepts when known. Do not silently rewrite concept files unless the user confirms.
`,

  '.codex/skills/health-check/SKILL.md': `---
name: health-check
description: Generate a lightweight health report for the Obsidian knowledge base.
---

# Health Check

Use when the user asks to inspect knowledge base quality.

Write outputs/health/YYYY-MM-DD-health-check.md. Check:

1. summaries missing from All-Sources.
2. concepts missing from All-Concepts.
3. concepts with no sources, no definition, no examples, or no boundary.
4. duplicate or conflicting concept definitions.
5. outputs/qa files that should be reflected back into wiki.
6. isolated summaries or stale open questions.

Only produce a report. Put risky fixes under “需要用户确认的修改”.
`,
};

export class KnowledgeWorkflowInitializer {
  constructor(private adapter: Pick<VaultFileAdapter, 'ensureFolder' | 'exists' | 'write'>) {}

  async initialize(): Promise<KnowledgeWorkflowInitializationResult> {
    const createdFolders: string[] = [];
    const createdFiles: string[] = [];

    for (const folder of KNOWLEDGE_WORKFLOW_FOLDERS) {
      if (!(await this.adapter.exists(folder))) {
        await this.adapter.ensureFolder(folder);
        createdFolders.push(folder);
      }
    }

    for (const [path, content] of Object.entries(FILE_TEMPLATES)) {
      if (!(await this.adapter.exists(path))) {
        await this.adapter.write(path, content);
        createdFiles.push(path);
      }
    }

    return { createdFiles, createdFolders };
  }
}
