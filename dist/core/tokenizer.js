const operators = "=+-*/%<>!&|^~";
const enclosureStarts = "({[";
const enclosureEnds = ")}]";
export function tokenize(input, options) {
    let current = 0;
    const tokens = [];
    function finishToken(tokenType, isValidChar, ignoreFirst) {
        const at = current;
        if (ignoreFirst)
            do {
                current++;
            } while (current < input.length && isValidChar());
        else
            while (current < input.length && isValidChar())
                current++;
        return at + 1 < current ? { at, length: current - at, type: tokenType } : { at, type: tokenType };
    }
    function finishLiteral(tick) {
        const { at, type } = finishToken((tick === "'" ? TokenType.Char : TokenType.String), () => input[current] !== tick, true);
        input[current] === tick && current++; // consume the closing tick
        return { at, length: current - at, type };
    }
    function handleUnknownChar() {
        if (options.unknownCharacterBehaviour !== "throw-error")
            tokens.push({ at: current++, type: TokenType.Ignored });
        else
            throw new Error(`Unknown character: ${input[current]}`);
    }
    while (current < input.length) {
        if (input.slice(current, current + options.commentPrefix.length) === options.commentPrefix) {
            const at = current;
            current += options.commentPrefix.length;
            while (current < input.length && input[current] !== "\n")
                current++;
            tokens.push({ at, length: current - at, type: TokenType.Comment });
            current++;
            continue;
        }
        if (isNumber(input[current]))
            tokens.push(finishToken(TokenType.Number, () => isNumber(input[current])));
        else if (isAlpha(input[current]))
            tokens.push(finishToken(TokenType.Identifier, () => !getCharacterType(input[current], options) && isAlpha(input[current])));
        else if (input[current] === "'" || input[current] === '"')
            tokens.push(finishLiteral(input[current]));
        else {
            const charType = getCharacterType(input[current], options);
            if (charType) {
                tokens.push({ at: current, type: charType });
                current++;
            }
            else
                handleUnknownChar();
        }
    }
    return tokens;
}
const isAlpha = (char) => /[a-zA-Z_]/.test(char);
const isWhitespace = (char) => /\s/.test(char);
const isNumber = (char) => /[0-9]/.test(char);
function getCharacterType(char, options) {
    return enclosureStarts.includes(char)
        ? TokenType.EnclosureStart
        : enclosureEnds.includes(char)
            ? TokenType.EnclosureEnd
            : operators.includes(char)
                ? TokenType.Operator
                : char === "\t"
                    ? options.includeIndentation === false
                        ? undefined
                        : TokenType.Indentation
                    : char === "\n"
                        ? options.includeNewlines === false
                            ? undefined
                            : TokenType.Newline
                        : isWhitespace(char)
                            ? options.includeWhitespace === false
                                ? undefined
                                : TokenType.Whitespace
                            : char === "."
                                ? TokenType.Dot
                                : char === ","
                                    ? TokenType.Comma
                                    : char === ":"
                                        ? TokenType.Colon
                                        : char === ";"
                                            ? TokenType.Semicolon
                                            : char === "#"
                                                ? TokenType.Hash
                                                : undefined;
}
export var TokenType;
(function (TokenType) {
    TokenType["Function"] = "function";
    TokenType["Identifier"] = "identifier";
    TokenType["Number"] = "number";
    TokenType["Operator"] = "operator";
    TokenType["String"] = "string";
    TokenType["Char"] = "char";
    TokenType["EnclosureStart"] = "enclosure-start";
    TokenType["EnclosureEnd"] = "enclosure-end";
    TokenType["Comment"] = "comment";
    TokenType["Ignored"] = "ignored";
    TokenType["Hash"] = "hash";
    TokenType["Dot"] = "dot";
    TokenType["Comma"] = "comma";
    TokenType["Colon"] = "colon";
    TokenType["Semicolon"] = "semicolon";
    TokenType["Whitespace"] = "whitespace";
    TokenType["Indentation"] = "indentation";
    TokenType["Newline"] = "newline";
})(TokenType || (TokenType = {}));
