# Auth0 JWT Authentication Setup Guide

This AR Sticker app now supports Auth0 JWT authentication. You can use it to:
- Limit uploads to authenticated users
- Track which user created each sticker
- Implement user dashboards and analytics
- Protect API endpoints with Auth0 tokens

## Setup Steps

### 1. Create Auth0 Account
- Go to https://auth0.com
- Sign up for a free account
- Create a new tenant (your domain)

### 2. Configure Frontend Application

#### 2.1 Create Auth0 Application
1. In Auth0 Dashboard, go to **Applications** > **Applications**
2. Click **Create Application**
3. Name it: `V-Sticker Web`
4. Choose: **Single Page Application**
5. Select **React** as the technology

#### 2.2 Update Application Settings
1. Go to your app **Settings** tab
2. Under **Application URIs**, set:
   - **Allowed Callback URLs**: `http://localhost:3000/callback, https://yourdomain.com/callback`
   - **Allowed Logout URLs**: `http://localhost:3000, https://yourdomain.com`
   - **Allowed Web Origins**: `http://localhost:3000, https://yourdomain.com`

3. Copy your:
   - **Domain**: `your-auth0-domain.auth0.com`
   - **Client ID**: (long string)

4. Add to `frontend/.env.local`:
   ```
   NEXT_PUBLIC_AUTH0_DOMAIN=your-auth0-domain.auth0.com
   NEXT_PUBLIC_AUTH0_CLIENT_ID=your-client-id
   NEXT_PUBLIC_AUTH0_AUDIENCE=http://localhost:5000
   NEXT_PUBLIC_AUTH0_REDIRECT_URI=http://localhost:3000/callback
   ```

### 3. Configure Backend API

#### 3.1 Create Auth0 API
1. In Auth0 Dashboard, go to **Applications** > **APIs**
2. Click **Create API**
3. Name it: `V-Sticker API`
4. Identifier: `http://localhost:5000` (or your API URL)
5. Signing Algorithm: **RS256**

#### 3.2 Add to Backend .env
```
AUTH0_DOMAIN=your-auth0-domain.auth0.com
AUTH0_AUDIENCE=http://localhost:5000
```

### 4. Test Authentication

#### 4.1 Frontend Login
1. Start frontend: `npm run dev` (in `/frontend`)
2. Go to http://localhost:3000
3. Click **Login** button
4. You'll be redirected to Auth0 login
5. Create an account or use an existing one
6. You'll be redirected back to the app

#### 4.2 Backend Token Verification
1. After login, your token is automatically stored
2. When you upload a sticker, the token is sent in the `Authorization` header
3. Backend verifies the token and associates the sticker with your user

### 5. Protect API Endpoints

#### 5.1 Optional Protection (current setup)
By default, endpoints use `auth0OptionalMiddleware`, which:
- Accepts requests with or without tokens
- Decorates request with user info if valid token is present
- `req.user` contains: `{ id, email, name }`

#### 5.2 Require Authentication
To require Auth0 on an endpoint:

```javascript
import { auth0Middleware } from './middleware/auth0.js';

// Protect this route - Auth0 token required
app.post('/api/upload', auth0Middleware, uploadController);
```

#### 5.3 Check User in Controller
```javascript
export const uploadSticker = async (req, res) => {
  const userId = req.user?.id; // From Auth0 token
  
  if (userId) {
    // Associate sticker with user
    stickerData.ownerId = userId;
  }
  
  // ... rest of upload logic
};
```

## Usage in Frontend Components

### 1. Using Auth0 Hook
```typescript
import { useAuth0 } from '@auth0/auth0-react';

export function MyComponent() {
  const { user, isLoading, isAuthenticated, logout } = useAuth0();
  
  if (isLoading) return <div>Loading...</div>;
  
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return (
    <div>
      <p>Welcome, {user.name}</p>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}
```

### 2. Getting Auth0 Token for API Calls
```typescript
import { useAuth0Token } from '@/hooks/useAuth0Token';
import { apiCall } from '@/lib/api-auth0';

export function UploadComponent() {
  const { getToken } = useAuth0Token();
  
  async function handleUpload() {
    const token = await getToken();
    const result = await apiCall('/api/upload', {
      method: 'POST',
      body: formData,
    }, token);
  }
  
  return <button onClick={handleUpload}>Upload</button>;
}
```

### 3. Using API Hook with Auto-Token
```typescript
import { useApiWithAuth0 } from '@/lib/api-auth0';

export function MyComponent() {
  const { apiCall } = useApiWithAuth0();
  
  async function fetchData() {
    const result = await apiCall('/api/some-endpoint');
    // Token is automatically included if available
  }
  
  return <button onClick={fetchData}>Fetch Data</button>;
}
```

## Troubleshooting

### Login Not Working
- Check browser console for errors
- Verify `NEXT_PUBLIC_AUTH0_DOMAIN` and `NEXT_PUBLIC_AUTH0_CLIENT_ID` are set
- Make sure callback URL is in Auth0 Application settings

### Token Not Validated on Backend
- Check `AUTH0_DOMAIN` and `AUTH0_AUDIENCE` in backend `.env`
- Verify token includes `aud` claim matching `AUTH0_AUDIENCE`
- Check backend logs for `[Auth0]` messages

### 401 Unauthorized on Protected Endpoints
- Make sure `Authorization: Bearer <token>` header is sent
- Token might be expired - request a new one
- Check CORS settings if frontend is on different domain

## Files Created/Modified

**New Files:**
- `frontend/src/lib/auth0-config.ts` - Auth0 configuration
- `frontend/src/components/Auth0ProviderWrapper.tsx` - Provider wrapper
- `frontend/src/components/AuthButton.tsx` - Login/Logout button
- `frontend/src/app/callback/page.tsx` - Auth0 callback handler
- `frontend/src/hooks/useAuth0Token.ts` - Hook for getting tokens
- `frontend/src/lib/api-auth0.ts` - API utilities for Auth0
- `backend/src/middleware/auth0.js` - JWT verification middleware

**Modified Files:**
- `frontend/src/app/layout.tsx` - Added Auth0Provider wrapper
- `backend/src/app.js` - Added auth0OptionalMiddleware
- `backend/.env` - Added AUTH0_DOMAIN and AUTH0_AUDIENCE
- `frontend/.env.local` - Added Auth0 configuration (create if missing)

## Optional: Add Login Button to Header

Update your Header component:

```typescript
import { AuthButton } from '@/components/AuthButton';

export function Header() {
  return (
    <header className="flex justify-between items-center">
      <h1>V-Sticker</h1>
      <AuthButton />
    </header>
  );
}
```

## Next Steps

1. Test login/logout flow
2. Update your Sticker model to include `ownerId` field
3. Add user dashboard page
4. Implement upload limits per user
5. Track analytics per user

For more info: https://auth0.com/docs/quickstart/spa/react/01-login
