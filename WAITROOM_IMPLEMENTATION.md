# Waitroom Implementation for "Cercle de parole"

## Overview

This implementation provides a waitroom system where users wait until the minimum required number of participants join before creating a group chat. The minimum number of users is configurable via environment variables.

## Features

- **Environment Variable Configuration**: `E2EE_MIN_MEMBERS` controls minimum users needed
- **Real-time Updates**: Users see live updates as others join/leave the waitroom
- **Automatic Group Creation**: When minimum users reached, group chat is automatically created
- **User-friendly Interface**: Progress bar and user list in the waitroom
- **Reconnection Support**: Handles user disconnections and reconnections gracefully

## Architecture

### Backend Components

1. **Environment Configuration** (`backend/src/config/environment.ts`)
   - Loads `E2EE_MIN_MEMBERS` from environment variables
   - Defaults to 3 users if not specified

2. **Waitroom Controller** (`backend/src/controllers/WaitroomController.ts`)
   - Manages waitroom state and user connections
   - Handles socket events: `join_waitroom`, `leave_waitroom`, `disconnect`
   - Automatically creates groups when minimum users reached

3. **Socket Integration** (`backend/index.ts`)
   - Integrated with existing Socket.IO server
   - Works alongside Noble Signal Protocol

### Frontend Components

1. **Waitroom Screen** (`frontend/src/screens/WaitroomScreen.tsx`)
   - Beautiful UI showing waiting users and progress
   - Real-time updates via Socket.IO
   - Automatic navigation to group chat when ready

2. **Navigation Updates**
   - HomeScreen now navigates to Waitroom instead of direct GroupChat
   - Waitroom automatically redirects to GroupChat when group is formed

## Usage Flow

1. User clicks "Cercle de parole" on HomeScreen
2. Navigates to WaitroomScreen
3. Connects to waitroom via Socket.IO
4. Sees other waiting users in real-time
5. When minimum users reached, automatically redirected to GroupChat
6. Group chat starts with end-to-end encryption

## Socket Events

### Client to Server
- `join_waitroom`: Join the waitroom
- `leave_waitroom`: Leave the waitroom voluntarily

### Server to Client
- `waitroom_joined`: Initial waitroom state
- `waitroom_updated`: Real-time updates when users join/leave
- `group_created`: Group formed, includes groupId and groupName
- `waitroom_error`: Error occurred

## Configuration

### Backend Environment Variables
```bash
E2EE_MIN_MEMBERS=3  # Minimum users needed for group chat
```

### Frontend Environment Variables
```bash
EXPO_PUBLIC_E2EE_MIN_MEMBERS=3  # For display purposes
```

## Testing

Run the manual test script:
```bash
cd backend
node src/tests/manual/test-waitroom.js
```

This simulates multiple users joining the waitroom and tests the group creation flow.

## Files Modified/Created

### Backend
- `src/config/environment.ts` - Environment configuration
- `src/controllers/WaitroomController.ts` - Waitroom logic
- `src/services/GroupService.ts` - Updated to use environment variable
- `src/tests/manual/test-waitroom.js` - Test script
- `index.ts` - Integrated waitroom controller

### Frontend
- `src/screens/WaitroomScreen.tsx` - Waitroom UI
- `src/screens/WaitroomScreen.style.ts` - Waitroom styles
- `src/screens/HomeScreen.tsx` - Updated navigation
- `src/navigation/AppNavigator.tsx` - Added waitroom route

### Environment
- `backend/.env.example` - Environment variable examples
- `frontend/.env.example` - Frontend environment examples

## Error Handling

- Connection failures show user-friendly messages
- Automatic cleanup when users disconnect
- Graceful handling of network interruptions
- Fallback to error messages if group creation fails

## Security

- Same authentication as existing group chat system
- Socket.IO authentication required
- User validation before joining waitroom
- Protected against unauthorized access 