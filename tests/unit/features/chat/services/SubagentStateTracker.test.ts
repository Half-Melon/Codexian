import { SubagentStateTracker } from '@/features/chat/services/SubagentStateTracker';

describe('SubagentStateTracker', () => {
  it('tracks spawned subagents in the current stream', () => {
    const tracker = new SubagentStateTracker();

    tracker.recordSpawn('spawn-1');
    tracker.recordSpawn('spawn-2');

    expect(tracker.subagentsSpawnedThisStream).toBe(2);
  });

  it('resets only the per-stream spawn count', () => {
    const tracker = new SubagentStateTracker();

    tracker.recordSpawn('spawn-1');
    tracker.resetSpawnedCount();

    expect(tracker.subagentsSpawnedThisStream).toBe(0);
  });

  it('clears active spawn ids without resetting the usage suppression count', () => {
    const tracker = new SubagentStateTracker();

    tracker.recordSpawn('spawn-1');
    tracker.resetStreamingState();

    expect(tracker.subagentsSpawnedThisStream).toBe(1);
  });

  it('clears all tracking state', () => {
    const tracker = new SubagentStateTracker();

    tracker.recordSpawn('spawn-1');
    tracker.clear();

    expect(tracker.subagentsSpawnedThisStream).toBe(0);
  });
});
