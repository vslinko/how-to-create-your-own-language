const astPrettyPrint = require('ast-pretty-print');
const fs = require('fs');
const { tokenize } = require('./1-tokenizer');
const { parse } = require('./2-parser');
const { compile } = require('./3-compiler');
const { Scope, evaluate } = require('./4-interpreter');

const sourceCode = fs.readFileSync('./example.lisp', 'utf8');

const tokens = tokenize(sourceCode);

console.log(tokens);

const ast = parse(tokens);

console.log(astPrettyPrint(ast, true));

const opcodes = compile(ast);

console.log(opcodes);

const scope = new Scope();
scope.set('print', function(arg) {
  console.log(arg);
});
scope.set('add', (a, b) => {
  return a + b;
});

evaluate(opcodes, scope);
