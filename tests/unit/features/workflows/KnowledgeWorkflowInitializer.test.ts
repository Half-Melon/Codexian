import {
  KNOWLEDGE_WORKFLOW_AGENTS_PATH,
  KNOWLEDGE_WORKFLOW_CONCEPT_INDEX_PATH,
  KNOWLEDGE_WORKFLOW_MAP_PATH,
  KNOWLEDGE_WORKFLOW_SOURCE_INDEX_PATH,
} from '@/features/workflows/knowledgeWorkflowCommands';
import { KnowledgeWorkflowInitializer } from '@/features/workflows/KnowledgeWorkflowInitializer';

function createMockAdapter(existing: Record<string, string> = {}) {
  const files = { ...existing };
  const folders = new Set<string>();
  const writes: Array<{ path: string; content: string }> = [];

  const markFolder = (path: string) => {
    if (!path) return;
    const parts = path.split('/').filter(Boolean);
    let current = '';
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      folders.add(current);
    }
  };

  for (const path of Object.keys(files)) {
    markFolder(path.slice(0, path.lastIndexOf('/')));
  }

  return {
    files,
    folders,
    writes,
    adapter: {
      exists: jest.fn(async (path: string) =>
        Object.prototype.hasOwnProperty.call(files, path) || folders.has(path)
      ),
      ensureFolder: jest.fn(async (path: string) => {
        markFolder(path);
      }),
      write: jest.fn(async (path: string, content: string) => {
        writes.push({ path, content });
        files[path] = content;
        markFolder(path.slice(0, path.lastIndexOf('/')));
      }),
    },
  };
}

describe('KnowledgeWorkflowInitializer', () => {
  it('creates the Karpathy-style knowledge workflow scaffold for a new vault', async () => {
    const { adapter, files, folders } = createMockAdapter();
    const initializer = new KnowledgeWorkflowInitializer(adapter);

    const result = await initializer.initialize();

    expect(result.createdFolders).toEqual([
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
    ]);
    expect(result.createdFiles).toEqual([
      KNOWLEDGE_WORKFLOW_AGENTS_PATH,
      KNOWLEDGE_WORKFLOW_MAP_PATH,
      KNOWLEDGE_WORKFLOW_SOURCE_INDEX_PATH,
      KNOWLEDGE_WORKFLOW_CONCEPT_INDEX_PATH,
      '.codex/skills/compile-source/SKILL.md',
      '.codex/skills/archive-source/SKILL.md',
      '.codex/skills/repair-health/SKILL.md',
      '.codex/skills/undo-archive/SKILL.md',
      '.codex/skills/workflow-acceptance/SKILL.md',
      '.codex/skills/update-indexes/SKILL.md',
      '.codex/skills/save-qa/SKILL.md',
      '.codex/skills/health-check/SKILL.md',
    ]);
    expect(folders.has('raw/articles')).toBe(true);
    expect(folders.has('raw/inbox')).toBe(true);
    expect(folders.has('new')).toBe(true);
    expect(files[KNOWLEDGE_WORKFLOW_AGENTS_PATH]).toContain('new/ 是新来源暂存区');
    expect(files[KNOWLEDGE_WORKFLOW_AGENTS_PATH]).toContain('raw/ 是来源层');
    expect(files[KNOWLEDGE_WORKFLOW_AGENTS_PATH]).toContain('raw/inbox/');
    expect(files[KNOWLEDGE_WORKFLOW_AGENTS_PATH]).toContain('outputs/reports/YYYY-MM-DD-archive-log.md');
    expect(files[KNOWLEDGE_WORKFLOW_MAP_PATH]).toContain('new/ 使用说明');
    expect(files[KNOWLEDGE_WORKFLOW_MAP_PATH]).toContain('编译新来源');
    expect(files[KNOWLEDGE_WORKFLOW_SOURCE_INDEX_PATH]).toContain('All Sources');
    expect(files[KNOWLEDGE_WORKFLOW_CONCEPT_INDEX_PATH]).toContain('All Concepts');
    expect(files['.codex/skills/compile-source/SKILL.md']).toContain('name: compile-source');
    expect(files['.codex/skills/compile-source/SKILL.md']).toContain('new/ folder');
    expect(files['.codex/skills/archive-source/SKILL.md']).toContain('name: archive-source');
    expect(files['.codex/skills/archive-source/SKILL.md']).toContain('raw/inbox');
    expect(files['.codex/skills/archive-source/SKILL.md']).toContain('根据文档内容制定一个新的标题');
    expect(files['.codex/skills/archive-source/SKILL.md']).toContain('如果目标文件已存在');
    expect(files['.codex/skills/repair-health/SKILL.md']).toContain('name: repair-health');
    expect(files['.codex/skills/undo-archive/SKILL.md']).toContain('name: undo-archive');
    expect(files['.codex/skills/workflow-acceptance/SKILL.md']).toContain('name: workflow-acceptance');
  });

  it('does not overwrite existing user files or report existing folders as created', async () => {
    const { adapter, files } = createMockAdapter({
      [KNOWLEDGE_WORKFLOW_AGENTS_PATH]: 'custom agents',
      [KNOWLEDGE_WORKFLOW_MAP_PATH]: 'custom map',
    });
    const initializer = new KnowledgeWorkflowInitializer(adapter);

    const result = await initializer.initialize();

    expect(files[KNOWLEDGE_WORKFLOW_AGENTS_PATH]).toBe('custom agents');
    expect(files[KNOWLEDGE_WORKFLOW_MAP_PATH]).toBe('custom map');
    expect(result.createdFiles).not.toContain(KNOWLEDGE_WORKFLOW_AGENTS_PATH);
    expect(result.createdFiles).not.toContain(KNOWLEDGE_WORKFLOW_MAP_PATH);
  });
});
