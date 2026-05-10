import type { VaultFileAdapter } from '../../core/storage/VaultFileAdapter';

export interface KnowledgeWorkflowStatusFile {
  path: string;
  mtime: number;
  size: number;
}

export interface KnowledgeWorkflowStatus {
  pendingNewSourceCount: number;
  pendingNewSources: KnowledgeWorkflowStatusFile[];
  latestArchiveLog: KnowledgeWorkflowStatusFile | null;
  latestHealthCheck: KnowledgeWorkflowStatusFile | null;
}

type StatusAdapter = Pick<VaultFileAdapter, 'listFilesRecursive' | 'stat' | 'read'>;

async function filesWithStats(
  adapter: StatusAdapter,
  paths: string[],
): Promise<KnowledgeWorkflowStatusFile[]> {
  const files: KnowledgeWorkflowStatusFile[] = [];
  for (const path of paths) {
    const stat = await adapter.stat(path);
    files.push({
      path,
      mtime: stat?.mtime ?? 0,
      size: stat?.size ?? 0,
    });
  }
  return files.sort((a, b) => b.mtime - a.mtime || a.path.localeCompare(b.path));
}

export class KnowledgeWorkflowStatusService {
  constructor(private adapter: StatusAdapter) {}

  async getStatus(): Promise<KnowledgeWorkflowStatus> {
    const [newFiles, reportFiles, healthFiles] = await Promise.all([
      this.adapter.listFilesRecursive('new'),
      this.adapter.listFilesRecursive('outputs/reports'),
      this.adapter.listFilesRecursive('outputs/health'),
    ]);

    const pendingNewSources = await filesWithStats(this.adapter, newFiles);
    const archiveLogs = await filesWithStats(
      this.adapter,
      reportFiles.filter(path => path.includes('archive-log')),
    );
    const healthChecks = await filesWithStats(
      this.adapter,
      healthFiles.filter(path => path.includes('health-check')),
    );

    return {
      pendingNewSourceCount: pendingNewSources.length,
      pendingNewSources,
      latestArchiveLog: archiveLogs[0] ?? null,
      latestHealthCheck: healthChecks[0] ?? null,
    };
  }
}
