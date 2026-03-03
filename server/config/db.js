/**
 * Database Configuration
 * generated: config/db.js — MongoDB connection with Mongoose
 */

import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/thebakestories';
    
    const conn = await mongoose.connect(mongoURI, {
      // Mongoose 6+ doesn't need these options, but keeping for clarity
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Log database name
    console.log(`   Database: ${conn.connection.name}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Ensure MongoDB is running locally (mongod)');
    console.error('   2. Or set MONGO_URI to your MongoDB Atlas connection string');
    console.error('   3. Check network connectivity\n');
    
    // Don't exit in test environment
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
};

export default connectDB;
