const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URL, {
      dbName: 'rag_knowledge_assistant',
    });
    console.log(`[MongoDB] Connected safely to: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB] Connection Failed! Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
