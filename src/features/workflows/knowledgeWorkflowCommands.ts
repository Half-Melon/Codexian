import type { ProviderCommandEntry } from '../../core/providers/commands/ProviderCommandEntry';

export const KNOWLEDGE_WORKFLOW_AGENTS_PATH = 'AGENTS.md';
export const KNOWLEDGE_WORKFLOW_MAP_PATH = 'wiki/maps/LLM 个人知识库工作流.md';
export const KNOWLEDGE_WORKFLOW_SOURCE_INDEX_PATH = 'wiki/indexes/All-Sources.md';
export const KNOWLEDGE_WORKFLOW_CONCEPT_INDEX_PATH = 'wiki/indexes/All-Concepts.md';

export type KnowledgeWorkflowKind =
  | 'compile-next-sources'
  | 'save-current-qa'
  | 'health-check';

interface KnowledgeWorkflowDefinition {
  kind: KnowledgeWorkflowKind;
  commandId: string;
  commandName: string;
  dropdownName: string;
  description: string;
  ribbonIcon: string;
  notice: string;
  prompt: string;
}

const COMMON_CONTEXT = [
  '请先读取 AGENTS.md、wiki/maps/LLM 个人知识库工作流.md、wiki/indexes/All-Sources.md 和 wiki/indexes/All-Concepts.md。',
  '遵守 vault 里的三层边界：raw/ 与 Clippings/ 是来源层，wiki/ 是可复用知识层，outputs/ 是运行输出层。',
].join('\n');

const KNOWLEDGE_WORKFLOWS: Record<KnowledgeWorkflowKind, KnowledgeWorkflowDefinition> = {
  'compile-next-sources': {
    kind: 'compile-next-sources',
    commandId: 'workflow-compile-next-sources',
    commandName: '编译下一批候选来源',
    dropdownName: 'kb-compile-next',
    description: '编译工作流入口里列出的下一批候选来源',
    ribbonIcon: 'file-plus-2',
    notice: '已发送：编译下一批候选来源',
    prompt: [
      '使用 compile-source 和 update-indexes，编译“下一批候选来源”的 3 到 5 篇资料。',
      COMMON_CONTEXT,
      `候选来源优先来自 ${KNOWLEDGE_WORKFLOW_MAP_PATH} 的“下一批候选来源”；如果该区块为空，再从 wiki/indexes/All-Sources.md 里选择 status 不是 compiled 的来源。`,
      '请为每篇来源生成下一可用编号的 wiki/summaries/S-xxx 摘要，必要时更新或新增 wiki/concepts/C-xxx 概念，并同步更新 wiki/indexes/All-Sources.md 与 wiki/indexes/All-Concepts.md。',
      '先小批量，不迁移 Clippings，不上 RAG，不做全库重构。',
      '如果涉及大规模概念合并、目录迁移、批量重命名或删除文件，先给计划并等待我确认。',
      '完成后列出创建文件、修改文件、不确定内容和下一批候选来源建议。',
    ].join('\n\n'),
  },
  'save-current-qa': {
    kind: 'save-current-qa',
    commandId: 'workflow-save-current-qa',
    commandName: '保存当前问答',
    dropdownName: 'kb-save-qa',
    description: '把当前对话中可复用的结论保存到 outputs/qa',
    ribbonIcon: 'save',
    notice: '已发送：保存当前问答',
    prompt: [
      '使用 save-qa，把当前这次对话中具有长期复用价值的结论保存到 outputs/qa。',
      COMMON_CONTEXT,
      '请按 outputs/qa/YYYY-MM-DD-问题标题.md 命名，使用 AGENTS.md 里的 Q&A 模板。',
      '内容需要包含问题、简短结论、分析过程、可执行建议、不确定性，以及可反哺到 wiki 的内容。',
      '请关联相关 concepts 和 sources；如果当前对话内容不足以确定来源，请在“不确定性”里明确说明。',
      '除非我明确确认，不要静默改写 concept 文件；可以在末尾列出建议反哺项。',
    ].join('\n\n'),
  },
  'health-check': {
    kind: 'health-check',
    commandId: 'workflow-health-check',
    commandName: '运行知识库健康检查',
    dropdownName: 'kb-health-check',
    description: '生成一次知识库健康检查报告',
    ribbonIcon: 'activity',
    notice: '已发送：运行知识库健康检查',
    prompt: [
      '使用 health-check，运行一次知识库健康检查。',
      COMMON_CONTEXT,
      '请检查 wiki/summaries、wiki/concepts、wiki/indexes、wiki/maps 和 outputs/qa。',
      '输出到 outputs/health/YYYY-MM-DD-health-check.md。',
      '检查 summary 是否登记到 All-Sources，concept 是否登记到 All-Concepts，concept 是否缺来源/定义/例子/边界，是否有重复或冲突概念，outputs/qa 是否值得反哺到 wiki，以及索引中的开放问题是否需要转成行动项。',
      '只生成报告，不自动大规模改写 wiki。需要修复的内容请放进“需要用户确认的修改”。',
    ].join('\n\n'),
  },
};

export function getKnowledgeWorkflowDefinitions(): KnowledgeWorkflowDefinition[] {
  return Object.values(KNOWLEDGE_WORKFLOWS);
}

export function buildKnowledgeWorkflowPrompt(kind: KnowledgeWorkflowKind): string {
  return KNOWLEDGE_WORKFLOWS[kind].prompt;
}

export function getKnowledgeWorkflowDefinition(kind: KnowledgeWorkflowKind): KnowledgeWorkflowDefinition {
  return KNOWLEDGE_WORKFLOWS[kind];
}

export function getKnowledgeWorkflowCommandEntries(): ProviderCommandEntry[] {
  return getKnowledgeWorkflowDefinitions().map((workflow) => ({
    id: `codexidian-${workflow.commandId}`,
    providerId: 'codex',
    kind: 'command',
    name: workflow.dropdownName,
    description: workflow.description,
    content: workflow.prompt,
    scope: 'builtin',
    source: 'builtin',
    isEditable: false,
    isDeletable: false,
    displayPrefix: '/',
    insertPrefix: '/',
  }));
}

export interface KnowledgeWorkflowCommandHost {
  addCommand(command: {
    id: string;
    name: string;
    callback: () => void | Promise<void>;
  }): unknown;
  runKnowledgeWorkflow(kind: KnowledgeWorkflowKind): Promise<void>;
  openKnowledgeWorkflowMap(): Promise<void>;
  initializeKnowledgeWorkflow(): Promise<void>;
}

export interface KnowledgeWorkflowRibbonHost {
  addRibbonIcon(
    icon: string,
    title: string,
    callback: () => void | Promise<void>,
  ): unknown;
  runKnowledgeWorkflow(kind: KnowledgeWorkflowKind): Promise<void>;
  openKnowledgeWorkflowMap(): Promise<void>;
  initializeKnowledgeWorkflow(): Promise<void>;
}

export function registerKnowledgeWorkflowCommands(host: KnowledgeWorkflowCommandHost): void {
  host.addCommand({
    id: 'initialize-knowledge-workflow',
    name: '初始化知识库工作流',
    callback: () => host.initializeKnowledgeWorkflow(),
  });

  for (const workflow of getKnowledgeWorkflowDefinitions()) {
    host.addCommand({
      id: workflow.commandId,
      name: workflow.commandName,
      callback: () => host.runKnowledgeWorkflow(workflow.kind),
    });
  }

  host.addCommand({
    id: 'open-knowledge-workflow-map',
    name: '打开知识库工作流入口',
    callback: () => host.openKnowledgeWorkflowMap(),
  });
}

export function registerKnowledgeWorkflowRibbonIcons(host: KnowledgeWorkflowRibbonHost): void {
  host.addRibbonIcon(
    'folder-tree',
    'Codexidian: 初始化知识库工作流',
    () => host.initializeKnowledgeWorkflow(),
  );

  for (const workflow of getKnowledgeWorkflowDefinitions()) {
    host.addRibbonIcon(
      workflow.ribbonIcon,
      `Codexidian: ${workflow.commandName}`,
      () => host.runKnowledgeWorkflow(workflow.kind),
    );
  }

  host.addRibbonIcon(
    'map',
    'Codexidian: 打开知识库工作流入口',
    () => host.openKnowledgeWorkflowMap(),
  );
}
