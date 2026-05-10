import { createMockEl, type MockElement } from '@test/helpers/mockElement';
import { setIcon } from 'obsidian';

import type { SubagentInfo, ToolCallInfo } from '@/core/types';
import {
  addSubagentToolCall,
  createSubagentBlock,
  finalizeSubagentBlock,
  renderStoredSubagent,
  updateSubagentToolResult,
} from '@/features/chat/rendering/SubagentRenderer';

const getTextByClass = (el: MockElement, cls: string): string[] => {
  const results: string[] = [];
  const visit = (node: MockElement) => {
    if (node.hasClass(cls)) {
      results.push(node.textContent);
    }
    node.children.forEach(visit);
  };
  visit(el);
  return results;
};

describe('Sync Subagent Renderer', () => {
  let parentEl: MockElement;

  beforeEach(() => {
    jest.clearAllMocks();
    parentEl = createMockEl('div');
  });

  describe('createSubagentBlock', () => {
    it('should start collapsed by default', () => {
      const state = createSubagentBlock(parentEl as any, 'task-1', { description: 'Test task' });

      expect(state.info.isExpanded).toBe(false);
      expect((state.wrapperEl as any).hasClass('expanded')).toBe(false);
    });

    it('should set aria-expanded to false by default', () => {
      const state = createSubagentBlock(parentEl as any, 'task-1', { description: 'Test task' });

      expect(state.headerEl.getAttribute('aria-expanded')).toBe('false');
    });

    it('should hide content by default', () => {
      const state = createSubagentBlock(parentEl as any, 'task-1', { description: 'Test task' });

      expect((state.contentEl as any).style.display).toBe('none');
    });

    it('should set correct ARIA attributes for accessibility', () => {
      const state = createSubagentBlock(parentEl as any, 'task-1', { description: 'Test task' });

      expect(state.headerEl.getAttribute('role')).toBe('button');
      expect(state.headerEl.getAttribute('tabindex')).toBe('0');
      expect(state.headerEl.getAttribute('aria-expanded')).toBe('false');
      expect(state.headerEl.getAttribute('aria-label')).toContain('click to expand');
    });

    it('should toggle expand/collapse on header click', () => {
      const state = createSubagentBlock(parentEl as any, 'task-1', { description: 'Test task' });

      // Initially collapsed
      expect(state.info.isExpanded).toBe(false);
      expect((state.wrapperEl as any).hasClass('expanded')).toBe(false);
      expect((state.contentEl as any).style.display).toBe('none');

      // Trigger click
      (state.headerEl as any).click();

      // Should be expanded
      expect(state.info.isExpanded).toBe(true);
      expect((state.wrapperEl as any).hasClass('expanded')).toBe(true);
      expect((state.contentEl as any).style.display).toBe('block');

      // Click again to collapse
      (state.headerEl as any).click();
      expect(state.info.isExpanded).toBe(false);
      expect((state.wrapperEl as any).hasClass('expanded')).toBe(false);
      expect((state.contentEl as any).style.display).toBe('none');
    });

    it('should update aria-expanded on toggle', () => {
      const state = createSubagentBlock(parentEl as any, 'task-1', { description: 'Test task' });

      // Initially collapsed
      expect(state.headerEl.getAttribute('aria-expanded')).toBe('false');

      // Expand
      (state.headerEl as any).click();
      expect(state.headerEl.getAttribute('aria-expanded')).toBe('true');

      // Collapse
      (state.headerEl as any).click();
      expect(state.headerEl.getAttribute('aria-expanded')).toBe('false');
    });

    it('should show description in label', () => {
      const state = createSubagentBlock(parentEl as any, 'task-1', { description: 'My task description' });

      expect(state.labelEl.textContent).toBe('My task description');
    });

    it('should not show a tool count badge in the header', () => {
      const state = createSubagentBlock(parentEl as any, 'task-1', { description: 'Test task' });

      expect(getTextByClass(state.wrapperEl as any, 'codexian-subagent-count')).toEqual([]);
    });
  });

  describe('renderStoredSubagent', () => {
    it('should start collapsed by default', () => {
      const subagent: SubagentInfo = {
        id: 'task-1',
        description: 'Test task',
        status: 'completed',
        toolCalls: [],
        isExpanded: false,
      };

      const wrapperEl = renderStoredSubagent(parentEl as any, subagent);

      expect((wrapperEl as any).hasClass('expanded')).toBe(false);
    });

    it('should set aria-expanded to false by default', () => {
      const subagent: SubagentInfo = {
        id: 'task-1',
        description: 'Test task',
        status: 'completed',
        toolCalls: [],
        isExpanded: false,
      };

      const wrapperEl = renderStoredSubagent(parentEl as any, subagent);

      const headerEl = (wrapperEl as any).children[0];
      expect(headerEl.getAttribute('aria-expanded')).toBe('false');
    });

    it('should hide content by default', () => {
      const subagent: SubagentInfo = {
        id: 'task-1',
        description: 'Test task',
        status: 'completed',
        toolCalls: [],
        isExpanded: false,
      };

      const wrapperEl = renderStoredSubagent(parentEl as any, subagent);

      const contentEl = (wrapperEl as any).children[1];
      expect(contentEl.style.display).toBe('none');
    });

    it('should toggle expand/collapse on click', () => {
      const subagent: SubagentInfo = {
        id: 'task-1',
        description: 'Test task',
        status: 'completed',
        toolCalls: [],
        isExpanded: false,
      };

      const wrapperEl = renderStoredSubagent(parentEl as any, subagent);
      const headerEl = (wrapperEl as any).children[0];
      const contentEl = (wrapperEl as any).children[1];

      // Initially collapsed
      expect((wrapperEl as any).hasClass('expanded')).toBe(false);
      expect(contentEl.style.display).toBe('none');

      // Click to expand
      headerEl.click();
      expect((wrapperEl as any).hasClass('expanded')).toBe(true);
      expect(contentEl.style.display).toBe('block');
      expect(headerEl.getAttribute('aria-expanded')).toBe('true');

      // Click to collapse
      headerEl.click();
      expect((wrapperEl as any).hasClass('expanded')).toBe(false);
      expect(contentEl.style.display).toBe('none');
      expect(headerEl.getAttribute('aria-expanded')).toBe('false');
    });
  });
});

describe('keyboard navigation', () => {
  let parentEl: MockElement;

  beforeEach(() => {
    jest.clearAllMocks();
    parentEl = createMockEl('div');
  });

  it('should support keyboard navigation (Enter/Space) on createSubagentBlock', () => {
    const state = createSubagentBlock(parentEl as any, 'task-1', { description: 'Test task' });

    // Simulate keydown event
    const keydownHandlers: Array<(e: any) => void> = [];
    const originalAddEventListener = state.headerEl.addEventListener;
    state.headerEl.addEventListener = (event: string, handler: (e: any) => void) => {
      if (event === 'keydown') {
        keydownHandlers.push(handler);
      }
      originalAddEventListener.call(state.headerEl, event, handler);
    };

    // Re-check - the handler should already be registered
    // We need to dispatch a keydown event
    const enterEvent = { key: 'Enter', preventDefault: jest.fn() };
    (state.headerEl as any).dispatchEvent({ type: 'keydown', ...enterEvent });

    // The handler should have been called and expanded
    expect(state.info.isExpanded).toBe(true);
    expect((state.wrapperEl as any).hasClass('expanded')).toBe(true);

    // Space to collapse
    const spaceEvent = { key: ' ', preventDefault: jest.fn() };
    (state.headerEl as any).dispatchEvent({ type: 'keydown', ...spaceEvent });

    expect(state.info.isExpanded).toBe(false);
    expect((state.wrapperEl as any).hasClass('expanded')).toBe(false);
  });

  it('should support keyboard navigation (Enter/Space) on renderStoredSubagent', () => {
    const subagent: SubagentInfo = {
      id: 'task-1',
      description: 'Test task',
      status: 'completed',
      toolCalls: [],
      isExpanded: false,
    };

    const wrapperEl = renderStoredSubagent(parentEl as any, subagent);
    const headerEl = (wrapperEl as any).children[0];

    // Simulate Enter key
    const enterEvent = { key: 'Enter', preventDefault: jest.fn() };
    headerEl.dispatchEvent({ type: 'keydown', ...enterEvent });

    expect((wrapperEl as any).hasClass('expanded')).toBe(true);

    // Simulate Space key to collapse
    const spaceEvent = { key: ' ', preventDefault: jest.fn() };
    headerEl.dispatchEvent({ type: 'keydown', ...spaceEvent });

    expect((wrapperEl as any).hasClass('expanded')).toBe(false);
  });
});

describe('addSubagentToolCall', () => {
  let parentEl: MockElement;

  beforeEach(() => {
    jest.clearAllMocks();
    parentEl = createMockEl('div');
  });

  it('adds tool call to state without rendering a header count', () => {
    const state = createSubagentBlock(parentEl as any, 'task-1', { description: 'Test task' });

    const toolCall: ToolCallInfo = {
      id: 'tool-1',
      name: 'Read',
      input: { file_path: 'test.md' },
      status: 'running',
      isExpanded: false,
    };

    addSubagentToolCall(state, toolCall);

    expect(state.info.toolCalls).toHaveLength(1);
    expect(getTextByClass(state.wrapperEl as any, 'codexian-subagent-count')).toEqual([]);
  });

  it('clears previous content and renders new tool item', () => {
    const state = createSubagentBlock(parentEl as any, 'task-1', { description: 'Test task' });

    const toolCall1: ToolCallInfo = {
      id: 'tool-1',
      name: 'Read',
      input: { file_path: 'test.md' },
      status: 'running',
      isExpanded: false,
    };
    addSubagentToolCall(state, toolCall1);

    const toolCall2: ToolCallInfo = {
      id: 'tool-2',
      name: 'Grep',
      input: { pattern: 'test' },
      status: 'running',
      isExpanded: false,
    };
    addSubagentToolCall(state, toolCall2);

    expect(state.info.toolCalls).toHaveLength(2);
    expect(getTextByClass(state.wrapperEl as any, 'codexian-subagent-count')).toEqual([]);
  });

  it('merges repeated tool IDs instead of duplicating tool rows', () => {
    const state = createSubagentBlock(parentEl as any, 'task-1', { description: 'Test task' });

    addSubagentToolCall(state, {
      id: 'tool-1',
      name: 'Write',
      input: {},
      status: 'running',
      isExpanded: false,
    });

    addSubagentToolCall(state, {
      id: 'tool-1',
      name: 'Write',
      input: { file_path: 'notes.md' },
      status: 'running',
      isExpanded: false,
    });

    expect(state.info.toolCalls).toHaveLength(1);
    expect(state.info.toolCalls[0]).toEqual(
      expect.objectContaining({
        id: 'tool-1',
        input: { file_path: 'notes.md' },
      })
    );
    expect(getTextByClass(state.wrapperEl as any, 'codexian-subagent-count')).toEqual([]);
    expect(getTextByClass(state.toolsContainerEl as any, 'codexian-subagent-tool-name')).toEqual(['Write']);
    expect(getTextByClass(state.toolsContainerEl as any, 'codexian-subagent-tool-summary')).toEqual(['notes.md']);
  });
});

describe('updateSubagentToolResult', () => {
  let parentEl: MockElement;

  beforeEach(() => {
    jest.clearAllMocks();
    parentEl = createMockEl('div');
  });

  it('updates tool call status in state', () => {
    const state = createSubagentBlock(parentEl as any, 'task-1', { description: 'Test task' });

    const toolCall: ToolCallInfo = {
      id: 'tool-1',
      name: 'Read',
      input: { file_path: 'test.md' },
      status: 'running',
      isExpanded: false,
    };
    addSubagentToolCall(state, toolCall);

    const updatedToolCall: ToolCallInfo = {
      ...toolCall,
      status: 'completed',
      result: 'File contents here',
    };
    updateSubagentToolResult(state, 'tool-1', updatedToolCall);

    expect(state.info.toolCalls[0].status).toBe('completed');
  });

  it('does not update tool call for non-matching tool ID', () => {
    const state = createSubagentBlock(parentEl as any, 'task-1', { description: 'Test task' });

    const toolCall: ToolCallInfo = {
      id: 'tool-1',
      name: 'Read',
      input: { file_path: 'test.md' },
      status: 'running',
      isExpanded: false,
    };
    addSubagentToolCall(state, toolCall);

    updateSubagentToolResult(state, 'tool-999', { ...toolCall, id: 'tool-999', status: 'completed' });

    expect(state.info.toolCalls[0].status).toBe('running');
  });
});

describe('finalizeSubagentBlock', () => {
  let parentEl: MockElement;

  beforeEach(() => {
    jest.clearAllMocks();
    parentEl = createMockEl('div');
  });

  it('sets status to completed and adds done class', () => {
    const state = createSubagentBlock(parentEl as any, 'task-1', { description: 'Test task' });

    (setIcon as jest.Mock).mockClear();
    finalizeSubagentBlock(state, 'All done', false);

    expect(state.info.status).toBe('completed');
    expect(state.info.result).toBe('All done');
    expect((state.wrapperEl as any).hasClass('done')).toBe(true);
    expect(setIcon).toHaveBeenCalledWith(expect.anything(), 'check');
  });

  it('sets status to error and adds error class', () => {
    const state = createSubagentBlock(parentEl as any, 'task-1', { description: 'Test task' });

    (setIcon as jest.Mock).mockClear();
    finalizeSubagentBlock(state, 'Something failed', true);

    expect(state.info.status).toBe('error');
    expect(state.info.result).toBe('Something failed');
    expect((state.wrapperEl as any).hasClass('error')).toBe(true);
    expect(setIcon).toHaveBeenCalledWith(expect.anything(), 'x');
  });

  it('keeps tool history and shows result section text', () => {
    const state = createSubagentBlock(parentEl as any, 'task-1', { description: 'Test task' });

    // Add a tool call first to populate content
    addSubagentToolCall(state, {
      id: 'tool-1',
      name: 'Read',
      input: { file_path: 'test.md' },
      status: 'running',
      isExpanded: false,
    });

    finalizeSubagentBlock(state, 'Done', false);

    const doneText = getTextByClass(state.contentEl as any, 'codexian-subagent-result-output')[0];
    expect(doneText).toBe('Done');
  });

  it('shows ERROR text when isError is true', () => {
    const state = createSubagentBlock(parentEl as any, 'task-1', { description: 'Test task' });

    finalizeSubagentBlock(state, 'Error occurred', true);

    const errorText = getTextByClass(state.contentEl as any, 'codexian-subagent-result-output')[0];
    expect(errorText).toBe('Error occurred');
  });

  it('does not restore a tool count badge after finalization', () => {
    const state = createSubagentBlock(parentEl as any, 'task-1', { description: 'Test task' });

    addSubagentToolCall(state, {
      id: 'tool-1',
      name: 'Read',
      input: {},
      status: 'running',
      isExpanded: false,
    });
    addSubagentToolCall(state, {
      id: 'tool-2',
      name: 'Grep',
      input: {},
      status: 'running',
      isExpanded: false,
    });

    finalizeSubagentBlock(state, 'Done', false);

    expect(getTextByClass(state.wrapperEl as any, 'codexian-subagent-count')).toEqual([]);
  });
});

describe('renderStoredSubagent status variants', () => {
  let parentEl: MockElement;

  beforeEach(() => {
    jest.clearAllMocks();
    parentEl = createMockEl('div');
  });

  it('renders completed subagent with done class and check icon', () => {
    const subagent: SubagentInfo = {
      id: 'task-1',
      description: 'Completed task',
      status: 'completed',
      toolCalls: [],
      isExpanded: false,
    };

    (setIcon as jest.Mock).mockClear();
    const wrapperEl = renderStoredSubagent(parentEl as any, subagent);

    expect((wrapperEl as any).hasClass('done')).toBe(true);
    expect(setIcon).toHaveBeenCalledWith(expect.anything(), 'check');
    const doneText = getTextByClass(wrapperEl as any, 'codexian-subagent-result-output')[0];
    expect(doneText).toBe('DONE');
  });

  it('renders error subagent with error class and x icon', () => {
    const subagent: SubagentInfo = {
      id: 'task-1',
      description: 'Failed task',
      status: 'error',
      toolCalls: [],
      isExpanded: false,
    };

    (setIcon as jest.Mock).mockClear();
    const wrapperEl = renderStoredSubagent(parentEl as any, subagent);

    expect((wrapperEl as any).hasClass('error')).toBe(true);
    expect(setIcon).toHaveBeenCalledWith(expect.anything(), 'x');
    const errorText = getTextByClass(wrapperEl as any, 'codexian-subagent-result-output')[0];
    expect(errorText).toBe('ERROR');
  });

  it('renders running subagent with tool list', () => {
    const subagent: SubagentInfo = {
      id: 'task-1',
      description: 'Running task',
      status: 'running',
      toolCalls: [
        { id: 'tool-1', name: 'Read', input: { file_path: 'test.md' }, status: 'completed', isExpanded: false },
        { id: 'tool-2', name: 'Grep', input: { pattern: 'test' }, status: 'running', isExpanded: false },
      ],
      isExpanded: false,
    };

    const wrapperEl = renderStoredSubagent(parentEl as any, subagent);

    // Should not have done or error class
    expect((wrapperEl as any).hasClass('done')).toBe(false);
    expect((wrapperEl as any).hasClass('error')).toBe(false);
  });

  it('renders running subagent tool call with expanded-style result', () => {
    const subagent: SubagentInfo = {
      id: 'task-1',
      description: 'Running task',
      status: 'running',
      toolCalls: [
        {
          id: 'tool-1',
          name: 'Read',
          input: { file_path: 'test.md' },
          status: 'completed',
          result: 'File contents here',
          isExpanded: false,
        },
      ],
      isExpanded: false,
    };

    const wrapperEl = renderStoredSubagent(parentEl as any, subagent);
    const contentEl = (wrapperEl as any).children[1]; // content area

    // Should show result text
    const resultTexts = getTextByClass(contentEl, 'codexian-tool-line');
    expect(resultTexts.length).toBe(1);
    expect(resultTexts[0]).toContain('File contents here');
  });

  it('does not render a tool count badge for stored subagents', () => {
    const subagent: SubagentInfo = {
      id: 'task-1',
      description: 'Task with tools',
      status: 'completed',
      toolCalls: [
        { id: 'tool-1', name: 'Read', input: {}, status: 'completed', isExpanded: false },
        { id: 'tool-2', name: 'Grep', input: {}, status: 'completed', isExpanded: false },
        { id: 'tool-3', name: 'Edit', input: {}, status: 'completed', isExpanded: false },
      ],
      isExpanded: false,
    };

    const wrapperEl = renderStoredSubagent(parentEl as any, subagent);

    expect(getTextByClass(wrapperEl as any, 'codexian-subagent-count')).toEqual([]);
  });

  it('truncates long descriptions', () => {
    const longDesc = 'A'.repeat(50);
    const subagent: SubagentInfo = {
      id: 'task-1',
      description: longDesc,
      status: 'completed',
      toolCalls: [],
      isExpanded: false,
    };

    const wrapperEl = renderStoredSubagent(parentEl as any, subagent);

    const labelTexts = getTextByClass(wrapperEl as any, 'codexian-subagent-label');
    expect(labelTexts[0]).toBe('A'.repeat(40) + '...');
  });
});
