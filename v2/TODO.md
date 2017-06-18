# outline

- [ ] example
- [ ] tokenizer
  - [ ] constants
  - [ ] token class
  - [ ] checks
  - [ ] tokenizer
    - [ ] tokenize
    - [ ] readWhile
- [ ] parser
  - [ ] classes
  - [ ] parser
    - [ ] nextToken
    - [ ] throwUnexpectedToken
    - [ ] assertCurrentToken
    - [ ] parse
    - [ ] parseX
- [ ] compiler
  - [ ] function class
    - [ ] name
    - [ ] args
    - [ ] opcodes
    - [ ] locals # локально определенное имя
    - [ ] consts # константы (в том числе подфункции)
    - [ ] names # имена аттрибутов, глобальных переменных
    - [ ] defineLocal
    - [ ] defineConst
    - [ ] defineName
  - [ ] constants
- [ ] interpreter
  - [ ] stack
  - [ ] scope
  - [ ] interpreter class
    - [ ] fn, scope, stack
    - [ ] running, currentPosition



# release 1

CONST_KEYWORD
EOF
EQUALS
NUMBER
PLUS
SEMICOLON
WORD
COMMA
WHITESPACE
LEFT_PARENTHESIS
RIGHT_PARENTHESIS

Node
Program Node
Expression Node
Identifier Expression
Literal Expression
BinaryExpression Expression
CallExpression Expression
Statement Node
VariableDeclaration Statement
ExpressionStatement Statement

LOAD_CONST
STORE_FAST
LOAD_FAST
BINARY_ADD
CALL_FUNCTION
LOAD_GLOBAL

```js
const x = 1;
const y = 2;
const z = x + y;
print(z);
```

# release 2

FUNCTION_KEYWORD
LEFT_BRACES
RIGHT_BRACES
RETURN_KEYWORD

FunctionDeclaration Statement
BlockStatement Statement
ReturnStatement Statement

MAKE_FUNCTION
POP_TOP
RETURN_VALUE

```js
function add(a, b) {
  return a + b;
}

const x = 1;
const y = 2;
const z = add(x, y);
print(z);
```

# release 3

IF_KEYWORD
GT

IfStatement Statement

POP_JUMP_IF_FALSE

```js
function add(a, b) {
  return a + b;
}

const x = 1;
const y = 2;
const z = add(x, y);

if (z > 2) {
  print(0);
} else {
  print(1);
}
```
