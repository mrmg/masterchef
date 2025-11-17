# MasterChef Voting App - Setup Guide

## Firebase Configuration

### 1. Update Storage Rules
Deploy the updated storage rules to allow video uploads:
```bash
firebase deploy --only storage
```

### 2. Update Firestore Rules
Deploy the updated Firestore rules for connections tracking:
```bash
firebase deploy --only firestore
```

### 3. Enable Firebase Realtime Database
The connection tracking feature requires Firebase Realtime Database:

1. Go to Firebase Console → Realtime Database
2. Click "Create Database"
3. Choose a location (same as your Firestore for best performance)
4. Start in **test mode** (or use the provided `database.rules.json`)
5. Copy your database URL (e.g., `https://your-project-default-rtdb.firebaseio.com`)

### 4. Deploy Database Rules
Deploy the database rules for presence system:
```bash
firebase deploy --only database
```

### 5. Update Environment Variables
Add the database URL to your `.env` file:
```
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
```

### 6. Restart Development Server
After updating `.env`, restart your dev server:
```bash
npm run dev
```

## New Features

### Video Upload
- Supports MP4, MOV, WebM formats
- Maximum file size: 50MB
- Automatic thumbnail generation
- Video duration display

### Active Connection Tracking
- Shows number of online users
- Real-time updates
- Automatic cleanup of stale connections

### Display Name Management
- Prompted on first upload/comment
- Stored in browser cookie (365 days)
- Can be changed in gallery settings

### Comments System
- Comment on rounds or general session
- 500 character limit
- Real-time updates
- Grouped by round

## Troubleshooting

### "Firebase Storage: User does not have permission" Error
- Run: `firebase deploy --only storage`
- This updates the storage rules to allow the new `media` path

### "Firebase Realtime Database" Warning
- Enable Realtime Database in Firebase Console
- Add `VITE_FIREBASE_DATABASE_URL` to your `.env` file
- Restart your dev server

### Chef Names Not Showing in Gallery
- Check that chefs have names set in the game state
- Verify `simultaneousPlayers` config is correct
- Check browser console for any errors

### Gallery Not Scrollable
- This has been fixed in the latest update
- Clear browser cache and refresh if issue persists
