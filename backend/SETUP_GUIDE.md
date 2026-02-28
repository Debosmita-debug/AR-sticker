# Backend Setup & Installation Guide

## ✅ Installation Complete!

All dependencies have been installed successfully. The backend is ready to run!

## 🚀 Quick Start

### Step 1: Configure Environment Variables

Copy and customize the `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and configure these **required** variables:

```env
# Database (choose one option below)
MONGODB_URI=mongodb://localhost:27017/ar-sticker-db
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ar-sticker-db

# Cloudinary (sign up at https://cloudinary.com - free tier available)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# JWT Secrets (generate random strings)
JWT_SECRET=your-random-secret-key-at-least-32-characters-long
JWT_REFRESH_SECRET=your-random-refresh-secret-key-at-least-32-characters-long

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Email (optional, for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@arsticker.com
```

### Step 2: Setup MongoDB

Choose one option:

**Option A: Local MongoDB (Recommended for Development)**
1. Download MongoDB Community Server: https://www.mongodb.com/try/download/community
2. Install and start MongoDB
3. Use default connection: `mongodb://localhost:27017/ar-sticker-db`

**Option B: MongoDB Atlas (Cloud - No Installation)**
1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string: `mongodb+srv://user:password@cluster.mongodb.net/ar-sticker-db`
4. Paste in `.env` as `MONGODB_URI`

### Step 3: Start the Server

**Development Mode** (with auto-reload):
```bash
npm run dev
```

**Production Mode**:
```bash
npm start
```

Server will start on port 5000 (or custom `PORT` in `.env`)

Expected output:
```
Server running on port 5000 in development mode
MongoDB connected successfully
```

## 📝 API Testing

Once running, test the API:

### Health Check
```bash
curl http://localhost:5000/health
```

### API Info
```bash
curl http://localhost:5000/api
```

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"securepass123"}'
```

### Upload Sticker
```bash
curl -X POST http://localhost:5000/api/upload \
  -F "image=@image.jpg" \
  -F "video=@video.mp4" \
  -F 'options={"caption":"My Sticker","loop":true}'
```

## 🔧 Configuration Reference

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| MONGODB_URI | ✅ | localhost | MongoDB connection string |
| CLOUDINARY_CLOUD_NAME | ✅ | - | Cloudinary cloud name |
| CLOUDINARY_API_KEY | ✅ | - | Cloudinary API key |
| CLOUDINARY_API_SECRET | ✅ | - | Cloudinary API secret |
| JWT_SECRET | ✅ | - | Secret for access tokens |
| JWT_REFRESH_SECRET | ✅ | - | Secret for refresh tokens |
| FRONTEND_URL | ✅ | http://localhost:3000 | CORS origin |
| PORT | ❌ | 5000 | Server port |
| NODE_ENV | ❌ | development | Environment |
| MAX_IMAGE_SIZE_MB | ❌ | 5 | Max image size |
| MAX_VIDEO_SIZE_MB | ❌ | 50 | Max video size |
| LOG_LEVEL | ❌ | info | Log verbosity |
| SMTP_HOST | ❌ | - | Email server |
| SMTP_PORT | ❌ | 587 | Email port |
| SMTP_USER | ❌ | - | Email username |
| SMTP_PASS | ❌ | - | Email password |
| SMTP_FROM | ❌ | - | Email From address |

## 🗂️ Project Structure

```
backend/
├── server.js                 # Entry point
├── package.json              # Dependencies
├── .env.example              # Environment template
├── .env                      # Your config (not committed)
└── src/
    ├── app.js                # Express setup
    ├── controllers/          # Request handlers
    ├── middleware/           # Express middleware
    ├── models/              # Mongoose schemas
    ├── routes/              # API routes
    ├── services/            # Business logic
    └── utils/               # Helper functions
```

## 🚨 Troubleshooting

### "MongoDB connection error"
→ Start MongoDB or configure `MONGODB_URI` with Atlas URL in `.env`

### "Cannot find module 'X'"
→ Run `npm install` to install dependencies

### "Port 5000 already in use"
→ Change `PORT` in `.env` or kill process on port 5000

### "Cloudinary upload failed"
→ Check your Cloudinary credentials in `.env`

### "CORS error from frontend"
→ Update `FRONTEND_URL` in `.env` to match your frontend URL

## 📚 API Documentation

Full API documentation available in [README.md](./README.md)

### Key Endpoints
- `POST /api/upload` - Upload sticker
- `GET /ar/:id` - Get AR data
- `POST /api/scan/:id` - Record scan
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/dashboard` - Get user dashboard

## 🔐 Security Notes

- Never commit `.env` file (already in `.gitignore`)
- Use strong, random JWT secrets (at least 32 characters)
- Keep Cloudinary API secret private
- Enable HTTPS in production
- Use environment-specific configs

## 📦 Dependencies Installed

- **express** - Web framework
- **mongoose** - MongoDB ODM
- **cloudinary** - Cloud storage
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing
- **express-rate-limit** - Rate limiting
- **express-fileupload** - File uploads
- **fluent-ffmpeg** - Video compression
- **helmet** - Security headers
- **cors** - Cross-origin support
- **file-type** - MIME validation
- **pino** - Structured logging
- **nodemailer** - Email service

## 💡 Next Steps

1. Setup MongoDB (local or Atlas)
2. Get Cloudinary credentials (free account)
3. Configure `.env` file
4. Run `npm run dev` to start
5. Test with curl or Postman
6. Connect to your frontend

## 📞 Support

For issues:
1. Check `.env` configuration
2. Verify MongoDB is running
3. Check logs in terminal output
4. Review README.md for API details

## 📄 File Sizes and Limits

- Max image: 5 MB (JPG/PNG)
- Max video: 50 MB (MP4/WebM)
- Video auto-compresses to 15 MB
- Scan history: Last 1000 records per sticker

## 🎯 What's Built

✅ Complete AR sticker upload pipeline  
✅ Image + video processing with CloudDinary  
✅ MindAR .mind file generation  
✅ JWT authentication (access + refresh tokens)  
✅ User dashboard with sticker management  
✅ Scan tracking and analytics  
✅ Rate limiting and security headers  
✅ Error handling and logging  
✅ Email notifications (optional)  
✅ Password-protected stickers  
✅ Sticker expiration with TTL  

Enjoy! 🚀
