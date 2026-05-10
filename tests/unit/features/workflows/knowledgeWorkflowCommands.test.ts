import {
  buildKnowledgeWorkflowPrompt,
  getKnowledgeWorkflowCommandEntries,
  KNOWLEDGE_WORKFLOW_MAP_PATH,
  registerKnowledgeWorkflowCommands,
  registerKnowledgeWorkflowRibbonIcons,
} from '@/features/workflows/knowledgeWorkflowCommands';

describe('knowledge workflow commands', () => {
  it('builds a compile prompt for new sources from the new folder', () => {
    const prompt = buildKnowledgeWorkflowPrompt('compile-new-sources');

    expect(prompt).toContain('compile-source');
    expect(prompt).toContain('archive-source');
    expect(prompt).toContain('编译新来源');
    expect(prompt).toContain('new/');
    expect(prompt).toContain('raw/inbox');
    expect(prompt).toContain('outputs/reports/YYYY-MM-DD-archive-log.md');
    expect(prompt).toContain('wiki/indexes/All-Sources.md');
    expect(prompt).toContain('wiki/indexes/All-Concepts.md');
    expect(prompt).toContain('同步修正 summary');
    expect(prompt).toContain('根据文档内容制定一个新的标题');
    expect(prompt).toContain('如果目标文件已存在');
    expect(prompt).toContain('不迁移 Clippings');
    expect(prompt).toContain('不上 RAG');
    expect(prompt).toContain('大规模概念合并');
  });

  it('builds a save-QA prompt for reusable current conversation conclusions', () => {
    const prompt = buildKnowledgeWorkflowPrompt('save-current-qa');

    expect(prompt).toContain('save-qa');
    expect(prompt).toContain('当前这次对话');
    expect(prompt).toContain('outputs/qa');
    expect(prompt).toContain('可反哺到 wiki');
  });

  it('builds a health-check prompt that writes a report without broad rewrites', () => {
    const prompt = buildKnowledgeWorkflowPrompt('health-check');

    expect(prompt).toContain('health-check');
    expect(prompt).toContain('outputs/health/YYYY-MM-DD-health-check.md');
    expect(prompt).toContain('只生成报告');
    expect(prompt).toContain('不自动大规模改写 wiki');
  });

  it('builds an apply-health-fixes prompt from the latest health report', () => {
    const prompt = buildKnowledgeWorkflowPrompt('apply-health-fixes');

    expect(prompt).toContain('repair-health');
    expect(prompt).toContain('outputs/health');
    expect(prompt).toContain('低风险修复');
    expect(prompt).toContain('需要用户确认');
  });

  it('builds an undo-last-archive prompt from archive logs', () => {
    const prompt = buildKnowledgeWorkflowPrompt('undo-last-archive');

    expect(prompt).toContain('undo-archive');
    expect(prompt).toContain('outputs/reports');
    expect(prompt).toContain('archive-log');
    expect(prompt).toContain('撤销计划');
  });

  it('builds a workflow acceptance prompt for real vault checks', () => {
    const prompt = buildKnowledgeWorkflowPrompt('workflow-acceptance-check');

    expect(prompt).toContain('workflow-acceptance');
    expect(prompt).toContain('端到端验收');
    expect(prompt).toContain('outputs/reports/YYYY-MM-DD-workflow-acceptance.md');
  });

  it('includes user-configured workflow options in prompts', () => {
    const prompt = buildKnowledgeWorkflowPrompt('compile-new-sources', {
      batchSize: 7,
      summaryTemplate: 'CUSTOM SUMMARY TEMPLATE',
      conceptTemplate: 'CUSTOM CONCEPT TEMPLATE',
      archiveRules: 'CUSTOM ARCHIVE RULES',
      archiveLogTemplate: 'CUSTOM ARCHIVE LOG',
    });

    expect(prompt).toContain('每次最多处理 7 个 new/ 来源文件');
    expect(prompt).toContain('CUSTOM SUMMARY TEMPLATE');
    expect(prompt).toContain('CUSTOM CONCEPT TEMPLATE');
    expect(prompt).toContain('CUSTOM ARCHIVE RULES');
    expect(prompt).toContain('CUSTOM ARCHIVE LOG');
  });

  it('exposes command entries that can also appear in the chat dropdown', () => {
    const entries = getKnowledgeWorkflowCommandEntries();

    expect(entries.map(entry => entry.name)).toEqual([
      'kb-compile-new',
      'kb-save-qa',
      'kb-health-check',
      'kb-apply-health-fixes',
      'kb-undo-last-archive',
      'kb-acceptance-check',
    ]);
    expect(entries.every(entry => entry.providerId === 'codex')).toBe(true);
    expect(entries.every(entry => entry.displayPrefix === '/')).toBe(true);
    expect(entries.every(entry => entry.insertPrefix === '/')).toBe(true);
    expect(entries[0].content).toBe(buildKnowledgeWorkflowPrompt('compile-new-sources'));
  });

  it('keeps the workflow map path stable for the Obsidian open command', () => {
    expect(KNOWLEDGE_WORKFLOW_MAP_PATH).toBe('wiki/maps/LLM 个人知识库工作流.md');
  });

  it('registers the Obsidian command palette actions', async () => {
    const commands: Array<{ id: string; name: string; callback: () => void | Promise<void> }> = [];
    const host = {
      addCommand: jest.fn((command) => {
        commands.push(command);
      }),
      initializeKnowledgeWorkflow: jest.fn().mockResolvedValue(undefined),
      runKnowledgeWorkflow: jest.fn().mockResolvedValue(undefined),
      openKnowledgeWorkflowStatus: jest.fn().mockResolvedValue(undefined),
      openKnowledgeWorkflowMap: jest.fn().mockResolvedValue(undefined),
    };

    registerKnowledgeWorkflowCommands(host);

    expect(commands.map(command => command.id)).toEqual([
      'initialize-knowledge-workflow',
      'workflow-compile-new-sources',
      'workflow-save-current-qa',
      'workflow-health-check',
      'workflow-apply-health-fixes',
      'workflow-undo-last-archive',
      'workflow-acceptance-check',
      'open-knowledge-workflow-status',
      'open-knowledge-workflow-map',
    ]);
    expect(commands.map(command => command.name)).toEqual([
      '初始化知识库工作流',
      '编译新来源',
      '保存当前问答',
      '运行知识库健康检查',
      '应用健康检查建议',
      '撤销上次归档',
      '运行知识库工作流验收',
      '查看知识库状态',
      '打开知识库工作流入口',
    ]);

    await commands[0].callback();
    await commands[1].callback();
    await commands[7].callback();
    await commands[8].callback();

    expect(host.initializeKnowledgeWorkflow).toHaveBeenCalledTimes(1);
    expect(host.runKnowledgeWorkflow).toHaveBeenCalledWith('compile-new-sources');
    expect(host.openKnowledgeWorkflowStatus).toHaveBeenCalledTimes(1);
    expect(host.openKnowledgeWorkflowMap).toHaveBeenCalledTimes(1);
  });

  it('registers one-click ribbon icons for knowledge workflows', async () => {
    const icons: Array<{ icon: string; title: string; callback: () => void | Promise<void> }> = [];
    const host = {
      addRibbonIcon: jest.fn((icon, title, callback) => {
        icons.push({ icon, title, callback });
      }),
      initializeKnowledgeWorkflow: jest.fn().mockResolvedValue(undefined),
      runKnowledgeWorkflow: jest.fn().mockResolvedValue(undefined),
      openKnowledgeWorkflowStatus: jest.fn().mockResolvedValue(undefined),
      openKnowledgeWorkflowMap: jest.fn().mockResolvedValue(undefined),
    };

    registerKnowledgeWorkflowRibbonIcons(host);

    expect(icons.map(item => item.title)).toEqual([
      'Codexidian: 编译新来源',
      'Codexidian: 保存当前问答',
      'Codexidian: 运行知识库健康检查',
      'Codexidian: 应用健康检查建议',
      'Codexidian: 撤销上次归档',
      'Codexidian: 运行知识库工作流验收',
      'Codexidian: 查看知识库状态',
      'Codexidian: 打开知识库工作流入口',
    ]);
    expect(icons.map(item => item.icon)).toEqual([
      'file-plus-2',
      'save',
      'activity',
      'wrench',
      'undo-2',
      'check-check',
      'list-checks',
      'map',
    ]);

    await icons[0].callback();
    await icons[6].callback();
    await icons[7].callback();

    expect(host.initializeKnowledgeWorkflow).not.toHaveBeenCalled();
    expect(host.runKnowledgeWorkflow).toHaveBeenCalledWith('compile-new-sources');
    expect(host.openKnowledgeWorkflowStatus).toHaveBeenCalledTimes(1);
    expect(host.openKnowledgeWorkflowMap).toHaveBeenCalledTimes(1);
  });
});
