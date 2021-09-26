export type Type = "Literal" | "Variable" | "Operator" | "Function" | "Left Parenthesis" | "Right Parenthesis" | "Comma";
export type Associativity = "left" | "right";

export class Token {
  static __ID: number = 1;

  readonly id: number = Token.__ID++;

    readonly type: Type;
    readonly value: string;

    constructor(type: Type, value: string) {
        this.type = type;
        this.value = value;
    }

    // read 4 => numberBuffer read 5 => numberBuffer read 6 => numberBuffer read . => numberBuffer read 7 => numberBuffer
    // x is a letter, so put all the contents of numberbuffer together as a Literal 456.7 => result
    // read x => letterBuffer read y => letterBuffer
    // + is an Operator, so remove all the contents of letterbuffer separately as Variables x => result, y => result + => result
    // read 6 => numberBuffer
    // s is a letter, so put all the contents of numberbuffer together as a Literal 6 => result
    // read s => letterBuffer read i => letterBuffer read n => letterBuffer
    // ( is a Left Parenthesis, so put all the contents of letterbuffer together as a function sin => result
    // read 7 => numberBuffer read . => numberBuffer read 0 => numberBuffer read 4 => numberBuffer
    // x is a letter, so put all the contents of numberbuffer together as a Literal 7.04 => result
    // read x => letterBuffer
    // ) is a Right Parenthesis, so remove all the contents of letterbuffer separately as Variables x => result
    // - is an Operator, but both buffers are empty, so there's nothing to remove
    // read m => letterBuffer read i => letterBuffer read n => letterBuffer
    // ( is a Left Parenthesis, so put all the contents of letterbuffer together as a function min => result
    // read a => letterBuffer
    // , is a comma, so put all the contents of letterbuffer together as a Variable a => result
    // then push , as a Function Arg Separator => result
    // read 7=> numberBuffer
    // ) is a Right Parenthesis, so put all the contents of numberbuffer together as a Literal 7 => result

    // digit => push ch to NB
    // decimal point => push ch to NB
    // letter => join NB contents as one Literal and push to result, then push ch to LB
    // operator => join NB contents as one Literal and push to result OR push LB contents separately as Variables, then push ch to result
    // LP => join LB contents as one Function and push to result OR (join NB contents as one Literal and push to result, push Operator * to result), then push ch to result
    // RP => join NB contents as one Literal and push to result, push LB contents separately as Variables, then push ch to result
    // comma => join NB contents as one Literal and push to result, push LB contents separately as Variables, then push ch to result


    public static tokenize(string: string): Token[] {

        var result: Token[] = [];
        string = string.replace(/·/g, "*").replace(/:/g, "/");
        var array = string.replace(/\s+/g, "").split("");

        var lbuf = "";
        var nbuf = "";

      function flush(result: Token[]) {
        if (lbuf.length !== 0) {
          [...lbuf].forEach((l, i) => {
            result.push(new Token("Variable", l));
            if (i !== lbuf.length - 1)
              result.push(new Token("Operator", "*"));
          });
          lbuf = "";
        }
        else if (nbuf.length !== 0) {
          result.push(new Token("Literal", nbuf));
          nbuf = "";
        }
      }

      let lchar: string | undefined;
        array.forEach((char) => {
            if (Token.isDigit(char)) {
              nbuf += char;
              if (lbuf.length !== 0) {
                [...lbuf].forEach(l => {
                  result.push(new Token("Variable", l));
                  result.push(new Token("Operator", "*"));
                });
                lbuf = "";
              }
            }
            else if (Token.isLetter(char)) {
              lbuf += char;
              if (nbuf.length !== 0) {
                result.push(new Token("Literal", nbuf));
                result.push(new Token("Operator", "*"));
                nbuf = "";
              }
            }
            else if (Token.isOperator(char)) {
              flush(result);
              result.push(new Token("Operator", char));
            }
            else if (Token.isLeftParenthesis(char)) {
              if (lbuf.length !== 0) {
                result.push(new Token("Function", lbuf));
                lbuf = "";
              }
              else if (nbuf.length !== 0) {
                result.push(new Token("Literal", nbuf));
                result.push(new Token("Operator", "*"));
                nbuf = "";
              }
              else if (lchar === ")") {
                result.push(new Token("Operator", "*"));
              }
              result.push(new Token("Left Parenthesis", char));
            }
            else if (Token.isRightParenthesis(char)) {
              flush(result);
              result.push(new Token("Right Parenthesis", char));
            }
            else if (Token.isComma(char)) {
              flush(result);
              result.push(new Token("Comma", char));
            }
            lchar = char;
        });
      flush(result);

        return result;
    }


    static isComma(ch: string): boolean {
        return (ch === ",");
    }

    static isDigit(ch: string): boolean {
        return /\d|\./.test(ch);
    }

    static isLetter(ch: string): boolean {
        return /[a-z]/i.test(ch);
    }

    static isOperator(ch: string): boolean {
        return /\+|-|\*|\/|\^/.test(ch);
    }

    static isLeftParenthesis(ch: string): boolean {
        return (ch === "(");
    }

    static isRightParenthesis(ch: string): boolean {
        return (ch == ")");
    }

  public precedence(): number {
    return Token.prec[this.value];
  }

  public associativity(): Associativity {
    return Token.assoc[this.value];
  }

  static assoc: { [key: string]: Associativity } = {  "^" : "right",  "*" : "left",  "/" : "left",  "+" : "left",  "-" : "left" };
  static prec: { [key: string]: number } = {  "^" : 4,  "*" : 3,  "/" : 3,  "+" : 2,  "-" : 2 };
}
