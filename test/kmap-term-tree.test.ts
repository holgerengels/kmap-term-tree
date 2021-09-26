import { html, fixture, expect } from '@open-wc/testing';

import { KmapTermTree } from '../src/KmapTermTree.js';
import '../src/kmap-term-tree.js';

describe('KmapTermTree', () => {
  it('has a default title "Hey there" and counter 5', async () => {
    const el = await fixture<KmapTermTree>(html`<kmap-term-tree></kmap-term-tree>`);

    expect(el.title).to.equal('Hey there');
    //expect(el.counter).to.equal(5);
  });

  it('passes the a11y audit', async () => {
    const el = await fixture<KmapTermTree>(html`<kmap-term-tree></kmap-term-tree>`);

    await expect(el).shadowDom.to.be.accessible();
  });
});
