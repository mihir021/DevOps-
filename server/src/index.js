// Load variables from .env into process.env (MONGODB_URI, JWT_SECRET, PORT).
// This must run before anything else that reads process.env.
require('dotenv').config({ quiet: true });

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB first, then start listening for requests.
// If the DB connection fails, we don't want the server pretending to be healthy.
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
