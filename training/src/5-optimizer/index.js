const OP = require('../3-compiler').OP;
const Opcode = require('../3-compiler').Opcode;

function optimize(opcodes) {
  const newOpcodes = [];

  for (let i = 0; i < opcodes.length; i++) {
    const opcode = opcodes[i];

    if (opcode.type === OP.BINARY_ADD) {
      const left = newOpcodes[newOpcodes.length - 2];
      const right = newOpcodes[newOpcodes.length - 1];

      if (left.type === OP.PUSH_LITERAL && right.type === OP.PUSH_LITERAL) {
        newOpcodes.splice(-2);
        newOpcodes.push(new Opcode(OP.PUSH_LITERAL, left.value + right.value));
        continue;
      }
    }

    if (opcode.type === OP.BINARY_MULTIPLY) {
      const left = newOpcodes[newOpcodes.length - 2];
      const right = newOpcodes[newOpcodes.length - 1];

      if (left.type === OP.PUSH_LITERAL && right.type === OP.PUSH_LITERAL) {
        newOpcodes.splice(-2);
        newOpcodes.push(new Opcode(OP.PUSH_LITERAL, left.value * right.value));
        continue;
      }
    }

    newOpcodes.push(opcode);
  }

  return newOpcodes;
}

module.exports.optimize = optimize;
