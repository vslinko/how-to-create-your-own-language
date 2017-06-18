const { tokenize } = require('../1-tokenizer');

describe('tokenize', () => {
  it('should tokenize', () => {
    expect(tokenize('(print (a))')).toMatchSnapshot();
  });
});
