const ast = require('../2-parser/ast');

const OP = {
  BINARY_ADD: 'BINARY_ADD',
  BINARY_MULTIPLY: 'BINARY_MULTIPLY',
  CALL_FUNCTION: 'CALL_FUNCTION',
  COMPARE_OP: 'COMPARE_OP',
  LOAD_ATTR: 'LOAD_ATTR',
  LOAD_CONST: 'LOAD_CONST',
  LOAD_FAST: 'LOAD_FAST',
  LOAD_GLOBAL: 'LOAD_GLOBAL',
  MAKE_FUNCTION: 'MAKE_FUNCTION',
  POP_JUMP_IF_FALSE: 'POP_JUMP_IF_FALSE',
  POP_TOP: 'POP_TOP',
  RETURN_VALUE: 'RETURN_VALUE',
  STORE_FAST: 'STORE_FAST',
};

class Opcode {
  constructor(type, value) {
    this.type = type;
    this.value = value;
  }
}

class FunctionCode {
  constructor(name, args) {
    this.name = name;
    this.args = args;
    this.opcodes = [];
    this.locals = [];
    this.consts = [];
    this.names = [];
    this.labels = [];
  }

  getOpcodes() {
    const opcodesWithLabels = this.opcodes;
    const opcodesWithoutLabels = [];
    const positions = new Map();

    for (let i = 0; i < opcodesWithLabels.length; i++) {
      const opcode = opcodesWithLabels[i];

      if (opcode instanceof Label) {
        positions.set(opcode.index, opcodesWithoutLabels.length);
      } else {
        opcodesWithoutLabels.push(opcode);
      }
    }

    for (let i = 0; i < opcodesWithoutLabels.length; i++) {
      const opcode = opcodesWithoutLabels[i];

      if (opcode.type === OP.POP_JUMP_IF_FALSE) {
        opcodesWithoutLabels[i] = new Opcode(opcode.type, positions.get(opcode.value));
      }
    }

    return opcodesWithoutLabels;
  }

  defineLocal(item) {
    const index = this.locals.indexOf(item);

    if (index >= 0) {
      return index;
    }

    this.locals.push(item);

    return this.locals.length - 1;
  }

  defineName(item) {
    const index = this.names.indexOf(item);

    if (index >= 0) {
      return index;
    }

    this.names.push(item);

    return this.names.length - 1;
  }

  defineConst(item) {
    const index = this.consts.indexOf(item);

    if (index >= 0) {
      return index;
    }

    this.consts.push(item);

    return this.consts.length - 1;
  }

  createLabel() {
    const label = new Label(this.labels.length);
    this.labels.push(label);
    return label;
  }
}

class Label {
  constructor(index) {
    this.index = index;
  }
}

function invalidNode(node) {
  return new Error(`Invalid node "${node.type}"`);
}

function compileExpression(fn, expression) {
  if (expression instanceof ast.Literal) {
    if (typeof expression.value === 'number') {
      fn.opcodes.push(new Opcode(OP.LOAD_CONST, fn.defineConst(expression.value)));
    } else {
      throw invalidNode(expression);
    }

  } else if (expression instanceof ast.BinaryExpression) {
    compileExpression(fn, expression.left);
    compileExpression(fn, expression.right);
    switch (expression.operator) {
      case '+': fn.opcodes.push(new Opcode(OP.BINARY_ADD, undefined)); break;
      case '*': fn.opcodes.push(new Opcode(OP.BINARY_MULTIPLY, undefined)); break;
      case '>': fn.opcodes.push(new Opcode(OP.COMPARE_OP, fn.defineConst('>'))); break;
      default: throw invalidNode(expression);
    }

  } else if (expression instanceof ast.CallExpression) {
    compileExpression(fn, expression.callee);
    expression.arguments.forEach(argument => {
      compileExpression(fn, argument);
    });
    fn.opcodes.push(new Opcode(OP.CALL_FUNCTION, expression.arguments.length));

  } else if (expression instanceof ast.MemberExpression) {
    compileExpression(fn, expression.object);
    fn.opcodes.push(new Opcode(OP.LOAD_ATTR, fn.defineName(expression.property.name)));

  } else if (expression instanceof ast.Identifier) {
    if (fn.locals.indexOf(expression.name) >= 0) {
      fn.opcodes.push(new Opcode(OP.LOAD_FAST, fn.defineLocal(expression.name)));
    } else {
      fn.opcodes.push(new Opcode(OP.LOAD_GLOBAL, fn.defineName(expression.name)));
    }

  } else if (expression instanceof ast.ParenthesesExpression) {
    compileExpression(fn, expression.expression);

  } else {
    throw invalidNode(expression);
  }
}

function compileVariableDeclaration(fn, variableDeclaration) {
  compileExpression(fn, variableDeclaration.init);
  fn.opcodes.push(new Opcode(OP.STORE_FAST, fn.defineLocal(variableDeclaration.name.name)));
}

function compileExpressionStatement(fn, statement) {
  compileExpression(fn, statement.expression);
  fn.opcodes.push(new Opcode(OP.POP_TOP, undefined));
}

function compileFunctionDeclaration(fn, statement) {
  const newFn = new FunctionCode(statement.id.name, statement.params.map(param => param.name));

  statement.params.forEach(param => {
    newFn.defineLocal(param.name);
  });

  compileBody(newFn, statement.body.body);

  fn.opcodes.push(new Opcode(OP.LOAD_CONST, fn.defineConst(newFn)));
  fn.opcodes.push(new Opcode(OP.LOAD_CONST, fn.defineConst(statement.id.name)));
  fn.opcodes.push(new Opcode(OP.MAKE_FUNCTION, 0));
  fn.opcodes.push(new Opcode(OP.STORE_FAST, fn.defineLocal(statement.id.name)));
}

function compileReturnStatement(fn, statement) {
  compileExpression(fn, statement.argument);
  fn.opcodes.push(new Opcode(OP.RETURN_VALUE, undefined));
}

function compileIfStatement(fn, statement) {
  const label = fn.createLabel();
  compileExpression(fn, statement.test);
  fn.opcodes.push(new Opcode(OP.POP_JUMP_IF_FALSE, label.index));
  compileBlock(fn, statement.consequent.body);
  fn.opcodes.push(label);
}

function compileStatement(fn, statement) {
  if (statement instanceof ast.VariableDeclaration) {
    compileVariableDeclaration(fn, statement);
  } else if (statement instanceof ast.ExpressionStatement) {
    compileExpressionStatement(fn, statement);
  } else if (statement instanceof ast.FunctionDeclaration) {
    compileFunctionDeclaration(fn, statement);
  } else if (statement instanceof ast.ReturnStatement) {
    compileReturnStatement(fn, statement);
  } else if (statement instanceof ast.IfStatement) {
    compileIfStatement(fn, statement);
  } else {
    throw invalidNode(statement);
  }
}

function compileBlock(fn, statements) {
  statements.forEach(statement => {
    compileStatement(fn, statement);
  });
}

function compileBody(fn, statements) {
  compileBlock(fn, statements);

  if (fn.opcodes.length === 0 || fn.opcodes[fn.opcodes.length - 1].type !== OP.RETURN_VALUE) {
    fn.opcodes.push(new Opcode(OP.LOAD_CONST, fn.defineConst(undefined)));
    fn.opcodes.push(new Opcode(OP.RETURN_VALUE));
  }
}

function compileProgram(program) {
  const fn = new FunctionCode('<module>', []);

  compileBody(fn, program.statements);

  return fn;
}

function compile(program) {
  return compileProgram(program);
}

module.exports.OP = OP;
module.exports.Opcode = Opcode;
module.exports.compile = compile;
module.exports.FunctionCode = FunctionCode;
