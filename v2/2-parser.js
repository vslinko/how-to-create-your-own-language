const { TokenType } = require('./1-tokenizer');

class Node {

}

class Program extends Node {
  constructor(statements) {
    super();
    this.statements = statements;
  }
}

class Expression extends Node {

}

class Identifier extends Expression {
  constructor(text) {
    super();
    this.text = text;
  }
}

class Literal extends Expression {
  constructor(text, value) {
    super();
    this.text = text;
    this.value = value;
  }
}

class BinaryExpression extends Expression {
  constructor(left, op, right) {
    super();
    this.left = left;
    this.op = op;
    this.right = right;
  }
}

class CallExpression extends Expression {
  constructor(callee, args) {
    super();
    this.callee = callee;
    this.arguments = args;
  }
}

class Statement extends Node {

}

class VariableDeclaration extends Statement {
  constructor(name, init) {
    super();
    this.name = name;
    this.init = init;
  }
}

class ExpressionStatement extends Statement {
  constructor(expr) {
    super();
    this.expr = expr;
  }
}

function unexpectedTokenError(actualToken, expectedToken) {
  return new Error(
    `Unexpected token ${actualToken}, expected ${expectedToken}`
  );
}

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
  }

  parse() {
    this.currentToken = undefined;
    this.currentPosition = 0;
    this.nextToken();

    return this.parseProgram();
  }

  parseProgram() {
    const statements = [];

    while (true) {
      const statement = this.parseStatement();

      statements.push(statement);

      if (this.currentToken.type === TokenType.EOF) {
        break;
      }
    }

    return new Program(statements);
  }

  parseStatement() {
    if (this.currentToken.type === TokenType.CONST_KEYWORD) {
      return this.parseVariableDeclaration();
    } else {
      return this.parseExpressionStatement();
    }
  }

  parseVariableDeclaration() {
    this.assertToken(TokenType.CONST_KEYWORD);
    this.nextToken();

    const name = this.parseIdentifier();

    this.assertToken(TokenType.EQUALS);
    this.nextToken();

    const init = this.parseExpression();

    this.assertToken(TokenType.SEMICOLON);
    this.nextToken();

    return new VariableDeclaration(name, init);
  }

  parseIdentifier() {
    this.assertToken(TokenType.WORD);

    const text = this.currentToken.value;

    this.nextToken();

    return new Identifier(text);
  }

  parseExpressionStatement() {
    const expr = this.parseExpression();

    this.assertToken(TokenType.SEMICOLON);
    this.nextToken();

    return new ExpressionStatement(expr);
  }

  parseExpression() {
    let expression;

    if (this.currentToken.type === TokenType.NUMBER) {
      expression = this.parseLiteral();
    } else {
      expression = this.parseIdentifier();
    }

    if (this.currentToken.type === TokenType.PLUS) {
      return this.parseBinaryExpression(expression);
    }

    if (this.currentToken.type === TokenType.LEFT_PAREN) {
      return this.parseCallExpression(expression);
    }

    return expression;
  }

  parseCallExpression(callee) {
    const args = [];

    this.assertToken(TokenType.LEFT_PAREN);
    this.nextToken();

    while (true) {
      const arg = this.parseExpression();

      args.push(arg);

      if (this.currentToken.type === TokenType.COMMA) {
        this.nextToken();
      } else {
        break;
      }
    }

    this.assertToken(TokenType.RIGHT_PAREN);
    this.nextToken();

    return new CallExpression(callee, args);
  }

  parseBinaryExpression(left) {
    this.assertToken(TokenType.PLUS);

    const op = this.currentToken.value;

    this.nextToken();

    const right = this.parseExpression();

    return new BinaryExpression(left, op, right);
  }

  parseLiteral() {
    this.assertToken(TokenType.NUMBER);

    const text = this.currentToken.value;
    const value = Number(text);

    this.nextToken();

    return new Literal(text, value);
  }

  nextToken() {
    do {
      this.currentToken = this.tokens[this.currentPosition];
      this.currentPosition++;
    } while (this.currentToken.type === TokenType.WHITESPACE);
  }

  assertToken(expectedToken) {
    if (this.currentToken.type !== expectedToken) {
      throw unexpectedTokenError(
        this.currentToken.type,
        expectedToken
      );
    }
  }
}

function parse(tokens) {
  const parser = new Parser(tokens);
  return parser.parse();
}

module.exports = {
  Program,
  Expression,
  Identifier,
  Literal,
  BinaryExpression,
  CallExpression,
  Statement,
  VariableDeclaration,
  ExpressionStatement,

  parse,
}
