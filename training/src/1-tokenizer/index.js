const T = {
  COMMA: 'COMMA',
  CONST_KEYWORD: 'CONST_KEYWORD',
  DOT: 'DOT',
  EOF: 'EOF',
  EQUALS: 'EQUALS',
  FUNCTION_KEYWORD: 'FUNCTION_KEYWORD',
  GT: 'GT',
  IF_KEYWORD: 'IF_KEYWORD',
  LEFT_BRACES: 'LEFT_BRACES',
  LEFT_PARENTHESIS: 'LEFT_PARENTHESIS',
  NUMBER: 'NUMBER',
  PLUS: 'PLUS',
  RETURN_KEYWORD: 'RETURN_KEYWORD',
  RIGHT_BRACES: 'RIGHT_BRACES',
  RIGHT_PARENTHESIS: 'RIGHT_PARENTHESIS',
  SEMICOLON: 'SEMICOLON',
  STAR: 'STAR',
  WORD: 'WORD',
  WHITESPACE: 'WHITESPACE',
};

const keywords = {
  function: T.FUNCTION_KEYWORD,
  const: T.CONST_KEYWORD,
  return: T.RETURN_KEYWORD,
  if: T.IF_KEYWORD,
};

class Token {
  constructor(type, value, start, end, loc) {
    this.type = type;
    this.value = value;
    this.start = start;
    this.end = end;
    this.loc = loc;
  }
}

function isWhitespace(char) {
  return /[ \n]/.test(char);
}

function isAlpha(char) {
  return /[A-Za-z]/.test(char);
}

function isNumeric(char) {
  return /[0-9]/.test(char);
}

function isPunctuationStart(char) {
  return /[.,=;+(){}*>]/.test(char);
}

class Tokenizer {
  constructor(file) {
    this.file = file;
    this.currentPosition = 0;
    this.currentLine = 1;
    this.currentColumn = 1;

    this.startPosition = this.currentPosition;
    this.startLocation = {line: this.currentLine, column: this.currentColumn};

    this.eofReached = false;
  }

  next() {
    if (this.eofReached) {
      return;
    }

    this.startPosition = this.currentPosition;
    this.startLocation = {line: this.currentLine, column: this.currentColumn};

    if (this.currentPosition === this.file.source.length) {
      return this._readEof();
    }

    const char = this.file.source[this.currentPosition];
    let value;

    if (isWhitespace(char)) {
      value = this._readWhitespace();
    } else if (isAlpha(char)) {
      value = this._readWord();
    } else if (isNumeric(char)) {
      value = this._readNumber();
    } else if (isPunctuationStart(char)) {
      value = this._readPunctuation();
    }

    if (value === undefined) {
      throw new Error(`Unexpected character "${char}" at position ${this.currentPosition}`);
    }

    return value;
  }

  _readPunctuation() {
    const char = this.file.source[this.currentPosition];
    this._nextChar();
    let type;

    switch (char) {
      case '.': type = T.DOT; break;
      case ',': type = T.COMMA; break;
      case ';': type = T.SEMICOLON; break;
      case '=': type = T.EQUALS; break;
      case '+': type = T.PLUS; break;
      case '*': type = T.STAR; break;
      case '(': type = T.LEFT_PARENTHESIS; break;
      case ')': type = T.RIGHT_PARENTHESIS; break;
      case '{': type = T.LEFT_BRACES; break;
      case '}': type = T.RIGHT_BRACES; break;
      case '>': type = T.GT; break;
    }

    return this._createToken(type, char);
  }

  _readNumber() {
    const string = this._readWhile(isNumeric);
    return this._createToken(T.NUMBER, string);
  }

  _readWord() {
    const string = this._readWhile(isAlpha);

    if (keywords[string]) {
      return this._createToken(keywords[string], string);
    }

    return this._createToken(T.WORD, string);
  }

  _readWhitespace() {
    const string = this._readWhile(isWhitespace);
    return this._createToken(T.WHITESPACE, string);
  }

  _readEof() {
    this.eofReached = true;
    return this._createToken(T.EOF, undefined);
  }

  _readWhile(test) {
    let string = '';

    while (true) {
      if (this.currentPosition === this.file.source.length) {
        return string;
      }

      const char = this.file.source[this.currentPosition];

      if (test(char)) {
        string += char;
        this._nextChar();
      } else {
        return string;
      }
    }
  }

  _createToken(type, value) {
    return new Token(
      type,
      value,
      this.startPosition,
      this.currentPosition,
      {
        start: this.startLocation,
        end: {
          line: this.currentLine,
          column: this.currentColumn,
        },
      }
    );
  }

  _nextChar() {
    const char = this.file.source[this.currentPosition];
    this.currentPosition++;

    if (char === '\n') {
      this.currentLine++;
      this.currentColumn = 1;
    } else {
      this.currentColumn++;
    }
  }

  [Symbol.iterator]() {
    return tokenizer(this.file);
  }
}

function* tokenizer(file) {
  const t = new Tokenizer(file);

  while (true) {
    const value = t.next();

    if (value === undefined) {
      break;
    }

    yield value;
  }
}

function getPrecedence(type) {
  if (type === T.GT) {
    return 7;
  } else if (type === T.PLUS) {
    return 9;
  } else if (type === T.STAR) {
    return 10;
  }
}

module.exports.T = T;
module.exports.Token = Token;
module.exports.Tokenizer = Tokenizer;
module.exports.tokenizer = tokenizer;
module.exports.getPrecedence = getPrecedence;
