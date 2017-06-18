const FunctionCode = require('../3-compiler').FunctionCode;
const writeFileSync = require('fs').writeFileSync;
const execSync = require('child_process').execSync;

function compile(fn) {
  const code = convert(fn);

  writeFileSync('temp.py', [
    'import marshal',
    'from types import CodeType',
    `c = ${code}`,
    // `print(c.co_code.hex())`,
    `x = marshal.dumps(c)`,
    `f = open('res.pyc', "wb+")`,
    `f.write(b'\\x33\\x0D\\x0D\\x0A')`,
    `f.write(b'\\x8F\\xB1\\x21\\x59')`,
    `f.write(b'\\x69\\x00\\x00\\x00')`,
    `f.write(x)`,
  ].join('\n') + '\n');
  return execSync(`python3 temp.py`).toString().trim();

  function covertArrayToTuple(arr) {
    const extraComma = arr.length === 1 ? ',' : '';
    return `(${arr.map(convert).join(', ')}${extraComma})`;
  }

  function convert(type) {
    if (type === undefined) {
      return 'None';
    } else if (typeof type === 'number') {
      return String(type);
    } else if (typeof type === 'string') {
      return convertString(type);
    } else if (type instanceof FunctionCode) {
      return convertCodeType(type);
    } else {
      console.log(type);
      throw new Error();
    }
  }

  function convertString(type) {
    return `"${type}"`;
  }

  function convertBuffer(buf) {
    const hex = buf.toString('hex').match(/.{1,2}/g)
      .map(x => `\\x${x}`)
      .join('');
    return `b'${hex}'`;
  }

  function convertBytecode(opcodes) {
    const arr = opcodes.reduce((acc, opcode) => {
      acc.push(opcodesMap[opcode.type]);
      const value = opcode.value === undefined ? 0 : opcode.value;
      acc.push(opcode.type === 'POP_JUMP_IF_FALSE' ? value * 2 : value);
      return acc;
    }, []);

    return `bytes([${arr.join(', ')}])`;
  }

  function convertCodeType(fn) {
    const argcount = fn.args.length;
    const kwonlyargcount = 0;
    const nlocals = fn.locals.length;
    const stacksize = 30;
    const flags = 64;
    const codestring = convertBytecode(fn.getOpcodes());
    const consts = covertArrayToTuple(fn.consts);
    const names = covertArrayToTuple(fn.names);
    const varnames = covertArrayToTuple(fn.locals);
    const filename = convertString('qwe.py');
    const name = convertString(fn.name);
    const firstlineno = 0;
    const lnotab = convertBuffer(Buffer.from('00', 'hex'));
    const freevars = covertArrayToTuple([]);
    const cellvars = covertArrayToTuple([]);

    const args = [
      argcount,
      kwonlyargcount,
      nlocals,
      stacksize,
      flags,
      codestring,
      consts,
      names,
      varnames,
      filename,
      name,
      firstlineno,
      lnotab,
      freevars,
      cellvars,
    ].join(', ');

    return `CodeType(${args})`;
  }
}

var opcodesMap = {
  'POP_TOP': 1,
  'ROT_TWO': 2,
  'ROT_THREE': 3,
  'DUP_TOP': 4,
  'DUP_TOP_TWO': 5,
  'NOP': 9,
  'UNARY_POSITIVE': 10,
  'UNARY_NEGATIVE': 11,
  'UNARY_NOT': 12,
  'UNARY_INVERT': 15,
  'BINARY_MATRIX_MULTIPLY': 16,
  'INPLACE_MATRIX_MULTIPLY': 17,
  'BINARY_POWER': 19,
  'BINARY_MULTIPLY': 20,
  'BINARY_MODULO': 22,
  'BINARY_ADD': 23,
  'BINARY_SUBTRACT': 24,
  'BINARY_SUBSCR': 25,
  'BINARY_FLOOR_DIVIDE': 26,
  'BINARY_TRUE_DIVIDE': 27,
  'INPLACE_FLOOR_DIVIDE': 28,
  'INPLACE_TRUE_DIVIDE': 29,
  'GET_AITER': 50,
  'GET_ANEXT': 51,
  'BEFORE_ASYNC_WITH': 52,
  'INPLACE_ADD': 55,
  'INPLACE_SUBTRACT': 56,
  'INPLACE_MULTIPLY': 57,
  'INPLACE_MODULO': 59,
  'STORE_SUBSCR': 60,
  'DELETE_SUBSCR': 61,
  'BINARY_LSHIFT': 62,
  'BINARY_RSHIFT': 63,
  'BINARY_AND': 64,
  'BINARY_XOR': 65,
  'BINARY_OR': 66,
  'INPLACE_POWER': 67,
  'GET_ITER': 68,
  'GET_YIELD_FROM_ITER': 69,
  'PRINT_EXPR': 70,
  'LOAD_BUILD_CLASS': 71,
  'YIELD_FROM': 72,
  'GET_AWAITABLE': 73,
  'INPLACE_LSHIFT': 75,
  'INPLACE_RSHIFT': 76,
  'INPLACE_AND': 77,
  'INPLACE_XOR': 78,
  'INPLACE_OR': 79,
  'BREAK_LOOP': 80,
  'WITH_CLEANUP_START': 81,
  'WITH_CLEANUP_FINISH': 82,
  'RETURN_VALUE': 83,
  'IMPORT_STAR': 84,
  'SETUP_ANNOTATIONS': 85,
  'YIELD_VALUE': 86,
  'POP_BLOCK': 87,
  'END_FINALLY': 88,
  'POP_EXCEPT': 89,
  'HAVE_ARGUMENT': 90,
  'STORE_NAME': 90,
  'DELETE_NAME': 91,
  'UNPACK_SEQUENCE': 92,
  'FOR_ITER': 93,
  'UNPACK_EX': 94,
  'STORE_ATTR': 95,
  'DELETE_ATTR': 96,
  'STORE_GLOBAL': 97,
  'DELETE_GLOBAL': 98,
  'LOAD_CONST': 100,
  'LOAD_NAME': 101,
  'BUILD_TUPLE': 102,
  'BUILD_LIST': 103,
  'BUILD_SET': 104,
  'BUILD_MAP': 105,
  'LOAD_ATTR': 106,
  'COMPARE_OP': 107,
  'IMPORT_NAME': 108,
  'IMPORT_FROM': 109,
  'JUMP_FORWARD': 110,
  'JUMP_IF_FALSE_OR_POP': 111,
  'JUMP_IF_TRUE_OR_POP': 112,
  'JUMP_ABSOLUTE': 113,
  'POP_JUMP_IF_FALSE': 114,
  'POP_JUMP_IF_TRUE': 115,
  'LOAD_GLOBAL': 116,
  'CONTINUE_LOOP': 119,
  'SETUP_LOOP': 120,
  'SETUP_EXCEPT': 121,
  'SETUP_FINALLY': 122,
  'LOAD_FAST': 124,
  'STORE_FAST': 125,
  'DELETE_FAST': 126,
  'STORE_ANNOTATION': 127,
  'RAISE_VARARGS': 130,
  'CALL_FUNCTION': 131,
  'MAKE_FUNCTION': 132,
  'BUILD_SLICE': 133,
  'LOAD_CLOSURE': 135,
  'LOAD_DEREF': 136,
  'STORE_DEREF': 137,
  'DELETE_DEREF': 138,
  'CALL_FUNCTION_KW': 141,
  'CALL_FUNCTION_EX': 142,
  'SETUP_WITH': 143,
  'EXTENDED_ARG': 144,
  'LIST_APPEND': 145,
  'SET_ADD': 146,
  'MAP_ADD': 147,
  'LOAD_CLASSDEREF': 148,
  'BUILD_LIST_UNPACK': 149,
  'BUILD_MAP_UNPACK': 150,
  'BUILD_MAP_UNPACK_WITH_CALL': 151,
  'BUILD_TUPLE_UNPACK': 152,
  'BUILD_SET_UNPACK': 153,
  'SETUP_ASYNC_WITH': 154,
  'FORMAT_VALUE': 155,
  'BUILD_CONST_KEY_MAP': 156,
  'BUILD_STRING': 157,
  'BUILD_TUPLE_UNPACK_WITH_CALL': 158,
  'LOAD_METHOD': 160,
  'CALL_METHOD': 161,
};

module.exports.compile = compile;
