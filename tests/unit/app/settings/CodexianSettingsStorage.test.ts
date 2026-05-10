import { CODEXIAN_SETTINGS_PATH, CodexianSettingsStorage } from '@/app/settings/CodexianSettingsStorage';
import {
  DEFAULT_KNOWLEDGE_WORKFLOW_SETTINGS,
  ZH_CN_KNOWLEDGE_WORKFLOW_SETTINGS,
} from '@/app/settings/defaultSettings';

function createStorageAdapter(existing: Record<string, string> = {}) {
  const files = { ...existing };

  return {
    files,
    adapter: {
      exists: jest.fn(async (path: string) => Object.prototype.hasOwnProperty.call(files, path)),
      read: jest.fn(async (path: string) => files[path]),
      write: jest.fn(async (path: string, content: string) => {
        files[path] = content;
      }),
      ensureFolder: jest.fn(),
      rename: jest.fn(),
      delete: jest.fn(),
      list: jest.fn(),
    },
  };
}

describe('CodexianSettingsStorage language defaults', () => {
  it('uses English knowledge workflow templates for new settings', async () => {
    const { adapter } = createStorageAdapter();
    const storage = new CodexianSettingsStorage(adapter as any);

    const settings = await storage.load();

    expect(settings.knowledgeWorkflow.summaryTemplate).toContain('# Title');
    expect(settings.knowledgeWorkflow.summaryTemplate).not.toContain('# 标题');
    expect(settings.knowledgeWorkflow.conceptTemplate).toContain('## One-sentence definition');
    expect(settings.knowledgeWorkflow.archiveRules).toContain('Create a new title from the document content');
  });

  it('replaces legacy Chinese default workflow templates when loading English settings', async () => {
    const { adapter } = createStorageAdapter({
      [CODEXIAN_SETTINGS_PATH]: JSON.stringify({
        locale: 'en',
        knowledgeWorkflow: ZH_CN_KNOWLEDGE_WORKFLOW_SETTINGS,
      }),
    });
    const storage = new CodexianSettingsStorage(adapter as any);

    const settings = await storage.load();

    expect(settings.knowledgeWorkflow.summaryTemplate).toBe(DEFAULT_KNOWLEDGE_WORKFLOW_SETTINGS.summaryTemplate);
    expect(settings.knowledgeWorkflow.conceptTemplate).toBe(DEFAULT_KNOWLEDGE_WORKFLOW_SETTINGS.conceptTemplate);
    expect(settings.knowledgeWorkflow.archiveRules).toBe(DEFAULT_KNOWLEDGE_WORKFLOW_SETTINGS.archiveRules);
    expect(settings.knowledgeWorkflow.archiveLogTemplate).toBe(DEFAULT_KNOWLEDGE_WORKFLOW_SETTINGS.archiveLogTemplate);
  });

  it('preserves user-customized workflow templates even when they contain Chinese', async () => {
    const customSummary = `${ZH_CN_KNOWLEDGE_WORKFLOW_SETTINGS.summaryTemplate}\n\n用户自定义字段`;
    const { adapter } = createStorageAdapter({
      [CODEXIAN_SETTINGS_PATH]: JSON.stringify({
        locale: 'en',
        knowledgeWorkflow: {
          ...ZH_CN_KNOWLEDGE_WORKFLOW_SETTINGS,
          summaryTemplate: customSummary,
        },
      }),
    });
    const storage = new CodexianSettingsStorage(adapter as any);

    const settings = await storage.load();

    expect(settings.knowledgeWorkflow.summaryTemplate).toBe(customSummary);
    expect(settings.knowledgeWorkflow.conceptTemplate).toBe(DEFAULT_KNOWLEDGE_WORKFLOW_SETTINGS.conceptTemplate);
  });

  it('uses Simplified Chinese defaults when loading legacy Chinese defaults under Simplified Chinese locale', async () => {
    const { adapter } = createStorageAdapter({
      [CODEXIAN_SETTINGS_PATH]: JSON.stringify({
        locale: 'zh-CN',
        knowledgeWorkflow: ZH_CN_KNOWLEDGE_WORKFLOW_SETTINGS,
      }),
    });
    const storage = new CodexianSettingsStorage(adapter as any);

    const settings = await storage.load();

    expect(settings.knowledgeWorkflow.summaryTemplate).toBe(ZH_CN_KNOWLEDGE_WORKFLOW_SETTINGS.summaryTemplate);
    expect(settings.knowledgeWorkflow.archiveRules).toContain('根据文档内容制定一个新的标题');
  });
});
