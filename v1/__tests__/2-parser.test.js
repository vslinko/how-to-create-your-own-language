const { tokenize } = require('../1-tokenizer');
const { parse } = require('../2-parser');

describe('parse', () => {
  it('should parse', () => {
    expect(parse(tokenize('(print (a))'))).toMatchSnapshot();
  });
});
