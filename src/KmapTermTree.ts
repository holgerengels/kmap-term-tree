import {css, html, LitElement, property, PropertyValues, query, internalProperty, svg} from 'lit-element';
import {Parser, TermNode} from "./parser.js";
import {Token} from "./tokenizer.js";
import {ifDefined} from "lit-html/directives/if-defined.js";

interface Connection {
  from: number,
  to: number,
}
interface Position {
  x: number,
  y: number,
  width: number,
  height: number,
}
interface Edge {
  from: Position,
  to: Position,
}
export class KmapTermTree extends LitElement {
  // language=CSS
  static styles = css`
    :host {
      display: block;
      color: var(--kmap-term-tree-text-color, #000);
      position: relative;
    }
    .tokens, .nodes, kmap-term-tree-edges {
      position: absolute;
    }
    .tokens, .nodes {
      white-space: nowrap;
    }
    kmap-term-tree-edges {
      width: 100%;
      height: 100%;
    }
    .token {
      display: inline-block;
    }
    .token, .node {
      display: inline-block;
      position: relative;
      background-color: var(--kmap-term-tree-background-color, white);
    }
    .node {
      display: inline-block;
      position: relative;
      border: 1px solid var(--kmap-term-tree-border-color, #005b9f);
      padding: 0px 4px;
      border-radius: 1em;
      margin: -1px -5px;
    }
    .node[depth="0"], .node:not([depth]) {
      visibility: hidden;
    }
    .node[depth="1"] {
        top: calc(var(--kmap-term-tree-vertical-distance, 1.5em) * 1.5);
    }
    .node[depth="2"] {
      top: calc(var(--kmap-term-tree-vertical-distance, 1.5em) * 3);
    }
    .node[depth="3"] {
      top: calc(var(--kmap-term-tree-vertical-distance, 1.5em) * 4.5);
    }
    .node[depth="4"] {
      top: calc(var(--kmap-term-tree-vertical-distance, 1.5em) * 6);
    }
    .node[depth="5"] {
      top: calc(var(--kmap-term-tree-vertical-distance, 1.5em) * 7.5);
    }
    .node[depth="6"] {
      top: calc(var(--kmap-term-tree-vertical-distance, 1.5em) * 9);
    }
  `;

  private parser: Parser = new Parser();

  @property({ type: String }) term?: string;
  @property({type: Number}) tension: number = 0;

  @internalProperty() tokens?: Token[];
  @internalProperty() nodes?: TermNode[];
  @internalProperty() termNode?: TermNode;
  @internalProperty() depths?: {[key: string]: number};
  @internalProperty() maxDepths?: number;

  @internalProperty() connections?: Connection[];

  @query("kmap-term-tree-edges") edgesElement?: KmapTermTreeEdge;
  @query("#tokens") tokensElement?: HTMLDivElement;

  protected update(_changedProperties: PropertyValues) {
    if (_changedProperties.has("term")) {
      if (this.term !== undefined) {
        this.tokens = Token.tokenize(this.term);
        this.termNode = this.parser.parse(this.tokens);

        let map: {[key: string]: number} = {};
        this.maxDepths = this.calcDepths(this.termNode, map);

        let connections: Connection[] = [];
        this.termNode.breadthFirst((n) => {
          if (n.leftChildNode !== undefined)
            connections.push({from: n.token.id, to: n.leftChildNode.token.id})
          if (n.rightChildNode !== undefined)
            connections.push({from: n.token.id, to: n.rightChildNode.token.id})
        });
        this.depths = map;
        this.connections = connections;
      }
    }
    super.update(_changedProperties);
  }

  private calcDepths(node: TermNode, map: { [p: string]: number }): number {
    let depth = 0;
    if (node.leftChildNode)
      depth = Math.max(depth, this.calcDepths(node.leftChildNode, map) + 1);
    if (node.rightChildNode)
      depth = Math.max(depth, this.calcDepths(node.rightChildNode, map) + 1);
    map[node.token.id] = depth;
    return depth;
  }

  render() {
    return html`
      ${this.connections ? html`
        <kmap-term-tree-edges .tension="${this.tension}"></kmap-term-tree-edges>
      ` : ''}
      ${!this.tokens ? '' : html`
        <div class="tokens" id="tokens">
          ${this.tokens.map((t) => html`
            <div class="token" id="${t.id}">${this._prettify(t.value)}</div>
          `)}
        </div>
      ` }
      ${this.tokens && this.depths ? html`
        <div class="nodes">
          ${this.tokens.map((t) => html`
            <div class="node" id="n${t.id}" depth="${ifDefined(this.depths ? this.depths[t.id]: undefined)}">${this._prettify(t.value)}</div>
          `)}
        </div>
      ` : ''}
    `;
  }

  protected async updated(_changedProperties: PropertyValues) {
    if (_changedProperties.has("connections")) {
      await this.updateComplete;

      if (this.tokensElement && this.maxDepths ) {
        let tokensHeight = this.tokensElement.offsetHeight;
        console.log(this.maxDepths)
        console.log(tokensHeight + "px")
        this.style.setProperty("--kmap-term-tree-max-depth", "" + this.maxDepths);
        this.style.setProperty("--kmap-term-tree-vertical-distance", tokensHeight + "px");
        this.style.height = "calc(3px + var(--kmap-term-tree-vertical-distance) * (var(--kmap-term-tree-max-depth)*1.5 + 1))";
        console.log(this.style.height);
      }

      let edges: Edge[] = [];
      if (this.edgesElement && this.connections) {
        for (const connection of this.connections) {
          let edge = this._connect(connection);
          if (edge)
            edges.push(edge);
        }
        this.edgesElement.edges = edges;
      }
    }
  }

  _connect(connection: Connection): Edge | undefined {
    if (!this.shadowRoot)
      return;
    let from = this.shadowRoot.getElementById("n" + connection.from);
    let to = this.shadowRoot.getElementById("n" + connection.to);
    if (!from || !to)
      return;
    let frompos = this._findAbsolutePosition(from);
    let topos = this._findAbsolutePosition(to);

    return { from: frompos, to: topos };
  }

  _findAbsolutePosition(element: HTMLElement): Position {
    var x: number = 0;
    var y: number = 0;
    var el: HTMLElement | null = element;
    for (; el != this; el = el.offsetParent as HTMLElement) {
      x += el.offsetLeft;
      y += el.offsetTop;
    }
    return {
      x: x,
      y: y,
      width: element.offsetWidth,
      height: element.offsetHeight,
    };
  }

  private _prettify(value: string) {
    return value === "*" ? "·" : value;
  }
}

export class KmapTermTreeEdge extends LitElement {
  static styles = css`
    :host {
      display: block;
      stroke: var(--kmap-term-tree-edge-color, #fbc02d);
      position: relative;
    }
  `;

  @property({type: Number}) tension: number = .5;
  @property({type: Array}) edges: Edge[] = [];

  render() {
    const parent = this.offsetParent as HTMLElement;
    //language=SVG
    return this.edges === undefined ? '' : svg`
      <svg style="position:absolute;left:0px;top:0px" width="${parent.clientWidth}" height="${parent.clientHeight}">
      ${this.edges.map(edge => svg`
        <path d="${this._path(edge)}" fill="none" stroke-width="2" stroke-opacity=".9"/>
      `)}
      </svg>
    `;
  }

  _path(edge: Edge) {
    let fromx = edge.from.x + edge.from.width / 2;
    let fromy = edge.from.y + edge.from.height / 2;
    let tox = edge.to.x + edge.to.width / 2;
    let toy = edge.to.y + edge.to.height / 2;

    var delta = (toy-fromy) * this.tension;
    var hx1 = fromx;
    var hy1 = fromy + delta;
    var hx2 = tox;
    var hy2 = toy - delta;
    return "M "  + fromx + " " + fromy +
      " C " + hx1 + " " + hy1
      + " "  + hx2 + " " + hy2
      + " " + tox + " " + toy;
  }

}
window.customElements.define('kmap-term-tree-edges', KmapTermTreeEdge);
