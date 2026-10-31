export class Token {
    constructor(type, value) {
        this.id = Token.__ID++;
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
    static tokenize(string) {
        var result = [];
        var array = string.replace(/\s+/g, "").split("");
        var lbuf = "";
        var nbuf = "";
        function flush(result) {
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
        });
        flush(result);
        return result;
    }
    static isComma(ch) {
        return (ch === ",");
    }
    static isDigit(ch) {
        return /\d|\./.test(ch);
    }
    static isLetter(ch) {
        return /[a-z]/i.test(ch);
    }
    static isOperator(ch) {
        return /\+|-|\*|\/|\^/.test(ch);
    }
    static isLeftParenthesis(ch) {
        return (ch === "(");
    }
    static isRightParenthesis(ch) {
        return (ch == ")");
    }
    precedence() {
        return Token.prec[this.value];
    }
    associativity() {
        return Token.assoc[this.value];
    }
}
Token.__ID = 1;
Token.assoc = { "^": "right", "*": "left", "/": "left", "+": "left", "-": "left" };
Token.prec = { "^": 4, "*": 3, "/": 3, "+": 2, "-": 2 };
console.log(Token.tokenize("89sin(sqrt(45))/3^4 + 2.2xy/7"));
//# sourceMappingURL=tokenizer.js.map