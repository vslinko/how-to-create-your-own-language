const assert = require('assert');
const OP = require('../3-compiler').OP;
const FunctionCode = require('../3-compiler').FunctionCode;

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
  constructor(parent) {
    this.parent = parent;
    this._scope = new Map();
  }

  has(key) {
    return this._scope.has(key);
  }

  set(key, value) {
    if (this.has(key)) {
      console.log(this)
      throw new Error(`Identifier '"${key}"' has already been declared`);
    }

    this._scope.set(key, value);
  }

  getFast(key) {
    return this._scope.get(key);
  }

  get(key) {
    if (!this.has(key)) {
      if (this.parent) {
        return this.parent.get(key);
      } else {
        throw new Error(`${key} is not defined`);
      }
    }

    return this._scope.get(key);
  }
}

class Value {
  getRawString() {
    throw new Error('Not implemented');
  }
}

class UndefinedValue extends Value {
  getRawString() {
    return "[Undefined]";
  }
}

class BooleanValue extends Value {
  getRawString() {
    return "[Undefined]";
  }
}

class TrueValue extends BooleanValue {
  getRawString() {
    return "[True]";
  }
}

class FalseValue extends BooleanValue {
  getRawString() {
    return "[False]";
  }
}

const undefinedValue = new UndefinedValue();
const trueValue = new TrueValue();
const falseValue = new FalseValue();

class StringValue extends Value {
  constructor(value) {
    super();
    this.value = value;
  }

  getRawString() {
    return `[String ${this.value}]`;
  }
}

class NumberValue extends Value {
  constructor(value) {
    super();
    this.value = value;
  }

  getRawString() {
    return `[Number ${this.value}]`;
  }
}

class FunctionValue extends Value {

}

class UserFunctionValue extends FunctionValue {
  constructor(name, fn) {
    super();
    this.name = name;
    this.fn = fn;
  }

  eval(stack, scope, args) {
    const newScope = new Scope(scope);
    for (let i = 0; i < args.length; i++) {
      newScope.set(this.fn.args[i], args[i]);
    }
    evalFn(stack, newScope, this.fn);
  }

  getRawString() {
    return `[Function ${this.name}(${this.fn.args.join(', ')})]`;
  }
}

class NativeFunctionValue extends FunctionValue {
  constructor(name, args, implementation) {
    super();
    this._name = name;
    this._args = args;
    this._implementation = implementation;
  }

  eval(stack, scope, args) {
    const value = this._implementation(scope, args);
    assert(value instanceof Value);

    stack.push(value);
  }

  getRawString() {
    return `[NativeFunction ${this._name}(${this._args.join(', ')})]`;
  }
}

class ObjectValue extends Value {
  constructor() {
    super();
    this._object = new Map();
  }

  has(key) {
    return this._object.has(key);
  }

  set(key, value) {
    this._object.set(key, value);
  }

  get(key) {
    return this._object.get(key);
  }

  getRawString() {
    const keys = Array.from(this._object.keys()).map(k => {
      return k + ': ' + this._object.get(k).getRawString();
    }).join(', ');

    return `[Object ${keys}]`;
  }
}

function run(fn, scope) {
  const newScope = new Scope(scope);
  const stack = new Stack();

  evalFn(stack, newScope, fn);

  const value = stack.pop();
  assert(value instanceof Value);

  return value;
}

function evalFn(stack, scope, fn) {
  const opcodes = fn.getOpcodes();

  for (let i = 0; i < opcodes.length; i++) {
    const opcode = opcodes[i];

    switch (opcode.type) {
      case OP.BINARY_ADD: evalAdd(stack, scope, fn, opcode); break;
      case OP.BINARY_MULTIPLY: evalMul(stack, scope, fn, opcode); break;
      case OP.COMPARE_OP: evalCompareGt(stack, scope, fn, opcode); break;
      case OP.CALL_FUNCTION: evalCall(stack, scope, fn, opcode); break;
      case OP.LOAD_ATTR: evalGetProp(stack, scope, fn, opcode); break;
      case OP.LOAD_CONST: evalPushNumberLiteral(stack, scope, fn, opcode); break;
      case OP.STORE_FAST: evalSaveVar(stack, scope, fn, opcode); break;
      case OP.LOAD_FAST: evalLoadVar(stack, scope, fn, opcode); break;
      case OP.LOAD_GLOBAL: evalLoadGlobal(stack, scope, fn, opcode); break;
      case OP.POP_TOP: evalPopNoop(stack, scope, fn, opcode); break;
      case OP.MAKE_FUNCTION: evalMakeFunction(stack, scope, fn, opcode); break;
      case OP.RETURN_VALUE: return;
      case OP.POP_JUMP_IF_FALSE:
        {
          const value = stack.pop();
          assert(value instanceof BooleanValue);
          if (value === falseValue) {
            i = opcode.value - 1;
          }
        }
        break;
      default:
        throw new Error(`Unknown opcode "${opcode.type}"`);
    }
  }
}

function evalCompareGt(stack, scope, fn, opcode) {
  const right = stack.pop();
  assert(right instanceof NumberValue);

  const left = stack.pop();
  assert(left instanceof NumberValue);

  const op = fn.consts[opcode.value];
  let value;

  switch (op) {
    case '>': value = left.value > right.value; break;
    default:
      throw new Error();
  }

  stack.push(value ? trueValue : falseValue);
}

function evalPopNoop(stack, scope, fn, opcode) {
  const value = stack.pop();
  assert(value instanceof Value);
}

function evalAdd(stack, scope, fn, opcode) {
  const right = stack.pop();
  assert(right instanceof NumberValue);

  const left = stack.pop();
  assert(left instanceof NumberValue);

  stack.push(new NumberValue(left.value + right.value));
}

function evalMul(stack, scope, fn, opcode) {
  const right = stack.pop();
  assert(right instanceof NumberValue);

  const left = stack.pop();
  assert(left instanceof NumberValue);

  stack.push(new NumberValue(left.value * right.value));
}

function evalCall(stack, scope, fn, opcode) {
  const args = new Array(opcode.value);
  for (let i = opcode.value - 1; i >= 0; i--) {
    args[i] = stack.pop();
    assert(args[i] instanceof Value);
  }

  const nfn = stack.pop();
  assert(nfn instanceof FunctionValue);

  nfn.eval(stack, scope, args);
}

function evalGetProp(stack, scope, fn, opcode) {
  const object = stack.pop();
  assert(object instanceof ObjectValue);

  const name = fn.names[opcode.value];

  const value = object.has(name) ? object.get(name) : undefinedValue;
  assert(value instanceof Value);

  stack.push(value);
}

function evalPushNumberLiteral(stack, scope, fn, opcode) {
  const name = fn.consts[opcode.value];
  let value;

  if (name === undefined) {
    value = undefinedValue;
  } else if (typeof name === 'number') {
    value = new NumberValue(name);
  } else if (typeof name === 'string') {
    value = new StringValue(name);
  } else if (name instanceof FunctionCode) {
    value = name;
  } else {
    throw new Error();
  }

  stack.push(value);
}

function evalMakeFunction(stack, scope, fn, opcode) {
  const name = stack.pop();
  assert(name instanceof StringValue);

  const value = stack.pop();
  assert(value instanceof FunctionCode);
  stack.push(new UserFunctionValue(name, value));
}

function evalSaveVar(stack, scope, fn, opcode) {
  const value = stack.pop();
  assert(value instanceof Value);

  scope.set(fn.locals[opcode.value], value);
}

function evalLoadVar(stack, scope, fn, opcode) {
  const value = scope.getFast(fn.locals[opcode.value]);
  assert(value instanceof Value);

  stack.push(value);
}

function evalLoadGlobal(stack, scope, fn, opcode) {
  const value = scope.get(fn.names[opcode.value]);
  assert(value instanceof Value);

  stack.push(value);
}

module.exports.run = run;
module.exports.Scope = Scope;
module.exports.NativeFunctionValue = NativeFunctionValue;
module.exports.ObjectValue = ObjectValue;
module.exports.undefinedValue = undefinedValue;
