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

  it('exposes command entries that can also appear in the chat dropdown', () => {
    const entries = getKnowledgeWorkflowCommandEntries();

    expect(entries.map(entry => entry.name)).toEqual([
      'kb-compile-new',
      'kb-save-qa',
      'kb-health-check',
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
      openKnowledgeWorkflowMap: jest.fn().mockResolvedValue(undefined),
    };

    registerKnowledgeWorkflowCommands(host);

    expect(commands.map(command => command.id)).toEqual([
      'initialize-knowledge-workflow',
      'workflow-compile-new-sources',
      'workflow-save-current-qa',
      'workflow-health-check',
      'open-knowledge-workflow-map',
    ]);
    expect(commands.map(command => command.name)).toEqual([
      '初始化知识库工作流',
      '编译新来源',
      '保存当前问答',
      '运行知识库健康检查',
      '打开知识库工作流入口',
    ]);

    await commands[0].callback();
    await commands[1].callback();
    await commands[4].callback();

    expect(host.initializeKnowledgeWorkflow).toHaveBeenCalledTimes(1);
    expect(host.runKnowledgeWorkflow).toHaveBeenCalledWith('compile-new-sources');
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
      openKnowledgeWorkflowMap: jest.fn().mockResolvedValue(undefined),
    };

    registerKnowledgeWorkflowRibbonIcons(host);

    expect(icons.map(item => item.title)).toEqual([
      'Codexidian: 编译新来源',
      'Codexidian: 保存当前问答',
      'Codexidian: 运行知识库健康检查',
      'Codexidian: 打开知识库工作流入口',
    ]);
    expect(icons.map(item => item.icon)).toEqual([
      'file-plus-2',
      'save',
      'activity',
      'map',
    ]);

    await icons[0].callback();
    await icons[3].callback();

    expect(host.initializeKnowledgeWorkflow).not.toHaveBeenCalled();
    expect(host.runKnowledgeWorkflow).toHaveBeenCalledWith('compile-new-sources');
    expect(host.openKnowledgeWorkflowMap).toHaveBeenCalledTimes(1);
  });
});
