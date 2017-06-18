const {
  Identifier,
  Literal,
  ParenExpression,
} = require('./2-parser');

const OpcodeType = {
  LOAD_CONST: 'LOAD_CONST',
  STORE_FAST: 'STORE_FAST',
  LOAD_FAST: 'LOAD_FAST',
  CALL_FUNCTION: 'CALL_FUNCTION',
  POP_TOP: 'POP_TOP',
  COMPARE_OP: 'COMPARE_OP',
  POP_JUMP_IF_FALSE: 'POP_JUMP_IF_FALSE',
  JUMP_FORWARD: 'JUMP_FORWARD',
  MAKE_FUNCTION: 'MAKE_FUNCTION',
  RETURN_VALUE: 'RETURN_VALUE',
};

class Opcode {
  constructor(type, value) {
    this.type = type;
    this.value = value;
  }
}

class Function {
  constructor(opcodes) {
    this.opcodes = opcodes;
  }
}

class Compiler {
  constructor(ast) {
    this.ast = ast;
  }

  compile() {
    this.currentFunction = new Function([]);
    this.compileProgram(this.ast);
    return this.currentFunction;
  }

  compileProgram(program) {
    this.compileBlock(program.expressions);
  }

  compileBlock(expressions) {
    for (const expression of expressions) {
      this.compileExpression(expression);
      this.currentFunction.opcodes.push(new Opcode(OpcodeType.POP_TOP, 0));
    }
  }

  compileExpression(expression) {
    if (expression instanceof ParenExpression) {
      this.compileParenExpression(expression);

    } else if (expression instanceof Identifier) {
      this.compileIdentifier(expression);

    } else if (expression instanceof Literal) {
      this.compileLiteral(expression);

    } else {
      throw new Error(`Unexpected node "${expression.type}"`);
    }
  }

  compileIdentifier(id) {
    this.currentFunction.opcodes.push(new Opcode(OpcodeType.LOAD_FAST, id.text));
  }

  compileLiteral(literal) {
    this.currentFunction.opcodes.push(new Opcode(OpcodeType.LOAD_CONST, literal.value));
  }

  compileParenExpression(expression) {
    const { name, args } = expression;

    if (name.text === 'def') {
      this.compileDef(expression);
      return;
    }

    if (name.text === 'eq') {
      this.compileEq(expression);
      return;
    }

    if (name.text === 'if') {
      this.compileIf(expression);
      return;
    }

    if (name.text === 'fn') {
      this.compileFn(expression);
      return;
    }

    if (name.text === 'return') {
      this.compileReturn(expression);
      return;
    }

    this.compileIdentifier(name);

    for (const arg of args) {
      this.compileExpression(arg);
    }

    this.currentFunction.opcodes.push(new Opcode(OpcodeType.CALL_FUNCTION, args.length));
  }

  compileEq(expression) {
    const { args } = expression;

    if (args.length !== 2) {
      throw new Error(`eq should have 2 args`);
    }

    const [left, right] = args;

    this.compileExpression(left);
    this.compileExpression(right);

    this.currentFunction.opcodes.push(new Opcode(OpcodeType.COMPARE_OP, '=='));
  }

  compileIf(expression) {
    const { args } = expression;

    if (args.length !== 3) {
      throw new Error(`if should have 3 args`);
    }

    const [testExpression, trueExpression, falseExpression] = args;

    const currentFunction = this.currentFunction;

    const testFunction = new Function([]);
    this.currentFunction = testFunction;
    this.compileExpression(testExpression);

    const trueFunction = new Function([]);
    this.currentFunction = trueFunction;
    this.compileExpression(trueExpression);

    const falseFunction = new Function([]);
    this.currentFunction = falseFunction;
    this.compileExpression(falseExpression);

    this.currentFunction = currentFunction;

    this.currentFunction.opcodes = [
      ...currentFunction.opcodes,
      ...testFunction.opcodes,
      new Opcode(OpcodeType.POP_JUMP_IF_FALSE, trueFunction.opcodes.length + 1),
      ...trueFunction.opcodes,
      new Opcode(OpcodeType.JUMP_FORWARD, falseFunction.opcodes.length),
      ...falseFunction.opcodes,
    ];
  }

  compileDef(expression) {
    const { args } = expression;

    if (args.length !== 2) {
      throw new Error(`def should have 2 args`);
    }

    const [name, value] = args;

    this.compileExpression(value);

    this.currentFunction.opcodes.push(new Opcode(OpcodeType.STORE_FAST, name.text));
    this.currentFunction.opcodes.push(new Opcode(OpcodeType.LOAD_CONST, undefined));
  }

  compileFn(expression) {
    const { args } = expression;

    if (args.length <= 1) {
      throw new Error(`fn should have more than 1 arg`);
    }

    const firstArgExpression = args.shift();
    const fnArgNames = [
      firstArgExpression.name.text,
      ...firstArgExpression.args.map(arg => arg.text),
    ].reverse();

    const newFunction = new Function([]);

    for (const argName of fnArgNames) {
      newFunction.opcodes.push(new Opcode(OpcodeType.STORE_FAST, argName));
    }

    const currentFunction = this.currentFunction;
    this.currentFunction = newFunction;
    this.compileBlock(args);
    this.currentFunction = currentFunction;

    this.currentFunction.opcodes.push(new Opcode(OpcodeType.MAKE_FUNCTION, newFunction));
  }

  compileReturn(expression) {
    const { args } = expression;

    if (args.length !== 1) {
      throw new Error(`return should have 1 arg`);
    }

    const [returnValue] = args;

    this.compileExpression(returnValue);

    this.currentFunction.opcodes.push(new Opcode(OpcodeType.RETURN_VALUE, 0));
  }
}

function compile(ast) {
  const compiler = new Compiler(ast);
  return compiler.compile();
}

module.exports = {
  compile,
  OpcodeType,
  Opcode,
  Function,
};
