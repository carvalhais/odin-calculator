// Implements a basic calculator with a state machine based approach.
// 
// The calculator uses an infix notation, and have the following states:
//
//      STATE_BEGIN:
//          Initial state.
//
//      STATE_WAIT1,
//      STATE_WAIT2:
//          In these states, the state machine is waiting for the user to user
//          to start inputing numbers for the respective operands (1 and 2).
//
//      STATE_OPERAND1,
//      STATE_OPERAND2:
//          The user has started to input operands, pressing an operation key
//          waits for the next operand (if inputing operand 1) or immediately 
//          computes the result (if inputing operand 2).
//
//      STATE_RESULT_EQUAL,
//      STATE_RESULT_CHAIN:
//          The machine gets to these states after a computation. There needs
//          to be two different states to handle pculiarities in the behaviour
//          of the calculator after the users finishes the current computation 
//          by pressing either the "=" key or another operation key.
//
//          Full precision is kept for chained computations made with the value
//          stored from the previous result.
//
const numSymbols = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "dec"];
const opSymbols = ["div", "mul", "sub", "add"];
const specialFn = ["ac", "bs"];

let iota = 0;
const STATE_BEGIN = iota++;
const STATE_WAIT1 = iota++
const STATE_OPERAND1 = iota++;
const STATE_WAIT2 = iota++;
const STATE_OPERAND2 = iota++;
const STATE_RESULT_EQUAL = iota++;
const STATE_RESULT_CHAIN = iota++;

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

            // this is the only valid state for the user to press the "=" key
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
                    this.currentState = STATE_RESULT_CHAIN;
                }
                if(input === "eq") {
                    this.operand2 = this.bufferParse();
                    if(!this.compute()) {
                        return;
                    }
                    this.bufferResult();
                    this.displayUpdate();
                    this.currentState = STATE_RESULT_EQUAL;
                }
                break;

            // intentionally falls through at the end of the current case 
            // since STATE_RESULT_CHAIN handles the case for operation 
            // inputs correctly
            case STATE_RESULT_EQUAL:
                if(numSymbols.includes(input)) {
                    this.stateClear();
                    if(input === "dec") {
                        this.bufferAdd("0");
                    }
                    this.bufferAdd(input);
                    this.displayUpdate();
                    this.currentState = STATE_OPERAND1;
                    break;
                }

            // probably it would be possible to meet the requirements without
            // this state, but having another state allows for chaining 
            // multiple computations without loss of precision (the result 
            // shown on LCD screen is only limited by the display width, but
            // not by the precision of chained coputations)
            case STATE_RESULT_CHAIN:
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

    allClear: function() {
        this.stateClear();
        this.cycleState();
    },

    backSpace: function() {
        switch(this.currentState) {
            case STATE_OPERAND1:
            case STATE_OPERAND2:
                if(this.buffer.length > 1) {
                    this.buffer.pop();
                }
                else {
                    this.buffer[0] = "0";
                }
                break;
        }
        this.displayUpdate();
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
        this.allClear();
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

function symbolDispatcher(symbol) {
    if(specialFn.includes(symbol)) {
        switch(symbol) {
            case "ac":
                stateMachine.allClear();
                break;
            case "bs":
                stateMachine.backSpace();
                break;
        }
    }
    else {
        stateMachine.cycleState(symbol);
    }
}

// handles user click events on the UI
function clickHandler(e) {
    const id = e.target.id;
    if(!id.startsWith("button-")) {
        return
    };
    const symbol = id.split("-").at(-1);
    symbolDispatcher(symbol);
}

// handles user key presses on the UI
function keydownHandler(e) {
    symbol = null;
    switch(e.key) {
        case "Escape":
            symbol = "ac";
            break;
        case "Backspace":
            symbol = "bs";
            break;
        case "/":
            symbol = "div";
            break;
        case "*":
            symbol = "mul";
            break;
        case "-":
            symbol = "sub";
            break;
        case "+":
            symbol = "add";
            break;
        case "Enter":
            symbol = "eq";
            break;
        case "=":
            symbol = "eq";
            break;
        case ".":
            symbol = "dec";
            break;
        case ",":
            symbol = "dec";
            break;
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
            symbol = e.key;
            break;
    }
    symbolDispatcher(symbol);
}

const body = document.querySelector("body");
body.addEventListener("click", clickHandler);
body.addEventListener("keydown", keydownHandler)

window.onload = stateMachine.cycleState();