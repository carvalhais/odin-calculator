const numSymbols = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "dec"];
const opSymbols = ["div", "mul", "sub", "add"];
const specialFn = ["ac", "bs"];

let iota = 0;
const STATE_BEGIN = iota++;
const STATE_WAIT1 = iota++
const STATE_OPERAND1 = iota++;
const STATE_WAIT2 = iota++;
const STATE_OPERAND2 = iota++;
const STATE_RESULT = iota++;

const stateMachine ={
    display: document.querySelector(".lcd-active"),
    maxWidth: 10,
    minValue: -999999999,
    maxValue: 9999999999,
    buffer: [],
    operand1: null,
    operand2: null,
    infix: null,
    lastResult: null,
    currentState: STATE_BEGIN,
    cycleState: function(input) {
        switch(this.currentState) {

            case STATE_BEGIN:
                this.bufferAdd("0");
                this.displayUpdate();
                this.currentState = STATE_WAIT1;
                break;

            case STATE_WAIT1:
                if(numSymbols.includes(input)) {
                    if(input === "0") {
                        this.displayUpdate();
                        break;
                    }
                    if(input !== "dec") {
                        this.bufferClear();
                    }
                    this.bufferAdd(input);
                    this.displayUpdate();
                    this.currentState = STATE_OPERAND1;
                }
                if(opSymbols.includes(input)) {
                    this.operand1 = this.bufferParse();
                    this.infix = input;
                    this.currentState = STATE_WAIT2;
                }
                break;

            case STATE_OPERAND1:
                if(numSymbols.includes(input)) {
                    this.bufferAdd(input);
                    this.displayUpdate();
                }
                if(opSymbols.includes(input)) {
                    this.operand1 = this.bufferParse();
                    this.infix = input;
                    this.currentState = STATE_WAIT2;
                }
                break;

            case STATE_WAIT2:
                if(numSymbols.includes(input)) {
                    this.bufferClear();
                    if(input === "dec") {
                        this.bufferAdd("0");
                    }
                    this.bufferAdd(input);
                    this.displayUpdate();
                    this.currentState = STATE_OPERAND2;
                }
                if(opSymbols.includes(input)) {
                    this.infix = input;
                }
                break;

            case STATE_OPERAND2:
                if(numSymbols.includes(input)) {
                    this.bufferAdd(input);
                    this.displayUpdate();
                }
                if(opSymbols.includes(input)) {
                    this.operand2 = this.bufferParse();
                    // compute() will handle state machine if there were any
                    // errors
                    if(!this.compute()) {
                        return;
                    }
                    this.bufferResult();
                    this.displayUpdate();
                    this.infix = input;
                    this.currentState = STATE_RESULT;
                }
                break;

            // probably it would be possible to meet the requirements without
            // this state, but having another state allows for chainning 
            // multiple computations without loss of precision (the result 
            // shown on LCD screen is only limited by the display width, but
            // not by the precision of chained coputations)
            case STATE_RESULT:
                if(numSymbols.includes(input)) {
                    this.bufferClear();
                    if(input === "dec") {
                        this.bufferAdd("0");
                    }
                    this.bufferAdd(input);
                    this.displayUpdate();
                    this.operand1 = this.lastResult;
                    this.currentState = STATE_OPERAND2;
                }
                if(opSymbols.includes(input)) {
                    this.operand1 = this.lastResult;
                    this.infix = input;
                    this.currentState = STATE_WAIT2;
                }
                break;

            default:
                break;
        }
    },

    bufferAdd: function(digit) {
        // the font glyph for the dot has zero width, we need to account for
        // this when computing the onscreen width of the display text
        const decInBuffer = this.buffer.includes(".") ? 1 : 0;
        const width = this.buffer.length - decInBuffer;
        if(width >= this.maxWidth) {
            return;
        }
        // do nothing if there already is a decimal separator in the buffer and
        // the user is trying to input another one
        if(digit === "dec" && decInBuffer) {
            return;
        }
        digit = digit === "dec" ? "." : digit;
        this.buffer.push(digit);
    },

    bufferClear: function() {
        this.buffer = [];
    },

    bufferParse: function() {
        return +this.buffer.join("");
    },

    bufferResult: function() {
        let intNum = Math.trunc(this.lastResult);
        let intStr = intNum.toString()
        // have the width of the decimal part be be as wide as possible while
        // still making sure the integer part will fully fit on the LCD
        let decWidth = this.maxWidth - intStr.length;
        if(decWidth === 0) {
            // inNum might not be the nearest integer so round it
            intNum = Math.round(this.lastResult);
            this.buffer = intNum.toString().split("");
        }
        let decNum = this.lastResult - intNum;
        // string representation of decimal part rounded to decWidth places
        let decStr = decNum.toFixed(decWidth).split(".").at(-1);
        let numSpell = `${intStr}.${decStr}`.split("");
        // consume any stray character to the right of the decimal separator 
        // that shouldn't be display
        while(numSpell.includes(".")) {
            if(numSpell.at(-1) === "0" || numSpell.at(-1) === ".") {
                numSpell.pop();
                continue;
            }
            break;
        }
        this.buffer = numSpell;
    },

    compute: function() {
        let result = null;
        switch(this.infix) {
            case "div":
                if(this.operand2 === 0) {
                    this.error("DIV.BY.0");
                    return false;
                }
                result = this.operand1 / this.operand2;
                break;
            case "mul":
                result = this.operand1 * this.operand2;
                break;
            case "sub":
                result = this.operand1 - this.operand2;
                break;
            case "add":
                result = this.operand1 + this.operand2;
                break;
        }
        if(result < this.minValue) {
            this.error("UNDERFLOW");
            return false;
        }
        if(result > this.maxValue) {
            this.error("OVERFLOW")
            return false;
        }
        this.lastResult = result;
        return true;
    },

    displayUpdate: function() {
        this.display.textContent = this.buffer.join("");
    },

    error: function(msg) {
        this.stateClear();
        this.cycleState();
        this.display.textContent = msg;
    },

    stateClear: function() {
        this.buffer = [];
        this.operand1 = null;
        this.operand2 = null;
        this.infix = null;
        this.lastResult = null;
        this.currentState = STATE_BEGIN;
    },
}

function clickHandler(e) {
    const id = e.target.id;
    if(!id.startsWith("button-")) {
        return
    };

    const symbol = id.split("-").at(-1);
    stateMachine.cycleState(symbol);
}

const calcKeyboard = document.querySelector(".keyboard");
calcKeyboard.addEventListener("click", clickHandler);

window.onload = stateMachine.cycleState();