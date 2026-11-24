const { randomInt } = require('node:crypto');
const supabase = require('../config/supabase');

const codeAlphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const randomCode = () =>
  Array.from({ length: 6 }, () => codeAlphabet[randomInt(codeAlphabet.length)]).join('');

const generateUniqueCommunityCode = async () => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = randomCode();
    const { data, error } = await supabase
      .from('communities')
      .select('id')
      .eq('code', code)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return code;
    }
  }

  throw new Error('Unable to generate unique community code. Please retry.');
};

module.exports = {
  generateUniqueCommunityCode,
};
