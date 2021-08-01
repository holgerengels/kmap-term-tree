import { Token } from "./tokenizer.js";

export class TermNode {
  readonly token: Token;
  readonly leftChildNode?: TermNode;
  readonly rightChildNode?: TermNode;

  constructor(token: Token, leftChildNode?: TermNode, rightChildNode?: TermNode) {
    this.token = token;
    this.leftChildNode = leftChildNode;
    this.rightChildNode = rightChildNode;
  }

  public breadthFirst(callback: (n: TermNode, d: number) => void): void {
    var queue: TermNode[] = [this];
    var depth = [0];
    var n: TermNode | undefined;
    var d: number | undefined;

    while(queue.length > 0) {
      n = queue.shift();
      d = depth.shift();
      if (n === undefined || d === undefined)
        throw new Error("nonsense");

      callback(n, d);

      if (n.rightChildNode) {
        queue.push(n.rightChildNode);
        depth.push(d + 1);
      }
      if (n.leftChildNode) {
        queue.push(n.leftChildNode);
        depth.push(d + 1);
      }
    }
  }

  public toString = () : string => { return this.token.value; }
}

class Stack<T> {
  private array: T[] = [];

  push(o: T) { this.array.push(o) };
  pop(): T { return this.array.pop() as T; };
  peek(): T { return this.array.slice(-1)[0]; };
  isEmpty(): boolean { return this.array.length === 0 };
  clear(): void { this.array = [] }
}
export class Parser {
  private opStack: Stack<Token> = new Stack<Token>();
  private outStack: Stack<TermNode> = new Stack<TermNode>();

  outOperator(operatorToken: Token) {
    const rightChildNode: TermNode | undefined = this.outStack.pop();
    const leftChildNode: TermNode | undefined = this.outStack.pop();
    this.outStack.push(new TermNode(operatorToken, leftChildNode, rightChildNode));
  }
  outFunction(operatorToken: Token) {
    const leftChildNode: TermNode | undefined = this.outStack.pop();
    this.outStack.push(new TermNode(operatorToken, leftChildNode));
  }
  // https://de.wikipedia.org/wiki/Shunting-yard-Algorithmus
  public parse(tokens: Token[]): TermNode {
    this.opStack.clear();
    this.outStack.clear();

    tokens.forEach((t) => {
      if (t.type === "Literal" || t.type === "Variable") {
        this.outStack.push(new TermNode(t));
      }
      else if (t.type === "Function") {
        this.opStack.push(t);
      }
      else if (t.type === "Comma") {
      }
      else if (t.type === "Operator") {
        while (!this.opStack.isEmpty()
        && this.opStack.peek().type === "Operator"
        && t.associativity() === "left"
        && t.precedence() <= this.opStack.peek().precedence()) {
          this.outOperator(this.opStack.pop());
        }
        this.opStack.push(t);
      }
      else if (t.type === "Left Parenthesis") {
        this.opStack.push(t);
      }
      else if (t.type === "Right Parenthesis") {
        while (!this.opStack.isEmpty() && this.opStack.peek().type !== "Left Parenthesis")
          this.outOperator(this.opStack.pop());
        this.opStack.pop();
        if (!this.opStack.isEmpty() && this.opStack.peek().type === "Function")
          this.outFunction(this.opStack.pop());
      }
    });
    while (!this.opStack.isEmpty())
      this.outOperator(this.opStack.pop());

    return this.outStack.pop();
  }
}
