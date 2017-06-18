const { tokenize } = require('../1-tokenizer');
const { parse } = require('../2-parser');
const { compile } = require('../3-compiler');
const { Scope, evaluate } = require('../4-interpreter');

describe('evaluate', () => {
  it('should evaluate', () => {
    const log = [];
    const randomValue = 42;

    const scope = new Scope();

    scope.set('print', (arg) => {
      log.push(arg);
    });

    scope.set('a', () => {
      return randomValue;
    });

    evaluate(compile(parse(tokenize('(print (a))'))), scope);

    expect(log).toMatchSnapshot();
  });
});
