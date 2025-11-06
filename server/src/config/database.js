const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.NODE_ENV === 'test' 
      ? process.env.MONGODB_TEST_URI 
      : process.env.MONGODB_URI || 'mongodb://localhost:27017/mern_testing_app';
    
    const conn = await mongoose.connect(mongoURI);
    
    if (process.env.NODE_ENV !== 'test') {
      console.log(`🍃 MongoDB Connected: ${conn.connection.host}`);
    }
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;