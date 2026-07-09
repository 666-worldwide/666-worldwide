const userModel = require('../models/userModel');

async function getMe(req, res, next) {
  try {
    const user = await userModel.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.json({ user: userModel.toPublicProfile(user) });
  } catch (err) {
    return next(err);
  }
}

async function updateMe(req, res, next) {
  try {
    const { fullName, bio } = req.body;
    const updated = await userModel.updateProfile(req.userId, {
      fullName: fullName !== undefined ? fullName.trim() : undefined,
      bio: bio !== undefined ? bio.trim() : undefined
    });
    if (!updated) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.json({ message: 'Profile updated.', user: userModel.toPublicProfile(updated) });
  } catch (err) {
    return next(err);
  }
}

async function uploadPhoto(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No photo file was provided.' });
    }
    const updated = await userModel.updatePhoto(req.userId, req.file.filename);
    if (!updated) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.json({ message: 'Photo uploaded.', user: userModel.toPublicProfile(updated) });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getMe, updateMe, uploadPhoto };
