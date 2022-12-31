import languages from "./languages/index.js";
import { tokenize } from "./tokenizer.js";
export class Editor {
    constructor(container, options) {
        this.options = options;
        this.elements = setupElements();
        this.updateUserInput(options.initialInput);
        this.addInputEventListeners();
        this.updateOutput("full-update", { afterUpdate: { selectionStart: 0 } });
        container.insertAdjacentElement("beforeend", this.elements.codeEditor);
    }
    addInputEventListeners() {
        let prevInputLineCount = this.elements.userInput.value.split("\n").length;
        this.elements.userInput.addEventListener("keydown", ev => {
            if (ev.key === "Tab") {
                ev.preventDefault();
                const input = this.elements.userInput.value;
                const inputLines = input.split("\n");
                const { start, end } = this.inputSelection;
                const linesBeforeStartCount = input.slice(0, start).split("\n").length - 1;
                if (start !== end) {
                    const selectionLineCount = input.slice(start, end).split("\n").length;
                    let endOffset = 0;
                    for (let i = linesBeforeStartCount; i < linesBeforeStartCount + selectionLineCount; i++) {
                        const canShiftTab = inputLines[i].startsWith(Editor.tab);
                        inputLines[i] = ev.shiftKey ? (canShiftTab ? inputLines[i].slice(2) : inputLines[i]) : Editor.tab + inputLines[i];
                        endOffset += ev.shiftKey ? (canShiftTab ? -1 : 0) : 1;
                    }
                    this.updateUserInput(inputLines.join("\n"));
                    this.updateOutput("line-update", {
                        start: linesBeforeStartCount - 1,
                        count: inputLines.length + Editor.tab.length,
                        afterUpdate: {
                            selectionStart: start,
                            selectionEnd: end + endOffset * Editor.tab.length,
                        },
                    });
                    return;
                }
                if (ev.shiftKey)
                    this.updateUserInput(input.slice(0, start - (input.slice(0, start).endsWith(Editor.tab) ? Editor.tab.length : 0)) + input.slice(start));
                else
                    this.updateUserInput(input.slice(0, start) + Editor.tab + input.slice(start));
                this.updateOutput("line-update", { start: linesBeforeStartCount - 1, count: inputLines.length + 2, afterUpdate: { selectionStart: start + 2 } });
            }
        });
        this.elements.userInput.addEventListener("input", ev => {
            const input = this.elements.userInput.value;
            const { start } = this.inputSelection;
            const currentInputLineCount = input.split("\n").length;
            const deltaInputLineCount = currentInputLineCount - prevInputLineCount;
            const startLineIndex = input.slice(0, start).split("\n").length - 1;
            this.updateUserInput(); // updating the row count if necessary
            if (deltaInputLineCount > 0) {
                this.updateOutput("create-line", { start: startLineIndex - deltaInputLineCount, count: deltaInputLineCount });
                this.updateOutput("line-update", { start: startLineIndex - deltaInputLineCount - 1, count: deltaInputLineCount + 2 });
            }
            else if (deltaInputLineCount < 0) {
                this.updateOutput("full-update", {});
            }
            else
                this.updateOutput("line-update", { start: startLineIndex });
            prevInputLineCount = currentInputLineCount;
        });
    }
    updateUserInput(newInput) {
        newInput != null && (this.elements.userInput.value = newInput.replace(/\t/g, Editor.tab));
        this.elements.userInput.rows = this.elements.userInput.value.split("\n").length;
    }
    updateOutput(type, options) {
        const lineList = this.elements.outputLineList;
        if (type === "full-update")
            lineList.innerHTML = this.outputHTML;
        else if (type === "line-update") {
            const { start, count } = options;
            const update = (index) => index >= 0 && index < lineList.children.length && (lineList.children[index].innerHTML = this.getOutputLineHTML(index, false));
            for (let i = start; i < start + (count || 1); i++)
                update(i);
        }
        else if (type === "create-line") {
            const { start, count } = options;
            for (let i = start; i < start + (count || 1); i++)
                i >= 1 ? lineList.children[i - 1].insertAdjacentHTML("afterend", Editor.emptyLineHTML) : lineList.insertAdjacentHTML("afterbegin", Editor.emptyLineHTML);
        }
        else {
            const { start, count } = options;
            for (let i = start; i < start + (count || 1); i++)
                lineList.children[i].remove();
        }
        if (options.afterUpdate) {
            const { selectionStart, selectionEnd } = options.afterUpdate;
            this.elements.userInput.focus();
            this.elements.userInput.setSelectionRange(selectionStart, selectionEnd || selectionStart, !selectionEnd || selectionStart === selectionEnd ? "none" : selectionStart < selectionEnd ? "forward" : "backward");
        }
    }
    get outputHTML() {
        const inputLines = this.elements.userInput.value.split("\n");
        return inputLines.map(line => this.getOutputLineHTML(line)).join("");
    }
    getOutputLineHTML(lineOrLineIndex, wrap = true) {
        const line = typeof lineOrLineIndex === "string" ? lineOrLineIndex : this.elements.userInput.value.split("\n")[lineOrLineIndex];
        const outputLineHTML = languages[this.options.language].language.highlightSyntax(line, tokenize(line, languages[this.options.language].tokenizerOptions));
        return wrap ? `<${Editor.lineElementName}>${outputLineHTML}</${Editor.lineElementName}>` : outputLineHTML;
    }
    get inputSelection() {
        return { start: this.elements.userInput.selectionStart, end: this.elements.userInput.selectionEnd, direction: this.elements.userInput.selectionDirection };
    }
}
Editor.lineElementName = "li";
Editor.emptyLineHTML = `<${Editor.lineElementName}></${Editor.lineElementName}>`;
Editor.tab = "  ";
function setupElements() {
    const userInput = document.createElement("textarea");
    userInput.classList.add("user-input");
    userInput.spellcheck = false;
    const outputLineList = document.createElement("ol");
    outputLineList.classList.add("output-lines");
    const outputContainer = document.createElement("section");
    outputContainer.classList.add("output-container");
    outputContainer.append(outputLineList);
    const codeEditor = document.createElement("code");
    codeEditor.classList.add("code-editor");
    codeEditor.append(outputContainer, userInput);
    return { codeEditor, userInput, outputContainer, outputLineList };
}
