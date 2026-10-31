import { Token } from "./tokenizer";
export class TermNode {
    constructor(token, leftChildNode, rightChildNode) {
        this.toString = () => { return this.token.value; };
        this.token = token;
        this.leftChildNode = leftChildNode;
        this.rightChildNode = rightChildNode;
    }
    breadthFirst(callback) {
        var queue = [this];
        var depth = [0];
        var n;
        var d;
        while (queue.length > 0) {
            n = queue.shift();
            d = depth.shift();
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
}
class Stack {
    constructor() {
        this.array = [];
    }
    push(o) { this.array.push(o); }
    ;
    pop() { return this.array.pop(); }
    ;
    peek() { return this.array.slice(-1)[0]; }
    ;
    isEmpty() { return this.array.length === 0; }
    ;
}
export class Parser {
    outOperator(operatorToken) {
        const rightChildNode = this.outStack.pop();
        const leftChildNode = this.outStack.pop();
        this.outStack.push(new TermNode(operatorToken, leftChildNode, rightChildNode));
    }
    parse(tokens) {
        this.opStack = new Stack();
        this.outStack = new Stack();
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
                    && ((this.opStack.peek().precedence() > t.precedence())
                        || (this.opStack.peek().precedence() == t.precedence() && t.associativity() === "left"))) {
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
                    this.outOperator(this.opStack.pop());
            }
        });
        while (!this.opStack.isEmpty())
            this.outOperator(this.opStack.pop());
        return this.outStack.pop();
    }
}
//console.log(new Parser().parse("89sin(sqrt(45))/3^4 + 2.2xy/7").toString(0))
const parser = new Parser();
//const node = parser.parse("(2a+7a)+3b^2")
const tokens = Token.tokenize("sin(7a+3b)^2");
const node = parser.parse(tokens);
let array = [];
let depths = [];
node.breadthFirst((n, d) => {
    if (n.token.type !== "Literal" && n.token.type !== "Variable") {
        array.push(n.token);
        depths.push(d);
    }
});
array = array.reverse();
depths = depths.reverse();
var ld = 0;
var s = "";
for (const t of tokens) {
    if (s !== "")
        s += " ";
    s += t.value;
}
for (let i = 0; i < array.length; i++) {
    s += depths[i] === ld ? " " : "\n";
    s += array[i].value;
    ld = depths[i];
}
console.log(s);
//# sourceMappingURL=parser.js.map