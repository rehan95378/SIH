const mongoose = require('mongoose');

const connectDB = async () => {
  let uri = process.env.MONGODB_URI;
  if (!uri && process.env.NODE_ENV !== 'production') {
    uri = 'mongodb://localhost:27017/ertmac_nwis';
  }

  if (uri) {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 1500,
        socketTimeoutMS: 10000,
        connectTimeoutMS: 1500,
      });
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.warn('⚠️ Local/Configured MongoDB connection failed:', error.message);
      console.log('🔄 Launching In-Memory MongoDB Server fallback...');
    }
  }

  try {
    const initMockDb = require('./mockDb');
    await initMockDb();
    console.log('🚀 In-Memory Data Store is active and ready for requests!');
  } catch (memErr) {
    console.error('❌ Failed to initialize In-Memory Store:', memErr.message);
  }
};

module.exports = connectDB;
