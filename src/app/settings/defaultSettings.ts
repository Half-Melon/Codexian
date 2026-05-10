import { getDefaultHiddenProviderCommands } from '../../core/providers/commands/hiddenCommands';
import { type CodexidianSettings } from '../../core/types/settings';
import { DEFAULT_CODEX_PRIMARY_MODEL } from '../../providers/codex/types/models';
import { getBuiltInProviderDefaultConfigs } from '../../providers/defaultProviderConfigs';

export const DEFAULT_KNOWLEDGE_WORKFLOW_SETTINGS = {
  batchSize: 5,
  summaryTemplate: [
    '---',
    'type: summary',
    'source: "[[原始来源]]"',
    'compiled_at: YYYY-MM-DD',
    'concepts:',
    '  - "[[C-xxx 概念名]]"',
    'status: compiled',
    '---',
    '',
    '# 标题',
    '',
    '## 核心结论',
    '',
    '## 关键证据',
    '',
    '## 可复用观点',
    '',
    '## 疑点 / 待验证',
    '',
    '## 关联概念',
  ].join('\n'),
  conceptTemplate: [
    '---',
    'type: concept',
    'created: YYYY-MM-DD',
    'updated: YYYY-MM-DD',
    'sources:',
    '  - "[[S-xxx 来源摘要]]"',
    'status: active',
    '---',
    '',
    '# C-xxx 概念名',
    '',
    '## 一句话定义',
    '',
    '## 关键要点',
    '',
    '## 例子',
    '',
    '## 适用边界',
    '',
    '## 反例 / 易混淆点',
    '',
    '## 来源',
  ].join('\n'),
  archiveRules: [
    '归档时先根据文档内容制定一个新的标题：更贴切文章主题、更清晰表示文档内容，标题可以适当长一些。',
    '文件名使用新标题生成，保留原扩展名，去掉文件系统不安全字符。',
    'raw/papers/：论文、预印本、研究报告、DOI/arXiv/PDF 风格来源，或有 abstract/references 结构的文档。',
    'raw/transcripts/：播客、视频、会议、访谈、演讲转录，尤其包含时间戳或说话人。',
    'raw/posts/：社媒帖、论坛串、短笔记、碎片化帖子。',
    'raw/articles/：网页文章、博客、newsletter、专栏、长文。',
    'raw/inbox/：分类依据不足的来源。',
    '如果目标文件已存在，在文件名末尾追加简短区分后缀，不覆盖已有文件。',
  ].join('\n'),
  archiveLogTemplate: [
    '# YYYY-MM-DD archive log',
    '',
    '| Original | Archived | Category | Reason | Links updated | Uncertainty |',
    '| --- | --- | --- | --- | --- | --- |',
  ].join('\n'),
};

export const DEFAULT_CODEXIDIAN_SETTINGS: CodexidianSettings = {
  userName: '',

  permissionMode: 'yolo',

  model: DEFAULT_CODEX_PRIMARY_MODEL,
  thinkingBudget: 'off',
  effortLevel: 'high',
  serviceTier: 'default',
  enableAutoTitleGeneration: true,
  titleGenerationModel: '',

  excludedTags: [],
  mediaFolder: '',
  systemPrompt: '',
  persistentExternalContextPaths: [],

  sharedEnvironmentVariables: '',
  envSnippets: [],
  customContextLimits: {},

  keyboardNavigation: {
    scrollUpKey: 'w',
    scrollDownKey: 's',
    focusInputKey: 'i',
  },

  locale: 'en',

  providerConfigs: getBuiltInProviderDefaultConfigs(),

  settingsProvider: 'codex',
  savedProviderModel: {},
  savedProviderEffort: {},
  savedProviderServiceTier: {},
  savedProviderThinkingBudget: {},
  savedProviderPermissionMode: {},

  lastCustomModel: '',

  maxTabs: 3,
  tabBarPosition: 'input',
  enableAutoScroll: true,
  deferMathRenderingDuringStreaming: true,
  chatViewPlacement: 'right-sidebar',
  knowledgeWorkflow: DEFAULT_KNOWLEDGE_WORKFLOW_SETTINGS,

  hiddenProviderCommands: getDefaultHiddenProviderCommands(),
};
