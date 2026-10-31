import { TermNode, GERMAN_LABELS, OPERATOR_SYMBOLS } from './model.js';

const KNOWN_FUNCTIONS = new Set([
  'sin',
  'cos',
  'tan',
  'cot',
  'sec',
  'csc',
  'arcsin',
  'arccos',
  'arctan',
  'sinh',
  'cosh',
  'tanh',
  'exp',
  'ln',
  'log',
  'sqrt',
  'abs',
]);

const FUNCTION_MAP: Record<string, string> = {
  sin: 'Sin',
  cos: 'Cos',
  tan: 'Tan',
  cot: 'Cot',
  arcsin: 'Arcsin',
  arccos: 'Arccos',
  arctan: 'Arctan',
  sinh: 'Sinh',
  cosh: 'Cosh',
  tanh: 'Tanh',
  ln: 'Ln',
  log: 'Log',
  sqrt: 'Sqrt',
  abs: 'Abs',
  exp: 'Exp',
};

const GREEK_LETTERS = new Set([
  'alpha',
  'beta',
  'gamma',
  'delta',
  'epsilon',
  'zeta',
  'eta',
  'theta',
  'iota',
  'kappa',
  'lambda',
  'mu',
  'nu',
  'xi',
  'pi',
  'rho',
  'sigma',
  'tau',
  'upsilon',
  'phi',
  'chi',
  'psi',
  'omega',
]);

type TokenType =
  | 'NUMBER'
  | 'VARIABLE'
  | 'FUNCTION'
  | 'OPERATOR'
  | 'LPAREN'
  | 'RPAREN'
  | 'COMMA'
  | 'EOF';

interface Token {
  type: TokenType;
  value: string;
  implicit?: boolean;
}

class Tokenizer {
  private input: string;
  private pos = 0;

  constructor(input: string) {
    this.input = input.trim();
  }

  tokenize(): Token[] {
    const rawTokens: Token[] = [];

    while (this.pos < this.input.length) {
      const ch = this.input[this.pos];

      if (/\s/.test(ch)) {
        this.pos++;
        continue;
      }

      // Numbers: integer or floating point
      if (/\d/.test(ch)) {
        let num = '';
        while (
          this.pos < this.input.length &&
          /[\d.]/.test(this.input[this.pos])
        ) {
          num += this.input[this.pos++];
        }
        rawTokens.push({ type: 'NUMBER', value: num });
        continue;
      }

      // Words: functions, greek letters, or sequences of variable characters
      if (/[a-zA-Z]/.test(ch)) {
        let word = '';
        while (
          this.pos < this.input.length &&
          /[a-zA-Z]/.test(this.input[this.pos])
        ) {
          word += this.input[this.pos++];
        }
        const lower = word.toLowerCase();

        if (KNOWN_FUNCTIONS.has(lower)) {
          rawTokens.push({ type: 'FUNCTION', value: lower });
        } else if (GREEK_LETTERS.has(lower)) {
          rawTokens.push({ type: 'VARIABLE', value: lower });
        } else {
          // In school mathematics, "2ab" or "xy" means 2 * a * b or x * y
          for (const char of word) {
            rawTokens.push({ type: 'VARIABLE', value: char });
          }
        }
        continue;
      }

      // 'xx' or '·' or '*' as multiplication
      if (ch === 'x' && this.input[this.pos + 1] === 'x') {
        rawTokens.push({ type: 'OPERATOR', value: '*' });
        this.pos += 2;
        continue;
      }
      if (ch === '·' || ch === '*') {
        rawTokens.push({ type: 'OPERATOR', value: '*' });
        this.pos++;
        continue;
      }

      // Division: '/' or ':'
      if (ch === '/' || ch === ':') {
        rawTokens.push({ type: 'OPERATOR', value: ch });
        this.pos++;
        continue;
      }

      // Other operators
      if (ch === '+' || ch === '-' || ch === '^') {
        rawTokens.push({ type: 'OPERATOR', value: ch });
        this.pos++;
        continue;
      }

      // Parentheses & brackets
      if (ch === '(' || ch === '[') {
        rawTokens.push({ type: 'LPAREN', value: ch });
        this.pos++;
        continue;
      }
      if (ch === ')' || ch === ']') {
        rawTokens.push({ type: 'RPAREN', value: ch });
        this.pos++;
        continue;
      }

      if (ch === ',') {
        rawTokens.push({ type: 'COMMA', value: ch });
        this.pos++;
        continue;
      }

      // Fallback: skip unrecognized characters
      this.pos++;
    }

    // Insert implicit multiplication between operands where appropriate
    const tokens: Token[] = [];
    for (let i = 0; i < rawTokens.length; i++) {
      const cur = rawTokens[i];
      tokens.push(cur);

      if (i < rawTokens.length - 1) {
        const next = rawTokens[i + 1];
        const curEndsOperand =
          cur.type === 'NUMBER' ||
          cur.type === 'VARIABLE' ||
          cur.type === 'RPAREN';
        const nextStartsOperand =
          next.type === 'NUMBER' ||
          next.type === 'VARIABLE' ||
          next.type === 'FUNCTION' ||
          next.type === 'LPAREN';

        if (curEndsOperand && nextStartsOperand) {
          tokens.push({ type: 'OPERATOR', value: '*', implicit: true });
        }
      }
    }

    tokens.push({ type: 'EOF', value: '' });
    return tokens;
  }
}

let nodeIdCounter = 1;

export function resetNodeIdCounter() {
  nodeIdCounter = 1;
}

class PrattParser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private current(): Token {
    return this.tokens[this.pos];
  }

  private consume(expectedType?: TokenType): Token {
    const token = this.current();
    if (expectedType && token.type !== expectedType) {
      throw new Error(
        `Erwartet ${expectedType}, aber erhalten: ${token.type} (${token.value})`
      );
    }
    this.pos++;
    return token;
  }

  parse(precedence = 0): TermNode {
    let left = this.parsePrefix();

    while (true) {
      const token = this.current();
      if (token.type !== 'OPERATOR') break;

      const opPrec = this.getInfixPrecedence(token.value);
      if (opPrec <= precedence) break;

      this.pos++;
      left = this.parseInfix(left, token, opPrec);
    }

    return left;
  }

  private parsePrefix(): TermNode {
    const token = this.current();

    if (token.type === 'NUMBER') {
      this.pos++;
      const val = parseFloat(token.value);
      return {
        id: `n${nodeIdCounter++}`,
        type: 'literal',
        value: val,
        raw: token.value,
        symbol: token.value,
        label: `Zahl ${token.value}`,
        mathJson: val,
        children: [],
        depth: 0,
      };
    }

    if (token.type === 'VARIABLE') {
      this.pos++;
      return {
        id: `n${nodeIdCounter++}`,
        type: 'variable',
        raw: token.value,
        symbol: token.value,
        label: `Variable ${token.value}`,
        mathJson: token.value,
        children: [],
        depth: 0,
      };
    }

    if (token.type === 'FUNCTION') {
      this.pos++;
      const fnName = FUNCTION_MAP[token.value] || token.value;
      let arg: TermNode;

      if (this.current().type === 'LPAREN') {
        this.consume('LPAREN');
        arg = this.parse(0);
        this.consume('RPAREN');
      } else {
        arg = this.parse(35); // higher than *, /, ^
      }

      const symbol = token.value === 'sqrt' ? '√' : token.value;

      return {
        id: `n${nodeIdCounter++}`,
        type: 'function',
        op: fnName,
        symbol,
        label: GERMAN_LABELS[fnName] || fnName,
        mathJson: [fnName, arg.mathJson],
        children: [arg],
        depth: 0,
      };
    }

    // Unary plus or minus
    if (
      token.type === 'OPERATOR' &&
      (token.value === '-' || token.value === '+')
    ) {
      this.pos++;
      const op = token.value;
      const operand = this.parse(30); // Prefix unary precedence

      if (op === '-') {
        return {
          id: `n${nodeIdCounter++}`,
          type: 'operator',
          isUnary: true,
          op: 'Negate',
          symbol: '−',
          label: GERMAN_LABELS['Negate'],
          mathJson: ['Negate', operand.mathJson],
          children: [operand],
          depth: 0,
        };
      } else {
        return operand;
      }
    }

    // Parentheses
    if (token.type === 'LPAREN') {
      this.pos++;
      const expr = this.parse(0);
      this.consume('RPAREN');
      expr.isParenthesized = true;
      return expr;
    }

    throw new Error(`Unerwartetes Zeichen: ${token.value || token.type}`);
  }

  private getInfixPrecedence(op: string): number {
    switch (op) {
      case '+':
      case '-':
        return 10;
      case '*':
      case '/':
      case ':':
        return 20;
      case '^':
        return 40;
      default:
        return 0;
    }
  }

  private parseInfix(
    left: TermNode,
    token: Token,
    precedence: number
  ): TermNode {
    const op = token.value;
    const isRightAssoc = op === '^';
    const nextPrec = isRightAssoc ? precedence - 1 : precedence;
    const right = this.parse(nextPrec);

    let opName = 'Add';
    if (op === '-') opName = 'Subtract';
    else if (op === '*') opName = 'Multiply';
    else if (op === '/' || op === ':') opName = 'Divide';
    else if (op === '^') opName = 'Power';

    const symbol = OPERATOR_SYMBOLS[opName] || op;
    const label = GERMAN_LABELS[opName] || opName;

    return {
      id: `n${nodeIdCounter++}`,
      type: 'operator',
      op: opName,
      symbol,
      label,
      implicit: token.implicit,
      mathJson: [opName, left.mathJson, right.mathJson],
      children: [left, right],
      depth: 0,
    };
  }
}

/**
 * Calculates depths bottom-up:
 * Leaves have depth 0.
 * A parent node has depth = max(children.depth) + 1.
 * Returns the maximum depth of the tree.
 */
export function calculateDepths(node: TermNode): number {
  if (node.children.length === 0) {
    node.depth = 0;
    return 0;
  }
  let maxChild = 0;
  for (const child of node.children) {
    maxChild = Math.max(maxChild, calculateDepths(child));
  }
  node.depth = maxChild + 1;
  return node.depth;
}

/**
 * Parses an AsciiMath string into a TermNode AST with Math-JSON support.
 */
export function parseAsciiMath(input: string): TermNode {
  resetNodeIdCounter();
  const tokenizer = new Tokenizer(input);
  const tokens = tokenizer.tokenize();
  const parser = new PrattParser(tokens);
  const root = parser.parse(0);
  calculateDepths(root);
  return root;
}

function getOperatorPrecedence(node: TermNode): number {
  if (node.type !== 'operator') return 999;
  if (node.isUnary) return 30;
  switch (node.op) {
    case 'Add':
    case 'Subtract':
      return 10;
    case 'Multiply':
    case 'Divide':
      return 20;
    case 'Power':
      return 40;
    default:
      return 0;
  }
}

function needsParens(
  parent: TermNode,
  child: TermNode,
  isLeft: boolean
): boolean {
  if (child.isParenthesized) return true;
  if (child.type !== 'operator') return false;

  const pPrec = getOperatorPrecedence(parent);
  const cPrec = getOperatorPrecedence(child);

  if (cPrec < pPrec) return true;
  if (cPrec === pPrec) {
    // Subtraction and division are left-associative, right operand needs parentheses
    if (!isLeft && (parent.op === 'Subtract' || parent.op === 'Divide'))
      return true;
  }
  return false;
}

/**
 * Generates LaTeX from the AST with embedded `\htmlId{...}` for KaTeX.
 */
export function astToAnnotatedLatex(node: TermNode): string {
  if (node.type === 'literal') {
    return `\\htmlId{${node.id}}{${node.raw}}`;
  }

  if (node.type === 'variable') {
    // Greek letters support (e.g. \pi, \alpha)
    const varName = GREEK_LETTERS.has(node.symbol)
      ? `\\${node.symbol}`
      : node.symbol;
    return `\\htmlId{${node.id}}{${varName}}`;
  }

  if (node.type === 'function') {
    const childLatex = astToAnnotatedLatex(node.children[0]);
    let fnSymbol: string;
    if (node.op === 'Sqrt' || node.symbol === '√' || node.symbol === 'sqrt') {
      fnSymbol = `\\sqrt{${childLatex}}`;
    } else if (node.symbol === 'abs') {
      fnSymbol = `\\left|${childLatex}\\right|`;
    } else {
      fnSymbol = `\\operatorname{${node.symbol}}\\left(${childLatex}\\right)`;
    }
    return `\\htmlId{${node.id}}{${fnSymbol}}`;
  }

  if (node.type === 'operator') {
    if (node.isUnary) {
      const childLatex = astToAnnotatedLatex(node.children[0]);
      return `\\htmlId{${node.id}}{-${childLatex}}`;
    }

    const left = node.children[0];
    const right = node.children[1];

    let leftLatex = astToAnnotatedLatex(left);
    let rightLatex = astToAnnotatedLatex(right);

    if (needsParens(node, left, true)) {
      leftLatex = `\\left(${leftLatex}\\right)`;
    }
    if (needsParens(node, right, false)) {
      rightLatex = `\\left(${rightLatex}\\right)`;
    }

    if (node.op === 'Add') {
      return `\\htmlId{${node.id}}{${leftLatex} \\htmlId{op_${node.id}}{+} ${rightLatex}}`;
    }
    if (node.op === 'Subtract') {
      return `\\htmlId{${node.id}}{${leftLatex} \\htmlId{op_${node.id}}{-} ${rightLatex}}`;
    }
    if (node.op === 'Multiply') {
      // Implicit multiplication styling (e.g. 2a, 4ac, (2+a)(3-b))
      const isImplicit =
        node.implicit ||
        (left.type === 'literal' &&
          (right.type === 'variable' || right.type === 'function')) ||
        (left.type === 'variable' && right.type === 'variable') ||
        right.isParenthesized;
      const opSymbol = isImplicit
        ? ''
        : ' \\htmlId{op_' + node.id + '}{\\cdot} ';
      return `\\htmlId{${node.id}}{${leftLatex}${opSymbol}${rightLatex}}`;
    }
    if (node.op === 'Divide') {
      return `\\htmlId{${node.id}}{\\frac{${leftLatex}}{${rightLatex}}}`;
    }
    if (node.op === 'Power') {
      return `\\htmlId{${node.id}}{${leftLatex}^{${rightLatex}}}`;
    }
  }

  return '';
}
