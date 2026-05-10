import { setIcon } from 'obsidian';

import { getToolIcon } from '../../../core/tools/toolIcons';
import { TOOL_SPAWN_AGENT } from '../../../core/tools/toolNames';
import type { SubagentInfo, ToolCallInfo } from '../../../core/types';
import { setupCollapsible } from './collapsible';
import {
  getToolLabel,
  getToolName,
  getToolSummary,
  renderExpandedContent,
  setToolIcon,
} from './ToolCallRenderer';

interface SubagentToolView {
  wrapperEl: HTMLElement;
  nameEl: HTMLElement;
  summaryEl: HTMLElement;
  statusEl: HTMLElement;
  contentEl: HTMLElement;
}

interface SubagentSection {
  wrapperEl: HTMLElement;
  bodyEl: HTMLElement;
}

export interface SubagentState {
  wrapperEl: HTMLElement;
  contentEl: HTMLElement;
  headerEl: HTMLElement;
  labelEl: HTMLElement;
  statusEl: HTMLElement;
  promptSectionEl: HTMLElement;
  promptBodyEl: HTMLElement;
  toolsContainerEl: HTMLElement;
  resultSectionEl: HTMLElement | null;
  resultBodyEl: HTMLElement | null;
  toolElements: Map<string, SubagentToolView>;
  info: SubagentInfo;
}

const SUBAGENT_TOOL_STATUS_ICONS: Partial<Record<ToolCallInfo['status'], string>> = {
  completed: 'check',
  error: 'x',
  blocked: 'shield-off',
};

function extractSubagentDescription(input: Record<string, unknown>): string {
  return (input.description as string) || 'Codex subagent';
}

function extractSubagentPrompt(input: Record<string, unknown>): string {
  return (input.prompt as string) || '';
}

function truncateDescription(description: string, maxLength = 40): string {
  if (description.length <= maxLength) return description;
  return description.substring(0, maxLength) + '...';
}

function createSection(parentEl: HTMLElement, title: string, bodyClass?: string): SubagentSection {
  const wrapperEl = parentEl.createDiv({ cls: 'codexidian-subagent-section' });

  const headerEl = wrapperEl.createDiv({ cls: 'codexidian-subagent-section-header' });
  headerEl.setAttribute('tabindex', '0');
  headerEl.setAttribute('role', 'button');

  const titleEl = headerEl.createDiv({ cls: 'codexidian-subagent-section-title' });
  titleEl.setText(title);

  const bodyEl = wrapperEl.createDiv({ cls: 'codexidian-subagent-section-body' });
  if (bodyClass) bodyEl.addClass(bodyClass);

  const state = { isExpanded: false };
  setupCollapsible(wrapperEl, headerEl, bodyEl, state, {
    baseAriaLabel: title,
  });

  return { wrapperEl, bodyEl };
}

function setPromptText(promptBodyEl: HTMLElement, prompt: string): void {
  promptBodyEl.empty();
  const textEl = promptBodyEl.createDiv({ cls: 'codexidian-subagent-prompt-text' });
  textEl.setText(prompt || 'No prompt provided');
}

function updateSyncHeaderAria(state: SubagentState): void {
  state.headerEl.setAttribute(
    'aria-label',
    `Codex subagent: ${truncateDescription(state.info.description)} - Status: ${state.info.status} - click to expand`
  );
  state.statusEl.setAttribute('aria-label', `Status: ${state.info.status}`);
}

function renderSubagentToolContent(contentEl: HTMLElement, toolCall: ToolCallInfo): void {
  contentEl.empty();

  if (!toolCall.result && toolCall.status === 'running') {
    const emptyEl = contentEl.createDiv({ cls: 'codexidian-subagent-tool-empty' });
    emptyEl.setText('Running...');
    return;
  }

  renderExpandedContent(contentEl, toolCall.name, toolCall.result, toolCall.input);
}

function setSubagentToolStatus(view: SubagentToolView, status: ToolCallInfo['status']): void {
  view.statusEl.className = 'codexidian-subagent-tool-status';
  view.statusEl.addClass(`status-${status}`);
  view.statusEl.empty();
  view.statusEl.setAttribute('aria-label', `Status: ${status}`);

  const statusIcon = SUBAGENT_TOOL_STATUS_ICONS[status];
  if (statusIcon) {
    setIcon(view.statusEl, statusIcon);
  }
}

function updateSubagentToolView(view: SubagentToolView, toolCall: ToolCallInfo): void {
  view.wrapperEl.className = `codexidian-subagent-tool-item codexidian-subagent-tool-${toolCall.status}`;
  view.nameEl.setText(getToolName(toolCall.name, toolCall.input));
  view.summaryEl.setText(getToolSummary(toolCall.name, toolCall.input));
  setSubagentToolStatus(view, toolCall.status);
  renderSubagentToolContent(view.contentEl, toolCall);
}

function createSubagentToolView(parentEl: HTMLElement, toolCall: ToolCallInfo): SubagentToolView {
  const wrapperEl = parentEl.createDiv({
    cls: `codexidian-subagent-tool-item codexidian-subagent-tool-${toolCall.status}`,
  });
  wrapperEl.dataset.toolId = toolCall.id;

  const headerEl = wrapperEl.createDiv({ cls: 'codexidian-subagent-tool-header' });
  headerEl.setAttribute('tabindex', '0');
  headerEl.setAttribute('role', 'button');

  const iconEl = headerEl.createDiv({ cls: 'codexidian-subagent-tool-icon' });
  iconEl.setAttribute('aria-hidden', 'true');
  setToolIcon(iconEl, toolCall.name);

  const nameEl = headerEl.createDiv({ cls: 'codexidian-subagent-tool-name' });
  const summaryEl = headerEl.createDiv({ cls: 'codexidian-subagent-tool-summary' });
  const statusEl = headerEl.createDiv({ cls: 'codexidian-subagent-tool-status' });

  const contentEl = wrapperEl.createDiv({ cls: 'codexidian-subagent-tool-content' });

  const collapseState = { isExpanded: toolCall.isExpanded ?? false };
  setupCollapsible(wrapperEl, headerEl, contentEl, collapseState, {
    initiallyExpanded: toolCall.isExpanded ?? false,
    onToggle: (expanded) => {
      toolCall.isExpanded = expanded;
    },
    baseAriaLabel: getToolLabel(toolCall.name, toolCall.input),
  });

  const view: SubagentToolView = {
    wrapperEl,
    nameEl,
    summaryEl,
    statusEl,
    contentEl,
  };
  updateSubagentToolView(view, toolCall);

  return view;
}

function ensureResultSection(state: SubagentState): SubagentSection {
  if (state.resultSectionEl && state.resultBodyEl) {
    return { wrapperEl: state.resultSectionEl, bodyEl: state.resultBodyEl };
  }

  const section = createSection(state.contentEl, 'Result', 'codexidian-subagent-result-body');
  section.wrapperEl.addClass('codexidian-subagent-section-result');
  state.resultSectionEl = section.wrapperEl;
  state.resultBodyEl = section.bodyEl;
  return section;
}

function setResultText(state: SubagentState, text: string): void {
  const section = ensureResultSection(state);
  section.bodyEl.empty();
  const resultEl = section.bodyEl.createDiv({ cls: 'codexidian-subagent-result-output' });
  resultEl.setText(text);
}

function hydrateSyncSubagentStateFromStored(state: SubagentState, subagent: SubagentInfo): void {
  state.info.description = subagent.description;
  state.info.prompt = subagent.prompt;
  state.info.status = subagent.status;
  state.info.result = subagent.result;

  state.labelEl.setText(truncateDescription(subagent.description));
  setPromptText(state.promptBodyEl, subagent.prompt || '');

  for (const originalToolCall of subagent.toolCalls) {
    const toolCall: ToolCallInfo = {
      ...originalToolCall,
      input: { ...originalToolCall.input },
    };
    addSubagentToolCall(state, toolCall);
    if (toolCall.status !== 'running' || toolCall.result) {
      updateSubagentToolResult(state, toolCall.id, toolCall);
    }
  }

  if (subagent.status === 'completed' || subagent.status === 'error') {
    const fallback = subagent.status === 'error' ? 'ERROR' : 'DONE';
    finalizeSubagentBlock(state, subagent.result || fallback, subagent.status === 'error');
  } else {
    state.statusEl.className = 'codexidian-subagent-status status-running';
    state.statusEl.empty();
    updateSyncHeaderAria(state);
  }
}

export function createSubagentBlock(
  parentEl: HTMLElement,
  spawnToolId: string,
  spawnInput: Record<string, unknown>
): SubagentState {
  const description = extractSubagentDescription(spawnInput);
  const prompt = extractSubagentPrompt(spawnInput);

  const info: SubagentInfo = {
    id: spawnToolId,
    description,
    prompt,
    status: 'running',
    toolCalls: [],
    isExpanded: false,
  };

  const wrapperEl = parentEl.createDiv({ cls: 'codexidian-subagent-list' });
  wrapperEl.dataset.subagentId = spawnToolId;

  const headerEl = wrapperEl.createDiv({ cls: 'codexidian-subagent-header' });
  headerEl.setAttribute('tabindex', '0');
  headerEl.setAttribute('role', 'button');

  const iconEl = headerEl.createDiv({ cls: 'codexidian-subagent-icon' });
  iconEl.setAttribute('aria-hidden', 'true');
  setIcon(iconEl, getToolIcon(TOOL_SPAWN_AGENT));

  const labelEl = headerEl.createDiv({ cls: 'codexidian-subagent-label' });
  labelEl.setText(truncateDescription(description));

  const statusEl = headerEl.createDiv({ cls: 'codexidian-subagent-status status-running' });
  statusEl.setAttribute('aria-label', 'Status: running');

  const contentEl = wrapperEl.createDiv({ cls: 'codexidian-subagent-content' });

  const promptSection = createSection(contentEl, 'Prompt', 'codexidian-subagent-prompt-body');
  promptSection.wrapperEl.addClass('codexidian-subagent-section-prompt');
  setPromptText(promptSection.bodyEl, prompt);

  const toolsContainerEl = contentEl.createDiv({ cls: 'codexidian-subagent-tools' });

  setupCollapsible(wrapperEl, headerEl, contentEl, info);

  const state: SubagentState = {
    wrapperEl,
    contentEl,
    headerEl,
    labelEl,
    statusEl,
    promptSectionEl: promptSection.wrapperEl,
    promptBodyEl: promptSection.bodyEl,
    toolsContainerEl,
    resultSectionEl: null,
    resultBodyEl: null,
    toolElements: new Map<string, SubagentToolView>(),
    info,
  };

  updateSyncHeaderAria(state);
  return state;
}

export function addSubagentToolCall(
  state: SubagentState,
  toolCall: ToolCallInfo
): void {
  const existingIndex = state.info.toolCalls.findIndex(tc => tc.id === toolCall.id);
  if (existingIndex >= 0) {
    const existingToolCall = state.info.toolCalls[existingIndex]!;
    const mergedToolCall: ToolCallInfo = {
      ...existingToolCall,
      ...toolCall,
      input: {
        ...existingToolCall.input,
        ...toolCall.input,
      },
      result: toolCall.result ?? existingToolCall.result,
      isExpanded: toolCall.isExpanded ?? existingToolCall.isExpanded,
    };

    state.info.toolCalls[existingIndex] = mergedToolCall;

    const existingView = state.toolElements.get(toolCall.id);
    if (existingView) {
      updateSubagentToolView(existingView, mergedToolCall);
    }

    updateSyncHeaderAria(state);
    return;
  }

  state.info.toolCalls.push(toolCall);

  const toolView = createSubagentToolView(state.toolsContainerEl, toolCall);
  state.toolElements.set(toolCall.id, toolView);

  updateSyncHeaderAria(state);
}

export function updateSubagentToolResult(
  state: SubagentState,
  toolId: string,
  toolCall: ToolCallInfo
): void {
  const idx = state.info.toolCalls.findIndex(tc => tc.id === toolId);
  if (idx !== -1) {
    state.info.toolCalls[idx] = toolCall;
  }

  const toolView = state.toolElements.get(toolId);
  if (!toolView) {
    return;
  }

  updateSubagentToolView(toolView, toolCall);
}

export function finalizeSubagentBlock(
  state: SubagentState,
  result: string,
  isError: boolean
): void {
  state.info.status = isError ? 'error' : 'completed';
  state.info.result = result;

  state.labelEl.setText(truncateDescription(state.info.description));

  state.statusEl.className = 'codexidian-subagent-status';
  state.statusEl.addClass(`status-${state.info.status}`);
  state.statusEl.empty();
  if (state.info.status === 'completed') {
    setIcon(state.statusEl, 'check');
    state.wrapperEl.removeClass('error');
    state.wrapperEl.addClass('done');
  } else {
    setIcon(state.statusEl, 'x');
    state.wrapperEl.removeClass('done');
    state.wrapperEl.addClass('error');
  }

  const finalText = result?.trim() ? result : (isError ? 'ERROR' : 'DONE');
  setResultText(state, finalText);

  updateSyncHeaderAria(state);
}

export function renderStoredSubagent(
  parentEl: HTMLElement,
  subagent: SubagentInfo
): HTMLElement {
  const state = createSubagentBlock(parentEl, subagent.id, {
    description: subagent.description,
    prompt: subagent.prompt,
  });

  hydrateSyncSubagentStateFromStored(state, subagent);
  return state.wrapperEl;
}
