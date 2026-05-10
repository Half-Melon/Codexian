import type { App, ItemView } from 'obsidian';

import type { CanvasSelectionContext } from '../../../utils/canvas';
import { hideElement, showElement } from '../../../utils/dom';
import { updateContextRowHasContent } from './contextRowVisibility';

const CANVAS_POLL_INTERVAL = 250;

interface WorkspaceLeafLike {
  view?: unknown;
}

interface WorkspaceWithActiveLeaf {
  getMostRecentLeaf?: () => WorkspaceLeafLike | null;
}

interface CanvasViewLike {
  canvas?: {
    selection?: Set<{ id: string }>;
  };
  file?: {
    path?: string;
  };
}

export class CanvasSelectionController {
  private app: App;
  private indicatorEl: HTMLElement;
  private inputEl: HTMLElement;
  private contextRowEl: HTMLElement;
  private onVisibilityChange: (() => void) | null;
  private storedSelection: CanvasSelectionContext | null = null;
  private pollInterval: number | null = null;

  constructor(
    app: App,
    indicatorEl: HTMLElement,
    inputEl: HTMLElement,
    contextRowEl: HTMLElement,
    onVisibilityChange?: () => void
  ) {
    this.app = app;
    this.indicatorEl = indicatorEl;
    this.inputEl = inputEl;
    this.contextRowEl = contextRowEl;
    this.onVisibilityChange = onVisibilityChange ?? null;
  }

  start(): void {
    if (this.pollInterval) return;
    this.pollInterval = activeWindow.setInterval(() => this.poll(), CANVAS_POLL_INTERVAL);
  }

  stop(): void {
    if (this.pollInterval) {
      activeWindow.clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.clear();
  }

  private poll(): void {
    const canvasView = this.getCanvasView();
    if (!canvasView) return;

    const { canvas, file } = canvasView as ItemView & CanvasViewLike;
    if (!canvas?.selection) return;

    const selection: Set<{ id: string }> = canvas.selection;
    const canvasPath = file?.path;
    if (!canvasPath) return;

    const nodeIds = [...selection].map(node => node.id).filter(Boolean);

    if (nodeIds.length > 0) {
      const sameSelection = this.storedSelection
        && this.storedSelection.canvasPath === canvasPath
        && this.storedSelection.nodeIds.length === nodeIds.length
        && this.storedSelection.nodeIds.every(id => nodeIds.includes(id));

      if (!sameSelection) {
        this.storedSelection = { canvasPath, nodeIds };
        this.updateIndicator();
      }
    } else if (activeDocument.activeElement !== this.inputEl) {
      if (this.storedSelection) {
        this.storedSelection = null;
        this.updateIndicator();
      }
    }
  }

  private getCanvasView(): ItemView | null {
    const workspace = this.app.workspace as typeof this.app.workspace & WorkspaceWithActiveLeaf;
    const activeLeaf = workspace.getMostRecentLeaf?.();
    const activeView = activeLeaf?.view as ItemView | undefined;
    if (activeView?.getViewType?.() === 'canvas' && (activeView as ItemView & CanvasViewLike).file) {
      return activeView;
    }

    const leaves = this.app.workspace.getLeavesOfType('canvas');
    if (leaves.length === 0) return null;
    const leaf = leaves.find(l => (l.view as ItemView & CanvasViewLike).file);
    return leaf ? (leaf.view as ItemView) : null;
  }

  private updateIndicator(): void {
    if (!this.indicatorEl) return;

    if (this.storedSelection) {
      const { nodeIds } = this.storedSelection;
      this.indicatorEl.textContent = nodeIds.length === 1
        ? `node "${nodeIds[0]}" selected`
        : `${nodeIds.length} nodes selected`;
      showElement(this.indicatorEl, 'block');
    } else {
      hideElement(this.indicatorEl);
    }
    this.updateContextRowVisibility();
  }

  updateContextRowVisibility(): void {
    if (!this.contextRowEl) return;
    updateContextRowHasContent(this.contextRowEl);
    this.onVisibilityChange?.();
  }

  getContext(): CanvasSelectionContext | null {
    if (!this.storedSelection) return null;
    return {
      canvasPath: this.storedSelection.canvasPath,
      nodeIds: [...this.storedSelection.nodeIds],
    };
  }

  hasSelection(): boolean {
    return this.storedSelection !== null;
  }

  clear(): void {
    this.storedSelection = null;
    this.updateIndicator();
  }
}
