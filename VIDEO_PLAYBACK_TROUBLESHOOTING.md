# Video Playback Troubleshooting Guide

If videos still aren't playing after scanning, follow this debugging guide.

## Quick Diagnostics

1. **Open your browser's Developer Console** (F12)
2. Look for logs with `[Video]` and `[AR]` prefixes
3. Check the Network tab for video file loading

## Common Issues & Fixes

### Issue 1: Video File Not Loading ("❌ Video loading error")

**What it means:** The browser couldn't download the video file.

**Check:**
- Look in Console for error messages
- Go to Network tab → Filter by "Videos"
- Watch for failed requests to the video URL

**Fixes:**
- Verify Cloudinary credentials in backend `.env`
- Check CORS settings in Cloudinary dashboard
- Ensure video was uploaded properly (check Cloudinary Media Library)

**Console Example:**
```
❌ Video loading error: {
  networkState: 2,  // 2 = failed to load
  errorCode: 4,  // 4 = unsupported format
}
```

---

### Issue 2: Video Loads But Won't Play ("[Video] Can play" but no playback)

**What it means:** Browser downloaded the video but autoplay was blocked or playback failed.

**Why it happens:**
- Browser autoplay policy requires `muted: true` (already set ✓)
- Video format not supported (MP4 vs WebM)
- Error during play() promise execution

**Check Console for:**
```
[Video] Can play
[Video] ✗ Play failed: NotAllowedError
```

**Fixes:**
1. Ensure videos are **H.264 MP4 format** (not WebM)
2. Compress videos if they're large:
   ```bash
   ffmpeg -i input.mp4 -c:v libx264 -preset fast -crf 22 output.mp4
   ```
3. Test playback in Cloudinary directly:
   - Go to Cloudinary dashboard
   - Find your video in Media Library
   - Click it and test playback

---

### Issue 3: Video Starts But Doesn't Show ("opacity: 0" never changes)

**What it means:** Video texture is created but fade-in animation doesn't work.

**Check:**
- Does `[AR] Video plane added to scene` appear in logs?
- Is MindAR continuing to render?

**Fixes:**
1. Open DevTools → Elements (Inspector)
2. Look for `<canvas>` element
3. Verify it's visible and not hidden by CSS
4. Check if THREE.js animation loop is running

---

### Issue 4: Image Not Detected (Nothing happens on scan)

**This isn't a video issue, but related:**

**What it means:** The .mind file is invalid or doesn't contain proper feature data.

**Fixes:**
1. Check console for `[MindAR]` logs
2. If you see `[MindAR Fallback]` = using synthetic .mind file
3. For real detection, need online compiler to work:
   - Check backend logs: `[MindAR API]` messages
   - Verify `mindar.glitch.me` is accessible
   - If offline, try different image with higher contrast

---

## Testing Checklist

- [ ] Video URL is valid (copy-paste into browser address bar)
- [ ] Video plays in browser without AR
- [ ] Cloudinary Media Library shows video as playable
- [ ] Backend logs show `[Video]` messages
- [ ] Network tab shows video file being downloaded
- [ ] Console has no `❌ Video loading error` messages
- [ ] Image has good feature data (high contrast, distinctive patterns)

## Enable Verbose Logging

To troubleshoot further, the frontend now includes detailed logs:

1. **In browser console**, look for:
   ```
   [MindAR]     - AR detection info
   [AR]         - Target found/lost
   [Video]      - Video loading progress
   ```

2. **In backend logs**, look for:
   ```
   [MindAR]     - .mind file generation
   [Cloudinary] - Upload success/failure
   ```

## Direct Testing

### Test 1: Check Video URL Directly
```javascript
// In browser console:
fetch('YOUR_VIDEO_URL').then(r => r.blob()).then(b => {
  const url = URL.createObjectURL(b);
  const video = document.createElement('video');
  video.src = url;
  video.play();
  console.log('Video ready:', url);
  document.body.appendChild(video);
});
```

### Test 2: Check Cloudinary Upload
```bash
# List recently uploaded videos
curl https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/resources/video?prefix=ar-sticker \
  -u YOUR_API_KEY:YOUR_API_SECRET | jq '.resources[] | {public_id, format, duration}'
```

### Test 3: Check .mind File
```javascript
// In browser console on /ar-scanner page:
console.log('MIND File:', window.stickerData?.mindFileUrl);

// Try to fetch it
fetch(window.stickerData.mindFileUrl)
  .then(r => r.arrayBuffer())
  .then(buf => {
    console.log('Mind file size:', buf.byteLength);
    console.log('First 20 bytes:', new Uint8Array(buf).slice(0, 20));
  });
```

## Still Not Working?

1. **Share these logs in the console:**
   - Right-click → Save as → `debug-logs.json`
   - Include screenshots of console errors

2. **Check:**
   - Browser version (use Chrome/Edge/Safari, not IE)
   - Network connection (should be fast)
   - Device storage (videos use ~50MB+)

3. **Try:**
   - Different video (smaller file, higher quality)
   - Different device/browser
   - Clearing browser cache (Ctrl+Shift+Del)

## Video Format Recommendations

For best compatibility:

```bash
# Recommended: H.264 MP4, 30fps, 5-15 Mbps bitrate

# Encode using ffmpeg:
ffmpeg -i input.mov \
  -c:v libx264 \
  -preset medium \
  -crf 23 \
  -fps 30 \
  -pix_fmt yuv420p \
  output.mp4

# Check video:
ffprobe -v quiet -show_entries format=duration,size -show_entries stream=codec_type,width,height output.mp4
```

---

## Contact Support

If issues persist, provide:
1. Browser console logs (with `[Video]` tags)
2. Video URL (sanitized)
3. Screenshot of error
4. Device type (mobile/desktop)
5. Browser version
