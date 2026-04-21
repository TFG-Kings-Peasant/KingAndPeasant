const sendValidationError = (res, errors) => {
  return res.status(400).json({
    message: 'Validation error',
    code: 'VALIDATION_ERROR',
    errors: errors.map(err => ({
      code: 'INVALID_FIELD',
      message: err
    })),
  });
};

export const validateBody = (validator) => {
  return (req, res, next) => {
    const { data, errors } = validator(req.body);

    if (errors.length > 0) {
      return sendValidationError(res, errors);
    }

    req.validatedBody = data;
    return next();
  };
};
