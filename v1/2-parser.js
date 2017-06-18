const { TokenType } = require('./1-tokenizer');

class Node {
  constructor(type) {
    this.type = type;
  }
}

class Program extends Node {
  constructor(expressions) {
    super('Program');
    this.expressions = expressions;
  }
}

class ParenExpression extends Node {
  constructor(name, args) {
    super('Expression');
    this.name = name;
    this.args = args;
  }
}

class Identifier extends Node {
  constructor(text) {
    super('Identifier');
    this.text = text;
  }
}

class Literal extends Node {
  constructor(value) {
    super('Literal');
    this.value = value;
  }
}

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
  }

  parse() {
    this.currentPosition = 0;
    this.currentToken = undefined;
    this.nextToken();
    return this.parseProgram();
  }

  nextToken() {
    do {
      this.currentToken = this.tokens[this.currentPosition];
      this.currentPosition++;
    } while (this.currentToken.type === TokenType.WHITESPACE);
  }

  parseProgram() {
    const expressions = [];

    while (this.currentToken && this.currentToken.type !== TokenType.EOF) {
      const expression = this.parseExpression();
      expressions.push(expression);
    }

    this.assertCurrentToken(TokenType.EOF);

    return new Program(expressions);
  }

  parseExpression() {
    if (this.currentToken.type === TokenType.LEFT_PAREN) {
      return this.parseParenExpression();

    } else if (this.currentToken.type === TokenType.WORD) {
      return this.parseWord();

    } else if (this.currentToken.type === TokenType.NUMBER) {
      return this.parseNumber();

    } else {
      this.throwUnexpectedToken([TokenType.LEFT_PAREN, TokenType.WORD, TokenType.NUMBER]);
    }
  }

  parseParenExpression() {
    this.assertCurrentToken(TokenType.LEFT_PAREN);
    this.nextToken();
    const name = this.parseWord();

    const args = [];
    while (this.currentToken.type !== TokenType.RIGHT_PAREN) {
      const arg = this.parseExpression();
      args.push(arg);
    }

    this.assertCurrentToken(TokenType.RIGHT_PAREN);
    this.nextToken();

    return new ParenExpression(name, args);
  }

  parseNumber() {
    this.assertCurrentToken(TokenType.NUMBER);
    const value = Number(this.currentToken.value);
    this.nextToken();
    return new Literal(value);
  }

  parseWord() {
    this.assertCurrentToken(TokenType.WORD);
    const value = this.currentToken.value;
    this.nextToken();
    return new Identifier(value);
  }

  throwUnexpectedToken(expectedTypes) {
    throw new Error(`Unexpected token "${this.currentToken.type}" expected "${expectedTypes.join(' | ')}"`);
  }

  assertCurrentToken(expectedType) {
    if (this.currentToken.type !== expectedType) {
      this.throwUnexpectedToken([expectedType]);
    }
  }
}

function parse(tokens) {
  const parser = new Parser(tokens);
  return parser.parse();
}

module.exports = {
  Node,
  Program,
  Identifier,
  Literal,
  ParenExpression,
  parse,
};
