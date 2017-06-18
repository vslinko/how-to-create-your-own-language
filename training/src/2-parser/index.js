const assert = require('assert');
const Position = require('../0-utils/file').Position;
const T = require('../1-tokenizer').T;
const getPrecedence = require('../1-tokenizer').getPrecedence;
const ast = require('./ast');

function parse(tokenizer) {
  let currentToken;
  nextToken();

  function unexpectedToken(expectedTypes) {
    return new Error(
      `Unexpected token "${currentToken.type}" at position ${tokenizer.currentPosition}, expected "${expectedTypes.join(' | ')}"`
    );
  }

  function assertToken(expectedTypes, value) {
    if (!expectedTypes.includes(currentToken.type)) {
      throw unexpectedToken(expectedTypes);
    }
  }

  function markStartPosition() {
    return [currentToken.start, currentToken.loc.start];
  }

  function markEndPosition([start, startLoc]) {
    return [
      start,
      currentToken.start,
      {start: startLoc, end: currentToken.loc.start},
    ];
  }

  function nextToken() {
    currentToken = tokenizer.next();
  }

  function skipWhitespace() {
    while (currentToken.type === T.WHITESPACE) {
      currentToken = tokenizer.next();
    }
  }

  function nextNonWhitespaceToken() {
    nextToken();
    skipWhitespace();
  }

  function parseProgram() {
    const start = markStartPosition();

    const statements = [];

    skipWhitespace();

    while (currentToken.type !== T.EOF) {
      statements.push(parseStatement());
      skipWhitespace();
    }

    return new ast.Program(
      ...markEndPosition(start),
      statements
    );
  }

  function parseStatement() {
    if (currentToken.type === T.CONST_KEYWORD) {
      return parseVariableDeclaration();
    } else if (currentToken.type === T.FUNCTION_KEYWORD) {
      return parseFunctionDeclaration();
    } else if (currentToken.type === T.RETURN_KEYWORD) {
      return parseReturnStatement();
    } else if (currentToken.type === T.IF_KEYWORD) {
      return parseIfStatement();
    } else {
      return parseExpressionStatement();
    }
  }

  function parseIfStatement() {
    const start = markStartPosition();
    assertToken([T.IF_KEYWORD]);
    nextNonWhitespaceToken();
    assertToken([T.LEFT_PARENTHESIS]);
    nextNonWhitespaceToken();
    const test = parseExpression();
    skipWhitespace();
    assertToken([T.RIGHT_PARENTHESIS]);
    nextNonWhitespaceToken();
    const consequent = parseBlock();
    const alternate = undefined;
    return new ast.IfStatement(...markEndPosition(start), test, consequent, alternate);
  }

  function parseReturnStatement() {
    const start = markStartPosition();
    assertToken([T.RETURN_KEYWORD]);
    nextNonWhitespaceToken();
    const argument = parseExpression();
    skipWhitespace();
    assertToken([T.SEMICOLON]);
    nextToken();
    return new ast.ReturnStatement(...markEndPosition(start), argument);
  }

  function parseFunctionDeclaration() {
    const start = markStartPosition();
    assertToken([T.FUNCTION_KEYWORD]);
    nextNonWhitespaceToken();
    const id = parseIdentifier();
    skipWhitespace();
    const params = parseFunctionDeclarationParams();
    skipWhitespace();
    const body = parseBlock();
    return new ast.FunctionDeclaration(...markEndPosition(start), id, params, body);
  }

  function parseBlock() {
    const start = markStartPosition();
    assertToken([T.LEFT_BRACES]);
    nextNonWhitespaceToken();

    const statements = [];

    while (currentToken.type !== T.RIGHT_BRACES) {
      statements.push(parseStatement());
      skipWhitespace();
    }

    assertToken([T.RIGHT_BRACES]);
    nextToken();

    return new ast.BlockStatement(...markEndPosition(start), statements);
  }

  function parseFunctionDeclarationParams() {
    assertToken([T.LEFT_PARENTHESIS]);
    nextNonWhitespaceToken();

    const params = [];

    while (currentToken.type !== T.RIGHT_PARENTHESIS) {
      params.push(parseExpression());

      skipWhitespace();
      assertToken([T.COMMA, T.RIGHT_PARENTHESIS]);

      if (currentToken.type === T.COMMA) {
        nextNonWhitespaceToken();
      }
    }

    assertToken([T.RIGHT_PARENTHESIS]);
    nextToken();

    return params;
  }

  function parseExpressionStatement() {
    const start = markStartPosition();
    const expression = parseExpression();
    skipWhitespace();
    assertToken([T.SEMICOLON]);
    nextToken();
    return new ast.ExpressionStatement(...markEndPosition(start), expression);
  }

  function parseVariableDeclaration() {
    const start = markStartPosition();
    assertToken([T.CONST_KEYWORD]);
    nextNonWhitespaceToken();
    const name = parseIdentifier();
    skipWhitespace();
    assertToken([T.EQUALS]);
    nextNonWhitespaceToken();
    const init = parseExpression();
    skipWhitespace();
    assertToken([T.SEMICOLON]);
    nextToken();
    return new ast.VariableDeclaration(...markEndPosition(start), name, init);
  }

  function parseIdentifier() {
    const start = markStartPosition();
    assertToken([T.WORD]);
    const pos = currentToken.pos;
    const name = currentToken.value;
    nextToken();
    return new ast.Identifier(...markEndPosition(start), name);
  }

  function parseExpression() {
    return parseBinaryExpression(parseUnaryExpression(), -1);
  }

  function parseUnaryExpression() {
    const start = markStartPosition();

    let result = parseExpressionAtom();

    while (true) {
      if (currentToken.type === T.DOT) {
        nextToken();
        const object = result;
        const property = parseExpressionAtom();
        result = new ast.MemberExpression(...markEndPosition(start), object, property);
      } else if (currentToken.type === T.LEFT_PARENTHESIS) {
        nextNonWhitespaceToken();
        const callee = result;
        const args = parseCallExpressionArguments();
        result = new ast.CallExpression(...markEndPosition(start), callee, args);
        assertToken([T.RIGHT_PARENTHESIS]);
        nextToken();
      } else {
        break;
      }
    }

    skipWhitespace();

    return result;
  }

  function parseExpressionAtom() {
    if (currentToken.type === T.WORD) {
      return parseIdentifier();
    } else if (currentToken.type === T.NUMBER) {
      return parseNumberLiteral();
    } else if (currentToken.type === T.LEFT_PARENTHESIS) {
      return parseParenthesesExpression();
    } else {
      throw unexpectedToken([T.WORD, T.NUMBER]);
    }
  }

  function parseParenthesesExpression() {
    const start = markStartPosition();
    assertToken([T.LEFT_PARENTHESIS]);
    nextNonWhitespaceToken();
    const expression = parseExpression();
    skipWhitespace();
    assertToken([T.RIGHT_PARENTHESIS]);
    nextToken();
    return new ast.ParenthesesExpression(...markEndPosition(start), expression);
  }

  function parseCallExpressionArguments() {
    const args = [];

    while (currentToken.type !== T.RIGHT_PARENTHESIS) {
      args.push(parseExpression());

      skipWhitespace();
      assertToken([T.COMMA, T.RIGHT_PARENTHESIS]);

      if (currentToken.type === T.COMMA) {
        nextNonWhitespaceToken();
      }
    }

    return args;
  }

  function parseBinaryExpression(left, minPrecedence) {
    const precedence = getPrecedence(currentToken.type);

    if (precedence !== undefined && precedence > minPrecedence) {
      const start = markStartPosition();

      const operation = currentToken.value;
      nextNonWhitespaceToken();

      const right = parseBinaryExpression(parseUnaryExpression(), precedence);

      const node = new ast.BinaryExpression(...markEndPosition(start), left, operation, right);

      return parseBinaryExpression(node, minPrecedence);
    }

    return left;
  }

  function parseNumberLiteral() {
    const start = markStartPosition();
    assertToken([T.NUMBER]);
    const pos = currentToken.pos;
    const raw = currentToken.value;
    const value = Number(raw);
    nextToken();
    return new ast.Literal(...markEndPosition(start), value, raw);
  }

  return parseProgram();
}

module.exports.parse = parse;
