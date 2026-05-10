import { KnowledgeWorkflowStatusService } from '@/features/workflows/KnowledgeWorkflowStatus';

function createAdapter(files: Record<string, { content: string; mtime: number; size?: number }>) {
  return {
    listFilesRecursive: jest.fn(async (folder: string) =>
      Object.keys(files).filter(path => path.startsWith(`${folder}/`))
    ),
    stat: jest.fn(async (path: string) => {
      const file = files[path];
      return file ? { mtime: file.mtime, size: file.size ?? file.content.length } : null;
    }),
    read: jest.fn(async (path: string) => files[path]?.content ?? ''),
  };
}

describe('KnowledgeWorkflowStatusService', () => {
  it('summarizes pending new sources and latest workflow reports', async () => {
    const adapter = createAdapter({
      'new/article.md': { content: 'article', mtime: 100 },
      'new/nested/post.md': { content: 'post', mtime: 200 },
      'outputs/reports/2026-05-01-archive-log.md': { content: '# old', mtime: 300 },
      'outputs/reports/2026-05-10-archive-log.md': { content: '# latest archive', mtime: 500 },
      'outputs/health/2026-05-09-health-check.md': { content: '# health', mtime: 400 },
    });
    const service = new KnowledgeWorkflowStatusService(adapter);

    const status = await service.getStatus();

    expect(status.pendingNewSourceCount).toBe(2);
    expect(status.pendingNewSources.map(source => source.path)).toEqual([
      'new/nested/post.md',
      'new/article.md',
    ]);
    expect(status.latestArchiveLog?.path).toBe('outputs/reports/2026-05-10-archive-log.md');
    expect(status.latestHealthCheck?.path).toBe('outputs/health/2026-05-09-health-check.md');
  });
});
