// Simple, dependency-free validation for the auth routes.
// Kept as plain regex/functions so it's easy to read while learning -
// in a bigger app you'd likely use a library like `zod` or `joi` instead.

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password) {
  // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  return pattern.test(password);
}

function validateSignup(req, res, next) {
  const { name, email, password } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Name is required.' });
  }

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ message: 'A valid email is required.' });
  }

  if (!password || !isValidPassword(password)) {
    return res.status(400).json({
      message:
        'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.',
    });
  }

  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  next();
}

module.exports = { validateSignup, validateLogin, isValidEmail, isValidPassword };
