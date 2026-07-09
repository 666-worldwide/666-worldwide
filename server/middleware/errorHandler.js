const multer = require('multer');

function notFoundHandler(req, res, next) {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint not found.' });
  }
  return next();
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: `File too large. Maximum size is ${process.env.MAX_UPLOAD_MB || 5}MB.` });
    }
    return res.status(400).json({ error: err.message });
  }

  if (err && err.message && err.message.includes('Only image files')) {
    return res.status(400).json({ error: err.message });
  }

  console.error('Unhandled error:', err);
  const status = err.status || 500;
  const message = status === 500 ? 'Internal server error.' : err.message;
  return res.status(status).json({ error: message });
}

module.exports = { notFoundHandler, errorHandler };
