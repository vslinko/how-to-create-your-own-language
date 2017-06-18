const { Function } = require('./3-compiler');

class Stack {
  constructor() {
    this._stack = [];
  }

  push(value) {
    this._stack.push(value);
  }

  pop() {
    return this._stack.pop();
  }
}

class Scope {
  constructor() {
    this._scope = {};
  }

  has(key) {
    return key in this._scope;
  }

  get(key) {
    if (!this.has(key)) {
      throw new Error(`"${key}" is not defined`);
    }

    return this._scope[key];
  }

  set(key, value) {
    if (this.has(key)) {
      throw new Error(`Identifier "${key}" has already been declared`);
    }

    this._scope[key] = value;
  }
}

class Interpreter {
  constructor(fn, scope, stack) {
    this.opcodes = fn.opcodes;
    this.scope = scope;
    this.stack = stack;
  }

  eval() {
    this.currentPosition = 0;
    this.running = true;

    while (this.running && this.currentPosition < this.opcodes.length) {
      this.currentOpcode = this.opcodes[this.currentPosition];

      switch (this.currentOpcode.type) {
        case 'LOAD_CONST':
          this.evalLoadConst();
          break;

        case 'LOAD_FAST':
          this.evalLoadFast();
          break;

        case 'CALL_FUNCTION':
          this.evalCallFunction();
          break;

        case 'POP_TOP':
          this.evalPopTop();
          break;

        case 'COMPARE_OP':
          this.evalCompareOp();
          break;

        case 'STORE_FAST':
          this.evalStoreFast();
          break;

        case 'MAKE_FUNCTION':
          this.evalMakeFunction();
          break;

        case 'POP_JUMP_IF_FALSE':
          this.evalPopJumpIfFalse();
          break;

        case 'JUMP_FORWARD':
          this.evalJumpForward();
          break;

        case 'RETURN_VALUE':
          this.evalReturnValue();
          break;

        default:
          throw new Error(`Unexpected opcode "${this.currentOpcode.type}"`);
      }
    }
  }

  evalCompareOp() {
    const right = this.stack.pop();
    const left = this.stack.pop();

    switch (this.currentOpcode.value) {
      case '==':
        this.stack.push(left === right ? 1 : 0);
        break;

      default:
        throw new Error(`Unexpected operator "${this.currentOpcode.value}"`);
    }

    this.currentPosition++;
  }

  evalPopTop() {
    this.stack.pop();
    this.currentPosition++;
  }

  evalLoadConst() {
    this.stack.push(this.currentOpcode.value);
    this.currentPosition++;
  }

  evalMakeFunction() {
    const fn = this.currentOpcode.value;
    this.stack.push(fn);
    this.currentPosition++;
  }

  evalStoreFast() {
    const name = this.currentOpcode.value;
    const value = this.stack.pop();
    this.scope.set(name, value);
    this.currentPosition++;
  }

  evalLoadFast() {
    const name = this.currentOpcode.value;
    const value = this.scope.get(name);
    this.stack.push(value);
    this.currentPosition++;
  }

  evalCallFunction() {
    const argsLength = this.currentOpcode.value;
    const args = new Array(argsLength);
    for (let i = argsLength - 1; i >= 0; i--) {
      args[i] = this.stack.pop();
    }

    const fn = this.stack.pop();
    let value;

    if (fn instanceof Function) {
      const newStack = new Stack();

      for (const arg of args) {
        newStack.push(arg);
      }

      const interpreter = new Interpreter(fn, this.scope, newStack);
      interpreter.eval();

      value = newStack.pop();
    } else {
      value = fn(...args);
    }

    this.stack.push(value);

    this.currentPosition++;
  }

  evalPopJumpIfFalse() {
    const value = this.stack.pop();

    if (!value) {
      this.currentPosition += this.currentOpcode.value;
    }
  }

  evalJumpForward() {
    this.currentPosition += this.currentOpcode.value;
  }

  evalReturnValue() {
    this.running = false;
  }
}

function evaluate(fn, scope) {
  const stack = new Stack();
  const interpreter = new Interpreter(fn, scope, stack);
  interpreter.eval();
}

module.exports = {
  Stack,
  Scope,
  evaluate,
};
