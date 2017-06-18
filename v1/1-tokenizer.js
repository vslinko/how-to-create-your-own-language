const TokenType = {
  LEFT_PAREN: 'LEFT_PAREN',
  RIGHT_PAREN: 'RIGHT_PAREN',
  WORD: 'WORD',
  NUMBER: 'NUMBER',
  WHITESPACE: 'WHITESPACE',
  EOF: 'EOF',
};

function isWhitespaceChar(char) {
  return /\s/.test(char);
}

function isNumberChar(char) {
  return /[0-9]/.test(char);
}

function isWordChar(char) {
  return /[a-z]/i.test(char);
}

class Token {
  constructor(type, value) {
    this.type = type;
    this.value = value;
  }
}

class Tokenizer {
  constructor(sourceCode) {
    this.sourceCode = sourceCode;
  }

  tokenize() {
    this.tokens = [];
    this.currentPosition = 0;

    while (this.currentPosition < this.sourceCode.length) {
      const char = this.sourceCode[this.currentPosition];

      if (char === '(') {
        this.tokens.push(new Token(TokenType.LEFT_PAREN, char));
        this.currentPosition++;

      } else if (char === ')') {
        this.tokens.push(new Token(TokenType.RIGHT_PAREN, char));
        this.currentPosition++;

      } else if (isWhitespaceChar(char)) {
        this.tokens.push(new Token(TokenType.WHITESPACE, this.readWhile(isWhitespaceChar)));

      } else if (isNumberChar(char)) {
        this.tokens.push(new Token(TokenType.NUMBER, this.readWhile(isNumberChar)));

      } else if (isWordChar(char)) {
        this.tokens.push(new Token(TokenType.WORD, this.readWhile(isWordChar)));

      } else {
        throw new Error(`Unknown character "${char}" at position ${i}`);
      }
    }

    this.tokens.push(new Token(TokenType.EOF, ''));

    return this.tokens;
  }

  readWhile(test) {
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

    return value;
  }
}

function tokenize(sourceCode) /*: token[] */ {
  const tokenizer = new Tokenizer(sourceCode);
  return tokenizer.tokenize();
}

module.exports = {
  TokenType,
  tokenize,
};
