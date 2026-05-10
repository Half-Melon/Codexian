export class SubagentStateTracker {
  private runningSpawnIds = new Set<string>();
  private _spawnedThisStream = 0;

  get subagentsSpawnedThisStream(): number {
    return this._spawnedThisStream;
  }

  recordSpawn(spawnId: string): void {
    this.runningSpawnIds.add(spawnId);
    this._spawnedThisStream++;
  }

  markFinished(spawnId: string): void {
    this.runningSpawnIds.delete(spawnId);
  }

  resetSpawnedCount(): void {
    this._spawnedThisStream = 0;
  }

  resetStreamingState(): void {
    this.runningSpawnIds.clear();
  }

  orphanAllActive(): void {
    this.runningSpawnIds.clear();
  }

  clear(): void {
    this.runningSpawnIds.clear();
    this._spawnedThisStream = 0;
  }
}
