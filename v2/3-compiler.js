const {
  VariableDeclaration,
  ExpressionStatement,
  BinaryExpression,
  CallExpression,
  Literal,
  Identifier,
} = require('./2-parser');

const OpcodeType = {
  LOAD_CONST: 'LOAD_CONST',
  STORE_FAST: 'STORE_FAST',
  LOAD_FAST: 'LOAD_FAST',
  BINARY_ADD: 'BINARY_ADD',
  CALL_FUNCTION: 'CALL_FUNCTION',
  LOAD_GLOBAL: 'LOAD_GLOBAL',
}

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
  }

  defineConst(value) {
    const index = this.consts.indexOf(value);

    if (index >= 0) {
      return index;
    }

    this.consts.push(value);

    return this.consts.length - 1;
  }

  defineLocal(value) {
    const index = this.locals.indexOf(value);

    if (index >= 0) {
      return index;
    }

    this.locals.push(value);

    return this.locals.length - 1;
  }

  defineName(value) {
    const index = this.names.indexOf(value);

    if (index >= 0) {
      return index;
    }

    this.names.push(value);

    return this.names.length - 1;
  }
}

class Compiler {
  constructor(ast) {
    this.ast = ast;
  }

  compile() {
    this.currentFunction = new FunctionCode('<module>', []);

    this.compileProgram(this.ast);

    return this.currentFunction;
  }

  compileProgram(program) {
    for (const statement of program.statements) {
      this.compileStatement(statement);
    }
  }

  compileStatement(statement) {
    if (statement instanceof VariableDeclaration) {
      this.compileVariableDeclaration(statement);
    } else if (statement instanceof ExpressionStatement) {
      this.compileExpressionStatement(statement);
    } else {
      throw new Error()
    }
  }

  compileVariableDeclaration(varDecl) {
    const { name, init } = varDecl;

    this.compileExpression(init);

    this.currentFunction.opcodes.push(
      new Opcode(
        OpcodeType.STORE_FAST,
        this.currentFunction.defineLocal(name.text)
      )
    );
  }

  compileExpressionStatement(exprStatement) {
    this.compileExpression(exprStatement.expr);
  }

  compileExpression(expression) {
    if (expression instanceof BinaryExpression) {
      this.compileBinaryExpression(expression);
    } else if (expression instanceof Literal) {
      this.compileLiteral(expression);
    } else if (expression instanceof CallExpression) {
      this.compileCallExpression(expression);
    } else if (expression instanceof Identifier) {
      this.compileIdentifier(expression);
    } else {
      throw new Error();
    }
  }

  compileIdentifier(identifier) {
    const { text } = identifier;

    if (this.currentFunction.locals.indexOf(text) >= 0) {
      this.currentFunction.opcodes.push(
        new Opcode(
          OpcodeType.LOAD_FAST,
          this.currentFunction.defineLocal(text)
        )
      )
    } else {
      this.currentFunction.opcodes.push(
        new Opcode(
          OpcodeType.LOAD_GLOBAL,
          this.currentFunction.defineName(text)
        )
      )
    }
  }

  compileLiteral(literal) {
    const index = this.currentFunction.defineConst(
      literal.value
    );

    this.currentFunction.opcodes.push(
      new Opcode(OpcodeType.LOAD_CONST, index)
    );
  }

  compileBinaryExpression(binaryExpression) {
    const { left, op, right } = binaryExpression;

    this.compileExpression(left);
    this.compileExpression(right);

    switch (op) {
      case '+':
        this.currentFunction.opcodes.push(
          new Opcode(OpcodeType.BINARY_ADD, 0)
        );
        break;

      default:
        throw new Error();
    }
  }

  compileCallExpression(callExpression) {
    const callee = callExpression.callee;
    const args = callExpression.arguments;

    this.compileExpression(callee);

    for (const arg of args) {
      this.compileExpression(arg);
    }

    this.currentFunction.opcodes.push(
      new Opcode(OpcodeType.CALL_FUNCTION, args.length)
    );
  }
}

function compile(ast) {
  const compiler = new Compiler(ast);
  return compiler.compile();
}

module.exports = {
  OpcodeType,
  Opcode,
  FunctionCode,
  compile,
}
