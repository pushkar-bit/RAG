require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./middleware/logger');

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 5001;

// Connect to Database
connectDB();

// Core Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}));
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
});
