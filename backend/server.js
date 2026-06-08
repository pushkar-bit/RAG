require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./middleware/logger');

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 5001;

// Allowed origins — add any new deployment URLs here
const ALLOWED_ORIGINS = [
  'https://rag-lac-ten.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    const isAllowed = ALLOWED_ORIGINS.includes(origin) || 
                      origin.endsWith('.vercel.app') || 
                      /^http:\/\/localhost(:\d+)?$/.test(origin);

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from: ${origin}`);
      callback(null, false); // Return false instead of throwing error to keep response format clean
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Connect to Database
connectDB();

// Handle all preflight OPTIONS requests before any other middleware
// Express 5 no longer supports bare '*' wildcard — use regex instead
app.options(/.*/, cors(corsOptions));

// Core Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: false, limit: '20mb' }));
app.use(logger);

// Status route
app.get('/api/status', (req, res) => {
  res.json({ success: true, message: 'RAG Knowledge Assistant API is running' });
});

// API Routes
app.use('/api/documents', require('./routes/document.routes'));
app.use('/api/chat', require('./routes/chat.routes'));
app.use('/api/evaluation', require('./routes/evaluation.routes'));

// Global Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[🚀 Server] RAG Knowledge Assistant backend is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);

  // Pre-warm the embedding model so the first upload doesn't time out on Render
  const { generateEmbeddings } = require('./services/embedding.service');
  generateEmbeddings(['warmup'])
    .then(() => console.log('[🔥 Server] Embedding model pre-warmed successfully.'))
    .catch((err) => console.warn('[⚠️  Server] Embedding pre-warm failed (will retry on first request):', err.message));
});
