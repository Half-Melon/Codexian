import type { DiffLine, DiffStats } from './diff';

/** Diff data for Write/Edit tool operations (pre-computed from SDK structuredPatch). */
export interface ToolDiffData {
  filePath: string;
  diffLines: DiffLine[];
  stats: DiffStats;
}

/** Parsed option for AskUserQuestion tool. */
export interface AskUserQuestionOption {
  label: string;
  description: string;
  value?: string;
}

/** Parsed question for AskUserQuestion tool. */
export interface AskUserQuestionItem {
  question: string;
  id?: string;
  header: string;
  options: AskUserQuestionOption[];
  multiSelect: boolean;
  isOther?: boolean;
  isSecret?: boolean;
}

/** User-provided answers keyed by question text or stable question id. */
export type AskUserAnswers = Record<string, string | string[]>;

/** Tool call tracking with status and result. */
export interface ToolCallInfo {
  id: string;
  name: string;
  input: Record<string, unknown>;
  status: 'running' | 'completed' | 'error' | 'blocked';
  result?: string;
  isExpanded?: boolean;
  diffData?: ToolDiffData;
  resolvedAnswers?: AskUserAnswers;
}

export type ExitPlanModeDecision =
  | { type: 'approve' }
  | { type: 'approve-new-session'; planContent: string }
  | { type: 'feedback'; text: string };

export type ExitPlanModeCallback = (
  input: Record<string, unknown>,
  signal?: AbortSignal,
) => Promise<ExitPlanModeDecision | null>;

/** Codex subagent lifecycle state built from spawn_agent and wait_agent tools. */
export interface SubagentInfo {
  id: string;
  description: string;
  prompt?: string;
  isExpanded: boolean;
  result?: string;
  status: 'running' | 'completed' | 'error';
  toolCalls: ToolCallInfo[];
  agentId?: string;
}
