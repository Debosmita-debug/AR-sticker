# AR Sticker Backend API

A complete Node.js/Express.js backend for an AR Video Sticker Platform with MongoDB, Cloudinary integration, and MindAR support.

## 📋 Features

- **Upload API**: Handle image + video uploads with compression and validation
- **AR Pages**: Serve dynamic AR viewer data with password protection
- **Scan Tracking**: Track and log scan events with analytics
- **Authentication**: JWT-based user registration and login
- **Rate Limiting**: Per-endpoint rate limiting to prevent abuse
- **File Validation**: Magic byte validation for file types
- **Password Protection**: Optional password-protected stickers
- **Scan Analytics**: Track scans by country, date, and user agent
- **Email Notifications**: Transactional email support
- **Security**: Helmet.js, CORS, input sanitization

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ 
- MongoDB (local or Atlas)
- Cloudinary account (free tier works)
- SMTP credentials for emails (optional)

### Installation

```bash
npm install
```

### Environment Setup

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

**Required environment variables:**
- `MONGODB_URI` - MongoDB connection string
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` 
- `JWT_SECRET`, `JWT_REFRESH_SECRET` - Generate strong random strings
- `FRONTEND_URL` - Your frontend URL (e.g., `http://localhost:3000`)

### Development

```bash
npm run dev
```

Server runs on port 5000 (configurable via `PORT` env var).

### Production

```bash
npm start
```

## 📚 API Endpoints

### Upload Management

**POST /api/upload**
- Upload image + video and create sticker
- Multipart form-data with: `image`, `video`, `options`
- Rate limited: 10/hour per IP, 100/hour for Pro users
- Returns: `{ id, arPageUrl, scanPageUrl, expiresAt }`

**GET /api/upload/:id/status**
- Check upload status
- Returns: `{ status, createdAt, expiresAt, scanCount }`

### AR Viewer

**GET /ar/:id**
- Get sticker data for AR viewer
- Optional query: `?password=<pwd>` for protected stickers
- Returns: `{ imageUrl, videoUrl, mindFileUrl, options }`

**GET /ar/:id/metadata**
- Get public sticker metadata (no image/video URLs)
- Returns: `{ caption, isPasswordProtected, scanCount, daysUntilExpiry }`

**DELETE /ar/:id**
- Delete sticker (requires authentication)
- Requires ownership

### Scan Tracking

**POST /api/scan/:id**
- Record a scan event
- Rate limited: 100/minute per IP
- Returns: `{ scanCount, lastScannedAt }`

**GET /api/scan/:id/analytics** (Auth required)
- Get scan analytics for your sticker
- Returns: `{ totalScans, countryStats, dailyScans, recentScans }`

**POST /api/scan/:id/reset-count** (Auth required)
- Reset scan count and history
- Owner only

### Authentication

**POST /api/auth/register**
- Register new user
- Body: `{ email, password }`
- Returns: `{ user, accessToken, refreshToken }`

**POST /api/auth/login**
- Login user
- Body: `{ email, password }`
- Returns: `{ user, accessToken, refreshToken }`

**POST /api/auth/refresh**
- Refresh access token
- Body: `{ refreshToken }`
- Returns: `{ accessToken }`

**GET /api/auth/dashboard** (Auth required)
- Get user's stickers and stats
- Returns: `{ user, stickers, totalStickers, plan }`

**GET /api/auth/dashboard/stats** (Auth required)
- Get user statistics
- Returns: `{ totalStickers, totalScans, estimatedStorage, recentStickers }`

**DELETE /api/sticker/:id** (Auth required)
- Delete a sticker
- Owner only

## 🔐 Security Features

- **Helmet.js** - Security headers
- **CORS** - Configure allowed origins
- **Rate Limiting** - Per-endpoint protection
- **JWT** - Secure token authentication
- **Magic Byte Validation** - Real MIME type checking (not extension-based)
- **Password Hashing** - bcryptjs for user passwords and sticker passwords
- **Signed URLs** - Cloudinary URLs with TTL
- **Input Sanitization** - DOMPurify for text inputs

## 📊 Database Schema

### User
```javascript
{
  email: String (unique),
  passwordHash: String (bcrypted),
  stickers: [ObjectId], // References to Sticker
  plan: String, // 'free' | 'pro' | 'enterprise'
  lastLogin: Date,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Sticker
```javascript
{
  id: String (unique, nanoid),
  owner: ObjectId (ref User), // null for anonymous
  imageUrl: String,
  videoUrl: String,
  mindFileUrl: String,
  options: {
    loop: Boolean,
    caption: String,
    password: String (hashed),
    expiryDays: Number
  },
  scanCount: Number,
  scanHistory: [{
    timestamp: Date,
    userAgent: String,
    ip: String,
    country: String
  }],
  cloudinaryImageId: String,
  cloudinaryVideoId: String,
  cloudinaryMindId: String,
  createdAt: Date,
  expiresAt: Date,
  isActive: Boolean,
  updatedAt: Date
}
```

## 🛠️ File Structure

```
backend/
├── src/
│   ├── controllers/        # Request handlers
│   │   ├── uploadController.js
│   │   ├── arController.js
│   │   └── scanController.js
│   ├── middleware/         # Express middleware
│   │   ├── auth.js
│   │   ├── rateLimiter.js
│   │   ├── fileValidator.js
│   │   └── passwordProtect.js
│   ├── models/             # Mongoose schemas
│   │   ├── User.js
│   │   └── Sticker.js
│   ├── routes/             # Route handlers
│   │   ├── upload.js
│   │   ├── ar.js
│   │   ├── scan.js
│   │   └── user.js
│   ├── services/           # Business logic
│   │   ├── cloudinaryService.js
│   │   ├── mindARService.js
│   │   └── emailService.js
│   ├── utils/              # Utility functions
│   │   ├── generateId.js
│   │   ├── compressVideo.js
│   │   └── logger.js
│   └── app.js              # Express setup
├── server.js               # Entry point
├── package.json
├── .env.example
└── .gitignore
```

## 🔧 Configuration

### Rate Limiting
```env
UPLOAD_RATE_LIMIT=10              # Uploads per window
UPLOAD_RATE_WINDOW_MS=3600000     # 1 hour
SCAN_RATE_LIMIT=100               # Scans per window
SCAN_RATE_WINDOW_MS=60000         # 1 minute
```

### File Size Limits
```env
MAX_IMAGE_SIZE_MB=5
MAX_VIDEO_SIZE_MB=50
```

### JWT Tokens
```env
JWT_EXPIRY=1d
JWT_REFRESH_EXPIRY=7d
```

## 📝 Example Requests

### Upload Sticker
```bash
curl -X POST http://localhost:5000/api/upload \
  -F "image=@image.jpg" \
  -F "video=@video.mp4" \
  -F 'options={"caption":"My Sticker","expiryDays":30,"loop":true}'
```

### Get AR Data
```bash
curl http://localhost:5000/ar/sticker_abc123?password=optional
```

### Record Scan
```bash
curl -X POST http://localhost:5000/api/scan/sticker_abc123 \
  -H "Content-Type: application/json"
```

### Register & Login
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"securepass"}'
```

## 🚨 Error Handling

All endpoints return consistent JSON responses:

**Success:**
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

## 📦 Dependencies

- **express** - Web framework
- **mongoose** - MongoDB ODM
- **cloudinary** - Cloud storage
- **jsonwebtoken** - JWT auth
- **bcryptjs** - Password hashing
- **express-rate-limit** - Rate limiting
- **express-fileupload** - File uploads
- **fluent-ffmpeg** - Video compression
- **nodemailer** - Email service
- **helmet** - Security headers
- **pino** - Logging
- **file-type** - MIME validation

## 🧪 Testing

```bash
npm test
```

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please submit pull requests.

## 📞 Support

For issues, please open a GitHub issue or contact the development team.
