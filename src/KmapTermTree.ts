import { css, html, LitElement, PropertyValues, svg } from 'lit';
import { property, state, query } from 'lit/decorators.js';
import katex from 'katex';
import { katexStyles } from './katex-css.js';
import { TermNode, TreeEdge } from './model.js';
import { parseAsciiMath, astToAnnotatedLatex } from './asciimath-parser.js';

export class KmapTermTree extends LitElement {
  static styles = [
    katexStyles,
    css`
      :host {
        display: block;
        position: relative;
        font-family: var(
          --kmap-term-tree-font-family,
          system-ui,
          -apple-system,
          sans-serif
        );
        color: var(--kmap-term-tree-text-color, #1f2937);
        user-select: none;
        width: 100%;
      }

      .container {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        box-sizing: border-box;
      }

      .tree-canvas {
        position: relative;
        width: 100%;
        min-height: 80px;
      }

      .formula-wrapper {
        position: relative;
        z-index: 2;
        display: flex;
        justify-content: center;
        align-items: center;
        padding-top: 4px;
        font-size: var(--kmap-term-tree-formula-font-size, 1.35rem);
      }

      .highlight-overlay {
        position: absolute;
        z-index: 1;
        pointer-events: none;
        background-color: var(
          --kmap-term-tree-highlight-color,
          rgba(251, 191, 36, 0.28)
        );
        border: 2px solid
          var(--kmap-term-tree-highlight-outline, rgba(245, 158, 11, 0.75));
        border-radius: 6px;
        box-sizing: border-box;
        transition: left 0.12s ease-out, top 0.12s ease-out,
          width 0.12s ease-out, height 0.12s ease-out;
      }

      .edges-svg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1;
        overflow: visible;
      }

      .edge-path {
        fill: none;
        stroke: var(--kmap-term-tree-edge-color, #f59e0b);
        stroke-width: 2.2;
        stroke-linecap: round;
        opacity: 0.85;
        transition: stroke 0.2s ease, stroke-width 0.2s ease, opacity 0.2s ease;
      }

      .edge-path.highlighted {
        stroke: var(--kmap-term-tree-highlight-edge-color, #d97706);
        stroke-width: 3.2;
        opacity: 1;
      }

      .tree-node {
        position: absolute;
        z-index: 2;
        transform: translate(-50%, -50%);
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }

      .tree-node:hover,
      .tree-node.active {
        transform: translate(-50%, -50%) scale(1.15);
      }

      .node-badge {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: var(--kmap-term-tree-background-color, #ffffff);
        border: 2px solid var(--kmap-term-tree-border-color, #0284c7);
        color: var(--kmap-term-tree-node-text-color, #0284c7);
        font-weight: 700;
        font-size: 1rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
        box-sizing: border-box;
        transition: all 0.2s ease;
      }

      .tree-node:hover .node-badge,
      .tree-node.active .node-badge {
        background: var(--kmap-term-tree-active-node-bg, #0284c7);
        color: #ffffff;
        border-color: var(--kmap-term-tree-active-node-border, #0284c7);
        box-shadow: 0 4px 8px rgba(2, 132, 199, 0.35);
      }

      .node-label {
        margin-top: 2px;
        font-size: 0.7rem;
        font-weight: 500;
        color: #64748b;
        white-space: nowrap;
        background: rgba(255, 255, 255, 0.95);
        padding: 1px 4px;
        border-radius: 4px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      }

      /* KaTeX Highlight */
      .highlight-term {
        background-color: var(
          --kmap-term-tree-highlight-color,
          rgba(251, 191, 36, 0.35)
        ) !important;
        border-radius: 4px;
        outline: 2px solid
          var(--kmap-term-tree-highlight-outline, rgba(245, 158, 11, 0.7));
        transition: background-color 0.2s ease, outline 0.2s ease;
      }

      .info-bar {
        margin-top: 12px;
        padding: 6px 14px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 0.88rem;
        display: flex;
        align-items: center;
        gap: 8px;
        color: #334155;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
      }

      .info-badge {
        font-weight: 700;
        color: #0284c7;
        background: #e0f2fe;
        padding: 2px 8px;
        border-radius: 4px;
      }

      .error-msg {
        color: #dc2626;
        padding: 8px;
        font-size: 0.9rem;
      }
    `,
  ];

  @property({ type: String }) term?: string;
  @property({ type: Number }) tension: number = 0.5;
  @property({ type: Boolean }) showLabels: boolean = false;
  @property({ type: Boolean }) showDetails: boolean = true;

  @state() private ast?: TermNode;
  @state() private error?: string;
  @state() private flatNodes: TermNode[] = [];
  @state() private edges: TreeEdge[] = [];
  @state() private activeNodeId?: string;
  @state() private activeSubtreeIds: Set<string> = new Set();
  @state() private treeHeight: number = 100;
  @state() private highlightRect?: {
    left: number;
    top: number;
    width: number;
    height: number;
  };

  @query('#formula') private formulaElement?: HTMLElement;
  @query('.tree-canvas') private treeCanvasElement?: HTMLElement;

  private resizeObserver?: ResizeObserver;
  private lastObservedWidth = 0;
  private resizeFrameId?: number;
  private animationTimers: number[] = [];

  connectedCallback() {
    super.connectedCallback();
    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (Math.abs(width - this.lastObservedWidth) > 0.5) {
          this.lastObservedWidth = width;
          this.triggerLayoutUpdate();
        }
      }
    });

    window.addEventListener('animationend', this.onAnimationOrTransitionEnd);
    window.addEventListener('transitionend', this.onAnimationOrTransitionEnd);

    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(() => {
        if (this.isConnected) {
          this.recalculateLayout();
        }
      });
    }
  }

  disconnectedCallback() {
    if (this.resizeFrameId) {
      cancelAnimationFrame(this.resizeFrameId);
    }
    this.clearAnimationTimers();
    window.removeEventListener('animationend', this.onAnimationOrTransitionEnd);
    window.removeEventListener('transitionend', this.onAnimationOrTransitionEnd);
    this.resizeObserver?.disconnect();
    super.disconnectedCallback();
  }

  private onAnimationOrTransitionEnd = () => {
    this.triggerLayoutUpdate();
  };

  private triggerLayoutUpdate() {
    if (this.resizeFrameId) {
      cancelAnimationFrame(this.resizeFrameId);
    }
    this.resizeFrameId = requestAnimationFrame(() => {
      if (this.isConnected) {
        this.recalculateLayout();
      }
    });
  }

  private watchAncestorAnimations() {
    let curr: Element | null = this;
    const animations: Animation[] = [];

    while (curr) {
      if (typeof curr.getAnimations === 'function') {
        for (const anim of curr.getAnimations()) {
          if (anim.playState === 'running' || anim.pending) {
            animations.push(anim);
          }
        }
      }
      const root = curr.getRootNode() as ShadowRoot | Document;
      if (root && 'host' in root) {
        curr = (root as ShadowRoot).host;
      } else {
        curr = curr.parentElement;
      }
    }

    if (animations.length > 0) {
      Promise.all(animations.map(a => a.finished.catch(() => {}))).then(() => {
        if (this.isConnected) {
          this.recalculateLayout();
        }
      });
    }
  }

  private scheduleAnimationCheck() {
    this.clearAnimationTimers();
    this.watchAncestorAnimations();

    const t1 = window.setTimeout(() => {
      if (!this.isConnected) return;
      this.watchAncestorAnimations();
      this.recalculateLayout();
    }, 50);

    const t2 = window.setTimeout(() => {
      if (!this.isConnected) return;
      this.recalculateLayout();
    }, 320);

    const t3 = window.setTimeout(() => {
      if (!this.isConnected) return;
      this.recalculateLayout();
    }, 450);

    this.animationTimers.push(t1, t2, t3);
  }

  private clearAnimationTimers() {
    for (const t of this.animationTimers) {
      clearTimeout(t);
    }
    this.animationTimers = [];
  }

  // Support slotted content: <kmap-term-tree>2a+3b</kmap-term-tree>
  updateSlotted(event: Event) {
    const slot = event.target as HTMLSlotElement;
    const text = slot
      .assignedNodes()
      .map(n => n.textContent)
      .join('')
      .trim();
    if (text && text !== this.term) {
      this.term = text;
    }
  }

  protected willUpdate(changedProperties: PropertyValues) {
    if (changedProperties.has('term') && this.term !== undefined) {
      this.parseInput(this.term);
    }
  }

  private parseInput(termStr: string) {
    try {
      this.error = undefined;
      const cleanTerm = termStr.trim();
      if (!cleanTerm) {
        this.ast = undefined;
        this.flatNodes = [];
        this.edges = [];
        return;
      }

      this.ast = parseAsciiMath(cleanTerm);
      this.activeNodeId = this.ast.id;
      this.activeSubtreeIds = this.collectSubtreeIds(this.ast);
    } catch (e: any) {
      this.error = e.message || 'Fehler beim Parsen des Terms';
      this.ast = undefined;
      this.flatNodes = [];
      this.edges = [];
    }
  }

  protected async updated(changedProperties: PropertyValues) {
    if (changedProperties.has('term') || changedProperties.has('ast')) {
      this.renderKaTeX();
      await this.updateComplete;
      this.recalculateLayout();
      if (this.treeCanvasElement && this.resizeObserver) {
        this.resizeObserver.observe(this.treeCanvasElement);
      }
      this.scheduleAnimationCheck();
    }
  }

  private renderKaTeX() {
    if (!this.formulaElement || !this.ast) return;

    try {
      const latex = astToAnnotatedLatex(this.ast);
      katex.render(latex, this.formulaElement, {
        trust: true,
        strict: false,
        throwOnError: false,
      });
    } catch (err: any) {
      this.error = err.message;
    }
  }

  private recalculateLayout() {
    if (
      !this.ast ||
      !this.formulaElement ||
      !this.treeCanvasElement ||
      !this.shadowRoot
    )
      return;

    const canvasRect = this.treeCanvasElement.getBoundingClientRect();
    const offsetWidth = this.treeCanvasElement.offsetWidth;
    const offsetHeight = this.treeCanvasElement.offsetHeight;

    if (canvasRect.width === 0 || offsetWidth === 0) return;
    this.lastObservedWidth = offsetWidth;

    const scaleX = canvasRect.width / offsetWidth;
    const scaleY = offsetHeight > 0 ? canvasRect.height / offsetHeight : scaleX;
    if (scaleX < 0.01 || scaleY < 0.01) return;

    const flatNodes: TermNode[] = [];
    const nodeMap = new Map<string, TermNode>();

    // 1. Collect all nodes and measure leaf positions from KaTeX DOM elements
    const collectAndPositionLeaves = (node: TermNode) => {
      nodeMap.set(node.id, node);

      if (node.children.length === 0) {
        // Leaf node: measure rendered KaTeX span
        const el = this.shadowRoot!.getElementById(node.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          node.x = (rect.left - canvasRect.left + rect.width / 2) / scaleX;
          node.y = (rect.bottom - canvasRect.top) / scaleY;
          node.width = rect.width / scaleX;
          node.height = rect.height / scaleY;
        } else {
          node.x = offsetWidth / 2;
          node.y = 20;
        }
      } else {
        flatNodes.push(node);
        for (const child of node.children) {
          collectAndPositionLeaves(child);
        }
      }
    };

    collectAndPositionLeaves(this.ast);

    // 2. Position inner nodes bottom-up based on children coordinates
    const formulaRect = this.formulaElement.getBoundingClientRect();
    const formulaBottomRel = (formulaRect.bottom - canvasRect.top) / scaleY;
    const initialGap = 34; // distance from formula bottom to level 1 operators
    const rowHeight = 40; // distance between tree levels

    const positionInnerNodes = (node: TermNode) => {
      for (const child of node.children) {
        if (child.children.length > 0) {
          positionInnerNodes(child);
        }
      }

      if (node.children.length > 0) {
        if (node.type === 'function' || node.isUnary) {
          // Center under the full function / unary expression: e.g. sin(arg) or -arg
          const el = this.shadowRoot!.getElementById(node.id);
          if (el) {
            const rect = el.getBoundingClientRect();
            node.x = (rect.left - canvasRect.left + rect.width / 2) / scaleX;
          } else {
            node.x = node.children[0].x ?? 0;
          }
        } else {
          const first = node.children[0];
          const last = node.children[node.children.length - 1];
          node.x = ((first.x ?? 0) + (last.x ?? 0)) / 2;
        }
        node.y = formulaBottomRel + initialGap + (node.depth - 1) * rowHeight;
      }
    };

    positionInnerNodes(this.ast);

    // 3. Build edges between parent nodes and their children
    const edges: TreeEdge[] = [];
    for (const node of flatNodes) {
      if (node.x === undefined || node.y === undefined) continue;

      for (const child of node.children) {
        if (child.x === undefined || child.y === undefined) continue;

        edges.push({
          fromNodeId: child.id,
          toNodeId: node.id,
          fromX: child.x,
          fromY: child.y + (child.depth > 0 ? 14 : 2),
          toX: node.x,
          toY: node.y - 14,
        });
      }
    }

    const maxDepth = this.ast.depth;
    this.treeHeight = Math.max(
      60,
      formulaBottomRel + initialGap + (maxDepth - 1) * rowHeight + 24
    );
    this.flatNodes = flatNodes;
    this.edges = edges;
    this.updateHighlightRect(this.activeNodeId);
    this.requestUpdate();
  }

  private collectSubtreeIds(node: TermNode): Set<string> {
    const ids = new Set<string>();
    const traverse = (n: TermNode) => {
      ids.add(n.id);
      for (const c of n.children) traverse(c);
    };
    traverse(node);
    return ids;
  }

  private onNodeHover(node: TermNode, enter: boolean) {
    if (!enter) {
      // Revert highlight to root node
      if (this.ast) {
        this.setActiveNode(this.ast);
      }
      return;
    }
    this.setActiveNode(node);
  }

  private setActiveNode(node: TermNode) {
    this.activeNodeId = node.id;
    this.activeSubtreeIds = this.collectSubtreeIds(node);
    this.updateHighlightRect(node.id);
    this.requestUpdate();
  }

  private findNode(
    root: TermNode | undefined,
    id: string
  ): TermNode | undefined {
    if (!root) return undefined;
    if (root.id === id) return root;
    for (const child of root.children) {
      const found = this.findNode(child, id);
      if (found) return found;
    }
    return undefined;
  }

  private getNodeVisualBounds(
    node: TermNode
  ): { top: number; bottom: number; left: number; right: number } | null {
    if (!this.shadowRoot) return null;

    let minTop = Infinity;
    let maxBottom = -Infinity;
    let minLeft = Infinity;
    let maxRight = -Infinity;

    const collectBounds = (n: TermNode) => {
      const el = this.shadowRoot!.getElementById(n.id);
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          minTop = Math.min(minTop, r.top);
          maxBottom = Math.max(maxBottom, r.bottom);
          minLeft = Math.min(minLeft, r.left);
          maxRight = Math.max(maxRight, r.right);
        }
      }
      for (const child of n.children) {
        collectBounds(child);
      }
    };

    collectBounds(node);

    if (minTop === Infinity) return null;
    return { top: minTop, bottom: maxBottom, left: minLeft, right: maxRight };
  }

  private updateHighlightRect(nodeId?: string) {
    if (!nodeId || !this.shadowRoot || !this.treeCanvasElement || !this.ast) {
      this.highlightRect = undefined;
      return;
    }

    const node = this.findNode(this.ast, nodeId);
    if (!node) {
      this.highlightRect = undefined;
      return;
    }

    const bounds = this.getNodeVisualBounds(node);
    if (!bounds) {
      this.highlightRect = undefined;
      return;
    }

    const canvasRect = this.treeCanvasElement.getBoundingClientRect();
    const offsetWidth = this.treeCanvasElement.offsetWidth;
    const offsetHeight = this.treeCanvasElement.offsetHeight;
    if (canvasRect.width === 0 || offsetWidth === 0) {
      this.highlightRect = undefined;
      return;
    }

    const scaleX = canvasRect.width / offsetWidth;
    const scaleY = offsetHeight > 0 ? canvasRect.height / offsetHeight : scaleX;
    if (scaleX < 0.01 || scaleY < 0.01) {
      this.highlightRect = undefined;
      return;
    }

    const paddingX = 4;
    const paddingY = 4;

    this.highlightRect = {
      left: (bounds.left - canvasRect.left) / scaleX - paddingX,
      top: (bounds.top - canvasRect.top) / scaleY - paddingY,
      width: (bounds.right - bounds.left) / scaleX + paddingX * 2,
      height: (bounds.bottom - bounds.top) / scaleY + paddingY * 2,
    };
  }

  private renderPath(edge: TreeEdge): string {
    const delta = (edge.toY - edge.fromY) * this.tension;
    const hx1 = edge.fromX;
    const hy1 = edge.fromY + delta;
    const hx2 = edge.toX;
    const hy2 = edge.toY - delta;

    return `M ${edge.fromX} ${edge.fromY} C ${hx1} ${hy1} ${hx2} ${hy2} ${edge.toX} ${edge.toY}`;
  }

  render() {
    const activeNode =
      this.flatNodes.find(n => n.id === this.activeNodeId) || this.ast;
    const isRoot = activeNode?.id === this.ast?.id;

    return html`
      <div class="container">
        <!-- Canvas area with formula, edges, and operator nodes sharing the same coordinate space -->
        <div class="tree-canvas" style="height: ${this.treeHeight}px">
          ${this.highlightRect
            ? html`
                <div
                  class="highlight-overlay"
                  style="left: ${this.highlightRect.left}px; top: ${this
                    .highlightRect.top}px; width: ${this.highlightRect
                    .width}px; height: ${this.highlightRect.height}px;"
                ></div>
              `
            : ''}

          <div class="formula-wrapper">
            <div id="formula"></div>
          </div>

          ${this.error
            ? html`<div class="error-msg">${this.error}</div>`
            : html`
                <svg class="edges-svg">
                  ${this.edges.map(
                    edge => svg`
                      <path
                        class="edge-path ${
                          this.activeSubtreeIds.has(edge.fromNodeId) &&
                          this.activeSubtreeIds.has(edge.toNodeId)
                            ? 'highlighted'
                            : ''
                        }"
                        d="${this.renderPath(edge)}"
                      />
                    `
                  )}
                </svg>

                ${this.flatNodes.map(
                  node => html`
                    <div
                      class="tree-node ${this.activeNodeId === node.id
                        ? 'active'
                        : ''}"
                      style="left: ${node.x}px; top: ${node.y}px;"
                      @mouseenter=${() => this.onNodeHover(node, true)}
                      @mouseleave=${() => this.onNodeHover(node, false)}
                      @click=${() => this.setActiveNode(node)}
                    >
                      <div class="node-badge" title="${node.label}">
                        ${node.symbol}
                      </div>
                      ${this.showLabels
                        ? html`<span class="node-label">${node.label}</span>`
                        : ''}
                    </div>
                  `
                )}
              `}
        </div>

        <!-- Didactic info box -->
        ${this.showDetails && activeNode
          ? html`
              <div class="info-bar">
                <span>${isRoot ? 'Hauptrechenart:' : 'Teilterm:'}</span>
                <span class="info-badge">${activeNode.label}</span>
                <span style="color: #64748b">
                  ${activeNode.children.length === 2
                    ? `(verknüpft 2 Teilterme mit ${activeNode.symbol})`
                    : activeNode.isUnary
                    ? `(wirkt auf ${
                        activeNode.children[0].label || 'Ausdruck'
                      })`
                    : ''}
                </span>
              </div>
            `
          : ''}

        <div hidden>
          <slot @slotchange=${this.updateSlotted}></slot>
        </div>
      </div>
    `;
  }
}
