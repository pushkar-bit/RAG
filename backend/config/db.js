const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGODB_URL) {
    console.error('[MongoDB] ❌ MONGODB_URL environment variable is not set. Database features will be unavailable.');
    return; // Keep server alive so it can still respond with proper errors
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URL, {
      dbName: 'rag_knowledge_assistant',
      serverSelectionTimeoutMS: 10000, // Fail fast instead of hanging for 30s
    });
    console.log(`[MongoDB] ✅ Connected safely to: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB] ❌ Connection Failed: ${error.message}`);
    console.error('[MongoDB] Server will continue running but database operations will fail.');
    // Do NOT call process.exit(1) — a dead server cannot send CORS headers,
    // making all errors look like CORS errors to the browser.
  }
};

module.exports = connectDB;
