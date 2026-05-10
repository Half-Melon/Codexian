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
  'raw',
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
  '.codex/skills/update-indexes',
  '.codex/skills/save-qa',
  '.codex/skills/health-check',
];

const FILE_TEMPLATES: Record<string, string> = {
  [KNOWLEDGE_WORKFLOW_AGENTS_PATH]: `# Codexidian Knowledge Base Rules

本 vault 使用 Codexidian 运行 LLM 个人知识库工作流。执行知识库任务时，优先遵守本文件。

## 三层边界

- raw/ 是来源层：保存原始资料，默认不改写、不总结到原文件里。
- wiki/ 是知识层：保存 LLM 编译后的摘要、概念、索引和地图。
- outputs/ 是运行输出层：保存问答沉淀、健康检查和报告。
- Clippings/ 可以作为历史来源层处理，但不要自动迁移，除非用户明确要求。

## 目录约定

- raw/articles/：网页、博客、长文。
- raw/posts/：社媒帖、论坛帖、短内容。
- raw/papers/：论文。
- raw/transcripts/：播客、视频、访谈转录。
- wiki/summaries/：逐篇来源摘要，命名为 S-001 标题.md。
- wiki/concepts/：可复用概念，命名为 C-001 概念名.md。
- wiki/indexes/All-Sources.md：来源索引。
- wiki/indexes/All-Concepts.md：概念索引。
- wiki/maps/LLM 个人知识库工作流.md：工作流入口和下一批候选来源。
- outputs/qa/：复杂问答落文件。
- outputs/health/：知识库健康检查。

## 编译来源规则

每次只处理 3 到 5 篇候选来源。先读索引和工作流入口，再读取原文。为每篇来源生成 summary，必要时新建或更新 concept，并同步更新索引。

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

不要删除、迁移或批量重命名用户文件，除非用户明确确认。不要上来就搭 RAG；先使用轻量索引，等规模和检索需求证明必要后再升级。
`,

  [KNOWLEDGE_WORKFLOW_MAP_PATH]: `# LLM 个人知识库工作流

这是 Codexidian 的知识库工作流入口。把新资料放入 raw/ 或 Clippings/ 后，在这里维护下一批候选来源，然后运行“Codexidian: 编译下一批候选来源”。

## 下一批候选来源

<!-- 每次放 3 到 5 条，示例：
- [[raw/articles/example.md]]
- [[Clippings/example.md]]
-->

## 当前节奏

- 每天：只收集资料，必要时写一句为什么保存。
- 每周：选择 3 到 5 篇来源做小批量编译。
- 每周或每批次后：运行健康检查。
- 每月：审查概念是否需要合并、拆分或升级为 map。

## 操作按钮

- Codexidian: 编译下一批候选来源
- Codexidian: 保存当前问答
- Codexidian: 运行知识库健康检查

## 开放问题

- 哪些来源最值得进入下一批编译？
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
2. Select 3 to 5 candidate sources from “下一批候选来源” or uncompiled entries in wiki/indexes/All-Sources.md.
3. Read each source directly.
4. Create the next wiki/summaries/S-xxx file for each source.
5. Link summaries to existing concepts, or propose a new wiki/concepts/C-xxx file when the idea is reusable across contexts.
6. Do not migrate Clippings or rewrite raw files unless the user explicitly asks.
7. Report created files, modified files, uncertainties, and suggested next candidates.
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
