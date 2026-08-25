const mongoose = require('mongoose');

// Connects to MongoDB Atlas using the URI from .env (MONGODB_URI).
// Example URI format: mongodb+srv://username:password@cluster0.mongodb.net/dbname?retryWrites=true&w=majority
async function connectDB() {
  const uri = process.env.MONGODB_URI;

  // 1. Check if MONGODB_URI is provided
  if (!uri || !uri.trim()) {
    throw new Error(
      '\n' +
      '======================================================================\n' +
      '❌ MONGODB_URI is missing!\n\n' +
      '👉 HOW TO FIX:\n' +
      '1. Open your server/.env (or root .env) file.\n' +
      '2. Set MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/<database_name>?retryWrites=true&w=majority\n' +
      '3. In MongoDB Atlas, whitelist your IP in Security -> Network Access.\n' +
      '======================================================================\n'
    );
  }

  // 2. Check if the URI still contains unconfigured placeholders
  if (uri.includes('<username>') || uri.includes('<password>') || uri.includes('<database>')) {
    throw new Error(
      '\n' +
      '======================================================================\n' +
      '❌ MONGODB_URI contains unconfigured placeholder values (<username>/<password>)!\n\n' +
      '👉 HOW TO FIX:\n' +
      '1. Open server/.env (or root .env).\n' +
      '2. Replace <username> and <password> with your actual MongoDB Atlas database credentials.\n' +
      '3. Ensure the database name is specified before query parameters (e.g., ...mongodb.net/my_db?retryWrites=true).\n' +
      '======================================================================\n'
    );
  }

  try {
    await mongoose.connect(uri);
    console.log(`✅ MongoDB Atlas connected successfully! (Database: ${mongoose.connection.name})`);
  } catch (err) {
    let extraHelp = '';
    if (err.message && err.message.includes('querySrv ENOTFOUND')) {
      extraHelp = '\n💡 Tip: DNS lookup failed for your cluster URL. Double-check your cluster address in MONGODB_URI.';
    } else if (err.message && (err.message.includes('bad auth') || err.message.includes('Authentication failed'))) {
      extraHelp = '\n💡 Tip: Authentication failed. Verify your database username and password in MongoDB Atlas -> Database Access.';
    } else if (err.name === 'MongooseServerSelectionError') {
      extraHelp = '\n💡 Tip: Connection timed out. Make sure your IP address (or 0.0.0.0/0) is whitelisted in MongoDB Atlas -> Network Access.';
    }

    throw new Error(
      '\n' +
      '======================================================================\n' +
      `❌ Failed to connect to MongoDB Atlas: ${err.message}${extraHelp}\n\n` +
      '👉 Checklist:\n' +
      '  • Verify database username & password in MONGODB_URI.\n' +
      '  • Check MongoDB Atlas -> Network Access (IP Whitelist / 0.0.0.0/0).\n' +
      '======================================================================\n',
      { cause: err }
    );
  }
}

module.exports = connectDB;

