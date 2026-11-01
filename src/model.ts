export type NodeType = 'literal' | 'variable' | 'operator' | 'function';

export interface TermNode {
  id: string;
  type: NodeType;
  op?: string;
  symbol: string;
  label: string;
  raw?: string;
  value?: number;
  isUnary?: boolean;
  isParenthesized?: boolean;
  implicit?: boolean;
  mathJson: any;
  children: TermNode[];
  depth: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface TreeEdge {
  fromNodeId: string;
  toNodeId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export const GERMAN_LABELS: Record<string, string> = {
  Add: 'Summe',
  Subtract: 'Differenz',
  Multiply: 'Produkt',
  Divide: 'Quotient',
  Power: 'Potenz',
  Negate: 'Negation',
  Sqrt: 'Quadratwurzel',
  Sin: 'Sinus',
  Cos: 'Kosinus',
  Tan: 'Tangens',
  Cot: 'Kotangens',
  Ln: 'Natürlicher Logarithmus',
  Log: 'Logarithmus',
  Abs: 'Betrag',
  Exp: 'Exponentialfunktion',
};

export const OPERATOR_SYMBOLS: Record<string, string> = {
  Add: '+',
  Subtract: '−',
  Multiply: '·',
  Divide: ':',
  Power: '^',
  Negate: '−',
};
