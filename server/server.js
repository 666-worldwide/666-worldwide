require('dotenv').config();

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const { initializeDatabase } = require('./config/init');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const agentRoutes = require('./routes/agentRoutes');
const healthRoutes = require('./routes/healthRoutes');
const { UPLOAD_DIR } = require('./middleware/upload');

const REQUIRED_ENV_VARS = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnvVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
if (missingEnvVars.length > 0) {
  console.error(`FATAL: Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"]
      }
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Static frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

// Serve uploaded passport photos
app.use('/uploads', express.static(UPLOAD_DIR));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/agents', agentRoutes);
app.use('/health', healthRoutes);

// Fallback: serve index.html for unmatched non-API GET requests (simple multi-page routing safety net)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
    return next();
  }
  return res.sendFile(path.join(__dirname, '..', 'public', 'index.html'), (err) => {
    if (err) next(err);
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`666 WORLDWIDE server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('FATAL: Failed to start server:', err);
    process.exit(1);
  }
}

start();

module.exports = app;
