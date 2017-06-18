class Node {
  constructor(type, start, end, loc) {
    this.type = type;
    this.start = start;
    this.end = end;
    this.loc = loc;
  }
}

class Program extends Node {
  constructor(start, end, loc, statements) {
    super('Program', start, end, loc);
    this.statements = statements;
  }
}

class Expression extends Node {
}

class Identifier extends Expression {
  constructor(start, end, loc, name) {
    super('Identifier', start, end, loc);
    this.name = name;
  }
}

class Literal extends Expression {
  constructor(start, end, loc, value, raw) {
    super('Literal', start, end, loc);
    this.value = value;
    this.raw = raw;
  }
}

class ParenthesesExpression extends Expression {
  constructor(start, end, loc, expression) {
    super('ParenthesesExpression', start, end, loc);
    this.expression = expression;
  }
}

class BinaryExpression extends Expression {
  constructor(start, end, loc, left, operator, right) {
    super('BinaryExpression', start, end, loc);
    this.left = left;
    this.operator = operator;
    this.right = right;
  }
}

class CallExpression extends Expression {
  constructor(start, end, loc, callee, args) {
    super('CallExpression', start, end, loc);
    this.callee = callee;
    this.arguments = args;
  }
}

class Statement extends Node {
}

class VariableDeclaration extends Statement {
  constructor(start, end, loc, name, init) {
    super('VariableDeclaration', start, end, loc);
    this.name = name;
    this.init = init;
  }
}

class ExpressionStatement extends Statement {
  constructor(start, end, loc, expression) {
    super('ExpressionStatement', start, end, loc);
    this.expression = expression;
  }
}

class MemberExpression extends Expression {
  constructor(start, end, loc, object, property) {
    super('MemberExpression', start, end, loc);
    this.object = object;
    this.property = property;
  }
}

class FunctionDeclaration extends Statement {
  constructor(start, end, loc, id, params, body) {
    super('FunctionDeclaration', start, end, loc);
    this.id = id;
    this.params = params;
    this.body = body;
  }
}

class BlockStatement extends Statement {
  constructor(start, end, loc, body) {
    super('BlockStatement', start, end, loc);
    this.body = body;
  }
}

class ReturnStatement extends Statement {
  constructor(start, end, loc, argument) {
    super('ReturnStatement', start, end, loc);
    this.argument = argument;
  }
}

class IfStatement extends Statement {
  constructor(start, end, loc, test, consequent, alternate) {
    super('IfStatement', start, end, loc);
    this.test = test;
    this.consequent = consequent;
    this.alternate = alternate;
  }
}

module.exports.BinaryExpression = BinaryExpression;
module.exports.BlockStatement = BlockStatement;
module.exports.CallExpression = CallExpression;
module.exports.Expression = Expression;
module.exports.ExpressionStatement = ExpressionStatement;
module.exports.FunctionDeclaration = FunctionDeclaration;
module.exports.Identifier = Identifier;
module.exports.IfStatement = IfStatement;
module.exports.Literal = Literal;
module.exports.MemberExpression = MemberExpression;
module.exports.Node = Node;
module.exports.ParenthesesExpression = ParenthesesExpression;
module.exports.Program = Program;
module.exports.ReturnStatement = ReturnStatement;
module.exports.Statement = Statement;
module.exports.VariableDeclaration = VariableDeclaration;
