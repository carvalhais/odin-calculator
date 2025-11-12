const numSymbols = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "."];
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
                        break;
                    }
                    if(input !== ".") {
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
                    if(input === ".") {
                        this.bufferAdd("0");
                    }
                    this.bufferAdd(input);
                    this.displayUpdate();
                    this.currentState = STATE_OPERAND2;
                }
                break;

            case STATE_OPERAND2:
                if(numSymbols.includes(input)) {
                    this.bufferAdd(input);
                    this.displayUpdate();
                }
                if(opSymbols.includes(input)) {
                    this.operand2 = this.bufferParse();
                    this.compute();
                    this.bufferResult();
                    this.displayUpdate();
                    this.currentState = STATE_RESULT;
                }
                break;

            case STATE_RESULT:
                if(numSymbols.includes(input)) {
                    this.bufferClear();
                    if(input === ".") {
                        this.bufferAdd("0");
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

            default:
                break;
        }
    },

    bufferAdd: null,

    bufferClear: null,

    bufferParse: null,

    bufferResult: null,

    displayUpdate: null,

    stateClear: null,
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

window.onload = lcdDisplay._updateDisplay();