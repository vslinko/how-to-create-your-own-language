const fs = require('fs');
const tokenizer = require('./1-tokenizer');
const parser = require('./2-parser');
const compiler = require('./3-compiler');
const interpreter = require('./4-interpreter');

const sourceCode = fs.readFileSync('./example.js').toString();

const tokens = tokenizer.tokenize(sourceCode);

console.log(tokens);

const ast = parser.parse(tokens);

console.log(
  require('util').inspect(ast, {depth: null})
);

const fn = compiler.compile(ast);

console.log(fn);

interpreter.run(fn);
