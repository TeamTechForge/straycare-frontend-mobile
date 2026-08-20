# StrayCare Mobile

The StrayCare mobile client is a React Native application built with Expo and Expo Router. It connects users with rescue reporting, live tracking, community discussions, donations, notifications, chat, and audio calls.

## Project overview

StrayCare is an animal-welfare platform that helps people report stray animals, request and coordinate rescues, connect with rescuers and veterinary professionals, and support organizations through donations. The platform includes this mobile client, an administrative web dashboard, and a shared Node.js backend API with MongoDB and Socket.IO real-time services.

## Requirements

- Node.js and npm
- Expo CLI through the local project dependencies
- Android Studio and an Android device/emulator for Android development


## Setup

```bash
npm install
copy .env.example .env
```

Set `EXPO_PUBLIC_API_URL` to the backend URL. For a physical device, use the computer's LAN IP, for example `http://192.168.1.10:5000`, and keep the device and computer on the same network. Add the Firebase, Google OAuth, and optional Cloudinary values described in `.env.example` when those features are needed.

## Development

```bash
npm start
```

Expo will show shortcuts for opening the app in a development build, Android, iOS, or a browser.

| Command | Purpose |
| --- | --- |
| `npx expo run:android` | Build and open the Android native project |
| `npm test` | Run Jest tests |
| `npm run test:watch` | Run Jest in watch mode |

## Project layout

- `app` - Expo Router routes and screens
- `components` - Shared UI components
- `contexts` - Shared application state and providers
- `services` and `api` - Backend and third-party integrations
- `assets` - Images, fonts, and sounds
- `tests` - Mobile unit and component tests

The backend should be running before using API-backed features. Do not commit `.env`, signing credentials, or service-account secrets.
