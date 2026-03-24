const supabase = require('../config/supabase');

const randomCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

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
