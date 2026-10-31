import { html, fixture, expect } from '@open-wc/testing';

import { KmapTermTree } from '../src/KmapTermTree.js';
import '../src/kmap-term-tree.js';

describe('KmapTermTree', () => {
  it('renders a term with KaTeX and tree nodes', async () => {
    const el = await fixture<KmapTermTree>(
      html`<kmap-term-tree term="2a+3b"></kmap-term-tree>`
    );
    await el.updateComplete;

    const formula = el.shadowRoot!.querySelector('#formula');
    expect(formula).to.exist;
    expect(formula!.innerHTML).to.contain('katex');

    const nodes = el.shadowRoot!.querySelectorAll('.tree-node');
    // For 2a + 3b: nodes are +, and two implicit multiplications (3 operations)
    expect(nodes.length).to.be.greaterThan(0);
  });

  it('supports slot content', async () => {
    const el = await fixture<KmapTermTree>(
      html`<kmap-term-tree>(2+a)(3-b)</kmap-term-tree>`
    );
    await el.updateComplete;

    expect(el.term).to.equal('(2+a)(3-b)');
    const formula = el.shadowRoot!.querySelector('#formula');
    expect(formula!.innerHTML).to.contain('katex');
  });

  it('highlights full height for fractions and roots', async () => {
    const el = await fixture<KmapTermTree>(
      html`<kmap-term-tree term="sqrt(2/3)"></kmap-term-tree>`
    );
    await el.updateComplete;

    const overlay = el.shadowRoot!.querySelector(
      '.highlight-overlay'
    ) as HTMLElement;
    expect(overlay).to.exist;

    const overlayRect = overlay.getBoundingClientRect();
    const n1 = el.shadowRoot!.getElementById('n1')!; // numerator 2
    const n2 = el.shadowRoot!.getElementById('n2')!; // denominator 3

    const r1 = n1.getBoundingClientRect();
    const r2 = n2.getBoundingClientRect();

    // The overlay top must be at or above the numerator top
    expect(overlayRect.top).to.be.at.most(r1.top);
    // The overlay bottom must be at or below the denominator bottom
    expect(overlayRect.bottom).to.be.at.least(r2.bottom);
  });
});
