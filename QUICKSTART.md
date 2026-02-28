# AR Sticker Platform - Quick Start Guide

## Project Structure
```
.
├── backend/          # Express.js API server (port 5000)
│   ├── src/
│   ├── server.js
│   └── .env
├── frontend/         # Next.js UI (port 3000)
│   ├── src/app/      # Pages (upload, scanner, dashboard)
│   ├── src/hooks/    # React hooks (useUpload, useAuth)
│   └── env.local     # Frontend env vars
```

## Prerequisites
- Node.js 18+
- MongoDB (local or Atlas URI)
- Cloudinary account (for image/video hosting)

## Backend Setup

1. **Navigate to backend:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure `.env` (copy from `.env.example`):**
```bash
cp .env.example .env
```

4. **Update `.env` with your values:**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/ar-sticker-db
JWT_SECRET=change_me_in_production
JWT_REFRESH_SECRET=change_me_in_production
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@yourdomain.com
```

5. **Start backend:**
```bash
npm run dev
```
✅ Backend running at `http://localhost:5000`

## Frontend Setup

1. **In another terminal, navigate to frontend:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Verify `env.local` has:**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

4. **Start frontend:**
```bash
npm run dev
```
✅ Frontend running at `http://localhost:3000`

## Testing the Integration

### 1. Create a Sticker
- Open http://localhost:3000/upload-creation
- Upload a target image (JPG/PNG, max 15MB)
- Upload an AR video (MP4/WebM, max 100MB)
- Click **Generate AR Sticker**
- You should see a success response with the sticker ID

### 2. Scan a Sticker
- Open http://localhost:3000/ar-scanner?id=<sticker-id>
- Grant camera permission
- Point at the target image
- AR video should play

### 3. View Sticker Details
- Open http://localhost:3000/ar-experience?id=<sticker-id>
- Should display sticker metadata

### 4. Login (Optional)
- POST to `http://localhost:5000/api/auth/login`
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
- Token stored in-memory (not localStorage)

## Common Issues

### "Can't resolve '@/components/ui/Appicon'"
- Make sure `src/components/ui/Appicon.tsx` exists
- The file was recently patched to use correct casing

### Backend returns 404
- Check backend is running on port 5000
- Verify `CORS_ORIGIN` in `.env` matches frontend URL
- Check MongoDB is running

### Camera doesn't work in AR Scanner
- Must use HTTPS in production (browsers require it for camera access)
- localhost/127.0.0.1 are exempt from HTTPS requirement
- Safari iOS may need additional permissions

### Upload fails
- Check Cloudinary credentials in backend `.env`
- Verify file sizes are under limits (image 15MB, video 100MB)
- Check MongoDB connection

## Email / SendGrid (Optional)

You don't need SendGrid — the backend uses Nodemailer with SMTP. You can:

### Option 1: Use Gmail SMTP
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_specific_password  # Generate in Google Account settings
```

### Option 2: Use SendGrid SMTP
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your_sendgrid_api_key
```

### Option 3: Skip email for now
Leave SMTP values empty — transactional emails just won't send.

## Production Deployment

### Frontend (Vercel, Netlify, etc.)
```bash
npm run build
npm start
```
Set environment variable: `NEXT_PUBLIC_API_URL=https://your-backend.com`

### Backend (Railway, Render, Heroku, etc.)
```bash
npm install
npm start
```
Set environment variables (see `.env.example`)

## Architecture

**Frontend → Backend Communication:**
- Fetch API (not Next.js API routes)
- Direct calls to backend endpoints
- In-memory JWT tokens (no cookies/localStorage)
- CORS enabled on backend

**Key Endpoints Used:**
- `POST /api/upload` — Create sticker
- `GET /ar/:id` — Get sticker data
- `POST /api/auth/login` — Login user
- `GET /api/auth/dashboard` — Get user's stickers
- `POST /api/scan/:id` — Track scan

## Next Steps

1. ✅ Backend running?
2. ✅ Frontend running?
3. ✅ Can upload stickers?
4. ✅ Can scan with camera?

If yes to all → **You're ready!** 🎉

For issues, check:
- Browser console (frontend errors)
- Backend logs (API errors)
- Network tab (request/response details)
