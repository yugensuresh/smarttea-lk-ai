const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value) {
  return EMAIL_RE.test(String(value).trim());
}

export function passwordStrength(password) {
  const value = String(password);
  if (!value) return { score: 0, label: "Enter a password", tone: "muted" };

  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;

  if (score <= 1) return { score: 1, label: "Weak", tone: "weak" };
  if (score <= 3) return { score: 2, label: "Fair", tone: "fair" };
  if (score === 4) return { score: 3, label: "Good", tone: "good" };
  return { score: 4, label: "Strong", tone: "strong" };
}

export function meetsPasswordPolicy(password) {
  const value = String(password);
  return (
    value.length >= 8 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /\d/.test(value)
  );
}

export function validateLogin({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = "Email is required.";
  else if (!isValidEmail(email)) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Password is required.";
  return errors;
}

export function validateSignUp({ fullName, email, password, confirmPassword }) {
  const errors = {};
  if (!fullName.trim()) errors.fullName = "Full name is required.";
  if (!email.trim()) errors.email = "Email is required.";
  else if (!isValidEmail(email)) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Password is required.";
  else if (!meetsPasswordPolicy(password)) {
    errors.password = "Use at least 8 characters with upper, lower, and a number.";
  }
  if (!confirmPassword) errors.confirmPassword = "Confirm your password.";
  else if (confirmPassword !== password) errors.confirmPassword = "Passwords do not match.";
  return errors;
}
