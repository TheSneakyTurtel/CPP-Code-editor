import { TokenType } from "../../tokenizer.js";
import keywords from "./keywords.js";
import types from "./types.js";
const getTokenCode = (code, token) => (token.length ? code.slice(token.at, token.at + token.length) : code[token.at]);
const getTokenLineIndex = (code, token) => code.slice(0, token.at).split("\n").length - 1;
function isKeyword(state) {
    var _a, _b;
    if ((state.value.code === "include" || state.value.code === "define") && ((_a = state.prev) === null || _a === void 0 ? void 0 : _a.value.type) === TokenType.Hash && ((_b = state.prev) === null || _b === void 0 ? void 0 : _b.value.at) + 1 === state.value.at)
        return true;
    return !!keywords[state.value.code];
}
function isLibrary(state) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    return ((((_a = state.nextToken) === null || _a === void 0 ? void 0 : _a.code) === ">" &&
        ((_b = state.prev) === null || _b === void 0 ? void 0 : _b.value.code) === "<" &&
        ((_d = (_c = state.prev) === null || _c === void 0 ? void 0 : _c.prev) === null || _d === void 0 ? void 0 : _d.value.type) === TokenType.Whitespace &&
        ((_g = (_f = (_e = state.prev) === null || _e === void 0 ? void 0 : _e.prev) === null || _f === void 0 ? void 0 : _f.prev) === null || _g === void 0 ? void 0 : _g.value.code) === "include" &&
        ((_l = (_k = (_j = (_h = state.prev) === null || _h === void 0 ? void 0 : _h.prev) === null || _j === void 0 ? void 0 : _j.prev) === null || _k === void 0 ? void 0 : _k.prev) === null || _l === void 0 ? void 0 : _l.value.code) === "#") ||
        (((_m = state.prev) === null || _m === void 0 ? void 0 : _m.value.type) === TokenType.Whitespace && ((_p = (_o = state.prev) === null || _o === void 0 ? void 0 : _o.prev) === null || _p === void 0 ? void 0 : _p.value.code) === "namespace"));
}
function toHTMLEntityIfNeeded(char) {
    return char === "\t" ? "&nbsp; &nbsp;" : char === "\n" ? "<br />" : char === " " ? "&nbsp;" : char === "<" ? "&lt;" : char === ">" ? "&gt;" : char;
}
const cpp = {
    highlightSyntax(code, tokens) {
        var _a, _b, _c, _d;
        let output = "";
        let state;
        const highlightSyntax = (codePiece, className) => `<span class="${className}">${codePiece}</span>`;
        for (let i = 0; i < tokens.length; i++) {
            state = {
                prev: state,
                value: { type: tokens[i].type, code: getTokenCode(code, tokens[i]), at: tokens[i].at, lineIndex: getTokenLineIndex(code, tokens[i]) },
                nextToken: i + 1 < tokens.length
                    ? { type: tokens[i + 1].type, code: getTokenCode(code, tokens[i + 1]), at: tokens[i + 1].at, lineIndex: getTokenLineIndex(code, tokens[i + 1]) }
                    : undefined,
            };
            switch (state.value.type) {
                case TokenType.Dot:
                case TokenType.Comma:
                case TokenType.Semicolon:
                case TokenType.Operator:
                    output +=
                        (state.value.code === "*" && (((_a = state.prev) === null || _a === void 0 ? void 0 : _a.value.type) === TokenType.Identifier || ((_b = state.nextToken) === null || _b === void 0 ? void 0 : _b.type) === TokenType.Identifier)) ||
                            (state.value.code === "&" && ((_c = state.nextToken) === null || _c === void 0 ? void 0 : _c.type) === TokenType.Identifier)
                            ? highlightSyntax(toHTMLEntityIfNeeded(state.value.code), "pointer-indicator")
                            : toHTMLEntityIfNeeded(state.value.code);
                    break;
                case TokenType.Char:
                case TokenType.String:
                    output += highlightSyntax(state.value.code, "string");
                    break;
                case TokenType.Identifier:
                    if (((_d = state.nextToken) === null || _d === void 0 ? void 0 : _d.code) === "(")
                        output += highlightSyntax(state.value.code, "function");
                    else if (isLibrary(state))
                        output += highlightSyntax(state.value.code, "library");
                    else if (isKeyword(state))
                        output += highlightSyntax(state.value.code, "keyword");
                    else if (types[state.value.code])
                        output += highlightSyntax(state.value.code, "type");
                    else
                        output += highlightSyntax(state.value.code, "variable");
                    break;
                case TokenType.Number:
                    output += highlightSyntax(state.value.code, "number");
                    break;
                case TokenType.Comment:
                    output += highlightSyntax(state.value.code, "comment");
                    break;
                case TokenType.Ignored:
                    output += highlightSyntax(toHTMLEntityIfNeeded(state.value.code), "unexpected");
                    break;
                default:
                    output += toHTMLEntityIfNeeded(state.value.code);
                    break;
            }
        }
        return output;
    },
};
export const tokenizerOptions = {
    unknownCharacterBehaviour: "ignore",
    commentPrefix: "//",
};
export default cpp;
