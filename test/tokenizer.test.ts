import '../src/tokenizer.js';
import {expect, fixture, html} from "@open-wc/testing";
import {Token} from "../src/tokenizer";

describe('tokenizer', () => {
  it('implicit multiplication between parentheses', async () => {
    const tokens = Token.tokenize("(2+a)(3-b)");
    console.log(tokens)
    expect(tokens[5].type).to.equal('Operator');
    expect(tokens[5].value).to.equal('*');
  });
});
