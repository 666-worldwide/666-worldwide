const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegistration(req, res, next) {
  const { fullName, email, password } = req.body || {};

  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
    return res.status(400).json({ error: 'Full name must be at least 2 characters.' });
  }
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  req.body.fullName = fullName.trim();
  req.body.email = email.trim();
  return next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  return next();
}

function validateProfileUpdate(req, res, next) {
  const { fullName, bio } = req.body || {};
  if (fullName !== undefined && (typeof fullName !== 'string' || fullName.trim().length < 2)) {
    return res.status(400).json({ error: 'Full name must be at least 2 characters.' });
  }
  if (bio !== undefined && typeof bio !== 'string') {
    return res.status(400).json({ error: 'Bio must be text.' });
  }
  if (bio !== undefined && bio.length > 2000) {
    return res.status(400).json({ error: 'Bio must be under 2000 characters.' });
  }
  return next();
}

module.exports = { validateRegistration, validateLogin, validateProfileUpdate };
