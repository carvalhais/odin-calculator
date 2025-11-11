const lcdDisplay = {
    MAX_DIGITS: 10,
    _buffer: ["0",],    // show a solid 0 after loading
    _uiElement: document.querySelector(".lcd-active"),
    _updateDisplay: function() {
        // handle initial "0" display
        if(this._buffer[0] === "0" && this._buffer.length > 1) {
            if(this._buffer[1] !== ".") this._buffer.shift();
        }
        this._uiElement.textContent = this._buffer.join("");
    },
    addDigit: function(d) {
        const digits = "0123456789.";
        // dot has 0 width, so we only care about digits
        // https://www.keshikan.net/fonts-e.html
        const count = this._buffer.length + (
            this._buffer.includes(".") ? -1 : 0
        );
        if (count >= this.MAX_DIGITS) return;
        // allow for a single decimal separator
        if(d === "." && this._buffer.includes(d)) return;
        this._buffer.push(d);
        this._updateDisplay();
    },
    delDigit: function() {
        if(this._buffer.length > 1) this._buffer.pop()
        else this._buffer[0] = "0";
        this._updateDisplay();
    }
};

function buttonHandler(e) {
    const id = e.target.id;
    if(!id.startsWith("button-")) return;

    const button = id.split("-").at(-1);
    if(button === "0") lcdDisplay.addDigit("0")
    else if(button === "1") lcdDisplay.addDigit("1")
    else if(button === "2") lcdDisplay.addDigit("2")
    else if(button === "3") lcdDisplay.addDigit("3")
    else if(button === "4") lcdDisplay.addDigit("4")
    else if(button === "5") lcdDisplay.addDigit("5")
    else if(button === "6") lcdDisplay.addDigit("6")
    else if(button === "7") lcdDisplay.addDigit("7")
    else if(button === "8") lcdDisplay.addDigit("8")
    else if(button === "9") lcdDisplay.addDigit("9")
    else if(button === "dec") lcdDisplay.addDigit(".")
    else if(button === "bs") lcdDisplay.delDigit();
}

const keyboard = document.querySelector(".keyboard");
keyboard.addEventListener("click", buttonHandler);

window.onload = lcdDisplay._updateDisplay();