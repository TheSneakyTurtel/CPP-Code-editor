export class TextMeasureCanvas {
    constructor(element) {
        this.element = element;
        this.ctx = document.createElement("canvas").getContext("2d");
        this.update();
    }
    update() {
        const computedStyle = getComputedStyle(this.element, null);
        const fontSize = computedStyle.getPropertyValue("font-size");
        const fontFamily = computedStyle.getPropertyValue("font-family");
        const fontWeight = computedStyle.getPropertyValue("font-weight");
        this.ctx.font = `${fontSize} ${fontFamily} ${fontWeight}`;
    }
    measureText(text) {
        return this.ctx.measureText(text);
    }
}
