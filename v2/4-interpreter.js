const { OpcodeType } = require('./3-compiler');

class Stack {
  constructor() {
    this.state = [];
  }

  push(value) {
    this.state.push(value);
  }

  pop(value) {
    return this.state.pop();
  }
}

class Scope {
  constructor() {
    this.state = {}
  }

  has(key) {
    return key in this.state;
  }

  set(key, value) {
    this.state[key] = value;
  }

  get(key) {
    return this.state[key];
  }
}

class Interpreter {
  constructor(fn, stack, scope) {
    this.fn = fn;
    this.stack = stack;
    this.scope = scope;
  }

  run() {
    this.currentPosition = 0;

    while (true) {
      const opcode = this.fn.opcodes[this.currentPosition];

      if (!opcode) {
        break;
      }

      switch (opcode.type) {
        case OpcodeType.LOAD_CONST:
          this.evalLoadConst(opcode.value);
          break;

        case OpcodeType.BINARY_ADD:
          this.evalBinaryAdd();
          break;

        case OpcodeType.LOAD_GLOBAL:
          this.evalLoadGlobal(opcode.value);
          break;

        case OpcodeType.CALL_FUNCTION:
          this.evalCallFunction(opcode.value);
          break;

        case OpcodeType.LOAD_FAST:
          this.evalLoadFast(opcode.value);
          break;

        case OpcodeType.STORE_FAST:
          this.evalStoreFast(opcode.value);
          break;

        default:
          throw new Error(
            `Unexpected opcode ${opcode.type}`
          );
      }
    }
  }

  evalLoadFast(localIndex) {
    const name = this.fn.locals[localIndex];

    if (!this.scope.has(name)) {
      throw new Error(`Unknown variable ${name}`);
    }

    const value = this.scope.get(name);
    this.stack.push(value);
    this.currentPosition++;
  }

  evalStoreFast(localIndex) {
    const name = this.fn.locals[localIndex];

    if (this.scope.has(name)) {
      throw new Error(`Variable ${name} is already declared`);
    }

    const value = this.stack.pop();
    this.scope.set(name, value);
    this.currentPosition++;
  }

  evalLoadConst(constIndex) {
    const value = this.fn.consts[constIndex];

    this.stack.push(value);

    this.currentPosition++;
  }

  evalBinaryAdd() {
    const right = this.stack.pop();
    const left = this.stack.pop();

    const value = left + right;

    this.stack.push(value);

    this.currentPosition++;
  }

  evalLoadGlobal(nameIndex) {
    const name = this.fn.names[nameIndex];

    if (!this.scope.has(name)) {
      throw new Error(`Unknown variable ${name}`);
    }

    const value = this.scope.get(name);

    this.stack.push(value);

    this.currentPosition++;
  }

  evalCallFunction(argsLength) {
    const args = new Array(argsLength);
    for (let i = argsLength - 1; i >= 0; i--) {
      args[i] = this.stack.pop();
    }

    const fn = this.stack.pop();

    const result = fn(...args);

    this.stack.push(result);

    this.currentPosition++;
  }
}

function run(fn) {
  const stack = new Stack();
  const scope = new Scope();

  scope.set('print', function(...args) {
    console.log(...args);
  });

  const interpreter = new Interpreter(fn, stack, scope);
  interpreter.run();
}

module.exports = {
  run,
}
