const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');
const { signToken } = require('../middleware/auth');

const SALT_ROUNDS = 12;

async function register(req, res, next) {
  try {
    const { fullName, email, password } = req.body;

    const existing = await userModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await userModel.createUser({ fullName, email, passwordHash });
    const token = signToken(user.id);

    return res.status(201).json({
      message: 'Registration successful. Welcome to 666 WORLDWIDE.',
      token,
      user: userModel.toPublicProfile(user)
    });
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signToken(user.id);
    return res.json({
      message: 'Login successful.',
      token,
      user: userModel.toPublicProfile(user)
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { register, login };
