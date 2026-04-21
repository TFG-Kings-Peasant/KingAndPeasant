const NAME_MIN_LENGTH = 3;
const NAME_MAX_LENGTH = 30;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 72;
const EMAIL_MAX_LENGTH = 254;

const isNonEmptyString = (value) => typeof value === 'string' && value.trim() !== '';
const isValidEmail = (value) => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const normalizeName = (value) => typeof value === 'string' ? value.trim() : value;
const normalizeEmail = (value) => typeof value === 'string' ? value.trim().toLowerCase() : value;
const normalizePassword = (value) => typeof value === 'string' ? value.trim() : value;

export const validateRegisterBody = (body) => {
  const normalizedData = {
    name: normalizeName(body?.name),
    email: normalizeEmail(body?.email),
    password: normalizePassword(body?.password),
  };

  const errors = [];

  if (!isNonEmptyString(normalizedData.name)) {
    errors.push('Name is required');
  }

  if (isNonEmptyString(normalizedData.name) && normalizedData.name.length < NAME_MIN_LENGTH) {
    errors.push(`Name must be at least ${NAME_MIN_LENGTH} characters`);
  }

  if (isNonEmptyString(normalizedData.name) && normalizedData.name.length > NAME_MAX_LENGTH) {
    errors.push(`Name must be at most ${NAME_MAX_LENGTH} characters`);
  }

  if (!isValidEmail(normalizedData.email)) {
    errors.push('Email must be a valid email address');
  }

  if (isNonEmptyString(normalizedData.email) && normalizedData.email.length > EMAIL_MAX_LENGTH) {
    errors.push(`Email must be at most ${EMAIL_MAX_LENGTH} characters`);
  }

  if (!isNonEmptyString(normalizedData.password)) {
    errors.push('Password is required');
  }

  if (isNonEmptyString(normalizedData.password) && normalizedData.password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }

  if (isNonEmptyString(normalizedData.password) && normalizedData.password.length > PASSWORD_MAX_LENGTH) {
    errors.push(`Password must be at most ${PASSWORD_MAX_LENGTH} characters`);
  }

  return { data: normalizedData, errors };
};

export const validateLoginBody = (body) => {
  const normalizedData = {
    email: normalizeEmail(body?.email),
    password: normalizePassword(body?.password),
  };

  const errors = [];

  if (!isValidEmail(normalizedData.email)) {
    errors.push('Email must be a valid email address');
  }

  if (isNonEmptyString(normalizedData.email) && normalizedData.email.length > EMAIL_MAX_LENGTH) {
    errors.push(`Email must be at most ${EMAIL_MAX_LENGTH} characters`);
  }

  if (!isNonEmptyString(normalizedData.password)) {
    errors.push('Password is required');
  }

  return { data: normalizedData, errors };
};

export const validateEditProfileBody = (body) => {
  const { name, email, password } = body ?? {};

  const hasName = name !== undefined;
  const hasEmail = email !== undefined;
  const hasPassword = password !== undefined;

  const normalizedData = {
    name: hasName ? normalizeName(name) : undefined,
    email: hasEmail ? normalizeEmail(email) : undefined,
    password: hasPassword ? normalizePassword(password) : undefined,
  };

  const errors = [];

  if (!hasName && !hasEmail && !hasPassword) {
    errors.push('At least one field (name, email, password) must be provided');
  }

  if (hasName && !isNonEmptyString(normalizedData.name)) {
    errors.push('Name must be a non-empty string');
  }

  if (hasName && isNonEmptyString(normalizedData.name) && normalizedData.name.length < NAME_MIN_LENGTH) {
    errors.push(`Name must be at least ${NAME_MIN_LENGTH} characters`);
  }

  if (hasName && isNonEmptyString(normalizedData.name) && normalizedData.name.length > NAME_MAX_LENGTH) {
    errors.push(`Name must be at most ${NAME_MAX_LENGTH} characters`);
  }

  if (hasEmail && !isValidEmail(normalizedData.email)) {
    errors.push('Email must be a valid email address');
  }

  if (hasEmail && isNonEmptyString(normalizedData.email) && normalizedData.email.length > EMAIL_MAX_LENGTH) {
    errors.push(`Email must be at most ${EMAIL_MAX_LENGTH} characters`);
  }

  if (hasPassword && !isNonEmptyString(normalizedData.password)) {
    errors.push('Password must be a non-empty string');
  }

  if (hasPassword && isNonEmptyString(normalizedData.password) && normalizedData.password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }

  if (hasPassword && isNonEmptyString(normalizedData.password) && normalizedData.password.length > PASSWORD_MAX_LENGTH) {
    errors.push(`Password must be at most ${PASSWORD_MAX_LENGTH} characters`);
  }

  return { data: normalizedData, errors };
};
