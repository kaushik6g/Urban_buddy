const { validationResult } = require('express-validator');
const ApiError = require('../utils/apiError');

const validate = (req, _res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  return next(new ApiError(400, errors.array()[0].msg));
};

module.exports = validate;
