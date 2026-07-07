export const PASSWORD_HINT = 'At least 8 characters with letters and numbers.'
export const PASSWORD_MIN_LENGTH = 8

export const validatePassword = (password) => {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`
  }
  if (!/[A-Za-z]/.test(password)) {
    return 'Password must include at least one letter.'
  }
  if (!/\d/.test(password)) {
    return 'Password must include at least one number.'
  }
  return null
}
