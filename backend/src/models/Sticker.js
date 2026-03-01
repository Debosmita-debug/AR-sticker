import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const stickerSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    // Auth0 user ID (optional - if user is authenticated via Auth0)
    auth0UserId: {
      type: String,
      default: null,
      index: true,
      sparse: true // Allows null values without unique constraint violation
    },
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required']
    },
    videoUrl: {
      type: String,
      required: [true, 'Video URL is required']
    },
    mindFileUrl: {
      type: String,
      required: [true, '.mind file URL is required']
    },
    cloudinaryImageId: String,
    cloudinaryVideoId: String,
    cloudinaryMindId: String,
    options: {
      loop: {
        type: Boolean,
        default: true
      },
      caption: String,
      password: String, // hashed password
      expiryDays: {
        type: Number,
        default: 30
      }
    },
    scanCount: {
      type: Number,
      default: 0
    },
    lastScannedAt: Date,
    scanHistory: [
      {
        timestamp: { type: Date, default: Date.now },
        userAgent: String,
        ip: String,
        country: String
      }
    ],
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    expiresAt: {
      type: Date,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// TTL index for automatic deletion of expired stickers
stickerSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Hash password if provided
stickerSchema.pre('save', async function (next) {
  if (!this.isModified('options.password') || !this.options.password) {
    next();
    return;
  }

  try {
    const salt = await bcryptjs.genSalt(10);
    this.options.password = await bcryptjs.hash(this.options.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to verify password
stickerSchema.methods.verifyPassword = async function (enteredPassword) {
  if (!this.options.password) return true; // No password set
  return await bcryptjs.compare(enteredPassword, this.options.password);
};

// Method to check if sticker is expired
stickerSchema.methods.isExpired = function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// Method to increment scan count and log metadata
stickerSchema.methods.recordScan = function (userAgent, ip, country) {
  this.scanCount += 1;
  this.lastScannedAt = new Date();
  
  if (this.scanHistory.length >= 1000) {
    this.scanHistory = this.scanHistory.slice(-999);
  }
  
  this.scanHistory.push({
    timestamp: new Date(),
    userAgent,
    ip,
    country
  });
};

export default mongoose.model('Sticker', stickerSchema);
