const TokenType = {
  CONST_KEYWORD: 'CONST_KEYWORD',
  EQUALS: 'EQUALS',
  PLUS: 'PLUS',
  SEMICOLON: 'SEMICOLON',
  LEFT_PAREN: 'LEFT_PAREN',
  RIGHT_PAREN: 'RIGHT_PAREN',
  WORD: 'WORD',
  WHITESPACE: 'WHITESPACE',
  NUMBER: 'NUMBER',
  EOF: 'EOF',
  COMMA: 'COMMA',
}

class Token {
  constructor(type, value) {
    this.type = type;
    this.value = value;
  }
}

function isWhitespace(char) {
  return /[ \n]/.test(char);
}

function isNumber(char) {
  return /[0-9]/.test(char);
}

function isWordCharacter(char) {
  return /[a-zA-Z]/.test(char);
}

class Tokenizer {
  constructor(sourceCode) {
    this.sourceCode = sourceCode;
  }

  tokenize() {
    this.currentPosition = 0;
    this.tokens = [];

    while (this.currentPosition < this.sourceCode.length) {
      const char = this.sourceCode[this.currentPosition];

      if (isWhitespace(char)) {
        this.readWhile(isWhitespace, TokenType.WHITESPACE);

      } else if (isWordCharacter(char)) {
        this.readWhile(isWordCharacter, TokenType.WORD);

      } else if (isNumber(char)) {
        this.readWhile(isNumber, TokenType.NUMBER);

      } else if (char === '=') {
        this.tokens.push(new Token(TokenType.EQUALS, char));
        this.currentPosition++;

      } else if (char === '+') {
        this.tokens.push(new Token(TokenType.PLUS, char));
        this.currentPosition++;

      } else if (char === ';') {
        this.tokens.push(new Token(TokenType.SEMICOLON, char));
        this.currentPosition++;

      } else if (char === '(') {
        this.tokens.push(new Token(TokenType.LEFT_PAREN, char));
        this.currentPosition++;

      } else if (char === ')') {
        this.tokens.push(new Token(TokenType.RIGHT_PAREN, char));
        this.currentPosition++;

      } else if (char === ',') {
        this.tokens.push(new Token(TokenType.COMMA, char));
        this.currentPosition++;

      } else {
        throw new Error(`Unexpected character ${char}`);
      }
    }

    this.tokens.push(new Token(TokenType.EOF, undefined));

    return this.tokens;
  }

  readWhile(test, type) {
    let value = '';

    while (true) {
      const char = this.sourceCode[this.currentPosition];

      if (test(char)) {
        value += char;
        this.currentPosition++;
      } else {
        break;
      }
    }

    if (value === 'const') {
      this.tokens.push(new Token(
        TokenType.CONST_KEYWORD,
        value
      ));
    } else {
      this.tokens.push(new Token(
        type,
        value
      ));
    }
  }
}

function tokenize(sourceCode) {
  const tokenizer = new Tokenizer(sourceCode);
  return tokenizer.tokenize();
}

module.exports = {
  Token,
  TokenType,
  tokenize,
}
