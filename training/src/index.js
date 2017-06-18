const fs = require('fs');
const path = require('path');
const prettyPrintAst = require('ast-pretty-print');

const File = require('./0-utils/file').File;
const Tokenizer = require('./1-tokenizer').Tokenizer;
const parse = require('./2-parser').parse;
const compile = require('./3-compiler').compile;
const OP = require('./3-compiler').OP;
const FunctionCode = require('./3-compiler').FunctionCode;
const Scope = require('./4-iterpreter').Scope;
const run = require('./4-iterpreter').run;
const NativeFunctionValue = require('./4-iterpreter').NativeFunctionValue;
const ObjectValue = require('./4-iterpreter').ObjectValue;
const undefinedValue = require('./4-iterpreter').undefinedValue;
const optimize = require('./5-optimizer').optimize;
const compilePyc = require('./6-pyc').compile;

function prettyPrintTokens(tokens) {
  return tokens.map(token => {
    return (
      '\033[1;37m' + token.type + '\033[0m'
      + (token.value === undefined ? '' : ' \033[0;32m' + JSON.stringify(token.value) + '\033[0m')
      + ` \u001B[2m(${token.loc.start.line}:${token.loc.start.column},${token.loc.end.line}:${token.loc.end.column})\u001B[22m`
    );
  }).join('\n');
}

function prepend(value, length) {
  if (length < 2) length = 2;
  const p = new Array(length).fill('0');
  return (p + value).slice(-length);
}

function prettyPrintContext(functions) {
  const nameRef = [
    OP.LOAD_ATTR, OP.LOAD_GLOBAL,
  ];
  const localRef = [
    OP.STORE_FAST, OP.LOAD_FAST,
  ];
  const constRef = [
    OP.LOAD_CONST, OP.COMPARE_OP,
  ];
  const opRef = [
    OP.POP_JUMP_IF_FALSE,
  ];

  function printName(name) {
    if (name === undefined) {
      return 'undefined';
    } else if (typeof name === 'number') {
      return name;
    } else if (typeof name === 'string') {
      return `'${name}'`;
    } else if (name instanceof FunctionCode) {
      return (name.name || '') + '()';
    } else {
      throw new Error();
    }
  }

  return (
    functions.map((fn) => {
      const opcodes = fn.getOpcodes();
      const opcodesMaxIndexLength = String(opcodes.length - 1).length;
      const constsMaxIndexLength = String(fn.consts.length - 1).length;
      const namesMaxIndexLength = String(fn.names.length - 1).length;
      const localsMaxIndexLength = String(fn.locals.length - 1).length;

      return (
        '\033[1;37mFUNCTION' + '\033[0m' + (
          fn.name === undefined ? '' : ' \033[0;32m' + fn.name + '\033[0m'
        ) + '\n' +
        (fn.consts.length === 0 ? '' : '  consts:\n' + fn.consts.map((value, index) => {
          return '    \u001B[2m' + prepend(index, constsMaxIndexLength) + '\u001B[22m \033[0;32m' + printName(value) + '\033[0m';
        }).join('\n') + '\n') +
        (fn.names.length === 0 ? '' : '  names:\n' + fn.names.map((name, index) => {
          return '    \u001B[2m' + prepend(index, namesMaxIndexLength) + '\u001B[22m \033[0;32m' + printName(name) + '\033[0m';
        }).join('\n') + '\n') +
        (fn.locals.length === 0 ? '' : '  locals:\n' + fn.locals.map((name, index) => {
          return '    \u001B[2m' + prepend(index, localsMaxIndexLength) + '\u001B[22m \033[0;32m' + printName(name) + '\033[0m';
        }).join('\n') + '\n') +
        opcodes.map((opcode, index) => {
          let name;
          let value;

          if (constRef.indexOf(opcode.type) >= 0) {
            value = prepend(opcode.value, namesMaxIndexLength);
            name = printName(fn.consts[opcode.value]);
          } else if (nameRef.indexOf(opcode.type) >= 0) {
            value = prepend(opcode.value, namesMaxIndexLength);
            name = printName(fn.names[opcode.value]);
          } else if (localRef.indexOf(opcode.type) >= 0) {
            value = prepend(opcode.value, localsMaxIndexLength);
            name = printName(fn.locals[opcode.value]);
          } else if (opRef.indexOf(opcode.type) >= 0) {
            value = prepend(opcode.value, opcodesMaxIndexLength);
          } else {
            value = opcode.value;
          }

          return (
            '  \u001B[2m' + prepend(index, opcodesMaxIndexLength) + '\u001B[22m'
            + ' \033[1;37m' + opcode.type + '\033[0m'
            + (value === undefined ? '' : ' \033[0;32m' + value + '\033[0m')
            + (name === undefined ? '' : ' \u001B[2m' + name + '\u001B[22m')
          );
        }).join('\n')
      );
    }).join('\n\n')
  );
}

const line = new Array(80).fill('=').join('');

function evaluateFile(filePath) {
  const fileSource = fs.readFileSync(filePath).toString();

  const file = new File(filePath, fileSource);

  const tokenizer = new Tokenizer(file);

  console.log(line);
  console.log(prettyPrintTokens(Array.from(new Tokenizer(file))));
  console.log(line);

  const program = parse(tokenizer);

  console.log(prettyPrintAst(program, true));
  console.log(line);

  const fn = compile(program);

  function collectFunctions(fn) {
    function _collectFunctions(fn, acc) {
      acc.push(fn);
      return fn.consts.reduce((acc, item) => {
        if (item instanceof FunctionCode) {
          _collectFunctions(item, acc);
        }
        return acc;
      }, acc);
    }

    return _collectFunctions(fn, [])
  }

  console.log(prettyPrintContext(collectFunctions(fn)));
  console.log(line);

  function logValues(values) {
    console.log(values.map(value => value.getRawString()).join(' '));
  }

  const _print = new NativeFunctionValue('log', [], (scope, args) => {
    logValues(args);
    return undefinedValue;
  });
  const scope = new Scope();
  scope.set('print', _print);

  const result = run(fn, scope);

  console.log(line);
  logValues([result]);

  const res = compilePyc(fn);
  if (res.length > 0) {
    console.log(res);
  }
  console.log(line);
}

evaluateFile(path.join(__dirname, 'myapp.example.js'));
