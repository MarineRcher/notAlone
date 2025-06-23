# Test Users Setup & Group Chat Requirements

## Overview
The group chat system now requires users to be authenticated with valid database entries before joining groups. No more on-the-fly user creation.

## Test Users Created

The following test users have been created in the database:

| ID   | Login   | Email              | Password | Features                    |
|------|---------|--------------------|-----------|-----------------------------|
| 1001 | alice   | alice@test.dev     | test123   | Basic user, notifications   |
| 1002 | bob     | bob@test.dev       | test123   | Basic user, notifications   |
| 1003 | charlie | charlie@test.dev   | test123   | Premium user, notifications |
| 1004 | diana   | diana@test.dev     | test123   | 2FA enabled, no notifications|
| 1005 | eve     | eve@test.dev       | test123   | Premium user, notifications |

**Common Password**: All test users use the password `test123` for easy testing.

## Authentication Tokens

To connect to the Socket.IO server using these test users, use these mock tokens:

- `mock_jwt_token_alice`
- `mock_jwt_token_bob`
- `mock_jwt_token_charlie`
- `mock_jwt_token_diana`
- `mock_jwt_token_eve`

## Setup Instructions

1. **Run the seeder** (if not already done):
   ```bash
   cd backend
   yarn seed:all
   ```

2. **Start the development server**:
   ```bash
   docker compose up
   ```

3. **Test Socket.IO connection**:
   ```bash
   cd backend
   node tests/manual/simple-socket-test.js
   ```

## Group Chat Features

### Waitroom System
- Groups start in "waiting" status
- Minimum 3 members required to activate
- Users can join waiting groups or create new ones
- Groups automatically activate when reaching minimum members

### Authentication Requirements
- Users must authenticate with valid tokens
- Unknown users are rejected with helpful error messages
- Only database users can join groups

### Testing Multiple Users
```bash
# Terminal 1 - Alice
node tests/manual/test-socketio-client.js

# Terminal 2 - Bob  
node tests/manual/test-socketio-client.js

# Frontend Test
# The GroupChatTestScreen now randomly picks a test user
```

## Error Handling

The system now provides clear error messages:
- "Authentication required. Please connect with a valid token."
- "User not found. Please use a valid test user (alice, bob, charlie, diana, eve)"
- Authentication failures show available test users

## Changes Made

1. **Created seeder**: `backend/src/seeders/20250623074253-create-default-test-users.js`
2. **Updated GroupController**: Now maps mock tokens to predefined user IDs
3. **Updated GroupService**: Removed on-the-fly user creation, requires database users
4. **Updated test files**: Use valid test user tokens
5. **Enhanced logging**: Better error messages and status indicators

## Frontend Integration

The frontend `GroupChatTestScreen` now:
- Randomly selects from valid test users
- Properly handles authentication errors
- Shows clear connection status and error messages 