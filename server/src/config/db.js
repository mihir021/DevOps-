const mongoose = require('mongoose');

// Connects to MongoDB using the URI from .env (MONGODB_URI).
// The URI already includes the database name (`devops`) at the end,
// e.g. mongodb+srv://user:pass@cluster.mongodb.net/devops
async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not set. Check your server/.env file.');
  }

  await mongoose.connect(uri);
  console.log('MongoDB connected:', mongoose.connection.name);
}

module.exports = connectDB;
