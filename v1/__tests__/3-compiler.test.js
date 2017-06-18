const { tokenize } = require('../1-tokenizer');
const { parse } = require('../2-parser');
const { compile } = require('../3-compiler');

describe('compile', () => {
  it('should compile', () => {
    expect(compile(parse(tokenize('(print (a))')))).toMatchSnapshot();
  });
});
