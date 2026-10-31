import { expect } from '@open-wc/testing';
import { parseAsciiMath } from '../src/asciimath-parser.js';

describe('asciimath-parser', () => {
  it('parses addition and variables', () => {
    const ast = parseAsciiMath('2a + 3b');
    expect(ast.op).to.equal('Add');
    expect(ast.mathJson).to.deep.equal([
      'Add',
      ['Multiply', 2, 'a'],
      ['Multiply', 3, 'b'],
    ]);
    expect(ast.depth).to.equal(2);
  });

  it('handles implicit multiplication with parentheses', () => {
    const ast = parseAsciiMath('(2+a)(3-b)');
    expect(ast.op).to.equal('Multiply');
    expect(ast.mathJson).to.deep.equal([
      'Multiply',
      ['Add', 2, 'a'],
      ['Subtract', 3, 'b'],
    ]);
    expect(ast.depth).to.equal(2);
  });

  it('handles unary minus and double minus', () => {
    const ast1 = parseAsciiMath('-3 * x');
    expect(ast1.op).to.equal('Multiply');
    expect(ast1.mathJson).to.deep.equal(['Multiply', ['Negate', 3], 'x']);

    const ast2 = parseAsciiMath('5 - -2');
    expect(ast2.op).to.equal('Subtract');
    expect(ast2.mathJson).to.deep.equal(['Subtract', 5, ['Negate', 2]]);
  });

  it('handles powers and functions', () => {
    const ast = parseAsciiMath('x^2 + sin(3x)');
    expect(ast.op).to.equal('Add');
    expect(ast.children[0].op).to.equal('Power');
    expect(ast.children[1].op).to.equal('Sin');
  });

  it('handles division / fraction', () => {
    const ast = parseAsciiMath('(a + b) / (c + d)');
    expect(ast.op).to.equal('Divide');
    expect(ast.children[0].op).to.equal('Add');
    expect(ast.children[1].op).to.equal('Add');
  });
});
