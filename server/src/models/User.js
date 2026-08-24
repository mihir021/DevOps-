const mongoose = require('mongoose');

// We never store the raw password - only a bcrypt hash of it (added in Step 0.5).
// `unique: true` on email creates a MongoDB index that rejects duplicate signups
// at the database level (in addition to any check we do in the controller).
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // adds createdAt / updatedAt automatically
  }
);

module.exports = mongoose.model('User', userSchema);
