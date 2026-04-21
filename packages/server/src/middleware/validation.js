const sendValidationError = (res, errors) => {
  return res.status(400).send({
    message: 'Validation error',
    errors,
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
