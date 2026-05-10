import { DEFAULT_KNOWLEDGE_WORKFLOW_SETTINGS } from '../../app/settings/defaultSettings';
import type { ProviderCommandEntry } from '../../core/providers/commands/ProviderCommandEntry';
import type { KnowledgeWorkflowSettings } from '../../core/types/settings';
import { t } from '../../i18n/i18n';
import type { TranslationKey } from '../../i18n/types';

export const KNOWLEDGE_WORKFLOW_AGENTS_PATH = 'AGENTS.md';
export const KNOWLEDGE_WORKFLOW_MAP_PATH = 'wiki/maps/LLM Personal Knowledge Base Workflow.md';
export const KNOWLEDGE_WORKFLOW_SOURCE_INDEX_PATH = 'wiki/indexes/All-Sources.md';
export const KNOWLEDGE_WORKFLOW_CONCEPT_INDEX_PATH = 'wiki/indexes/All-Concepts.md';

export type KnowledgeWorkflowKind =
  | 'compile-new-sources'
  | 'save-current-qa'
  | 'health-check'
  | 'apply-health-fixes'
  | 'undo-last-archive'
  | 'workflow-acceptance-check';

interface KnowledgeWorkflowDefinitionSpec {
  kind: KnowledgeWorkflowKind;
  commandId: string;
  commandNameKey: TranslationKey;
  dropdownName: string;
  descriptionKey: TranslationKey;
  ribbonIcon: string;
  noticeKey: TranslationKey;
  buildPrompt: (options: KnowledgeWorkflowSettings) => string;
}

interface KnowledgeWorkflowDefinition extends Omit<
  KnowledgeWorkflowDefinitionSpec,
  'commandNameKey' | 'descriptionKey' | 'noticeKey'
> {
  commandName: string;
  description: string;
  notice: string;
}

const COMMON_CONTEXT = [
  `请先读取 AGENTS.md、${KNOWLEDGE_WORKFLOW_MAP_PATH}、wiki/indexes/All-Sources.md 和 wiki/indexes/All-Concepts.md。`,
  '遵守 vault 里的边界：new/ 是新来源暂存区，raw/ 与 Clippings/ 是来源归档层，wiki/ 是可复用知识层，outputs/ 是运行输出层。',
].join('\n');

function normalizeWorkflowOptions(options?: Partial<KnowledgeWorkflowSettings>): KnowledgeWorkflowSettings {
  return {
    ...DEFAULT_KNOWLEDGE_WORKFLOW_SETTINGS,
    ...options,
    batchSize: Math.max(1, Math.min(20, Math.floor(options?.batchSize ?? DEFAULT_KNOWLEDGE_WORKFLOW_SETTINGS.batchSize))),
  };
}

function buildWorkflowOptionsBlock(options: KnowledgeWorkflowSettings): string {
  return [
    `每次最多处理 ${options.batchSize} 个 new/ 来源文件。`,
    '摘要模板：',
    options.summaryTemplate,
    '概念模板：',
    options.conceptTemplate,
    '归档分类与重命名规则：',
    options.archiveRules,
    '归档日志模板：',
    options.archiveLogTemplate,
  ].join('\n\n');
}

const KNOWLEDGE_WORKFLOWS: Record<KnowledgeWorkflowKind, KnowledgeWorkflowDefinitionSpec> = {
  'compile-new-sources': {
    kind: 'compile-new-sources',
    commandId: 'workflow-compile-new-sources',
    commandNameKey: 'knowledgeWorkflow.commands.compileNewSources.name',
    dropdownName: 'kb-compile-new',
    descriptionKey: 'knowledgeWorkflow.commands.compileNewSources.description',
    ribbonIcon: 'file-plus-2',
    noticeKey: 'knowledgeWorkflow.commands.compileNewSources.notice',
    buildPrompt: (options) => [
      '使用 compile-source、archive-source 和 update-indexes，编译新来源并归档已编译原文。',
      COMMON_CONTEXT,
      buildWorkflowOptionsBlock(options),
      '请读取 vault 根目录 new/ 文件夹里的所有 Markdown 和可读文本来源文件；如果 new/ 为空，请直接说明没有新来源需要编译，不要从其他目录自动挑选来源。',
      '请为每篇新来源生成下一可用编号的 wiki/summaries/S-xxx 摘要，必要时更新或新增 wiki/concepts/C-xxx 概念，并同步更新 wiki/indexes/All-Sources.md 与 wiki/indexes/All-Concepts.md。',
      '每篇来源确认编译成功后，请根据文档内容制定一个新的标题：更贴切文章主题、更清晰表示该文档内容，标题可以适当长一些；再把对应原文件从 new/ 归档到 raw/articles、raw/posts、raw/papers 或 raw/transcripts。如果分类依据不足，归档到 raw/inbox。分类时写明理由，不要凭主题领域细分 raw/。',
      '如果目标文件已存在，不要覆盖已有文件；请在新文件名末尾追加简短区分后缀，并在归档日志中记录重名处理。',
      '归档后必须同步修正 summary frontmatter 里的 source、summary 正文里的来源链接、wiki/indexes/All-Sources.md 里的来源路径，以及其他由本次编译创建或修改的显式链接。',
      '请生成或更新 outputs/reports/YYYY-MM-DD-archive-log.md，记录每个文件的 new/ 原路径、raw/ 新路径、分类、分类理由、已同步更新的链接和不确定项。',
      '暂时不迁移 Clippings，不上 RAG，不做全库重构。',
      '如果涉及大规模概念合并、目录迁移、批量重命名或删除文件，先给计划并等待我确认。',
      '完成后列出创建文件、修改文件、移动文件、不确定内容，以及 new/ 里仍然保留的来源文件。',
    ].join('\n\n'),
  },
  'save-current-qa': {
    kind: 'save-current-qa',
    commandId: 'workflow-save-current-qa',
    commandNameKey: 'knowledgeWorkflow.commands.saveCurrentQa.name',
    dropdownName: 'kb-save-qa',
    descriptionKey: 'knowledgeWorkflow.commands.saveCurrentQa.description',
    ribbonIcon: 'save',
    noticeKey: 'knowledgeWorkflow.commands.saveCurrentQa.notice',
    buildPrompt: () => [
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
    commandNameKey: 'knowledgeWorkflow.commands.healthCheck.name',
    dropdownName: 'kb-health-check',
    descriptionKey: 'knowledgeWorkflow.commands.healthCheck.description',
    ribbonIcon: 'activity',
    noticeKey: 'knowledgeWorkflow.commands.healthCheck.notice',
    buildPrompt: () => [
      '使用 health-check，运行一次知识库健康检查。',
      COMMON_CONTEXT,
      '请检查 wiki/summaries、wiki/concepts、wiki/indexes、wiki/maps 和 outputs/qa。',
      '输出到 outputs/health/YYYY-MM-DD-health-check.md。',
      '检查 summary 是否登记到 All-Sources，concept 是否登记到 All-Concepts，concept 是否缺来源/定义/例子/边界，是否有重复或冲突概念，outputs/qa 是否值得反哺到 wiki，以及索引中的开放问题是否需要转成行动项。',
      '只生成报告，不自动大规模改写 wiki。需要修复的内容请放进“需要用户确认的修改”。',
    ].join('\n\n'),
  },
  'apply-health-fixes': {
    kind: 'apply-health-fixes',
    commandId: 'workflow-apply-health-fixes',
    commandNameKey: 'knowledgeWorkflow.commands.applyHealthFixes.name',
    dropdownName: 'kb-apply-health-fixes',
    descriptionKey: 'knowledgeWorkflow.commands.applyHealthFixes.description',
    ribbonIcon: 'wrench',
    noticeKey: 'knowledgeWorkflow.commands.applyHealthFixes.notice',
    buildPrompt: () => [
      '使用 repair-health，根据最近的 outputs/health 健康检查报告应用低风险修复。',
      COMMON_CONTEXT,
      '请先读取最新的 outputs/health/YYYY-MM-DD-health-check.md。',
      '只执行低风险修复：补索引缺项、修正明显过期链接、补充由现有 summary/concept 明确支持的登记信息。',
      '任何概念合并、概念拆分、删除、批量改名、跨目录迁移、来源解释不明确的修改，都必须放入“需要用户确认”并等待确认。',
      '完成后写入 outputs/reports/YYYY-MM-DD-health-fixes.md，列出已修改文件、跳过项和需要用户确认的项。',
    ].join('\n\n'),
  },
  'undo-last-archive': {
    kind: 'undo-last-archive',
    commandId: 'workflow-undo-last-archive',
    commandNameKey: 'knowledgeWorkflow.commands.undoLastArchive.name',
    dropdownName: 'kb-undo-last-archive',
    descriptionKey: 'knowledgeWorkflow.commands.undoLastArchive.description',
    ribbonIcon: 'undo-2',
    noticeKey: 'knowledgeWorkflow.commands.undoLastArchive.notice',
    buildPrompt: () => [
      '使用 undo-archive，根据最近的 outputs/reports/*archive-log.md 撤销上次归档。',
      COMMON_CONTEXT,
      '请先读取最新 archive-log，生成撤销计划，列出每个文件从 raw/ 返回 new/ 的路径，以及需要回滚的 summary source、正文链接、All-Sources 路径和本次生成内容中的显式链接。',
      '如果任一目标路径已存在、日志不完整、或无法确认链接变更范围，请不要执行，改为输出撤销计划并等待用户确认。',
      '只有在撤销范围清晰且低风险时才执行。完成后写入 outputs/reports/YYYY-MM-DD-undo-archive.md。',
    ].join('\n\n'),
  },
  'workflow-acceptance-check': {
    kind: 'workflow-acceptance-check',
    commandId: 'workflow-acceptance-check',
    commandNameKey: 'knowledgeWorkflow.commands.workflowAcceptance.name',
    dropdownName: 'kb-acceptance-check',
    descriptionKey: 'knowledgeWorkflow.commands.workflowAcceptance.description',
    ribbonIcon: 'check-check',
    noticeKey: 'knowledgeWorkflow.commands.workflowAcceptance.notice',
    buildPrompt: () => [
      '使用 workflow-acceptance，运行一次端到端验收。',
      COMMON_CONTEXT,
      '请检查初始化结构、new/ 待处理来源、最近一次编译结果、summary/concept/index 链接一致性、archive-log、raw/inbox、outputs/qa 和最近健康检查。',
      '输出到 outputs/reports/YYYY-MM-DD-workflow-acceptance.md。',
      '只生成验收报告，不自动迁移、删除或批量改写文件。报告需要包含通过项、失败项、风险、建议下一步。',
    ].join('\n\n'),
  },
};

function localizeWorkflowDefinition(spec: KnowledgeWorkflowDefinitionSpec): KnowledgeWorkflowDefinition {
  const {
    commandNameKey,
    descriptionKey,
    noticeKey,
    ...rest
  } = spec;
  return {
    ...rest,
    commandName: t(commandNameKey),
    description: t(descriptionKey),
    notice: t(noticeKey),
  };
}

export function getKnowledgeWorkflowDefinitions(): KnowledgeWorkflowDefinition[] {
  return Object.values(KNOWLEDGE_WORKFLOWS).map(localizeWorkflowDefinition);
}

export function buildKnowledgeWorkflowPrompt(
  kind: KnowledgeWorkflowKind,
  options?: Partial<KnowledgeWorkflowSettings>,
): string {
  return KNOWLEDGE_WORKFLOWS[kind].buildPrompt(normalizeWorkflowOptions(options));
}

export function getKnowledgeWorkflowDefinition(kind: KnowledgeWorkflowKind): KnowledgeWorkflowDefinition {
  return localizeWorkflowDefinition(KNOWLEDGE_WORKFLOWS[kind]);
}

export function getKnowledgeWorkflowCommandEntries(): ProviderCommandEntry[] {
  return getKnowledgeWorkflowDefinitions().map((workflow) => ({
    id: `codexian-${workflow.commandId}`,
    providerId: 'codex',
    kind: 'command',
    name: workflow.dropdownName,
    description: workflow.description,
    content: workflow.buildPrompt(normalizeWorkflowOptions()),
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
  openKnowledgeWorkflowStatus(): Promise<void>;
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
  openKnowledgeWorkflowStatus(): Promise<void>;
  openKnowledgeWorkflowMap(): Promise<void>;
}

export function registerKnowledgeWorkflowCommands(host: KnowledgeWorkflowCommandHost): void {
  host.addCommand({
    id: 'initialize-knowledge-workflow',
    name: t('knowledgeWorkflow.commands.initialize.name'),
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
    id: 'open-knowledge-workflow-status',
    name: t('knowledgeWorkflow.commands.openStatus.name'),
    callback: () => host.openKnowledgeWorkflowStatus(),
  });

  host.addCommand({
    id: 'open-knowledge-workflow-map',
    name: t('knowledgeWorkflow.commands.openMap.name'),
    callback: () => host.openKnowledgeWorkflowMap(),
  });
}

export function registerKnowledgeWorkflowRibbonIcons(host: KnowledgeWorkflowRibbonHost): void {
  for (const workflow of getKnowledgeWorkflowDefinitions()) {
    host.addRibbonIcon(
      workflow.ribbonIcon,
      `Codexian: ${workflow.commandName}`,
      () => host.runKnowledgeWorkflow(workflow.kind),
    );
  }

  host.addRibbonIcon(
    'list-checks',
    `Codexian: ${t('knowledgeWorkflow.commands.openStatus.name')}`,
    () => host.openKnowledgeWorkflowStatus(),
  );

  host.addRibbonIcon(
    'map',
    `Codexian: ${t('knowledgeWorkflow.commands.openMap.name')}`,
    () => host.openKnowledgeWorkflowMap(),
  );
}
