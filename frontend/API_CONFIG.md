# API Configuration

This document explains how to configure API endpoints for the frontend application.

## Configuration File

The main configuration is located in `src/config/api.ts`. This file centralizes all API URLs and settings.

## Environment Variables

You can override the default configuration using environment variables:

```bash
# API Configuration
EXPO_PUBLIC_API_BASE_URL=http://172.20.10.2:3000
EXPO_PUBLIC_SOCKET_URL=http://172.20.10.2:3000
```

## Different Environments

### Local Development
```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
EXPO_PUBLIC_SOCKET_URL=http://localhost:3000
```

### Mobile Development (with your computer's IP)
```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.155:3000
EXPO_PUBLIC_SOCKET_URL=http://192.168.1.155:3000
```

### Production
```bash
EXPO_PUBLIC_API_BASE_URL=https://your-api-domain.com
EXPO_PUBLIC_SOCKET_URL=https://your-socket-domain.com
```

## How to Use

1. **Create a `.env` file** in the frontend root directory
2. **Copy the environment variables** you need from the examples above
3. **Update the values** to match your environment
4. **Restart the Expo development server** for changes to take effect

## Development Helper

For quick development switching, you can also use the `setDevelopmentConfig` function:

```typescript
import { setDevelopmentConfig } from './src/config/api';

// Only works in development mode
setDevelopmentConfig({
  API_BASE_URL: 'http://localhost:3000',
  SOCKET_URL: 'http://localhost:3000',
});
```

## Files Updated

The following files now use the centralized configuration:

- `src/api/socket.ts` - Socket.IO connection
- `src/api/apiClient.ts` - HTTP API client
- All other API services inherit from apiClient

## Note

In Expo/React Native, environment variables must be prefixed with `EXPO_PUBLIC_` to be available in the client-side code. 