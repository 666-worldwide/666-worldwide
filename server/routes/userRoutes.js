const express = require('express');
const { getMe, updateMe, uploadPhoto } = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');
const { validateProfileUpdate } = require('../middleware/validate');
const { upload } = require('../middleware/upload');

const router = express.Router();

router.get('/me', requireAuth, getMe);
router.put('/me', requireAuth, validateProfileUpdate, updateMe);
router.post('/photo', requireAuth, upload.single('photo'), uploadPhoto);

module.exports = router;
